#!/bin/sh
set -e
# Uploads are bind-mounted from the host and were written as root by the previous deployment.
# Hand them to the unprivileged app user, then drop root for everything else.
mkdir -p /app/public/uploads
chown -R app:app /app/public/uploads 2>/dev/null || true

# Some hosts (e.g. Docker inside systemd-nspawn with remapped uids) don't allow that chown.
# Uploads must stay writable, so fall back to running as root there, loudly.
RUN_AS=app
if ! su-exec app sh -c 'f="/app/public/uploads/.write-test-$$"; touch "$f" && rm -f "$f"' 2>/dev/null; then
  echo "warning: /app/public/uploads is not writable by the app user (cannot change ownership of the bind mount on this host); running as root so uploads keep working" >&2
  RUN_AS=root
fi
as_app() { if [ "$RUN_AS" = root ]; then "$@"; else su-exec app "$@"; fi; }

# Apply pending migrations (additive; safe to run on every start).
cd /opt/migrate
as_app node node_modules/prisma/build/index.js migrate deploy

cd /app
if [ "$RUN_AS" = root ]; then exec node server.js; else exec su-exec app node server.js; fi
