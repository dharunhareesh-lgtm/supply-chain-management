# ==============================================================================
# Multi-stage Dockerfile for Dravix SCM Frontend (React 19 + Vite + Nginx)
# ==============================================================================

# --- Stage 1: Build Application ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install dependencies using yarn (resolves React 19 + Three.js peer graph reliably)
RUN yarn install --network-timeout 180000

# Copy frontend source code and configuration files
COPY . .

# Pass build argument for API URL if needed during build (default empty for same-domain proxy)
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build optimized production bundle
RUN yarn build

# --- Stage 2: Production Nginx Server ---
FROM nginx:1.27-alpine

# Remove default Nginx site configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration with reverse proxy and SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Healthcheck to verify Nginx is serving traffic
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
