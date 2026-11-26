#!/usr/bin/env bash
# Uso: ./scripts/init-git.sh [tu-rama]   (por defecto: feat/catalogo-mvp)
set -euo pipefail
BRANCH="${1:-feat/catalogo-mvp}"
REMOTE="https://github.com/erickaguila18/elflamingo.git"
[ -d .git ] || git init -b main
git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REMOTE"
git add -A
git commit -m "chore: estructura inicial SDD, SPA de catálogo y pruebas" || true
git push -u origin main
git checkout -b develop && git push -u origin develop
git checkout -b "$BRANCH" && git push -u origin "$BRANCH"
echo "Listo: main, develop y $BRANCH creadas. Trabaja en $BRANCH y abre Pull Request hacia develop."
