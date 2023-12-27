FROM redis/redis-stack-server:7.0.6-RC8 AS redis-stack

FROM redis:7-bookworm
RUN ln -sf /bin/bash /bin/sh
RUN apt-get update && apt-get install -y ca-certificates procps && apt-get clean

FROM python:3.10 AS builder
WORKDIR /home
COPY . .
WORKDIR /home/server
RUN pip3 install -r requirements.txt
RUN ln -sf /bin/bash /bin/sh
RUN apt-get update && apt-get install -y ca-certificates procps && apt-get clean
RUN apt-get update && apt-get install -y redis-server
RUN apt-get update && apt-get install -y npm

COPY --from=redis-stack /opt/redis-stack/lib/redisearch.so /opt/redis-stack/lib/redisearch.so
COPY --from=redis-stack /opt/redis-stack/lib/rejson.so /opt/redis-stack/lib/rejson.so
WORKDIR /home
RUN npm ci
WORKDIR /home/server

CMD ["/bin/sh", "script.sh"]