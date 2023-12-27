python3 download.py
python3 harmonize.py
redis-server --daemonize yes --loadmodule /opt/redis-stack/lib/redisearch.so --loadmodule /opt/redis-stack/lib/rejson.so --save
python3 push.py
python3 main.py
