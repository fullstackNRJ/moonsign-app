# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (swisseph-v2)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime build tools needed by native modules
RUN apk add --no-cache python3 make g++

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server

# Hugging Face Spaces require port 7860
EXPOSE 7860

CMD ["node", "dist/index.js"]
