import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute } from "../public/js/router.js";

test("rutas conocidas", () => {
  assert.deepEqual(parseRoute(""), { name: "list" });
  assert.deepEqual(parseRoute("#/"), { name: "list" });
  assert.deepEqual(parseRoute("#/producto/abc%20d"), { name: "detail", id: "abc d" });
  assert.deepEqual(parseRoute("#/admin"), { name: "admin" });
});
test("ruta desconocida", () => assert.equal(parseRoute("#/x/y").name, "notfound"));
