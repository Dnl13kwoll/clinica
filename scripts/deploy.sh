#!/bin/bash
set -e
echo "=== Deploy ==="
git pull origin main
pnpm install
pnpm build
docker compose up -d --build
echo "=== Concluido! ==="
