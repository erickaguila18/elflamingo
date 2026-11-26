import test from "node:test";
import assert from "node:assert/strict";
import { describeError } from "../public/js/errors.js";

test("permission-denied muestra mensaje de permisos", () => {
  assert.equal(
    describeError({ code: "permission-denied", message: "Missing or insufficient permissions." }),
    "Sin permisos: revisa las reglas de Firestore y tu UID de admin"
  );
});

test("unavailable muestra mensaje de conexión", () => {
  assert.equal(
    describeError({ code: "unavailable", message: "Failed to get document." }),
    "Sin conexión con Firebase. Revisa tu internet e inténtalo de nuevo."
  );
});

test("código auth/* muestra correo o contraseña incorrectos", () => {
  for (const code of ["auth/wrong-password", "auth/user-not-found", "auth/invalid-credential", "auth/"]) {
    assert.equal(describeError({ code, message: "whatever" }), "Correo o contraseña incorrectos.");
  }
});

test("cualquier otro error muestra No se pudo cargar + message", () => {
  assert.equal(describeError({ code: "not-found", message: "No such document" }), "No se pudo cargar: No such document");
  assert.equal(describeError({ message: "boom" }), "No se pudo cargar: boom");
  assert.equal(describeError(new Error("fallo de red")), "No se pudo cargar: fallo de red");
});

test("sin message usa 'error desconocido'", () => {
  assert.equal(describeError({ code: "x" }), "No se pudo cargar: error desconocido");
  assert.equal(describeError({ message: null }), "No se pudo cargar: error desconocido");
  assert.equal(describeError({ message: undefined }), "No se pudo cargar: error desconocido");
  assert.equal(describeError({}), "No se pudo cargar: error desconocido");
});
