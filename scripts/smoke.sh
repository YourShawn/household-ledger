#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
echo "== backend smoke =="
(cd "$root/backend" && mvn -q test)
echo "== frontend smoke =="
(cd "$root/frontend" && npm test)
echo "OK"
