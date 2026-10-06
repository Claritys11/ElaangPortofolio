#!/bin/sh
set -e
# Uploads are bind-mounted from the host and were written as root by the previous deployment.
# Hand them to the unprivileged app user, then drop root for everything else.
mkdir -p /app/public/uploads
chown -R app:app /app/public/uploads 2>/dev/null || true

# Some hosts (e.g. Docker inside systemd-nspawn with remapped uids) don't allow that chown, so the
# app user can read but not write uploads. Fail closed: stay unprivileged unless the operator
# explicitly accepts running as root for this host (ALLOW_ROOT_FALLBACK=1).
RUN_AS=app
if ! su-exec app sh -c 'f="/app/public/uploads/.write-test-$$"; touch "$f" && rm -f "$f"' 2>/dev/null; then
  if [ "${ALLOW_ROOT_FALLBACK:-0}" = "1" ]; then
    echo "warning: /app/public/uploads is not writable by the app user; ALLOW_ROOT_FALLBACK=1 set, running as root" >&2
    RUN_AS=root
  else
    echo "error: /app/public/uploads is not writable by the app user (uid $(id -u app)); admin uploads will fail." >&2
    echo "       Fix the host directory's ownership for that uid, or set ALLOW_ROOT_FALLBACK=1 to run as root on this host." >&2
  fi
fi
as_app() { if [ "$RUN_AS" = root ]; then "$@"; else su-exec app "$@"; fi; }

# Apply pending migrations (additive; safe to run on every start).
cd /opt/migrate
as_app node node_modules/prisma/build/index.js migrate deploy

cd /app
if [ "$RUN_AS" = root ]; then exec node server.js; else exec su-exec app node server.js; fi
