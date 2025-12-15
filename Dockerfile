# Use a imagem oficial do Playwright com Node.js
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala TODAS as dependências (precisa do TypeScript!)
RUN npm ci

# Instala os browsers do Playwright
RUN npx playwright install --with-deps chromium

# Copia o código da aplicação
COPY . .

# Compila o TypeScript
RUN npm run build

# Remove dependências de desenvolvimento
RUN npm prune --production

# Expõe a porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "dist/server.js"]