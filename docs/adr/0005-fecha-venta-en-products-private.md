# ADR 0005: fecha de venta (`soldAt`) en `products_private`, nunca en `products`

**Estado**: aceptada

## Contexto
RF-12 permite marcar un producto como vendido sin eliminarlo ni editarlo, y revertirlo. Se quiere registrar **cuándo** se vendió (`soldAt`, `serverTimestamp()`). Pero `products/{id}` tiene **lectura pública**: cualquier visitante puede leerlo. Las reglas de Firestore son **por documento, no por campo** (ver ADR 0002): si un campo vive en un documento público, es público. La regla de privacidad por diseño del proyecto (constitución 3; RF-06; `AGENTS.md`: nada sensible en `products` ni en el HTML público; precio de inversión solo en `products_private`) exige no exponer datos internos del dueño.

## Decisión
Guardar `soldAt` **solo** en `products_private/{id}`, la colección con lectura/escritura restringida al admin (regla `isAdmin()`, no se modifica `firestore.rules`):
- `markSold(id)`: un `writeBatch` atómico con `batch.update(products/{id}, { availability: "vendido", updatedAt: serverTimestamp() })` + `batch.set(products_private/{id}, { soldAt: serverTimestamp() }, { merge: true })`.
- `markAvailable(id)`: un `writeBatch` atómico con `batch.update(products/{id}, { availability: "disponible", updatedAt: serverTimestamp() })` + `batch.set(products_private/{id}, { soldAt: deleteField() }, { merge: true })`.
- En `products` solo cambia `availability` (+ `updatedAt`); nunca `name`, `description`, `price`, `thumb` ni fotos, y el producto no se borra.
- `merge: true` preserva `cost` y demás campos de `products_private`; `deleteField()` limpia `soldAt` al revertir sin tocar el resto.

## Consecuencias
- La fecha de venta es dato interno del dueño: no es legible por visitantes, no se renderiza en la vista pública y no puede filtrarse en el HTML.
- Misma forma que ADR 0002 (2 colecciones en 1 batch atómico): o se aplican ambos cambios o ninguno; si el batch falla, la UI muestra `describeError` y no se marca nada a medias.
- Revertir es simétrico y no pierde información pública: el producto vuelve a `disponible` intacto.
- Coste cero: sin Storage ni servicios nuevos; una escritura extra en `products_private` por operación, dentro de la cuota Spark.
