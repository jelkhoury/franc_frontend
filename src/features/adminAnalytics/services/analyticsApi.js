/**
 * Admin Analytics API — live endpoints at /api/admin/analytics/*
 * Mock datasets remain in ../mocks/ for reference only; this module always calls the API.
 */

import { get } from "../../../utils/httpServices";
import { ANALYTICS_ENDPOINTS } from "../../../services/apiService";
import {
  analyticsQueryParams,
  normalizeOverview,
  normalizeActivityTrend,
  normalizePaginatedRecentActivity,
  normalizePaginatedUsers,
  normalizeUserProfile,
  normalizeServiceAnalytics,
} from "../utils/analyticsApi.utils";

function getToken() {
  return localStorage.getItem("token");
}

async function analyticsGet(path, params = {}) {
  return get(path, { token: getToken(), params });
}

export async function fetchAnalyticsOverview(filters = {}) {
  const data = await analyticsGet(ANALYTICS_ENDPOINTS.OVERVIEW, analyticsQueryParams(filters));
  return normalizeOverview(data);
}

export async function fetchActivityTrend(filters = {}) {
  const params = analyticsQueryParams({ ...filters, groupBy: filters.groupBy || "daily" });
  const data = await analyticsGet(ANALYTICS_ENDPOINTS.ACTIVITY_TREND, params);
  return normalizeActivityTrend(data);
}

export async function fetchRecentActivity(filters = {}) {
  const data = await analyticsGet(
    ANALYTICS_ENDPOINTS.RECENT_ACTIVITY,
    analyticsQueryParams(filters)
  );
  return normalizePaginatedRecentActivity(data);
}

export async function fetchServiceAnalytics(serviceKey, filters = {}) {
  const data = await analyticsGet(
    ANALYTICS_ENDPOINTS.SERVICE(serviceKey),
    analyticsQueryParams(filters)
  );
  return normalizeServiceAnalytics(data);
}

export async function fetchUserSummaries(filters = {}) {
  const data = await analyticsGet(
    ANALYTICS_ENDPOINTS.USERS,
    analyticsQueryParams(filters)
  );
  return normalizePaginatedUsers(data);
}

/** @param {string|number} userId — backend uses integer user id */
export async function fetchUserProfile(userId) {
  if (!userId && userId !== 0) return null;

  const data = await analyticsGet(ANALYTICS_ENDPOINTS.USER_PROFILE(userId));
  return normalizeUserProfile(data);
}
