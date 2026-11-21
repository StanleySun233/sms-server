FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --prefer-offline --no-audit

COPY . .
ARG BACKEND_URL=http://sms-backend:8080
ENV BACKEND_URL=${BACKEND_URL}
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

EXPOSE 3000
USER node
CMD ["node", "server.js"]
