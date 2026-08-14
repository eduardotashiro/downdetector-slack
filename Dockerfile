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
ENV DISPLAY=:99
ENV NODE_DISABLE_COLORS=1
ENV FORCE_COLOR=0

COPY package*.json ./

RUN npm ci

RUN npx camoufox-js fetch

COPY . .

RUN npm run build

# 2>/dev/null (Errors from xkbcomp are not fatal to the X server)
CMD ["sh", "-c", "Xvfb :99 -screen 0 1920x1080x24 -ac 2>/dev/null & sleep 2 && node dist/server.js"]