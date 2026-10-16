set -eu

redis-server --daemonize yes --loadmodule /opt/redis-stack/lib/redisearch.so --loadmodule /opt/redis-stack/lib/rejson.so

until redis-cli ping >/dev/null 2>&1; do
  sleep 0.1
done

python3 push.py
# push.py skips the vector index when the snapshot has no matching embeddings
if redis-cli FT._LIST | grep -qx "idx:classes:vector"; then
  EMBEDDING_THREADS=1 python3 semantic_api.py &
fi
# Browser search index; builds in the background so the site isn't held up.
node build_search_index.mjs &
cd ..
npm run start
