#!/usr/bin/env bash
# Restore a pg_dump (-Fc) into the database at $DATABASE_URL and unpack an uploads archive
# into ./public/uploads (the directory docker-compose.yml bind-mounts).
# Usage: DATABASE_URL=postgresql://... scripts/restore.sh portfolio-YYYY-MM-DD.dump uploads-YYYY-MM-DD.tar.gz
set -euo pipefail
DUMP=${1:?dump file}
UPLOADS=${2:?uploads archive}
: "${DATABASE_URL:?set DATABASE_URL}"
docker run --rm --network host -v "$(realpath "$DUMP"):/tmp/restore.dump:ro" postgres:18-alpine \
  pg_restore --dbname "$DATABASE_URL" --clean --if-exists --no-owner --no-acl /tmp/restore.dump
mkdir -p public
tar xzf "$UPLOADS" -C public
echo "Restored. Start with: docker compose up -d --build"
