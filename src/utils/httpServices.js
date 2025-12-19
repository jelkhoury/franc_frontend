import {
  getStoredToken,
  isTokenExpired,
  clearAuthData,
} from "./tokenUtils"; 

const BASE_URLS = {
  default: (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, ""),
  ai: (process.env.REACT_APP_API_AI_URL || "").replace(/\/+$/, ""),
};

const httpService = {
  onUnauthorized: null,
  onRequest: null,
  onResponse: null,
  setBaseUrl(key, url) {
    BASE_URLS[key] = (url || "").replace(/\/+$/, "");
  },
  setBaseUrls(map) {
    Object.entries(map || {}).forEach(([k, v]) => {
      BASE_URLS[k] = (v || "").replace(/\/+$/, "");
    });
  },
};

class HttpError extends Error {
  constructor(status, message, details) {
    super(message || `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

const isFormData = (val) =>
  typeof FormData !== "undefined" && val instanceof FormData;

function buildUrl(path, params, base = "default") {
  const baseUrl = BASE_URLS[base] || BASE_URLS.default || "";
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  if (!params || Object.keys(params).length === 0) return url;

  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((item) => usp.append(k, String(item)));
    else usp.set(k, String(v));
  });
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${usp.toString()}`;
}

function buildHeaders({ token, headers, body }) {
  const h = new Headers(headers || {});
  // Only set content-type for non-FormData bodies.
  if (body && !isFormData(body) && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  }
  return h;
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (res.ok) {
    return isJson ? await res.json() : await res.text();
  }

  // Try to pull an error message from server JSON, fallback to text/status text
  let message = `Request failed with status ${res.status}`;
  let details = null;

  try {
    if (isJson) {
      const data = await res.json();
      message = data?.message || data?.error || message;
      details = data;
    } else {
      const text = await res.text();
      if (text) message = text;
      details = text;
    }
  } catch {
    // ignore parse errors
  }

  throw new HttpError(res.status, message, details);
}

async function coreFetch(
  method,
  path,
  { params, data, headers, token, signal, base } = {}
) {
  // Resolve token: passed in, or from storage
  const effectiveToken = token ?? getStoredToken();

  if (effectiveToken && isTokenExpired(effectiveToken)) {
    clearAuthData();
    if (typeof httpService.onUnauthorized === "function") {
      try {
        httpService.onUnauthorized();
      } catch {}
    }
    throw new HttpError(401, "Token expired");
  }

  const url = buildUrl(path, params, base);
  const body =
    data == null ? undefined : isFormData(data) ? data : JSON.stringify(data);

  const init = {
    method,
    headers: buildHeaders({ token: effectiveToken, headers, body }),
    body,
    signal,
  };

  if (typeof httpService.onRequest === "function") {
    try {
      httpService.onRequest({ url, init });
    } catch {}
  }

  const res = await fetch(url, init);

  if (typeof httpService.onResponse === "function") {
    try {
      httpService.onResponse(res);
    } catch {}
  }

  return parseResponse(res);
}

// Public helpers
export const get = (path, options = {}) => coreFetch("GET", path, options);
export const post = (path, data, options = {}) =>
  coreFetch("POST", path, { ...options, data });
export const put = (path, data, options = {}) =>
  coreFetch("PUT", path, { ...options, data });
export const patch = (path, data, options = {}) =>
  coreFetch("PATCH", path, { ...options, data });
export const del = (path, options = {}) => coreFetch("DELETE", path, options);

/**
 * Convenience for multipart/form-data uploads.
 * Pass a FormData instance as `formData`. No Content-Type header is set manually.
 */
export const postForm = (path, formData, options = {}) =>
  coreFetch("POST", path, { ...options, data: formData });

export default httpService;
