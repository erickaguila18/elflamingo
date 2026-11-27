import test from "node:test";
import assert from "node:assert/strict";
import { formatPrice, escapeHtml, availabilityLabel } from "../public/js/format.js";

test("formatPrice en MXN", () => assert.match(formatPrice(1234.5), /1,234\.50/));
test("escapeHtml neutraliza etiquetas", () => assert.equal(escapeHtml('<img onerror="x">'), "&lt;img onerror=&quot;x&quot;&gt;"));
test("availabilityLabel", () => {
  assert.equal(availabilityLabel("disponible"), "Disponible");
  assert.equal(availabilityLabel("agotado"), "Agotado");
});
test("availabilityLabel vendido → Vendido", () => assert.equal(availabilityLabel("vendido"), "Vendido"));
