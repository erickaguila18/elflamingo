# Especificación: catálogo El Flamingo
**Usuarios**: visitante (cualquiera con el link, solo lectura) · admin (1 cuenta Firebase Auth).

## Requisitos
- **RF-01 Catálogo**: el visitante ve una galería con foto, nombre, precio y etiqueta «Agotado» si aplica.
- **RF-02 Búsqueda**: filtra por nombre en el cliente, sin recargar.
- **RF-03 Detalle**: al hacer clic en un item ve nombre, descripción, precio, disponibilidad y todas sus fotos (1 a 4) con selector de miniaturas.
- **RF-04 Alta/edición/borrado**: el admin gestiona productos con: nombre, descripción, precio al público, precio de inversión, 1 a 4 fotos, disponibilidad (`disponible` | `agotado`).
- **RF-05 Margen**: el panel muestra el margen % = (precio − inversión) / precio.
- **RF-06 Privacidad**: el precio de inversión solo lo lee el admin.
- **RF-07 Enlace directo**: `#/producto/:id` es compartible.
- **RF-08 WhatsApp (opcional)**: si `APP.whatsapp` está configurado, el detalle muestra botón de contacto.
- **RF-09 Configuración**: el visitante puede elegir tema Sistema, Claro u Oscuro desde un botón de configuración.
- **RF-10 Resumen del panel admin**: el admin ve el total de productos (con disponibles y agotados), la inversión total, el valor de venta total y la ganancia estimada con su margen %. Cada producto cuenta como 1 unidad (no hay campo de cantidad). El resumen solo se ve con sesión de admin; la inversión proviene de `products_private`, que solo el admin puede leer. Solo los productos con precio numérico válido y costo numérico válido entran en los cálculos de dinero; los productos sin costo registrado (o con costo inválido) no entran y se informa cuántos hay. ganancia = valor de venta − inversión; margen % = ganancia / valor de venta * 100 redondeado a 1 decimal (no se muestra si el valor de venta es 0); importes redondeados a 2 decimales. La lógica vive en el módulo puro `stats.js` (`summarize`) y los costos se leen con `listCosts()` de `store.js`.
  - Presentación (T24): el admin ve el resumen arriba del panel, bajo el título «Panel» y antes del formulario, en cuatro tarjetas «Productos» (total con «N disponibles · N agotados»), «Inversión total», «Valor de venta» y «Ganancia estimada» (con «Margen: X%» solo si `marginPct` no es null); importes con `formatPrice`; si `withoutCost > 0` se informa «N producto(s) sin costo registrado, no incluidos en los importes»; nota «Se cuenta 1 unidad por producto»; la ganancia se pinta en `--ok` si es positiva y `--bad` si es negativa; HTML por `summaryHTML` en `views.js`; todo texto dinámico por `escapeHtml`.

## Criterios de aceptación
- Dado un visitante sin sesión, cuando consulta `products_private`, entonces Firestore rechaza la lectura (RF-06).
- Dado el formulario con 0 o 5 fotos, cuando guarda, entonces ve un error y no se escribe nada (RF-04).
- Dado precio ≤ 0 o nombre < 2 caracteres, entonces se bloquea el guardado con mensaje claro.
- Dado un nombre con `<script>`, entonces se muestra como texto (sin ejecutarse).
- Dado un producto agotado, entonces la galería lo marca y el detalle dice «Agotado».
- Dado un id inexistente en la URL, entonces se muestra «Este producto ya no existe».
- Dado el panel admin, cuando se abre, entonces el formulario se limpia sin errores en la consola.
- Dada la preferencia "Sistema", cuando el dispositivo cambia entre claro y oscuro, entonces la app lo sigue sin recargar (RF-09).
- Dada la preferencia "Oscuro" o "Claro", cuando se recarga la página, entonces se conserva sin parpadeo de color (RF-09).
- Dado que localStorage no está disponible, entonces la app funciona con el tema "Sistema" y sin errores (RF-09).
- Dada cualquier ruta, el enlace Admin y el botón de configuración permanecen alineados a la derecha del encabezado, con o sin buscador.
- Dado el producto A (precio 100, costo 60, disponible) y el producto B (precio 200, costo 150, agotado), entonces el resumen muestra 2 productos, inversión 210, valor de venta 300, ganancia 90 y margen 30% (RF-10).
- Dado un producto sin costo registrado (o con costo inválido, p. ej. NaN o texto), entonces no entra en los cálculos de dinero y se informa cuántos hay así (RF-10).
- Dado un catálogo vacío, entonces todos los totales son 0 y el margen no se muestra (RF-10).
- Dado el panel admin, cuando se abre, entonces bajo el título «Panel» y antes del formulario aparecen las tarjetas «Productos», «Inversión total», «Valor de venta» y «Ganancia estimada» con los totales de `summarize(list, costs)`, con productos y costos cargados en paralelo con `Promise.all([products(), store.listCosts()])`, y se recalcula al volver a ejecutar `showAdmin` tras guardar o borrar (RF-10).

## Fuera de alcance (v1)
Carrito, pagos, múltiples admins, categorías, paginación.
