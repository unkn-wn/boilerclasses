import os
import json
import redis
from redis.commands.json.path import Path
from tqdm import tqdm

r = redis.Redis(port=6379)

count = 1
path = "out.json"
f = open(path)
data = json.load(f)
for classData in tqdm(data):
  key = "classes:" + str(count)
  r.json().set(key, Path.root_path(), classData)
  count += 1




