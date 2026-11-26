/* Lógica pura: traduce errores de Firebase/Firestore a mensajes en español. */
export function describeError(e) {
  const code = e?.code;
  if (code === "permission-denied") return "Sin permisos: revisa las reglas de Firestore y tu UID de admin";
  if (code === "unavailable") return "Sin conexión con Firebase. Revisa tu internet e inténtalo de nuevo.";
  if (typeof code === "string" && code.startsWith("auth/")) return "Correo o contraseña incorrectos.";
  return "No se pudo cargar: " + (e?.message ?? "error desconocido");
}
