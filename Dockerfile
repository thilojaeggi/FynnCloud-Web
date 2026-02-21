# Build stage
# Run the node builder natively on the host architecture to bypass QEMU arm64 emulation bugs
FROM --platform=$BUILDPLATFORM node:25-slim AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the static site
RUN npx nuxi generate

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built static files from builder stage
COPY --from=builder /app/.output/public /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]