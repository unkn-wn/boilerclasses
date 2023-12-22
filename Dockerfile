# FROM node:18-alpine AS frontend
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm ci
# COPY . .
# RUN npm run build

# FROM redis/redis-stack-server:7.0.6-RC8 AS redis-stack

# FROM redis:7-bookworm
# RUN ln -sf /bin/bash /bin/sh
# RUN apt-get update && apt-get install -y ca-certificates procps && apt-get clean
# COPY --from=redis-stack /opt/redis-stack/lib/redisearch.so /opt/redis-stack/lib/redisearch.so
# COPY --from=redis-stack /opt/redis-stack/lib/rejson.so /opt/redis-stack/lib/rejson.so
# RUN redis-server --loadmodule /opt/redis-stack/lib/redisearch.so --loadmodule /opt/redis-stack/lib/rejson.s --port 7501 --save

FROM python
COPY server server
WORKDIR /server
RUN pip3 install -r requirements.txt
# RUN python3 download.py
# RUN python3 harmonize.py
# RUN python3 push.py