import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWhatsapp, buildMessage, contactUrl, resolveWhatsapp } from "../public/js/contact.js";

/* ---------- normalizeWhatsapp ---------- */

test("normalizeWhatsapp con '+52 55 1234 5678'", () => {
  assert.equal(normalizeWhatsapp("+52 55 1234 5678"), "525512345678");
});

test("normalizeWhatsapp quita paréntesis y guiones", () => {
  assert.equal(normalizeWhatsapp("+52 (55) 1234-5678"), "525512345678");
  assert.equal(normalizeWhatsapp("(52) 55-1234-5678"), "525512345678");
});

test("normalizeWhatsapp quita puntos y espacios", () => {
  assert.equal(normalizeWhatsapp("+52.55.1234.5678"), "525512345678");
  assert.equal(normalizeWhatsapp("  +52 55 1234 5678  "), "525512345678");
});

test("normalizeWhatsapp con letras devuelve ''", () => {
  assert.equal(normalizeWhatsapp("+52 55 1234 567A"), "");
  assert.equal(normalizeWhatsapp("mi número es 525512345678"), "");
  assert.equal(normalizeWhatsapp("abc"), "");
});

test("normalizeWhatsapp muy corto (10 dígitos) devuelve ''", () => {
  assert.equal(normalizeWhatsapp("5512345678"), ""); // 10 dígitos, sin código de país
  assert.equal(normalizeWhatsapp("+52 55 123 456"), ""); // 10 dígitos
});

test("normalizeWhatsapp vacío devuelve ''", () => {
  assert.equal(normalizeWhatsapp(""), "");
  assert.equal(normalizeWhatsapp("   "), "");
  assert.equal(normalizeWhatsapp(null), "");
  assert.equal(normalizeWhatsapp(undefined), "");
});

test("normalizeWhatsapp exige código de país: 11 a 15 dígitos", () => {
  assert.equal(normalizeWhatsapp("52551234567"), "52551234567"); // 11
  assert.equal(normalizeWhatsapp("525512345678901"), "525512345678901"); // 15
  assert.equal(normalizeWhatsapp("5255123456789012"), ""); // 16
});

test("normalizeWhatsapp quita ceros a la izquierda", () => {
  assert.equal(normalizeWhatsapp("00525512345678"), "525512345678");
  assert.equal(normalizeWhatsapp("+0052 55 1234 5678"), "525512345678");
});

/* ---------- buildMessage ---------- */

const PRODUCT = { id: "p1", name: "Osito", price: 100, availability: "disponible" };

test("buildMessage disponible", () => {
  assert.equal(
    buildMessage(PRODUCT, { pageUrl: "https://x.test/#/producto/p1", priceText: "$100.00" }),
    'Hola, me interesa el juguete "Osito" ($100.00). ¿Me das más información?\nhttps://x.test/#/producto/p1'
  );
});

test("buildMessage agotado", () => {
  assert.equal(
    buildMessage({ ...PRODUCT, availability: "agotado" }, { pageUrl: "https://x.test/#/producto/p1", priceText: "$100.00" }),
    'Hola, vi el juguete "Osito" y aparece agotado. ¿Cuándo vuelve a estar disponible?\nhttps://x.test/#/producto/p1'
  );
});

test("buildMessage sin pageUrl no agrega salto de línea", () => {
  const msg = buildMessage(PRODUCT, { priceText: "$100.00" });
  assert.ok(!msg.includes("\n"));
  assert.ok(msg.endsWith('¿Me das más información?'));
});

test("buildMessage nunca incluye el precio de inversión (campo cost)", () => {
  const msg = buildMessage({ ...PRODUCT, cost: 42, costo: 42, investment: 42 }, { pageUrl: "https://x.test", priceText: "$100.00" });
  assert.ok(!msg.includes("42"));
});

/* ---------- contactUrl ---------- */

const WA_NUMBER = "+52 55 1234 5678";

test("contactUrl enlace wa.me con mensaje codificado", () => {
  const url = contactUrl(WA_NUMBER, PRODUCT, { pageUrl: "https://x.test/#/producto/p1", priceText: "$100.00" });
  assert.ok(url.startsWith("https://wa.me/525512345678?text="));
  assert.ok(!url.includes(" "));
  assert.equal(
    decodeURIComponent(url.slice(url.indexOf("?text=") + 6)),
    'Hola, me interesa el juguete "Osito" ($100.00). ¿Me das más información?\nhttps://x.test/#/producto/p1'
  );
});

