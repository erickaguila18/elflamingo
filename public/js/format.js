export function formatPrice(n, { currency = "MXN", locale = "es-MX" } = {}) {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(n);
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export const availabilityLabel = (a) => (a === "disponible" ? "Disponible" : "Agotado");
