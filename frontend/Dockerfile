FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

RUN npm install -g serve && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --spider -q http://localhost:3000 || exit 1

CMD ["serve", "-s", "dist", "-l", "3000"]
