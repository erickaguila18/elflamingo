import test from "node:test";
import assert from "node:assert/strict";
import { validateProduct, parsePrice, margin } from "../public/js/validation.js";

const ok = { name: "Bolsa tejida", description: "Hecha a mano", price: 350, cost: 150, availability: "disponible" };

test("producto válido con 1 a 4 fotos", () => {
  for (const n of [1, 2, 3, 4]) assert.equal(validateProduct(ok, n).valid, true);
});
test("rechaza 0 y 5 fotografías", () => {
  assert.ok(validateProduct(ok, 0).errors.photos);
  assert.ok(validateProduct(ok, 5).errors.photos);
});
test("rechaza nombre corto, precio <= 0 y costo inválido", () => {
  const r = validateProduct({ ...ok, name: "a", price: 0, cost: NaN }, 1);
  assert.ok(r.errors.name && r.errors.price && r.errors.cost);
});
test("rechaza disponibilidad desconocida", () => {
  assert.ok(validateProduct({ ...ok, availability: "quizá" }, 1).errors.availability);
});
test("parsePrice limpia símbolos y rechaza vacío", () => {
  assert.equal(parsePrice("$1,250.50"), 1250.5);
  assert.ok(Number.isNaN(parsePrice("")));
  assert.ok(Number.isNaN(parsePrice("abc")));
});
test("margin calcula porcentaje", () => {
  assert.equal(margin(200, 150), 25);
  assert.equal(margin(0, 10), null);
});
