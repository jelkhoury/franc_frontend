import { FRANC_SERVICES, getServiceByKey } from "../constants/serviceRegistry";

const CALENDAR_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Stored range using UTC calendar-day boundaries (legacy). */
const UTC_DAY_BOUNDARY_RE =
  /^(\d{4}-\d{2}-\d{2})T(00:00:00\.000|23:59:59\.999)Z$/;

/** Local calendar date as YYYY-MM-DD (matches `<input type="date">`). */
export function formatLocalYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalCalendarDay(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Calendar day the user selected in the date picker (local), from YMD or stored ISO.
 */
export function selectedCalendarDay(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (CALENDAR_DAY_RE.test(s)) return s;
  const legacy = UTC_DAY_BOUNDARY_RE.exec(s);
  if (legacy) return legacy[1];
  const t = new Date(s);
  if (Number.isNaN(t.getTime())) return null;
  return formatLocalYmd(t);
}

/** First selected day → start of that local day as UTC ISO. */
export function calendarDayToFromDateUtc(ymd) {
  const day = selectedCalendarDay(ymd);
  if (!day) return null;
  const start = parseLocalCalendarDay(day);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

/** Last selected day → end of that local day as UTC ISO (never midnight at day start). */
export function calendarDayToToDateUtc(ymd) {
  const day = selectedCalendarDay(ymd);
  if (!day) return null;
  const end = parseLocalCalendarDay(day);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

export function normalizeAnalyticsFromDate(value) {
  return calendarDayToFromDateUtc(value);
}

export function normalizeAnalyticsToDate(value) {
  return calendarDayToToDateUtc(value);
}

/** Value for `<input type="date">` from stored filter ISO. */
export function analyticsDateInputValue(iso) {
  if (!iso) return "";
  return selectedCalendarDay(iso) ?? "";
}

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
  const endDay = new Date();
  const startDay = new Date();
  let resolvedPreset = preset;

  switch (preset) {
    case "today":
      break;
    case "last7days":
      startDay.setDate(startDay.getDate() - 6);
      break;
    case "last30days":
      startDay.setDate(startDay.getDate() - 29);
      break;
    case "thisMonth":
      startDay.setDate(1);
      break;
    default:
      startDay.setDate(startDay.getDate() - 29);
      resolvedPreset = "last30days";
  }

  return {
    fromDate: calendarDayToFromDateUtc(formatLocalYmd(startDay)),
    toDate: calendarDayToToDateUtc(formatLocalYmd(endDay)),
    preset: resolvedPreset,
  };
}

export function buildFilterQuery(filters) {
  const params = {};
  if (filters.fromDate) params.fromDate = normalizeAnalyticsFromDate(filters.fromDate);
  if (filters.toDate) params.toDate = normalizeAnalyticsToDate(filters.toDate);
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
