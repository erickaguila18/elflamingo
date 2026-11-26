export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 4;
export const AVAILABILITY = ["disponible", "agotado"];

export function parsePrice(v) {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : NaN;
}

export function margin(price, cost) {
  if (!(price > 0) || !Number.isFinite(cost)) return null;
  return Math.round(((price - cost) / price) * 1000) / 10;
}

export function validateProduct(p, photoCount) {
  const errors = {};
  const name = (p.name ?? "").trim();
  if (name.length < 2 || name.length > 80) errors.name = "El nombre debe tener entre 2 y 80 caracteres.";
  if ((p.description ?? "").length > 2000) errors.description = "La descripción admite hasta 2000 caracteres.";
  if (!(p.price > 0) || p.price > 10_000_000) errors.price = "Escribe un precio al público mayor a 0.";
  if (!(p.cost >= 0) || !Number.isFinite(p.cost)) errors.cost = "Escribe el precio de inversión (0 o más).";
  if (!AVAILABILITY.includes(p.availability)) errors.availability = "Elige una disponibilidad.";
  if (photoCount < MIN_PHOTOS) errors.photos = "Agrega al menos 1 fotografía.";
  if (photoCount > MAX_PHOTOS) errors.photos = "El máximo es 4 fotografías.";
  return { valid: Object.keys(errors).length === 0, errors };
}
