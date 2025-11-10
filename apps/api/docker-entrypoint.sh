#!/usr/bin/env bash
set -euo pipefail

if [ -f /run/secrets/database_url ]; then
  export DATABASE_URL="$(cat /run/secrets/database_url)"
fi
if [ -f /run/secrets/better_auth_secret ]; then
  export BETTER_AUTH_SECRET="$(cat /run/secrets/better_auth_secret)"
fi

npx prisma migrate deploy
npx prisma generate

exec node dist/src/main.js