#!/bin/sh
set -e
# Uploads are bind-mounted from the host and were written as root by the previous deployment.
# Hand them to the unprivileged app user, then drop root for everything else.
mkdir -p /app/public/uploads
chown -R app:app /app/public/uploads 2>/dev/null || echo "warning: could not chown /app/public/uploads; uploads may be read-only"

# Apply pending migrations (additive; safe to run on every start).
cd /opt/migrate
su-exec app node node_modules/prisma/build/index.js migrate deploy

cd /app
exec su-exec app node server.js
