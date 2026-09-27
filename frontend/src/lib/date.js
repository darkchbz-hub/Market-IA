const MEXICO_TIME_ZONE = "America/Mexico_City";

export function parseStoreDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text) ? `${text.replace(" ", "T")}Z` : text;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMexicoDateTime(value, options = {}) {
  const date = parseStoreDate(value);
  if (!date) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", { timeZone: MEXICO_TIME_ZONE, dateStyle: "medium", timeStyle: "short", ...options }).format(date);
}

export function formatMexicoDate(value, options = {}) {
  const date = parseStoreDate(value);
  if (!date) return "Fecha no disponible";
  const usesIndividualParts = ["weekday", "year", "month", "day"].some((key) => options[key] !== undefined);
  return new Intl.DateTimeFormat("es-MX", { timeZone: MEXICO_TIME_ZONE, ...(usesIndividualParts ? {} : { dateStyle: "medium" }), ...options }).format(date);
}
