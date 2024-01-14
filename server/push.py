import subprocess
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
r.flushall()
parser = argparse.ArgumentParser(description='data files')
parser.add_argument("-data", default="classes_out.json", dest="infile", help="which file to get data from")

args = parser.parse_args()

# push all data
count = 1
f = open(args.infile)
data = json.load(f)
for classData in tqdm(data):
  key = "classes:" + str(count)
  r.json().set(key, Path.root_path(), classData)
  count += 1

# create index
r.execute_command("FT.CREATE", "idx:classes", "ON", "JSON", "PREFIX", "1", 
              "classes:", "SCHEMA", 
              "$.fullTitle", "AS", "fullTitle", "TEXT", "WEIGHT", "50", 
              "$.description", "AS", "description", "TEXT", 
              "$.subjectCode", "AS", "subjectCode", "TAG", 
              "$.terms[*]", "AS", "terms", "TAG", 
              "$.courseCode", "AS", "courseCode", "NUMERIC",
              "$.instructor[*][*]", "AS", "instructor", "TEXT", "NOSTEM", 
              "$.credits[0]", "AS", "creditMin", "NUMERIC", 
              "$.credits[1]", "as", "creditMax", "NUMERIC", 
              "$.gened[*]", "AS", "gened", "TAG",
              "$.sched[*]", "AS", "sched", "TAG")
