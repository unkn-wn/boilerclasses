import os
import json
import redis
from redis.commands.json.path import Path
from tqdm import tqdm

r = redis.Redis(host='redis-17153.c257.us-east-1-3.ec2.cloud.redislabs.com', port='17153', username="default", password='gT4S5Gh13m5HUvy2ytT2AxcRDUpKanQH')

all_classes = []

count = 1
for jsonFile in os.listdir("classes/"):
  path = "classes/" + jsonFile
  f = open(path)
  data = json.load(f)
  all_classes.extend(data)
  # for classData in tqdm(data):
  #   key = "Class:" + str(count)
  #   classData['courseCode'] = int(classData['courseCode'])
  #   r.json().set(key, Path.root_path(), classData)
  #   count += 1
  print("done", jsonFile)

outfile = open("all.json", "w")
json.dump(all_classes, outfile, indent=4)