# ADR 0004: número de WhatsApp en Firestore, no en config.js

**Estado**: aceptada

## Contexto
RF-08 lee el número de WhatsApp de `APP.whatsapp` en `config.js`. Pero cambiar ese número exige editar el código, redeployar el sitio y esperar; el dueño quiere cambiarlo desde el panel admin sin tocar archivos. `config.js` se empaqueta estáticamente y no es editable en tiempo de ejecución. El proyecto ya usa Firestore (plan Spark, sin Storage) para datos públicos y privados, y RF-11 pide que el catálogo público lea el número de ahí.

## Decisión
Guardar el número en Firestore en `site/contact` como `{whatsapp, updatedAt}`:
- `site/{doc}` con `allow read: if true; allow write: if isAdmin();` (una sola regla nueva; el número es público por diseño — aparece en el `wa.me` del botón — pero solo el admin escribe).
- `store.js` `getContact()` (lectura pública) y `saveContact(number)` (`setDoc` con `serverTimestamp()`, solo admin por regla).
- El número efectivo se resuelve con `resolveWhatsapp(remote, fallback)`: `normalizeWhatsapp(remote)` si es válido; si no, `normalizeWhatsapp(APP.whatsapp)`; si no, `""` (sin botón).
- `APP.whatsapp` en `config.js` queda como respaldo: si no hay número guardado (o `getContact` falla), se usa el de configuración.

## Consecuencias
- Cambiar el número es instantáneo y no requiere desplegar.
- El número nunca está oculto: es público a propósito (va en el enlace `wa.me`); no se mezcla con `products_private` (precio de inversión, solo admin).
- Si Firestore no responde, `showDetail` cae a `APP.whatsapp` con `try/catch` sin romper la vista.
- Se paga una lectura extra (`site/contact`) por vista de detalle; dentro de la cuota Spark.
