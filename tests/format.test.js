import test from "node:test";
import assert from "node:assert/strict";
import { formatPrice, escapeHtml, whatsappLink, availabilityLabel } from "../public/js/format.js";

test("formatPrice en MXN", () => assert.match(formatPrice(1234.5), /1,234\.50/));
test("escapeHtml neutraliza etiquetas", () => assert.equal(escapeHtml('<img onerror="x">'), "&lt;img onerror=&quot;x&quot;&gt;"));
test("whatsappLink vacío sin número y con texto codificado", () => {
  assert.equal(whatsappLink("", "hola"), "");
  assert.equal(whatsappLink("+52 55 1234", "a b"), "https://wa.me/52551234?text=a%20b");
});
test("availabilityLabel", () => {
  assert.equal(availabilityLabel("disponible"), "Disponible");
  assert.equal(availabilityLabel("agotado"), "Agotado");
});
