/* Lógica pura de ajustes del visitante. Sin DOM ni Firebase.
 * Los ajustes se guardan en localStorage (o cualquier `storage` con
 * getItem/setItem) bajo la clave SETTINGS_KEY como un objeto JSON.
 * Hoy solo hay un ajuste: {theme}. Diseñado para sumar más después. */

export const THEMES = Object.freeze(["system", "light", "dark"]);

export const DEFAULT_SETTINGS = Object.freeze({ theme: "system" });

export const SETTINGS_KEY = "elflamingo.settings";

const KNOWN_KEYS = Object.freeze(Object.keys(DEFAULT_SETTINGS));

const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

const validTheme = (v) => typeof v === "string" && THEMES.includes(v);

/* Acepta solo claves conocidas con valores válidos; cualquier otra cosa devuelve DEFAULT_SETTINGS. */
export function normalizeSettings(raw) {
  if (!isPlainObject(raw)) return DEFAULT_SETTINGS;
  for (const key of Object.keys(raw)) {
    if (!KNOWN_KEYS.includes(key)) return DEFAULT_SETTINGS; // clave desconocida
  }
  if (!Object.prototype.hasOwnProperty.call(raw, "theme")) return DEFAULT_SETTINGS;
  if (!validTheme(raw.theme)) return DEFAULT_SETTINGS;
  return { theme: raw.theme };
}

/* Lee SETTINGS_KEY del storage. Si storage falla o el JSON está roto, DEFAULT_SETTINGS. */
export function loadSettings(storage) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (raw == null) return DEFAULT_SETTINGS;
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/* Guarda SETTINGS_KEY como JSON. Devuelve true si pudo; false si storage falla. */
export function saveSettings(storage, settings) {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/* Resuelve el tema efectivo a "light" | "dark".
 * "system" (o cualquier otro valor) sigue systemPrefersDark. */
export function resolveTheme(theme, systemPrefersDark) {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
}
