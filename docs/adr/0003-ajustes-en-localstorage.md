# ADR 0003: ajustes del visitante en localStorage
**Decisión**: los ajustes se guardan en `localStorage` con la clave `elflamingo.settings` como un objeto JSON (hoy solo `{theme}`); sin backend, gratis y por visitante.
**Consecuencias**: todo acceso va envuelto en `try/catch` (`settings.js`); si `localStorage` no está disponible se usa el tema `system` sin errores. Un script inline en `<head>`, antes de la hoja de estilos, aplica `data-theme` sin parpadeo; en `system` se omite y CSS `prefers-color-scheme` sigue al dispositivo sin recargar.
