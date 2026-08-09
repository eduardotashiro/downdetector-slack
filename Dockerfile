FROM mcr.microsoft.com/playwright:v1.58.0-noble

WORKDIR /app

RUN apt-get update && apt-get install -y xvfb build-essential && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["xvfb-run", "-a", "npm", "start"]