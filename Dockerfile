FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем ВСЕ зависимости (включая devDependencies)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Удаляем dev зависимости для production (опционально)
RUN npm prune --production

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/app.js"]