import { FRANC_SERVICES, getServiceByKey } from "../constants/serviceRegistry";

export function formatAnalyticsDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

export function formatAnalyticsDateShort(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Number(value).toFixed(decimals)}%`;
}

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function getDateRangePreset(preset) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return { fromDate: start.toISOString(), toDate: end.toISOString(), preset };
    case "last7days":
      start.setDate(start.getDate() - 6);
      return { fromDate: start.toISOString(), toDate: end.toISOString(), preset };
    case "last30days":
      start.setDate(start.getDate() - 29);
      return { fromDate: start.toISOString(), toDate: end.toISOString(), preset };
    case "thisMonth":
      start.setDate(1);
      return { fromDate: start.toISOString(), toDate: end.toISOString(), preset };
    default:
      start.setDate(start.getDate() - 29);
      return { fromDate: start.toISOString(), toDate: end.toISOString(), preset: "last30days" };
  }
}

export function buildFilterQuery(filters) {
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

export function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "evaluated" || s === "passed") return "green";
  if (s === "in progress" || s === "draft" || s === "pending" || s === "started") return "orange";
  if (s === "abandoned" || s === "failed" || s === "timeout") return "red";
  return "gray";
}

export function serviceLabel(serviceKey) {
  return getServiceByKey(serviceKey)?.name ?? serviceKey;
}

export function serviceIcon(serviceKey) {
  return getServiceByKey(serviceKey)?.icon ?? null;
}

export function serviceColor(serviceKey) {
  return getServiceByKey(serviceKey)?.color ?? "#718096";
}

export function paginateArray(items, page = 1, pageSize = 10) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export function filterByDateRange(items, dateField, fromDate, toDate) {
  if (!fromDate && !toDate) return items;
  const from = fromDate ? new Date(fromDate).getTime() : null;
  const to = toDate ? new Date(toDate).getTime() : null;
  return items.filter((item) => {
    const raw = item[dateField];
    if (!raw) return false;
    const t = new Date(raw).getTime();
    if (from !== null && t < from) return false;
    if (to !== null && t > to) return false;
    return true;
  });
}

export const DEFAULT_ANALYTICS_FILTERS = {
  preset: "last30days",
  fromDate: null,
  toDate: null,
  serviceKey: "",
  userId: "",
  status: "",
  groupBy: "daily",
  search: "",
  page: 1,
  pageSize: 10,
  sortBy: "date",
  sortDir: "desc",
};

export function initFilters(preset = "last30days") {
  const range = getDateRangePreset(preset);
  return {
    ...DEFAULT_ANALYTICS_FILTERS,
    preset: range.preset,
    fromDate: range.fromDate,
    toDate: range.toDate,
  };
}

export function getAllServiceKeysForLegend() {
  return FRANC_SERVICES.filter((s) => s.active).map((s) => s.key);
}
