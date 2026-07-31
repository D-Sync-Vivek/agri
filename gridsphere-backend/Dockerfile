# ---- Builder stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files AND Prisma schema FIRST
COPY package*.json ./
COPY prisma ./prisma

# Install ALL dependencies (including dev) – this will run prisma generate successfully
RUN npm ci

# Copy the rest of the application source
COPY . .

# (Optional) Generate Prisma client explicitly
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Expose the API port (internal)
EXPOSE 8000

# Start the built server
CMD ["node", "dist/server.js"]