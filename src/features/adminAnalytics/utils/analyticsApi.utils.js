/**
 * Helpers for admin analytics API — query building and response normalization.
 * Backend may return PascalCase (.NET); frontend expects camelCase.
 */

export function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

export function toUserIdString(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

/**
 * @param {import('../types/analytics.types').AnalyticsFilters} filters
 */
export function analyticsQueryParams(filters = {}) {
  const params = {};
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.serviceKey) params.serviceKey = filters.serviceKey;
  if (filters.userId) params.userId = filters.userId;
  if (filters.status) params.status = filters.status;
  if (filters.groupBy) params.groupBy = filters.groupBy;
  if (filters.page) params.page = filters.page;
  if (filters.pageSize) params.pageSize = filters.pageSize;
  if (filters.search) params.search = filters.search;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortDir) params.sortDir = filters.sortDir;
  return params;
}

function normalizeMostUsedService(raw) {
  if (!raw) return null;
  return {
    serviceKey: pick(raw, "serviceKey", "ServiceKey") ?? "",
    serviceName: pick(raw, "serviceName", "ServiceName") ?? "",
    activityCount: pick(raw, "activityCount", "ActivityCount") ?? 0,
  };
}

function normalizeServiceUsageItem(raw) {
  return {
    serviceKey: pick(raw, "serviceKey", "ServiceKey") ?? "",
    serviceName: pick(raw, "serviceName", "ServiceName") ?? "",
    uniqueUsers: pick(raw, "uniqueUsers", "UniqueUsers") ?? 0,
    activities: pick(raw, "activities", "Activities") ?? 0,
    completed: pick(raw, "completed", "Completed") ?? 0,
    completionRate: pick(raw, "completionRate", "CompletionRate") ?? 0,
    activitySharePercent: pick(raw, "activitySharePercent", "ActivitySharePercent") ?? 0,
  };
}

export function normalizeOverview(data) {
  if (!data) return null;
  return {
    totalUsers: pick(data, "totalUsers", "TotalUsers") ?? 0,
    activeUsers: pick(data, "activeUsers", "ActiveUsers") ?? 0,
    totalActivities: pick(data, "totalActivities", "TotalActivities") ?? 0,
    completedActivities: pick(data, "completedActivities", "CompletedActivities") ?? 0,
    completionRate: pick(data, "completionRate", "CompletionRate") ?? 0,
    mostUsedService: normalizeMostUsedService(
      pick(data, "mostUsedService", "MostUsedService")
    ),
    serviceUsage: (pick(data, "serviceUsage", "ServiceUsage") || []).map(normalizeServiceUsageItem),
  };
}

export function normalizeActivityTrend(data) {
  const arr = Array.isArray(data) ? data : pick(data, "items", "Items") || [];
  return arr.map((point) => ({
    date: pick(point, "date", "Date") ?? "",
    label: pick(point, "label", "Label") ?? "",
    activeUsers: pick(point, "activeUsers", "ActiveUsers") ?? 0,
    activities: pick(point, "activities", "Activities") ?? 0,
    completed: pick(point, "completed", "Completed") ?? 0,
  }));
}

export function normalizeRecentActivityItem(raw) {
  return {
    id: String(pick(raw, "id", "Id") ?? ""),
    userId: toUserIdString(pick(raw, "userId", "UserId")),
    userName: pick(raw, "userName", "UserName") ?? "",
    userEmail: pick(raw, "userEmail", "UserEmail") ?? "",
    activityLabel: pick(raw, "activityLabel", "ActivityLabel") ?? "",
    serviceKey: pick(raw, "serviceKey", "ServiceKey") ?? "",
    serviceName: pick(raw, "serviceName", "ServiceName") ?? "",
    result: pick(raw, "result", "Result") ?? null,
    status: pick(raw, "status", "Status") ?? "",
    occurredAt: pick(raw, "occurredAt", "OccurredAt") ?? null,
  };
}

export function normalizePaginatedRecentActivity(data) {
  const items = (pick(data, "items", "Items") || []).map(normalizeRecentActivityItem);
  return {
    page: pick(data, "page", "Page") ?? 1,
    pageSize: pick(data, "pageSize", "PageSize") ?? 10,
    total: pick(data, "total", "Total") ?? items.length,
    totalPages: pick(data, "totalPages", "TotalPages") ?? 1,
    items,
  };
}

export function normalizeUserSummaryItem(raw) {
  const servicesUsed = pick(raw, "servicesUsed", "ServicesUsed") || [];
  return {
    userId: toUserIdString(pick(raw, "userId", "UserId")),
    firstName: pick(raw, "firstName", "FirstName") ?? "",
    lastName: pick(raw, "lastName", "LastName") ?? "",
    email: pick(raw, "email", "Email") ?? "",
    faculty: pick(raw, "faculty", "Faculty") ?? null,
    major: pick(raw, "major", "Major") ?? null,
    servicesUsed: Array.isArray(servicesUsed) ? servicesUsed : [],
    totalActivities: pick(raw, "totalActivities", "TotalActivities") ?? 0,
    completedActivities: pick(raw, "completedActivities", "CompletedActivities") ?? 0,
    lastActivityAt: pick(raw, "lastActivityAt", "LastActivityAt") ?? null,
    registeredAt: pick(raw, "registeredAt", "RegisteredAt") ?? null,
  };
}

