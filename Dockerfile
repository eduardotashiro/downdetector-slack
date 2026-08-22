FROM mcr.microsoft.com/playwright:v1.58.0-noble

WORKDIR /app

RUN apt-get update && apt-get install -y \
    xvfb \
    build-essential \
    libgtk-3-0 \
    libdbus-glib-1-2 \
    libasound2t64 \
    libxt6 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm2 \
    libgbm1 \
    libxss1 \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# configura diretório fixo do camoufox
ENV CAMOUFOX_INSTALL_DIR=/opt/camoufox

COPY package*.json ./

RUN npm ci

RUN npx camoufox-js fetch

COPY . .

RUN npm run build

CMD ["node", "dist/server.js"]