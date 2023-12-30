redis-server --daemonize yes --loadmodule /opt/redis-stack/lib/redisearch.so --loadmodule /opt/redis-stack/lib/rejson.so --save
python3 push.py
cd ..
npm run start