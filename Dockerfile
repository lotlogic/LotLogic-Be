# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Headless Chrome deps (for puppeteer-core HTML -> PDF)
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application in development mode with Prisma generate
CMD ["sh", "-c", "npx prisma generate && npm run start:dev"] 
