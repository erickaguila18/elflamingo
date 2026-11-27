import test from "node:test";
import assert from "node:assert/strict";
import { summaryHTML } from "../public/js/views.js";
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
