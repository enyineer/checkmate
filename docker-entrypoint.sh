#!/bin/sh
# Docker entrypoint for Checkstack
# BASE_URL is read directly by the backend - no env var mapping needed
exec "$@"
