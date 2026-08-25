#!/bin/bash

rm -f /tmp/.X99-lock

Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &

sleep 1

exec "$@"