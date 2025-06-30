# Stage 1: Build the Next.js application
FROM node:24.3.0-alpine3.22 AS builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client for the target environment
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Stage 2: Run the Next.js application
FROM node:24.3.0-alpine3.22 AS runner

WORKDIR /app

# Copy the built application and necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
# Explicitly copy the generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables
ENV NODE_ENV=production
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ARG PORT=3000
ENV PORT=${PORT}

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run the application
CMD ["npm", "start"]
