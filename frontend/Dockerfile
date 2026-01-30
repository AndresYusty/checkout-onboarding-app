# Frontend Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Build de la aplicación con variables de entorno
# Las variables de entorno de Vite deben estar disponibles en build time
# Se pasan como ARG desde docker-compose (cargadas desde .env)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Imagen de producción con nginx
FROM nginx:alpine AS production

# Copiar archivos build
COPY --from=base /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

