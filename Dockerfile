FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      ca-certificates \
      xvfb \
      tini \
      procps \
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

ENV DISPLAY=:99
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx camoufox fetch
RUN npm run build

COPY xvfb.sh ./xvfb.sh
RUN chmod +x ./xvfb.sh

# tini como PID 1:reap de processos
ENTRYPOINT ["/usr/bin/tini", "--", "/bin/bash", "/app/xvfb.sh"]

CMD ["node", "dist/server.js"]