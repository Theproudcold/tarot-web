# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

ARG VITE_BASE_PATH=/
ARG VITE_API_BASE_URL=
ARG VITE_STREAM_TIMEOUT_MS=180000
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_STREAM_TIMEOUT_MS=${VITE_STREAM_TIMEOUT_MS}

RUN npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/LICENSE ./LICENSE
COPY --from=builder --chown=node:node /app/NOTICE ./NOTICE

USER node

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8787) + '/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start"]
