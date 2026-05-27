# Use a slim Node.js LTS image
FROM node:20-slim

# Install Chromium and necessary system libraries for Puppeteer/Chrome
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcups2 \
    && rm -rf /var/lib/apt/lists/*

# Point Puppeteer to the system-installed Chromium executable
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (includes devDependencies for typescript compilation)
RUN npm install

# Copy application source code
COPY . .

# Compile TypeScript into JavaScript
RUN npm run build

# Expose backend API port
EXPOSE 5000

# Start Express server (runs API & worker inline)
CMD ["npm", "run", "start"]
