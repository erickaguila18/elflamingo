import test from "node:test";
import assert from "node:assert/strict";
import { soldUpdate, availableUpdate } from "../public/js/sale.js";

// Valores falsos para ts y del: la forma del payload no debe depender del valor.
const FALSY = [undefined, null, false, 0, "", NaN];

// Intención preservada de tests/store.test.js (sin mock.module):
// - products/{id}: SOLO availability + updatedAt.
// - nunca se tocan name, description, price, thumb, fotos/photos ni campos privados.
// - soldAt vive SOLO en products_private; nunca en products.
// - availableUpdate limpia soldAt con el valor de borrado (deleteField()).
const PRODUCT_KEYS = ["availability", "updatedAt"];
const NEVER_IN_PRODUCT = [
  "name",
  "description",
  "price",
  "thumb",
  "photos",
  "fotos",
  "photoCount",
  "createdAt",
  "cost",
  "soldAt",
];
const NEVER_IN_PRIV = ["name", "description", "price", "thumb", "photos", "fotos", "photoCount", "createdAt", "cost"];

function assertSameValue(actual, expected, msg) {
  assert.ok(Object.is(actual, expected), msg ?? `esperado ${String(expected)}, recibido ${String(actual)}`);
}

function assertProductOnlyAvailabilityAndUpdatedAt(product, availability, ts) {
  assert.equal(product.availability, availability);
  assertSameValue(product.updatedAt, ts, "updatedAt debe ser exactamente ts");
  assert.deepEqual(Object.keys(product).sort(), [...PRODUCT_KEYS].sort(), "product solo tiene availability y updatedAt");
  for (const key of NEVER_IN_PRODUCT) {
    assert.ok(!(key in product), `no debe haber ${key} en product`);
  }
  assert.ok(!("soldAt" in product), "soldAt nunca en product");
}

test("soldUpdate(ts): products solo availability=vendido+updatedAt=ts; soldAt solo en priv con ts", () => {
  for (const ts of FALSY) {
    const { product, priv } = soldUpdate(ts);

    assertProductOnlyAvailabilityAndUpdatedAt(product, "vendido", ts);

    assert.deepEqual(Object.keys(priv), ["soldAt"], "priv solo tiene soldAt");
    assertSameValue(priv.soldAt, ts, "soldAt debe ser exactamente ts");
    assert.ok(!("soldAt" in product), "soldAt está solo en priv y nunca en product");
    for (const key of NEVER_IN_PRIV) {
      assert.ok(!(key in priv), `no debe haber ${key} en priv`);
    }
  }
});

test("availableUpdate(ts, del): products solo availability=disponible+updatedAt=ts; soldAt=del solo en priv", () => {
  for (const ts of FALSY) {
    for (const del of FALSY) {
      const { product, priv } = availableUpdate(ts, del);

      assertProductOnlyAvailabilityAndUpdatedAt(product, "disponible", ts);

      assert.deepEqual(Object.keys(priv), ["soldAt"], "priv solo tiene soldAt");
      assertSameValue(priv.soldAt, del, "availableUpdate pone soldAt con el valor de borrado (del)");
      assert.ok(!("soldAt" in product), "soldAt está solo en priv y nunca en product");
      for (const key of NEVER_IN_PRIV) {
        assert.ok(!(key in priv), `no debe haber ${key} en priv`);
      }
    }
  }
});

test("availableUpdate: soldAt usa el valor de borrado, no el timestamp", () => {
  const ts = "ts-falso";
  const del = "__DELETE_FIELD__";
  const { priv } = availableUpdate(ts, del);
  assert.equal(priv.soldAt, del);
  assert.notEqual(priv.soldAt, ts);
});
