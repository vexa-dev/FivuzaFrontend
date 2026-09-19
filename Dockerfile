# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Variables publicas de Vite: se hornean en el build. En Railway se pasan
# como variables del servicio (disponibles como build args).
ARG VITE_SENTRY_DSN=""
ARG VITE_SENTRY_ENVIRONMENT=production
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN     VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT
RUN npm run build

# Stage 2: Serve (nginx con proxy de /api y /ws al backend)
FROM nginx:alpine

# PORT lo inyecta Railway; BACKEND_URL es la URL interna del backend
# (ej. http://backend-web.railway.internal:8000). Solo estas dos se
# sustituyen en la plantilla.
ENV PORT=80 \
    BACKEND_URL=http://web:8000 \
    NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL)$"

COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
