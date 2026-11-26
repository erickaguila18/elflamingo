import test from "node:test";
import assert from "node:assert/strict";
import {
  THEMES,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  normalizeSettings,
  loadSettings,
  saveSettings,
  resolveTheme,
} from "../public/js/settings.js";

/* ---------- storage falso ---------- */
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); },
    removeItem(k) { data.delete(k); },
    data,
  };
}
const throwingStorage = {
  getItem() { throw new Error("localStorage no disponible"); },
  setItem() { throw new Error("localStorage no disponible"); },
};

/* ---------- constantes ---------- */
test("THEMES es exactamente [system, light, dark]", () => {
  assert.deepEqual(THEMES, ["system", "light", "dark"]);
});

test("DEFAULT_SETTINGS es {theme:'system'}", () => {
  assert.deepEqual(DEFAULT_SETTINGS, { theme: "system" });
});

test("la clave de persistencia es 'elflamingo.settings'", () => {
  assert.equal(SETTINGS_KEY, "elflamingo.settings");
});

/* ---------- normalizeSettings ---------- */
test("normalizeSettings acepta los tres temas válidos", () => {
  for (const theme of THEMES) {
    assert.deepEqual(normalizeSettings({ theme }), { theme });
  }
});

test("normalizeSettings: tema desconocido devuelve DEFAULT_SETTINGS", () => {
  assert.deepEqual(normalizeSettings({ theme: "blue" }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: "Sistema" }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: "System" }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: "" }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: null }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: 1 }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: ["dark"] }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: { mode: "dark" } }), DEFAULT_SETTINGS);
});

test("normalizeSettings: claves desconocidas devuelven DEFAULT_SETTINGS", () => {
  assert.deepEqual(normalizeSettings({}), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ foo: "bar" }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ unknown: true }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: "dark", extra: 1 }), DEFAULT_SETTINGS);
});

test("normalizeSettings: cualquier otra cosa devuelve DEFAULT_SETTINGS", () => {
  assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings("dark"), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings("system"), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings(42), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings(true), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings([]), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings(["dark"]), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings(() => ({})), DEFAULT_SETTINGS);
});

/* ---------- loadSettings ---------- */
test("loadSettings: sin valor guardado devuelve DEFAULT_SETTINGS", () => {
  assert.deepEqual(loadSettings(fakeStorage()), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": null })), DEFAULT_SETTINGS);
});

test("loadSettings: valores válidos guardados como JSON", () => {
  const s = fakeStorage({ "elflamingo.settings": JSON.stringify({ theme: "dark" }) });
  assert.deepEqual(loadSettings(s), { theme: "dark" });
  const s2 = fakeStorage({ "elflamingo.settings": '{"theme":"light"}' });
  assert.deepEqual(loadSettings(s2), { theme: "light" });
});

test("loadSettings: JSON roto devuelve DEFAULT_SETTINGS", () => {
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": "{oops" })), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": "not json" })), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": "" })), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": "{" })), DEFAULT_SETTINGS);
});

test("loadSettings: JSON válido pero inválido devuelve DEFAULT_SETTINGS", () => {
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": '"dark"' })), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": "null" })), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": "[]" })), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": '{"theme":"blue"}' })), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(fakeStorage({ "elflamingo.settings": '{"theme":"dark","x":1}' })), DEFAULT_SETTINGS);
});

test("loadSettings: si storage falla devuelve DEFAULT_SETTINGS sin lanzar", () => {
  assert.doesNotThrow(() => loadSettings(throwingStorage));
  assert.deepEqual(loadSettings(throwingStorage), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(undefined), DEFAULT_SETTINGS);
});

/* ---------- saveSettings ---------- */
test("saveSettings guarda JSON bajo 'elflamingo.settings' y devuelve true", () => {
  const s = fakeStorage();
  assert.equal(saveSettings(s, { theme: "dark" }), true);
  assert.equal(s.data.get("elflamingo.settings"), '{"theme":"dark"}');
  assert.deepEqual(loadSettings(s), { theme: "dark" });
});

test("saveSettings: roundtrip de los tres temas", () => {
  for (const theme of THEMES) {
    const s = fakeStorage();
    assert.equal(saveSettings(s, { theme }), true);
    assert.deepEqual(loadSettings(s), { theme });
  }
});

test("saveSettings: si storage falla devuelve false sin lanzar", () => {
  assert.doesNotThrow(() => saveSettings(throwingStorage, { theme: "dark" }));
  assert.equal(saveSettings(throwingStorage, { theme: "dark" }), false);
  assert.equal(saveSettings(null, { theme: "dark" }), false);
  assert.equal(saveSettings(undefined, { theme: "dark" }), false);
});

test("saveSettings: si settings no es serializable devuelve false", () => {
  const s = fakeStorage();
  const circular = { theme: "dark" };
  circular.self = circular;
  assert.equal(saveSettings(s, circular), false);
  assert.equal(saveSettings(s, { theme: "dark", n: 10n }), false);
});

/* ---------- resolveTheme ---------- */
test("resolveTheme: 'system' sigue la preferencia del dispositivo", () => {
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("system", true), "dark");
});

test("resolveTheme: 'light' siempre claro", () => {
  assert.equal(resolveTheme("light", false), "light");
  assert.equal(resolveTheme("light", true), "light");
});

test("resolveTheme: 'dark' siempre oscuro", () => {
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("dark", true), "dark");
});

test("resolveTheme siempre devuelve 'light' o 'dark'", () => {
  for (const theme of [...THEMES, "bogus", null, undefined, 1]) {
    for (const prefersDark of [true, false]) {
      assert.ok(["light", "dark"].includes(resolveTheme(theme, prefersDark)));
    }
  }
});
