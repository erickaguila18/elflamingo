import test from "node:test";
import assert from "node:assert/strict";
import { summarize } from "../public/js/stats.js";

test("ejemplo de la spec: A disponible 100/60 + B agotado 200/150", () => {
  const products = [
    { id: "a", price: 100, availability: "disponible" },
    { id: "b", price: 200, availability: "agotado" },
  ];
  const r = summarize(products, { a: 60, b: 150 });
  assert.deepEqual(r, {
    totalProducts: 2,
    available: 1,
    soldOut: 1,
    withCost: 2,
    withoutCost: 0,
    investment: 210,
    salesValue: 300,
    profit: 90,
    marginPct: 30,
    byAvailability: {
      disponible: { count: 1, investment: 60, salesValue: 100, profit: 40 },
      agotado: { count: 1, investment: 150, salesValue: 200, profit: 50 },
    },
  });
});

test("catálogo vacío: todos los totales son 0 y el margen no se muestra", () => {
  const r = summarize([], {});
  assert.deepEqual(r, {
    totalProducts: 0,
    available: 0,
    soldOut: 0,
    withCost: 0,
    withoutCost: 0,
    investment: 0,
    salesValue: 0,
    profit: 0,
    marginPct: null,
    byAvailability: {
      disponible: { count: 0, investment: 0, salesValue: 0, profit: 0 },
      agotado: { count: 0, investment: 0, salesValue: 0, profit: 0 },
    },
  });
  assert.deepEqual(summarize([]), r);
});

test("producto sin costo registrado: no entra en los cálculos de dinero y se informa", () => {
  const products = [
    { id: "a", price: 100, availability: "disponible" },
    { id: "b", price: 200, availability: "agotado" },
  ];
  const r = summarize(products, { a: 60 }); // b sin costo en products_private
  assert.equal(r.totalProducts, 2);
  assert.equal(r.withCost, 1);
  assert.equal(r.withoutCost, 1);
  assert.equal(r.investment, 60);
  assert.equal(r.salesValue, 100);
  assert.equal(r.profit, 40);
  assert.equal(r.marginPct, 40);
  // sigue contando en totalProducts y en su bucket de disponibilidad
  assert.equal(r.byAvailability.agotado.count, 1);
  assert.deepEqual(r.byAvailability.agotado, { count: 1, investment: 0, salesValue: 0, profit: 0 });
});

test("costo inválido (NaN o texto): no entra en los cálculos de dinero", () => {
  const products = [
    { id: "a", price: 100, availability: "disponible" },
    { id: "b", price: 200, availability: "disponible" },
    { id: "c", price: 300, availability: "disponible" },
  ];
  const r = summarize(products, { a: 60, b: NaN, c: "abc" });
  assert.equal(r.totalProducts, 3);
  assert.equal(r.withCost, 1);
  assert.equal(r.withoutCost, 2);
  assert.equal(r.investment, 60);
  assert.equal(r.salesValue, 100);
  assert.equal(r.profit, 40);
});

test("sin costo numérico válido en todo el catálogo: totales de dinero 0 y margen null", () => {
  const products = [{ id: "a", price: 100, availability: "disponible" }];
  const r = summarize(products, { a: NaN });
  assert.equal(r.withoutCost, 1);
  assert.equal(r.investment, 0);
  assert.equal(r.salesValue, 0);
  assert.equal(r.profit, 0);
  assert.equal(r.marginPct, null);
});

test("precio numérico inválido: no entra en los cálculos de dinero", () => {
  const products = [
    { id: "a", price: NaN, availability: "disponible" },
    { id: "b", price: "100", availability: "disponible" },
  ];
  const r = summarize(products, { a: 60, b: 60 });
  assert.equal(r.totalProducts, 2);
  assert.equal(r.withoutCost, 2);
  assert.equal(r.investment, 0);
  assert.equal(r.salesValue, 0);
  assert.equal(r.profit, 0);
  assert.equal(r.marginPct, null);
});

test("desglose por disponibilidad: count, investment, salesValue, profit", () => {
  const products = [
    { id: "a", price: 100, availability: "disponible" },
    { id: "b", price: 50, availability: "disponible" },
    { id: "c", price: 200, availability: "agotado" },
  ];
  const r = summarize(products, { a: 60, b: 20, c: 150 });
  assert.equal(r.available, 2);
  assert.equal(r.soldOut, 1);
  assert.deepEqual(r.byAvailability.disponible, { count: 2, investment: 80, salesValue: 150, profit: 70 });
  assert.deepEqual(r.byAvailability.agotado, { count: 1, investment: 150, salesValue: 200, profit: 50 });
  assert.equal(r.investment, 230);
  assert.equal(r.salesValue, 350);
  assert.equal(r.profit, 120);
});

test("redondeo: 0.1 + 0.2 no deja errores de coma flotante", () => {
  const products = [
    { id: "a", price: 0.1, availability: "disponible" },
    { id: "b", price: 0.2, availability: "disponible" },
  ];
  const r = summarize(products, { a: 0, b: 0 });
  assert.equal(r.salesValue, 0.3);
  assert.equal(r.profit, 0.3);
  assert.equal(r.marginPct, 100);
});

test("redondeo: importes a 2 decimales y margen a 1 decimal", () => {
  // 100/3 con costo 0 → valor de venta 33.33
  const r = summarize([{ id: "a", price: 100 / 3, availability: "disponible" }], { a: 0 });
  assert.equal(r.salesValue, 33.33);
  assert.equal(r.investment, 0);
  assert.equal(r.profit, 33.33);

  // profit 1 / salesValue 3 → 33.333... → 33.3
  const m = summarize([{ id: "x", price: 3, availability: "disponible" }], { x: 2 });
  assert.equal(m.profit, 1);
  assert.equal(m.marginPct, 33.3);
});

test("cada producto cuenta como 1 unidad (no hay campo de cantidad)", () => {
  const products = [{ id: "a", price: 100, availability: "disponible", quantity: 5 }];
  const r = summarize(products, { a: 60 });
  assert.equal(r.totalProducts, 1);
  assert.equal(r.investment, 60);
  assert.equal(r.salesValue, 100);
  assert.equal(r.profit, 40);
});
