# ADR 0001: fotos como base64 en Firestore
**Estado**: aceptada · **Contexto**: se exige costo cero; Storage requiere plan Blaze para buckets nuevos.
**Decisión**: comprimir en el cliente (900 px, JPEG 0.72), guardar en subcolección `photos` y una miniatura en el doc del producto para que el catálogo cargue rápido.
**Consecuencias**: sin CDN de imágenes; cuota Spark de 1 GiB de datos y 50k lecturas/día (suficiente para un catálogo pequeño). Si crece, migrar a Storage o Cloudinary cambiando solo `store.js` y `images.js`.
