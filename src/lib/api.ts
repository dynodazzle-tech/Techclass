/**
 * Unified API Client for TechClass
 * Handles API Base URL resolution, Netlify static hosting proxies,
 * and prevents "Unexpected token '<', <!DOCTYPE..." JSON parsing errors.
 */

// Development / Production Cloud Run backend fallback when deployed to Netlify without custom domain
export const DEFAULT_BACKEND_URL = 'https://ais-dev-obtfhzcdq5m2dtqltd42mb-16516054101.asia-east1.run.app';

export function getApiBaseUrl(): string {
  // 1. Explicit environment variable
  const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 2. Custom override in localStorage
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('techclass_api_url');
    if (savedUrl && savedUrl.trim() !== '') {
      return savedUrl.trim().replace(/\/+$/, '');
    }

    // 3. If running on Netlify or external static host, and not localhost/internal
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    const isCloudRunDev = hostname.includes('run.app');

    // On netlify.app, if relative /api is rewritten by netlify.toml / _redirects, relative works;
    // but if proxy is disabled or failing, fallback to the direct backend URL
    if (hostname.includes('netlify.app') && !isCloudRunDev && !isLocalhost) {
      // Return empty string to let netlify _redirects proxy first,
      // but safeApiFetch will automatically retry to DEFAULT_BACKEND_URL if HTML is returned!
      return '';
    }
  }

  return '';
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  isHtml: boolean;
  data: any;

  constructor(message: string, status: number, isHtml: boolean = false, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isHtml = isHtml;
    this.data = data;
  }
}

/**
 * Safely parses response body without crashing on HTML (<!DOCTYPE) responses
 */
export async function safeParseResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!text || text.trim() === '') {
    return null;
  }

  // Check if response is HTML instead of JSON (common Netlify 404/SPA rewrite issue)
  const isHtml = text.trim().startsWith('<') || contentType.includes('text/html');

  if (isHtml) {
    throw new ApiError(
      'Server returned an HTML page instead of JSON API response. If deployed on Netlify, check that the backend is connected.',
      res.status,
      true,
      { rawHtmlPreview: text.substring(0, 150) }
    );
  }

  try {
    return JSON.parse(text);
  } catch (err: any) {
    throw new ApiError(
      `Failed to parse response as JSON: ${err?.message || 'Invalid JSON'}`,
      res.status,
      false,
      { rawText: text.substring(0, 150) }
    );
  }
}

/**
 * Perform a safe API fetch with automatic Netlify proxy handling & fallback
 */
export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let primaryUrl = base ? `${base}${normalizedEndpoint}` : normalizedEndpoint;

  let headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach auth token if present and not already attached
  if (!headers['Authorization'] && typeof window !== 'undefined') {
    const token = localStorage.getItem('techclass_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(primaryUrl, {
      ...options,
      headers
    });

    try {
      const data = await safeParseResponse(res);
      if (!res.ok) {
        throw new ApiError(data?.error || `Request failed with status ${res.status}`, res.status, false, data);
      }
      return data as T;
    } catch (parseErr: any) {
      // If we received an HTML response on Netlify, attempt direct fallback to DEFAULT_BACKEND_URL
      if (parseErr.isHtml && typeof window !== 'undefined' && window.location.hostname.includes('netlify.app') && !base) {
        console.warn(`[TechClass API] Netlify returned HTML for ${endpoint}. Retrying directly against ${DEFAULT_BACKEND_URL}...`);
        const fallbackUrl = `${DEFAULT_BACKEND_URL}${normalizedEndpoint}`;
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
          headers
        });
        const fallbackData = await safeParseResponse(fallbackRes);
        if (!fallbackRes.ok) {
          throw new ApiError(fallbackData?.error || `Fallback request failed with status ${fallbackRes.status}`, fallbackRes.status, false, fallbackData);
        }
        return fallbackData as T;
      }
      throw parseErr;
    }
  } catch (err: any) {
    // If initial fetch failed completely (network error or CORS) on Netlify, attempt fallback
    if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app') && !base && !err.data?.rawHtmlPreview) {
      try {
        console.warn(`[TechClass API] Retrying failed request directly against backend: ${DEFAULT_BACKEND_URL}${normalizedEndpoint}`);
        const fallbackUrl = `${DEFAULT_BACKEND_URL}${normalizedEndpoint}`;
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
          headers
        });
        const fallbackData = await safeParseResponse(fallbackRes);
        if (!fallbackRes.ok) {
          throw new ApiError(fallbackData?.error || `Fallback request failed with status ${fallbackRes.status}`, fallbackRes.status, false, fallbackData);
        }
        return fallbackData as T;
      } catch (fallbackErr: any) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}
