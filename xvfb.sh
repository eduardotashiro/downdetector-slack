#!/bin/bash
set -euo pipefail

pkill -9 Xvfb 2>/dev/null || true
sleep 0.5
rm -f  /tmp/.X99-lock
rm -rf /tmp/.X11-unix/X99

Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render \
     > /dev/null 2>&1 &

for _ in $(seq 1 25); do
  [ -S /tmp/.X11-unix/X99 ] && break
  sleep 0.2
done

exec "$@"