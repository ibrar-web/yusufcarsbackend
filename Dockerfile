FROM node:22-slim AS builder
WORKDIR /usr/src/app

# Install dependencies (including dev for build) and cache layer
COPY package*.json ./
RUN npm ci

# Copy application source and build
COPY . .
RUN npm run build

# Remove devDependencies for a lean runtime
RUN npm prune --omit=dev

FROM node:22-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=4000

# Copy production-ready app from builder
COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
