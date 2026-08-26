FROM node:24-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV CAMOUFOX_INSTALL_DIR=/opt/camoufox

WORKDIR /app

COPY package*.json ./
RUN npm ci && npx camoufox-js fetch

COPY . .
RUN npm run build


FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      xvfb \
      tini \
      procps \
      ca-certificates \
      fonts-liberation \
      fonts-noto-color-emoji \
      libgtk-3-0 \
      libx11-xcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxtst6 \
      libnss3 \
      libnspr4 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libdrm2 \
      libgbm1 \
      libasound2 \
      libpangocairo-1.0-0 \
      libpango-1.0-0 \
      libcairo2 \
      libdbus-glib-1-2 \
      libxt6 \
    && rm -rf /var/lib/apt/lists/*

ENV CAMOUFOX_INSTALL_DIR=/opt/camoufox
ENV DISPLAY=:99
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /opt/camoufox /opt/camoufox
COPY xvfb.sh ./xvfb.sh

RUN chmod +x ./xvfb.sh

# tini como PID 1:reap de processos
ENTRYPOINT ["/usr/bin/tini", "--", "/bin/bash", "/app/xvfb.sh"]

CMD ["node", "--expose-gc", "dist/server.js"]