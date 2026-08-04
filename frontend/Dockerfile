# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# REACT_APP_API_URL is intentionally left empty so the browser uses relative
# paths (/api/...) which Nginx then proxies to the backend container.
# REACT_APP_SOCKET_URL must point to the host that the browser connects to.
# At runtime this is the same origin so we leave it empty too.
ARG REACT_APP_API_URL=""
ARG REACT_APP_SOCKET_URL=""

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL

RUN CI=false npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
