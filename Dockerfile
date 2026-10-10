FROM redis/redis-stack-server:7.0.6-RC8 AS redis-stack

FROM python:3.10 AS runtime-base

# System packages and Redis modules stay cached across normal source changes.
RUN ln -sf /bin/bash /bin/sh
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates procps redis-server npm \
    && rm -rf /var/lib/apt/lists/*

COPY --from=redis-stack /opt/redis-stack/lib/redisearch.so /opt/redis-stack/lib/redisearch.so
COPY --from=redis-stack /opt/redis-stack/lib/rejson.so /opt/redis-stack/lib/rejson.so

WORKDIR /home/server
COPY server/requirements.txt server/embeddings.py ./
RUN pip3 install --no-cache-dir -r requirements.txt \
    && python3 -c "from embeddings import load_embedding_model; load_embedding_model()"

# Course artifacts are isolated so frontend-only changes do not repeat vectorization.
FROM runtime-base AS course-data
WORKDIR /home/server
COPY data.lock /home/data.lock
COPY server/fetch_snapshot.sh server/vectorize.py ./
RUN sh fetch_snapshot.sh
RUN python3 vectorize.py

FROM runtime-base
WORKDIR /home
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

COPY --from=course-data /home/server/classes_out.json /home/server/classes_out.json
COPY --from=course-data /home/server/course_embeddings.npy /home/server/course_embeddings.npy
COPY --from=course-data /home/server/course_embeddings.manifest.json /home/server/course_embeddings.manifest.json

WORKDIR /home/server
CMD ["/bin/sh", "script.sh"]
