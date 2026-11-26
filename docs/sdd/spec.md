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

## Criterios de aceptación
- Dado un visitante sin sesión, cuando consulta `products_private`, entonces Firestore rechaza la lectura (RF-06).
- Dado el formulario con 0 o 5 fotos, cuando guarda, entonces ve un error y no se escribe nada (RF-04).
- Dado precio ≤ 0 o nombre < 2 caracteres, entonces se bloquea el guardado con mensaje claro.
- Dado un nombre con `<script>`, entonces se muestra como texto (sin ejecutarse).
- Dado un producto agotado, entonces la galería lo marca y el detalle dice «Agotado».
- Dado un id inexistente en la URL, entonces se muestra «Este producto ya no existe».

## Fuera de alcance (v1)
Carrito, pagos, múltiples admins, categorías, paginación.
