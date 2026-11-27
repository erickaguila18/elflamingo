import test from "node:test";
import assert from "node:assert/strict";
import { summaryHTML, detailHTML } from "../public/js/views.js";
import { summarize } from "../public/js/stats.js";
import { formatPrice, escapeHtml } from "../public/js/format.js";
import { APP } from "../public/js/config.js";

const money = (n) => escapeHtml(formatPrice(n, APP));

// Criterio de aceptación RF-10 (spec): ejemplo A + B
const A = { id: "a", price: 100, availability: "disponible" }; // costo 60
const B = { id: "b", price: 200, availability: "agotado" }; // costo 150
const COSTS = { a: 60, b: 150 };

// 2 productos, inversión 210, valor de venta 300, ganancia 90, margen 30% (RF-10)
const summaryAB = () => summarize([A, B], COSTS);

test("aparecen los cuatro títulos", () => {
  const html = summaryHTML(summaryAB());
  for (const title of ["Productos", "Inversión total", "Valor de venta", "Ganancia estimada"]) {
    assert.ok(html.includes(title), `falta el título «${title}»`);
  }
});

test("los importes formateados del ejemplo A + B de la spec", () => {
  const html = summaryHTML(summaryAB());
  assert.ok(html.includes(money(210)), `inversión total formateada ${money(210)}`);
  assert.ok(html.includes(money(300)), `valor de venta formateado ${money(300)}`);
  assert.ok(html.includes(money(90)), `ganancia estimada formateada ${money(90)}`);
  assert.ok(html.includes("Margen: 30%"), "margen 30%");
});

test("Productos muestra el total con N disponibles · N agotados", () => {
  const html = summaryHTML(summaryAB());
  assert.ok(html.includes("1 disponibles · 1 agotados"), "1 disponibles · 1 agotados");
});

test("la línea de 'sin costo' solo aparece cuando withoutCost > 0", () => {
  const complete = summaryHTML(summaryAB());
  assert.ok(!complete.includes("sin costo registrado"), "no aparece con todos los costos registrados");

  const missing = summaryHTML(summarize([A, B], { a: 60 })); // B sin costo en products_private
  assert.ok(
    missing.includes("1 producto(s) sin costo registrado, no incluidos en los importes"),
    "informa 1 producto sin costo"
  );

  const invalid = summaryHTML(summarize([A, B], { a: 60, b: "abc" })); // costo inválido
  assert.ok(invalid.includes("1 producto(s) sin costo registrado"), "el costo inválido también cuenta");
});

test("no aparece 'Margen' cuando marginPct es null", () => {
  // catálogo vacío → valor de venta 0 → marginPct null (RF-10)
  const empty = summaryHTML(summarize([], {}));
  assert.ok(!empty.includes("Margen"), "catálogo vacío no muestra margen");

  // sin costo válido → valor de venta 0 → marginPct null
  const noCost = summaryHTML(summarize([A], {}));
  assert.ok(!noCost.includes("Margen"), "sin costo no muestra margen");
});

test("nota pequeña 'Se cuenta 1 unidad por producto'", () => {
  const html = summaryHTML(summaryAB());
  assert.ok(html.includes("Se cuenta 1 unidad por producto"));
});

test("ganancia en clase ok si es positiva y bad si es negativa", () => {
  const positive = summaryHTML(summaryAB()); // ganancia 90
  assert.match(positive, /summary-value ok[^"]*"[^>]*>[^<]*<\/p>/);
  const negative = summaryHTML(summarize([A], { a: 500 })); // ganancia -400
  assert.ok(negative.includes("summary-value bad"), "ganancia negativa en bad");
});

/* ---------- detailHTML · botón de WhatsApp (RF-08) ---------- */

const WA_PRODUCT = { id: "p1", name: "Osito", description: "Suave", price: 100, availability: "disponible", photos: ["x"], thumb: "x" };
const WA_NUMBER = "+52 55 1234 5678";

test("detailHTML sin número no hay botón de WhatsApp", () => {
  const html = detailHTML(WA_PRODUCT, { whatsapp: "" });
  assert.ok(!html.includes("wa.me"), "no hay enlace wa.me");
  assert.ok(!html.includes("Preguntar por WhatsApp"), "no hay botón disponible");
  assert.ok(!html.includes("Preguntar cuándo habrá"), "no hay botón agotado");
});

test("detailHTML sin número válido no hay botón de WhatsApp", () => {
  const html = detailHTML(WA_PRODUCT, { whatsapp: "no-es-un-numero" });
  assert.ok(!html.includes("wa.me"));
  assert.ok(!html.includes("Preguntar"));
});

test("detailHTML con número hay enlace wa.me en pestaña nueva con rel=noopener", () => {
  const html = detailHTML(WA_PRODUCT, { whatsapp: WA_NUMBER, pageUrl: "https://x.test/#/producto/p1" });
  assert.ok(html.includes("https://wa.me/525512345678?text="), "enlace wa.me con dígitos y mensaje codificado");
  assert.ok(html.includes('target="_blank"'), "target=_blank");
  assert.ok(html.includes('rel="noopener"'), "rel=noopener");
  assert.ok(html.includes("Preguntar por WhatsApp"), "texto del botón disponible");
  assert.ok(!html.includes("Preguntar cuándo habrá"));
});

test("detailHTML producto agotado muestra 'Preguntar cuándo habrá'", () => {
  const html = detailHTML({ ...WA_PRODUCT, availability: "agotado" }, { whatsapp: WA_NUMBER });
  assert.ok(html.includes("Preguntar cuándo habrá"), "texto del botón agotado");
  assert.ok(!html.includes("Preguntar por WhatsApp"));
  assert.ok(html.includes("https://wa.me/525512345678?text="));
});

test("detailHTML el nombre con <script> aparece escapado", () => {
  const html = detailHTML({ ...WA_PRODUCT, name: "<script>alert(1)</script>" }, { whatsapp: WA_NUMBER });
  assert.ok(!html.includes("<script>"), "no hay etiqueta script sin escapar");
  assert.ok(html.includes("&lt;script&gt;"), "nombre escapado con escapeHtml");
  assert.ok(!html.includes(encodeURIComponent("<script>alert(1)</script>") + '"'), "el enlace no inyecta HTML");
});

test("detailHTML no incluye el precio de inversión en el mensaje de WhatsApp", () => {
  const html = detailHTML({ ...WA_PRODUCT, cost: 424242 }, { whatsapp: WA_NUMBER, pageUrl: "https://x.test" });
  assert.ok(!html.includes("424242"));
  assert.ok(!html.includes(encodeURIComponent("424242")));
});
