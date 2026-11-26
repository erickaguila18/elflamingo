# Plan técnico
## Arquitectura
`public/` (estático) → `index.html` + `js/app.js` (UI y eventos) · `views.js` (HTML puro) · `store.js` (Firestore) · `firebase.js` (carga dinámica del SDK por CDN, versión en `config.js`) · `validation.js`, `format.js`, `router.js`, `images.js`, `errors.js`, `product.js`, `settings.js` (lógica pura, probada) · `settings-ui.js` (panel de configuración).
Router por hash (`#/`, `#/producto/:id`, `#/admin`): funciona en cualquier servidor estático.

## Modelo de datos (Firestore, plan Spark)
- `products/{id}`: name, description, price, availability, thumb (JPEG base64 ~360px), photoCount, createdAt, updatedAt. **Lectura pública**.
- `products/{id}/photos/{0..3}`: `{data, order}` (JPEG base64 ~900px). Lectura pública, se carga solo en el detalle.
- `products_private/{id}`: `{cost}`. Solo admin.

## Ajustes del visitante (RF-09)
Los ajustes se guardan en `localStorage` con la clave `elflamingo.settings` como un objeto JSON (hoy solo `{theme}`; `theme` ∈ `system|light|dark`, por defecto `system`). `settings.js` (puro) normaliza y persiste con `try/catch`: si `localStorage` no está disponible se usa el tema `system` sin errores. Un script inline en `<head>`, antes de la hoja de estilos, aplica `data-theme="light|dark"` sin parpadeo; en `system` se omite `data-theme` y CSS `prefers-color-scheme` decide, siguiendo cambios del dispositivo sin recargar.

## Seguridad
`firestore.rules`: lectura pública del catálogo; escritura y `products_private` solo para el UID admin.

## Fotos sin Storage
Firebase Storage exige plan de pago para buckets nuevos. Se comprimen en el navegador (canvas) y se guardan en Firestore; ver ADR 0001. Un doc de foto pesa ~100–250 KB (límite 1 MiB).

## Despliegue gratuito
Local con `server.py`; público con GitHub Pages (workflow incluido) o Firebase Hosting.