export function normalizePaginatedUsers(data) {
  const items = (pick(data, "items", "Items") || []).map(normalizeUserSummaryItem);
  return {
    page: pick(data, "page", "Page") ?? 1,
    pageSize: pick(data, "pageSize", "PageSize") ?? 10,
    total: pick(data, "total", "Total") ?? items.length,
    totalPages: pick(data, "totalPages", "TotalPages") ?? 1,
    items,
    usedRealApi: true,
  };
}

function normalizeUserActivitySummary(raw) {
  if (!raw) {
    return {
      servicesUsed: 0,
      totalActivities: 0,
      completedActivities: 0,
      mostUsedServiceKey: null,
      mostUsedServiceName: null,
      lastActiveAt: null,
    };
  }
  return {
    servicesUsed: pick(raw, "servicesUsed", "ServicesUsed") ?? 0,
    totalActivities: pick(raw, "totalActivities", "TotalActivities") ?? 0,
    completedActivities: pick(raw, "completedActivities", "CompletedActivities") ?? 0,
    mostUsedServiceKey: pick(raw, "mostUsedServiceKey", "MostUsedServiceKey") ?? null,
    mostUsedServiceName: pick(raw, "mostUsedServiceName", "MostUsedServiceName") ?? null,
    lastActiveAt: pick(raw, "lastActiveAt", "LastActiveAt") ?? null,
  };
}

const SERVICE_BLOCK_ALIASES = {
  MockInterview: "mockInterview",
  Sds: "sds",
  JobComparison: "jobComparison",
  Gamification: "gamification",
  Resume: "resume",
  CoverLetter: "coverLetter",
  Chat: "chat",
  JobMatching: "jobMatching",
};

function normalizeServicesBlock(services) {
  if (!services || typeof services !== "object") return {};
  const out = {};
  Object.entries(services).forEach(([key, value]) => {
    const normalizedKey = SERVICE_BLOCK_ALIASES[key] ?? key;
    if (value == null) return;
    if (normalizedKey === "jobMatching") {
      out[normalizedKey] = normalizeJobMatchingUserBlock(value);
    } else {
      out[normalizedKey] = value;
    }
  });
  return out;
}

function normalizeJobMatchingUserBlock(raw) {
  const items = (pick(raw, "items", "Items") || []).map((item) => ({
    id: pick(item, "id", "Id"),
    searchType: pick(item, "searchType", "SearchType") ?? null,
    faculty: pick(item, "faculty", "Faculty") ?? null,
    major: pick(item, "major", "Major") ?? null,
    country: pick(item, "country", "Country") ?? null,
    queryText: pick(item, "queryText", "QueryText") ?? null,
    resultsCount: pick(item, "resultsCount", "ResultsCount") ?? 0,
    searchedAt: pick(item, "searchedAt", "SearchedAt") ?? null,
  }));
  return {
    searches: pick(raw, "searches", "Searches") ?? items.length,
    items,
  };
}

function normalizeJobMatchingSearchRow(raw) {
  return {
    id: pick(raw, "id", "Id"),
    userName: pick(raw, "userName", "UserName") ?? "",
    email: pick(raw, "email", "Email") ?? "",
    searchType: pick(raw, "searchType", "SearchType") ?? null,
    faculty: pick(raw, "faculty", "Faculty") ?? null,
    major: pick(raw, "major", "Major") ?? "",
    country: pick(raw, "country", "Country") ?? "",
    queryText: pick(raw, "queryText", "QueryText") ?? null,
    resultsCount: pick(raw, "resultsCount", "ResultsCount") ?? 0,
    searchedAt: pick(raw, "searchedAt", "SearchedAt") ?? null,
  };
}

export function normalizeUserProfile(data) {
  if (!data) return null;

  const services = normalizeServicesBlock(pick(data, "services", "Services"));

  return {
    userId: toUserIdString(pick(data, "userId", "UserId")),
    firstName: pick(data, "firstName", "FirstName") ?? "",
    lastName: pick(data, "lastName", "LastName") ?? "",
    email: pick(data, "email", "Email") ?? "",
    faculty: pick(data, "faculty", "Faculty") ?? null,
    major: pick(data, "major", "Major") ?? null,
    registeredAt: pick(data, "registeredAt", "RegisteredAt") ?? null,
    lastActivityAt: pick(data, "lastActivityAt", "LastActivityAt") ?? null,
    summary: normalizeUserActivitySummary(pick(data, "summary", "Summary")),
    recentActivity: (pick(data, "recentActivity", "RecentActivity") || []).map(
      normalizeRecentActivityItem
    ),
    services,
    _dataSource: "api",
  };
}

export function normalizeServiceAnalytics(data) {
  if (!data || typeof data !== "object") return data;

  const phase2Note = pick(data, "phase2Note", "Phase2Note");
  const recentSearches = pick(data, "recentSearches", "RecentSearches");

  if (recentSearches || phase2Note || pick(data, "totalSearches", "TotalSearches") != null) {
    return {
      totalSearches: pick(data, "totalSearches", "TotalSearches") ?? 0,
      uniqueUsers: pick(data, "uniqueUsers", "UniqueUsers") ?? 0,
      topMajors: (pick(data, "topMajors", "TopMajors") || []).map((m) => ({
        major: pick(m, "major", "Major") ?? "",
        count: pick(m, "count", "Count") ?? 0,
      })),
      topCountries: (pick(data, "topCountries", "TopCountries") || []).map((c) => ({
        country: pick(c, "country", "Country") ?? "",
        count: pick(c, "count", "Count") ?? 0,
      })),
      recentSearches: (recentSearches || []).map(normalizeJobMatchingSearchRow),
      phase2Note: phase2Note ?? null,
    };
  }

  return data;
}
