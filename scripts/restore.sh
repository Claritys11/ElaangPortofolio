#!/usr/bin/env bash
# Restore a pg_dump (-Fc) and an uploads archive into the compose stack.
# Usage: scripts/restore.sh portfolio-YYYY-MM-DD.dump uploads-YYYY-MM-DD.tar.gz
set -euo pipefail
DUMP=${1:?dump file}
UPLOADS=${2:?uploads archive}
docker compose up -d db
until docker compose exec -T db pg_isready -U portfolio -q; do sleep 1; done
docker compose cp "$DUMP" db:/tmp/restore.dump
docker compose exec -T db pg_restore -U portfolio -d portfolio --clean --if-exists --no-owner --no-acl /tmp/restore.dump
docker compose run --rm --no-deps -u root -v "$(realpath "$UPLOADS"):/tmp/u.tar.gz:ro" --entrypoint sh app \
  -c 'tar xzf /tmp/u.tar.gz -C /app/public && chown -R app:app /app/public/uploads'
echo "Restored. Start with: docker compose up -d"
