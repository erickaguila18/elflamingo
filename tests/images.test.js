import test from "node:test";
import assert from "node:assert/strict";
import { scaleDimensions, dataUrlBytes } from "../public/js/images.js";

test("scaleDimensions conserva proporción y no agranda", () => {
  assert.deepEqual(scaleDimensions(1800, 900, 900), { width: 900, height: 450 });
  assert.deepEqual(scaleDimensions(300, 200, 900), { width: 300, height: 200 });
});
test("dataUrlBytes estima el tamaño", () => assert.equal(dataUrlBytes("data:image/jpeg;base64,AAAA"), 3));
