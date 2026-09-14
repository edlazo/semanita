# Sirve igual para Render, Fly, Railway o cualquier cosa que corra un contenedor.
# Se eligió Docker sobre la configuración propia de cada plataforma justamente
# para no atarse a ninguna mientras todavía no está decidida.

# Build en una etapa aparte: las devDependencies (typescript, tsx, @types/*) son
# la mitad del node_modules y no hacen falta para correr.
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

# Node corre como root por defecto; la imagen ya trae el usuario `node`.
USER node

# La plataforma inyecta PORT; index.ts cae a 3000 si no viene.
EXPOSE 3000
CMD ["node", "dist/index.js"]
