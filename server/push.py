import os
import json
import redis
from redis.commands.json.path import Path
from tqdm import tqdm
# from dotenv import load_dotenv
import argparse
# load_dotenv()

# REDIS_HOST = os.getenv('REDIS_HOST')
# REDIS_PORT = os.getenv('REDIS_PORT')
# REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')

r = redis.Redis(host='localhost', port=6379)
parser = argparse.ArgumentParser(description='data files')
parser.add_argument("-data", default="class_out.json", dest="infile", help="which file to get data from")

args = parser.parse_args()

count = 1
f = open(args.infile)
data = json.load(f)
for classData in tqdm(data):
  key = "classes:" + str(count)
  classData["courseCode"] = str(classData["courseCode"])
  print(classData)
  r.json().set(key, Path.root_path(), classData)
  count += 1

'''
index command:
FT.CREATE idx:classes ON JSON PREFIX 1 "classes:" SCHEMA $.title AS title TEXT WEIGHT 2 $.description AS description TEXT $.subjectCode AS subjectCode TAG $.terms[*] AS terms TAG $.courseCode AS courseCode TEXT WEIGHT 3 NOSTEM $.instructor[*][*] as instructor TEXT NOSTEM $.subjectCode AS subjectCodeTerm TEXT $.credits[0] AS creditMin NUMERIC $.credits[1] as creditMax NUMERIC $.gened[*] AS gened TAG
'''
