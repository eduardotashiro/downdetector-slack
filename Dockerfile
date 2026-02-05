FROM mcr.microsoft.com/playwright:v1.58.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

CMD ["npm", "start"]
