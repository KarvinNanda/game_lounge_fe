# ============================================================
# Dockerfile — game_lounge_fe (Vue 3 Admin App)
# Multi-stage build: build static files dengan Node,
# lalu serve dengan Nginx yang ringan.
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies dulu (layer terpisah agar cache lebih efisien)
COPY package.json package-lock.json ./
RUN npm ci

# Copy seluruh source dan build
COPY . .

# npm run build otomatis memuat .env.production karena Vite mode=production
RUN npm run build

# ── Stage 2: Serve dengan Nginx ─────────────────────────────
FROM nginx:alpine

# Salin hasil build static dari stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Salin konfigurasi Nginx custom (SPA routing + gzip + cache + security headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck — Coolify/orchestrator bisa deteksi container sehat
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
