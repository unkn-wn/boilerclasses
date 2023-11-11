import os
import json
import redis
from redis.commands.json.path import Path
from tqdm import tqdm




for jsonFile in os.listdir("classes/"):
  path = "classes/" + jsonFile
  f = open(path)
  data = json.load(f)
  for classData in tqdm(data):
    key = classData['subjectCode'] + classData['courseCode']
    classData['courseCode'] = int(classData['courseCode'])
    r.json().set(key, Path.root_path(), classData)
  print("done", jsonFile)