test("contactUrl con acentos, comillas y salto de línea codificados", () => {
  const product = { name: 'Juguete "pequeño" ñandú', availability: "disponible" };
  const url = contactUrl("525512345678", product, { pageUrl: "https://x.test/#/producto/p1", priceText: "$100.00" });
  const raw = url.slice(url.indexOf("?text=") + 6);
  // nada sin codificar: sin espacios, comillas, acentos ni saltos de línea literales
  assert.ok(!/[\s"áéíóúüñ¿¡]/.test(raw), `mensaje sin codificar: ${raw}`);
  assert.ok(!url.includes("\n"));
  // formas codificadas presentes
  assert.ok(raw.includes("%22"), "comillas codificadas %22");
  assert.ok(/%C3%(A1|B1|BA|89)/i.test(raw), "acentos codificados en UTF-8");
  assert.ok(raw.includes("%0A"), "salto de línea codificado %0A");
  // round-trip exacto
  const msg = decodeURIComponent(raw);
  assert.ok(msg.includes('Juguete "pequeño" ñandú'), msg);
  assert.ok(msg.endsWith("\nhttps://x.test/#/producto/p1"));
});

test("contactUrl número vacío o inválido devuelve ''", () => {
  assert.equal(contactUrl("", PRODUCT, { priceText: "$100.00" }), "");
  assert.equal(contactUrl("   ", PRODUCT, { priceText: "$100.00" }), "");
  assert.equal(contactUrl("no-es-numero", PRODUCT, { priceText: "$100.00" }), "");
  assert.equal(contactUrl("5512345678", PRODUCT, { priceText: "$100.00" }), ""); // 10 dígitos
  assert.equal(contactUrl("52551234567890123", PRODUCT, { priceText: "$100.00" }), ""); // 17 dígitos
  assert.equal(contactUrl(null, PRODUCT, { priceText: "$100.00" }), "");
});

test("contactUrl el mensaje y la URL no contienen el costo aunque el producto traiga un campo cost", () => {
  const product = { ...PRODUCT, cost: 424242, costo: 424242 };
  const url = contactUrl(WA_NUMBER, product, { pageUrl: "https://x.test/#/producto/p1", priceText: "$100.00" });
  const msg = decodeURIComponent(url.slice(url.indexOf("?text=") + 6));
  assert.ok(!msg.includes("424242"), `mensaje contiene el costo: ${msg}`);
  assert.ok(!url.includes("424242"), `URL contiene el costo: ${url}`);
  assert.ok(!url.includes(encodeURIComponent("424242")));
});

test("contactUrl producto agotado usa mensaje y cambia texto", () => {
  const url = contactUrl(WA_NUMBER, { ...PRODUCT, availability: "agotado" }, { pageUrl: "https://x.test", priceText: "$100.00" });
  const msg = decodeURIComponent(url.slice(url.indexOf("?text=") + 6));
  assert.ok(msg.startsWith('Hola, vi el juguete "Osito" y aparece agotado.'));
});

/* ---------- resolveWhatsapp (RF-11) ---------- */

test("resolveWhatsapp devuelve el remoto si es válido", () => {
  assert.equal(resolveWhatsapp("+52 55 1234 5678", "525512345680"), "525512345678");
});

test("resolveWhatsapp usa el fallback si el remoto no es válido", () => {
  assert.equal(resolveWhatsapp("", "+52 55 1234 5680"), "525512345680");
  assert.equal(resolveWhatsapp(null, "525512345680"), "525512345680");
  assert.equal(resolveWhatsapp(undefined, "525512345680"), "525512345680");
  assert.equal(resolveWhatsapp("no-es-numero", "525512345680"), "525512345680");
  assert.equal(resolveWhatsapp("5512345678", "525512345680"), "525512345680"); // remoto de 10 dígitos
});

test("resolveWhatsapp devuelve '' si ninguno es válido", () => {
  assert.equal(resolveWhatsapp("", ""), "");
  assert.equal(resolveWhatsapp("abc", "123"), "");
  assert.equal(resolveWhatsapp(null, null), "");
  assert.equal(resolveWhatsapp("", "no-es-numero"), "");
});
