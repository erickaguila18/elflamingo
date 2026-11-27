# El Flamingo · contexto para el agente Claude

Catálogo de consulta (SPA) en HTML + JS vanilla (módulos ES, sin build), servido con Python, datos en Firebase Firestore (proyecto `elflamingo-bd80c`). Prioridad del dueño: **todo gratis** (plan Spark, sin Storage).

## Flujo SDD (obligatorio)
1. Leer `docs/sdd/constitution.md`, `spec.md`, `plan.md` y `tasks.md`.
2. Si el cambio altera comportamiento: actualizar primero `spec.md` (con criterios de aceptación) y `plan.md`.
3. Tomar UNA tarea de `tasks.md`; escribir primero la prueba en `tests/`; luego el código.
4. `npm test` debe pasar. Marcar la tarea `[x]` y commitear (Conventional Commits).
5. Decisiones relevantes nuevas → `docs/adr/NNNN-titulo.md`.

## Comandos
- `python3 server.py [puerto]` → http://localhost:8000
- `npm test` → pruebas unitarias (`node --test`, sin dependencias)

## Reglas duras
- El precio de inversión SOLO en `products_private`; nunca en `products` ni en el HTML público.
- Todo texto de usuario se pinta con `escapeHtml`.
- La lógica pura va en módulos sin DOM ni Firebase (`validation`, `format`, `router`, `images`) para poder probarla.
- No subir secretos. La config web de Firebase es pública; la seguridad son las reglas.
- Una versión del SDK, definida solo en `public/js/config.js`.
- No usar mock.module ni flags experimentales de Node. Lo que depende de Firebase se prueba con el emulador; la lógica pura va en módulos sin Firebase.
