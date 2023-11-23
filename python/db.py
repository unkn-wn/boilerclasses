import os
import json
import redis
from redis.commands.json.path import Path
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.getenv('REDIS_HOST')
REDIS_PORT = os.getenv('REDIS_PORT')
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, username="default", password=REDIS_PASSWORD)

all_classes = []

count = 1
path = "out.json"
f = open(path)
data = json.load(f)
for classData in tqdm(data):
  key = "classes:" + str(count)
  r.json().set(key, Path.root_path(), classData)
  count += 1

print("finished!")
