/* Contacto por WhatsApp (RF-08): lógica pura, sin DOM ni Firebase.
 * El mensaje prellenado incluye nombre, precio público y enlace del producto;
 * NUNCA incluye el precio de inversión (products_private). */

/* Normaliza un número de WhatsApp:
 * - quita espacios, "+", guiones, puntos y paréntesis;
 * - si quedan caracteres no numéricos devuelve "";
 * - quita ceros a la izquierda;
 * - acepta solo 11 a 15 dígitos (exige código de país); si no cumple devuelve "". */
export function normalizeWhatsapp(input) {
  const cleaned = String(input ?? "").replace(/[\s+\-.()]/g, "");
  if (!/^\d+$/.test(cleaned)) return "";
  const digits = cleaned.replace(/^0+/, "");
  if (digits.length < 11 || digits.length > 15) return "";
  return digits;
}

/* Mensaje prellenado:
 * disponible → Hola, me interesa el juguete "NOMBRE" (PRECIO). ¿Me das más información?
 * agotado    → Hola, vi el juguete "NOMBRE" y aparece agotado. ¿Cuándo vuelve a estar disponible?
 * En ambos casos agrega un salto de línea y pageUrl al final si existe. */
export function buildMessage(product, { pageUrl = "", priceText = "" } = {}) {
  const name = String(product?.name ?? "");
  const precio = String(priceText ?? "");
  let msg = product?.availability === "disponible"
    ? `Hola, me interesa el juguete "${name}" (${precio}). ¿Me das más información?`
    : `Hola, vi el juguete "${name}" y aparece agotado. ¿Cuándo vuelve a estar disponible?`;
  if (pageUrl) msg += `\n${pageUrl}`;
  return msg;
}

/* https://wa.me/<dígitos>?text=<mensaje codificado>; "" si el número no es válido. */
export function contactUrl(number, product, { pageUrl = "", priceText = "" } = {}) {
  const n = normalizeWhatsapp(number);
  if (!n) return "";
  return `https://wa.me/${n}?text=${encodeURIComponent(buildMessage(product, { pageUrl, priceText }))}`;
}
