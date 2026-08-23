import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAnalyticsOverview,
  fetchActivityTrend,
  fetchRecentActivity,
  fetchServiceAnalytics,
  fetchUserSummaries,
  fetchUserProfile,
} from "../services/analyticsApi";
import { initFilters } from "../utils/analytics.utils";

function serializeFilters(filters) {
  if (!filters) return "";
  try {
    return JSON.stringify(filters);
  } catch {
    return "";
  }
}

/**
 * @param {import('../types/analytics.types').AnalyticsFilters} filters
 * @param {(filters: import('../types/analytics.types').AnalyticsFilters) => Promise<*>} fetcher
 */
function useAnalyticsQuery(filters, fetcher) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const filterKey = serializeFilters(filters);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(filtersRef.current);
      setData(result);
    } catch (err) {
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher(filtersRef.current);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [filterKey, fetcher]);

  return { data, loading, error, reload };
}

export function useAnalyticsOverview(filters) {
  return useAnalyticsQuery(filters, fetchAnalyticsOverview);
}

export function useActivityTrend(filters) {
  return useAnalyticsQuery(filters, fetchActivityTrend);
}

export function useRecentActivity(filters) {
  return useAnalyticsQuery(filters, fetchRecentActivity);
}

export function useServiceAnalytics(serviceKey, filters) {
  const fetcher = useCallback(
    (f) => fetchServiceAnalytics(serviceKey, f),
    [serviceKey]
  );
  return useAnalyticsQuery(filters, fetcher);
}

export function useUserSummaries(filters) {
  return useAnalyticsQuery(filters, fetchUserSummaries);
}

export function useUserProfile(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserProfile(userId);
      setData(result);
    } catch (err) {
      setError(err?.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useAnalyticsFilters(initialPreset = "last30days") {
  const [filters, setFilters] = useState(() => initFilters(initialPreset));

  const setPreset = useCallback((preset) => {
    setFilters((prev) => {
      const next = initFilters(preset);
      return { ...prev, ...next, serviceKey: prev.serviceKey, userId: prev.userId, status: prev.status };
    });
  }, []);

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initFilters("last30days"));
  }, []);

  return { filters, setFilters, setPreset, updateFilters, resetFilters };
}
