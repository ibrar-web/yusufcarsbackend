# Use official Node.js LTS image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all source files
COPY . .

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 4000

# Start the app
CMD ["node", "server.js"]
