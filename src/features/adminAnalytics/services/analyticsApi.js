/**
 * Admin Analytics API — live endpoints at /api/admin/analytics/*
 * Mock datasets remain in ../mocks/ for reference only; this module always calls the API.
 */

import { get } from "../../../utils/httpServices";
import { ANALYTICS_ENDPOINTS, SDS_ENDPOINTS } from "../../../services/apiService";
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

function toExportDateParam(iso) {
  if (!iso) return null;
  return String(iso).slice(0, 10);
}

function parseContentDispositionFilename(header) {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/"/g, ""));
  } catch {
    return match[1].replace(/"/g, "");
  }
}

/**
 * Admin-only SDS Excel export. Returns blob + filename for client download.
 * @param {{ fromDate?: string|null, toDate?: string|null, completion?: 'all'|'complete'|'incomplete' }} options
 */
export async function exportSdsExcel({
  fromDate = null,
  toDate = null,
  completion = "all",
} = {}) {
  const token = getToken();
  const params = new URLSearchParams();
  const from = toExportDateParam(fromDate);
  const to = toExportDateParam(toDate);
  if (from) params.set("fromDate", from);
  if (to) params.set("toDate", to);
  params.set("completion", completion || "all");

  const baseUrl = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");
  const path = `${SDS_ENDPOINTS.EXPORT_EXCEL}?${params.toString()}`;
  const fullUrl = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const response = await fetch(fullUrl, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = "Export failed";
    try {
      const err = await response.json();
      message = err?.message || message;
    } catch {
      // response body may not be JSON
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(response.headers.get("Content-Disposition")) ||
    "Franc_SDS_Report.xlsx";

  return { blob, filename };
}
