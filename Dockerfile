# Stage 1: Build frontend
# node:20-slim (Debian/glibc statt Alpine/musl): better-sqlite3 zieht so vorgebaute
# Binaries und muss nicht aus dem Quellcode kompiliert werden (keine Build-Tools nötig).
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY server/ ./server/
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "server/index.js"]
