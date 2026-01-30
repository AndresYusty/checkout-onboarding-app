# Backend Dockerfile
FROM node:18-alpine AS base

# Instalar dependencias necesarias (incluyendo OpenSSL para Prisma)
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Build de la aplicación
RUN npm run build

# Imagen de producción
FROM node:18-alpine AS production

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar solo lo necesario para producción
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package*.json ./
COPY --from=base /app/prisma ./prisma

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]

