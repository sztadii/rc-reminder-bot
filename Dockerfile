FROM node:14.20.0-alpine AS builder
WORKDIR /action
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src/ src/
RUN npm run build \
  && npm prune --production

FROM node:14.20.0-alpine
COPY --from=builder action/package.json .
COPY --from=builder action/lib lib/
COPY --from=builder action/node_modules node_modules/
ENTRYPOINT [ "node", "/lib/index.js" ]
