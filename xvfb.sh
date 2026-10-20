#!/bin/bash
set -euo pipefail

#mata qualquer servidor Xvfb anterior que tenha ficado travado e limpa os arquivos de trava antigos
pkill -9 Xvfb 2>/dev/null || true
sleep 0.5
rm -f  /tmp/.X99-lock
rm -rf /tmp/.X11-unix/X99

#inicia o Xvfb (Virtual Framebuffer) na tela :99 com resolução Full HD (1920x1080) em segundo plano
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render \
     > /dev/null 2>&1 &

#fica checando por até 5 segundos (25 tentativas de 0.2s) até o servidor gráfico estar pronto para uso
for _ in $(seq 1 25); do
  [ -S /tmp/.X11-unix/X99 ] && break
  sleep 0.2
done

#executa o comando principal que veio do Dockerfile >>> "node", "dist/main.js"
exec "$@"
