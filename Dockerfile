FROM redis/redis-stack-server:7.0.6-RC8 AS redis-stack

FROM python:3.10 AS builder

# System packages and Redis modules first: these never depend on repo contents,
# so they stay cached across every deploy.
RUN ln -sf /bin/bash /bin/sh
RUN apt-get update && apt-get install -y ca-certificates procps && apt-get clean
RUN apt-get update && apt-get install -y redis-server
RUN apt-get update && apt-get install -y npm
COPY --from=redis-stack /opt/redis-stack/lib/redisearch.so /opt/redis-stack/lib/redisearch.so
COPY --from=redis-stack /opt/redis-stack/lib/rejson.so /opt/redis-stack/lib/rejson.so

# Dependency manifests only, so installs are cached until the manifests change.
WORKDIR /home/server
COPY server/requirements.txt .
RUN pip3 install -r requirements.txt

WORKDIR /home
COPY package.json package-lock.json ./
RUN npm ci

# Source code last: only the steps below re-run on a normal code change.
COPY . .
RUN npm run build
WORKDIR /home/server

# Data comes from the snapshot pinned in data.lock (built by .github/workflows/data.yml)
RUN sh fetch_snapshot.sh

CMD ["/bin/sh", "script.sh"]
