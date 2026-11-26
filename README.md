# El Flamingo · catálogo de consulta

SPA (HTML + JS) con galería de productos tipo marketplace, datos en **Firebase Firestore** y panel de administración. Todo en capas gratuitas (Firebase Spark, GitHub).

## 1. Ejecutar localmente
```bash
python3 server.py        # http://localhost:8000
npm test                 # pruebas (Node 20+, sin instalar nada)
```

## 2. Configurar Firebase (una sola vez, ~5 min)
1. Consola → proyecto `elflamingo-bd80c` → **Build > Firestore Database > Crear base de datos** (modo producción).
2. **Build > Authentication > Comenzar > Correo/contraseña (activar)**. En *Users* crea tu usuario admin y copia su **User UID**.
3. Abre `firestore.rules`, reemplaza `PEGA_AQUI_EL_UID_DEL_ADMIN` por tu UID y pega el contenido en **Firestore > Reglas > Publicar** (o `firebase deploy --only firestore:rules`).
4. **Authentication > Settings > Authorized domains**: agrega tu dominio de GitHub Pages (`erickaguila18.github.io`) si lo publicas ahí.
5. Recomendado: en Google Cloud Console > Credenciales, restringe la API key a tus dominios (`localhost`, `erickaguila18.github.io`).
6. Entra a `http://localhost:8000/#/admin`, inicia sesión y crea tu primer producto.

> Si la página no carga Firebase, cambia `SDK_VERSION` en `public/js/config.js` por una versión vigente.
> La config web de Firebase es pública por diseño; lo que protege tus datos son las reglas.

## 3. Privacidad del precio de inversión
Vive en `products_private/{id}` y solo el UID admin puede leerlo. Nunca llega al catálogo público.

## 4. Git: crear ramas y subir
El repo remoto está vacío. Desde esta carpeta:
```bash
./scripts/init-git.sh mi-rama      # crea y sube main, develop y mi-rama
```
Flujo diario: `git checkout mi-rama` → cambios → `npm test` → `git commit -m "feat: ..."` → `git push` → Pull Request hacia `develop`.

## 5. Publicar gratis
- **GitHub Pages**: Settings > Pages > Source: *GitHub Actions* (workflow `pages.yml`, requiere repo público en plan gratuito).
- **Firebase Hosting**: `npm i -g firebase-tools && firebase login && firebase deploy --only hosting`.

## 6. Desarrollo con SDD y Claude
Lee `CLAUDE.md` y `docs/sdd/` (constitución, spec, plan, tareas). Comandos para Claude Code: `/spec`, `/implement`, `/review` (`.claude/commands/`).

## Límites del plan gratuito
Fotos guardadas en Firestore (ADR 0001): ~1 GiB de datos y 50k lecturas/día. Suficiente para un catálogo pequeño o mediano.
