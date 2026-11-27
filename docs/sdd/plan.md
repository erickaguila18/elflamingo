# Plan técnico
## Arquitectura
`public/` (estático) → `index.html` + `js/app.js` (UI y eventos) · `views.js` (HTML puro) · `store.js` (Firestore) · `firebase.js` (carga dinámica del SDK por CDN, versión en `config.js`) · `validation.js`, `format.js`, `router.js`, `images.js`, `errors.js`, `product.js`, `settings.js`, `stats.js`, `contact.js` (lógica pura, probada) · `settings-ui.js` (panel de configuración).
RF-10: `stats.js` `summarize(products, costs)` calcula el resumen financiero del panel admin (total disponibles/agotados, inversión, valor de venta, ganancia, margen %, conteo sin costo, desglose por disponibilidad); `store.js` `listCosts()` lee `products_private` (solo admin) y devuelve `{id: cost}`. Presentación: `views.js` `summaryHTML(s)` pinta cuatro tarjetas («Productos», «Inversión total», «Valor de venta», «Ganancia estimada» + «Margen: X%», línea de sin costo, nota «Se cuenta 1 unidad por producto») con `formatPrice` + `escapeHtml`; `showAdmin` carga `Promise.all([products(), store.listCosts()])`, calcula `summarize(list, costs)` e inserta el HTML bajo «Panel» antes del formulario; CSS `.summary` rejilla 2 columnas en móvil / 4 en pantallas anchas con variables existentes (`--card`, `--line`, `--ink`, `--mute`, `--pink`, `--ok`, `--bad`).
RF-08: `contact.js` `contactUrl(number, product, { pageUrl, priceText })` construye `https://wa.me/<dígitos>?text=<mensaje codificado>`; `normalizeWhatsapp` valida el número (11–15 dígitos con código de país, sin `+`, espacios, guiones, puntos ni paréntesis; ceros a la izquierda quitados); `buildMessage` arma el mensaje (disponible vs agotado) con nombre, precio (`priceText`) y `pageUrl`, nunca el precio de inversión; `views.js` `detailHTML(p, { pageUrl, whatsapp })` muestra el botón (`target="_blank"`, `rel="noopener"`) solo si hay número válido; `app.js` `showDetail` pasa `pageUrl`; `APP.whatsapp` en `config.js` por defecto `""`.
RF-11: `site/contact` `{whatsapp, updatedAt}` en Firestore (lectura pública, escritura admin); `store.js` `getContact()` / `saveContact(number)`; `contact.js` `resolveWhatsapp(remote, fallback)`; `showDetail` resuelve el número con `try/catch` (fallback `APP.whatsapp` de `config.js`); el panel admin muestra la tarjeta «Contacto de WhatsApp» con `normalizeWhatsapp` + `describeError`. Ver ADR 0004.
Router por hash (`#/`, `#/producto/:id`, `#/admin`): funciona en cualquier servidor estático.

## Modelo de datos (Firestore, plan Spark)
- `products/{id}`: name, description, price, availability, thumb (JPEG base64 ~360px), photoCount, createdAt, updatedAt. **Lectura pública**.
- `products/{id}/photos/{0..3}`: `{data, order}` (JPEG base64 ~900px). Lectura pública, se carga solo en el detalle.
- `products_private/{id}`: `{cost}`. Solo admin.

## Ajustes del visitante (RF-09)
Los ajustes se guardan en `localStorage` con la clave `elflamingo.settings` como un objeto JSON (hoy solo `{theme}`; `theme` ∈ `system|light|dark`, por defecto `system`). `settings.js` (puro) normaliza y persiste con `try/catch`: si `localStorage` no está disponible se usa el tema `system` sin errores. Un script inline en `<head>`, antes de la hoja de estilos, aplica `data-theme="light|dark"` sin parpadeo; en `system` se omite `data-theme` y CSS `prefers-color-scheme` decide, siguiendo cambios del dispositivo sin recargar.

## Seguridad
`firestore.rules`: lectura pública del catálogo; escritura y `products_private` solo para el UID admin; `site/{doc}` lectura pública, escritura solo admin.

## Fotos sin Storage
Firebase Storage exige plan de pago para buckets nuevos. Se comprimen en el navegador (canvas) y se guardan en Firestore; ver ADR 0001. Un doc de foto pesa ~100–250 KB (límite 1 MiB).

## Despliegue gratuito
Local con `server.py`; público con GitHub Pages (workflow incluido) o Firebase Hosting.
