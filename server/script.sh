redis-server --daemonize yes --loadmodule /opt/redis-stack/lib/redisearch.so --loadmodule /opt/redis-stack/lib/rejson.so
python3 push.py
# Browser search index; builds in the background so the site isn't held up.
node build_search_index.mjs &
cd ..
npm run start