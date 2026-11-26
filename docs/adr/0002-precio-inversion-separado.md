# ADR 0002: precio de inversión en colección privada
**Decisión**: las reglas de Firestore son por documento, no por campo; por eso el costo vive en `products_private/{id}`.
**Consecuencias**: cada guardado escribe en 2 colecciones (en un batch atómico).
