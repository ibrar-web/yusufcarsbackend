# Use Node.js 22
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the source code
COPY . .

# Build project (if using TypeScript)
RUN npm run build

# Expose Cloud Run default port
EXPOSE 8080

# Start the application
CMD ["node", "dist/src/main.js"]
