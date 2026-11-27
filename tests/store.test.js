import test, { mock } from "node:test";
import assert from "node:assert/strict";

// Mockea firebase.js antes de importar store.js (sin red ni SDK).
const TS = "__SERVER_TIMESTAMP__"; // centinela de serverTimestamp()
const DEL = "__DELETE_FIELD__"; // centinela de deleteField()

let calls = [];
const fakeBatch = () => ({
  update: (...a) => calls.push(["update", ...a]),
  set: (...a) => calls.push(["set", ...a]),
  delete: (...a) => calls.push(["delete", ...a]),
  commit: async () => { calls.push(["commit"]); },
});

await mock.module(new URL("../public/js/firebase.js", import.meta.url).href, {
  exports: {
    db: { __fake: "db" },
    fsM: {
      collection: (_db, ...segs) => ({ path: segs.join("/") }),
      doc: (_db, ...segs) => ({ path: segs.filter((s) => typeof s === "string").join("/") }),
      getDocs: async () => ({ docs: [], forEach: () => {} }),
      getDoc: async () => ({ exists: () => false, data: () => ({}) }),
      setDoc: async () => {},
      writeBatch: () => fakeBatch(),
      query: (x) => x,
      orderBy: (...a) => a,
      serverTimestamp: () => TS,
      deleteField: () => DEL,
    },
  },
});

const store = await import("../public/js/store.js");

const FORBIDDEN = ["name", "description", "price", "thumb", "photos", "photoCount", "createdAt", "cost"];

function reset() { calls = []; }

test("markSold: batch atómico; products solo availability+updatedAt; soldAt en products_private con merge", async () => {
  reset();
  await store.markSold("p1");

  const updates = calls.filter((c) => c[0] === "update");
  const sets = calls.filter((c) => c[0] === "set");
  assert.equal(updates.length, 1, "un solo batch.update");
  assert.equal(sets.length, 1, "un solo batch.set");
  assert.equal(calls.filter((c) => c[0] === "delete").length, 0, "no borra nada");

  const [, ref, payload] = updates[0];
  assert.equal(ref.path, "products/p1", "actualiza products/{id}");
  assert.deepEqual(payload, { availability: "vendido", updatedAt: TS });
  for (const k of FORBIDDEN) assert.ok(!(k in payload), `no toca ${k}`);

  const [, privRef, privPayload, options] = sets[0];
  assert.equal(privRef.path, "products_private/p1", "escribe products_private/{id}");
  assert.deepEqual(privPayload, { soldAt: TS }, "fecha de venta con serverTimestamp");
  assert.deepEqual(options, { merge: true }, "merge: true");
  assert.ok(!("soldAt" in payload), "soldAt nunca en products");
  for (const k of FORBIDDEN) assert.ok(!(k in privPayload), `no toca ${k}`);

  assert.equal(calls.filter((c) => c[0] === "commit").length, 1, "un solo commit");
  assert.ok(calls.at(-1)[0] === "commit", "commit al final");
});

test("markAvailable: vuelve a disponible y limpia soldAt con deleteField() usando merge", async () => {
  reset();
  await store.markAvailable("p1");

  const updates = calls.filter((c) => c[0] === "update");
  const sets = calls.filter((c) => c[0] === "set");
  assert.equal(updates.length, 1);
  assert.equal(sets.length, 1);
  assert.equal(calls.filter((c) => c[0] === "delete").length, 0, "no borra el producto");

  const [, ref, payload] = updates[0];
  assert.equal(ref.path, "products/p1");
  assert.deepEqual(payload, { availability: "disponible", updatedAt: TS });
  for (const k of FORBIDDEN) assert.ok(!(k in payload), `no toca ${k}`);

  const [, privRef, privPayload, options] = sets[0];
  assert.equal(privRef.path, "products_private/p1");
  assert.deepEqual(privPayload, { soldAt: DEL }, "soldAt: deleteField()");
  assert.deepEqual(options, { merge: true }, "merge: true");
  assert.ok(!("soldAt" in payload), "soldAt nunca en products");

  assert.equal(calls.filter((c) => c[0] === "commit").length, 1);
});
