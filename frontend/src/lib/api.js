const defaultApiUrl = typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:4000/api";
const defaultSocketUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:4000";

export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl;
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

export async function apiFetch(path, options = {}) {
  const { method = "GET", body, token, headers = {}, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !(body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
    ...rest
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.message || payload || "Ocurrio un error en la solicitud.";
    throw new Error(message);
  }

  return payload;
}
