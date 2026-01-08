#!/bin/sh
# Docker entrypoint that derives VITE_* env vars from BASE_URL
# This simplifies configuration for Docker/K8s deployments

if [ -n "$BASE_URL" ]; then
  export VITE_API_BASE_URL="$BASE_URL"
  export VITE_FRONTEND_URL="$BASE_URL"
fi

exec "$@"
