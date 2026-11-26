/* Interfaz del panel de configuración. Usa el módulo puro settings.js.
 * El diálogo #settings está en index.html; el tema se aplica con
 * data-theme="light|dark" en <html> (se quita para "system"). */
import { THEMES, loadSettings, saveSettings } from "./settings.js";

const THEME_INPUT = 'input[name="theme"]';
const VALID = (v) => THEMES.includes(v);

function getStorage() {
  try { return window.localStorage; } catch { return null; }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
}

export function initSettings() {
  const btn = document.getElementById("settingsBtn");
  const dialog = document.getElementById("settings");
  if (!btn || !dialog) return;

  const storage = getStorage();
  const radios = Array.from(dialog.querySelectorAll(THEME_INPUT));
  const closeBtn = dialog.querySelector("#closeSettings");

  const markSaved = () => {
    const { theme } = loadSettings(storage);
    for (const r of radios) r.checked = r.value === theme;
  };

  // Tema inicial coherente con lo guardado (sin parpadeo si ya lo aplicó el script inline).
  applyTheme(loadSettings(storage).theme);

  btn.addEventListener("click", () => {
    markSaved();
    dialog.showModal();
  });

  for (const r of radios) {
    r.addEventListener("change", () => {
      if (!r.checked) return;
      const theme = VALID(r.value) ? r.value : "system";
      saveSettings(storage, { ...loadSettings(storage), theme }); // guarda objeto JSON completo
      applyTheme(theme);
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", () => dialog.close());
}
