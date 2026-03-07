#!/bin/sh
set -e

# Replace environment variables in env-config.js
envsubst < /app/public/env-config.js > /app/public/env-config.tmp.js
mv /app/public/env-config.tmp.js /app/public/env-config.js

# Start Next.js
exec "$@"
