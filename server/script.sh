set -eu

redis-server --daemonize yes --loadmodule /opt/redis-stack/lib/redisearch.so --loadmodule /opt/redis-stack/lib/rejson.so

until redis-cli ping >/dev/null 2>&1; do
  sleep 0.1
done

python3 push.py
EMBEDDING_THREADS=1 python3 semantic_api.py &
cd ..
npm run start
