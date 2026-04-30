FROM mcr.microsoft.com/playwright:v1.58.0-noble

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]
