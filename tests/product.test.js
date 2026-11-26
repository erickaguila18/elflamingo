import test from "node:test";
import assert from "node:assert/strict";
import { buildProduct } from "../public/js/product.js";

const fields = {
  name: "  Bolsa tejida  ",
  description: "  Hecha a mano  ",
  price: "350",
  cost: "150",
  availability: "disponible",
};

test("recorta name y description y convierte price/cost con parsePrice", () => {
  assert.deepEqual(buildProduct(fields), {
    data: { name: "Bolsa tejida", description: "Hecha a mano", price: 350, availability: "disponible" },
    cost: 150,
  });
});

test("price y cost aceptan formato de moneda como en el formulario", () => {
  const r = buildProduct({ ...fields, price: "$1,250.50", cost: "$800" });
  assert.equal(r.data.price, 1250.5);
  assert.equal(r.cost, 800);
});

test("price o cost vacío/inválido queda NaN", () => {
  const empty = buildProduct({ ...fields, price: "", cost: "" });
  assert.ok(Number.isNaN(empty.data.price));
  assert.ok(Number.isNaN(empty.cost));
  const bad = buildProduct({ ...fields, price: "abc", cost: "abc" });
  assert.ok(Number.isNaN(bad.data.price));
  assert.ok(Number.isNaN(bad.cost));
});

test("name y description solo sin espacios sobrantes, sin tocar el resto", () => {
  const r = buildProduct({ ...fields, name: "\tNombre\n con  espacios ", description: "  línea\n\nsigue  " });
  assert.equal(r.data.name, "Nombre\n con  espacios");
  assert.equal(r.data.description, "línea\n\nsigue");
});

test("preserva availability tal cual", () => {
  assert.equal(buildProduct({ ...fields, availability: "agotado" }).data.availability, "agotado");
});

test("data no incluye cost (precio de inversión fuera de products)", () => {
  const r = buildProduct(fields);
  assert.ok(!("cost" in r.data));
  assert.deepEqual(Object.keys(r.data).sort(), ["availability", "description", "name", "price"]);
  assert.deepEqual(Object.keys(r).sort(), ["cost", "data"]);
});
