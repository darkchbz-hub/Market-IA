const isBrowser = typeof window !== "undefined";
const isLocalBrowser = isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const defaultApiUrl = isBrowser ? `${window.location.origin}/api` : "http://localhost:4000/api";
const defaultSocketUrl = isBrowser ? window.location.origin : "http://localhost:4000";

function resolveApiUrl() {
  const configured = import.meta.env.VITE_API_URL;

  if (!configured) {
    return defaultApiUrl;
  }

  if (!isLocalBrowser && /localhost|127\.0\.0\.1/i.test(configured)) {
    return defaultApiUrl;
  }

  if (configured === "/api" && isBrowser) {
    return `${window.location.origin}/api`;
  }

  return configured;
}

function resolveSocketUrl() {
  const configured = import.meta.env.VITE_SOCKET_URL;

  if (!configured) {
    return defaultSocketUrl;
  }

  if (!isLocalBrowser && /localhost|127\.0\.0\.1/i.test(configured)) {
    return defaultSocketUrl;
  }

  return configured;
}

export const API_URL = resolveApiUrl();
export const SOCKET_URL = resolveSocketUrl();
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

  const fetchOptions = {
    method,
    headers: requestHeaders,
    body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
    ...rest
  };

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, fetchOptions);
  } catch (networkError) {
    const fallbackUrl = isBrowser ? `${window.location.origin}/api${path}` : `${defaultApiUrl}${path}`;

    if (`${API_URL}${path}` !== fallbackUrl) {
      response = await fetch(fallbackUrl, fetchOptions);
    } else {
      throw new Error("No se pudo conectar con el servidor. Recarga la pagina e intenta de nuevo.");
    }
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.message || payload || "Ocurrio un error en la solicitud.";
    throw new Error(message);
  }

  return payload;
}
