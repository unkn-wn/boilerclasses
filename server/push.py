import subprocess
import os
import json
import redis
from redis.commands.json.path import Path
from tqdm import tqdm
# from dotenv import load_dotenv
import argparse
import math
from decimal import Decimal, ROUND_HALF_UP
from schema import validate_courses
from search_index import write_search_index
# load_dotenv()


def overall_gpa(course):
  """Match the browser's instructor averages, counts, and GPA color."""
  averages = []
  semesters = set()
  for instructor, records in course.get('gpa', {}).items():
    if not instructor:
      continue
    semesters.update(records)
    if records:
      total = 0
      for row in records.values():
        total += row[13]
      average = math.floor(total / len(records) * 100 + 0.5) / 100
      if average != 0:
        averages.append(average)

  total = 0
  for average in averages:
    total += average
  # JavaScript toFixed rounds the exact binary float, with ties away from zero.
  gpa = str(Decimal(total / len(averages)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)) if averages else 0
  color = 'rgb(var(--background-color))'
  if gpa:
    stops = [(1.0, (71, 0, 0)), (2.25, (200, 30, 30)),
             (3.25, (218, 170, 0)), (4.0, (34, 197, 94))]
    lower, upper = stops[0], stops[-1]
    value = float(gpa)
    for start, end in zip(stops, stops[1:]):
      if start[0] <= value <= end[0]:
        lower, upper = start, end
        break
    fraction = (value - lower[0]) / (upper[0] - lower[0])
    rgb = [math.floor(a + fraction * (b - a) + 0.5)
           for a, b in zip(lower[1], upper[1])]
    color = '#' + ''.join(format(channel, '02x') for channel in rgb)
  return {'gpa': gpa, 'color': color, 'profCount': len(averages),
          'totalSemCount': len(semesters)}

# REDIS_HOST = os.getenv('REDIS_HOST')
# REDIS_PORT = os.getenv('REDIS_PORT')
# REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')

parser = argparse.ArgumentParser(description='data files')
parser.add_argument("-data", default="classes_out.json", dest="infile", help="which file to get data from")

args = parser.parse_args()

# push all data
count = 1
f = open(args.infile)
data = json.load(f)
f.close()
validate_courses(data, kind="harmonized", source=args.infile)
# Validate the complete input before clearing any Redis data.
r = redis.Redis(host='localhost', port=6379)
r.flushall()
for classData in tqdm(data):
  classData['overallGpa'] = overall_gpa(classData)
  key = "classes:" + str(count)
  r.json().set(key, Path.root_path(), classData)
  count += 1

# Same courses, in the same order, for browser-side search (/api/search-index)
write_search_index(data, "search_index.json")

r.execute_command("FT.CONFIG", "SET", "MINPREFIX", "1")

# create index
r.execute_command("FT.CREATE", "idx:classes", "ON", "JSON", "PREFIX", "1", 
              "classes:", "SCHEMA", 
              "$.fullTitle", "AS", "fullTitle", "TEXT", "WEIGHT", "50", 
              "$.detailId", "AS", "detailId", "TAG", 
              "$.description", "AS", "description", "TEXT", 
              "$.subjectCode", "AS", "subjectCode", "TAG", 
              "$.terms[*]", "AS", "terms", "TAG", 
              "$.courseCode", "AS", "courseCode", "NUMERIC", "SORTABLE",
              "$.instructor[*][*]", "AS", "instructor", "TEXT", "NOSTEM", 
              "$.credits[0]", "AS", "creditMin", "NUMERIC", 
              "$.credits[1]", "as", "creditMax", "NUMERIC", 
              "$.gened[*]", "AS", "gened", "TAG",
              "$.sched[*]", "AS", "sched", "TAG")
