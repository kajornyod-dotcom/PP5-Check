# Dockerfile for Next.js (TypeScript)
FROM node:24.3.0-alpine3.22 AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24.3.0-alpine3.22 AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG PORT=3000
ENV PORT=${PORT}
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/app ./app
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
EXPOSE ${PORT}
CMD ["sh", "-c", "npm run start"]
