import argparse
import csv
import io
import json
import os
import re
from decimal import Decimal, ROUND_HALF_UP

import requests

# Grade distributions from Purdue public records requests, published by BoilerGrades.
# Converts the newest N Fall/Spring CSVs into data/grades/classes_<f|s><yy>.json,
# the format harmonize.py reads. Older semesters keep coming from S3.
REPO = "eduxstad/boiler-grades"

parser = argparse.ArgumentParser(description="fetch and convert grade CSVs from boiler-grades")
parser.add_argument("--latest", type=int, default=5, dest="latest", help="how many of the newest Fall/Spring semesters to convert")
parser.add_argument("-out", default="data/grades/", dest="out", help="folder to write grade JSON to")
args = parser.parse_args()

GRADES = [("A", "totalA"), ("A-", "totalAminus"), ("A+", "totalAplus"),
          ("B", "totalB"), ("B-", "totalBminus"), ("B+", "totalBplus"),
          ("C", "totalC"), ("C-", "totalCminus"), ("C+", "totalCplus"),
          ("D", "totalD"), ("D-", "totalDminus"), ("D+", "totalDplus"),
          ("F", "totalF")]
# same order as the old JS sum, so float rounding comes out identical
POINTS = {"totalA": 4, "totalAminus": 3.7, "totalAplus": 4, "totalBplus": 3.3, "totalB": 3,
          "totalBminus": 2.7, "totalCplus": 2.3, "totalC": 2, "totalCminus": 1.7,
          "totalDplus": 1.3, "totalD": 1, "totalDminus": 0.7, "totalF": 0}


def percentage(value):
  # "34.1%" -> 34.1, "" -> 0 (ints stay ints, matching the old JS output)
  if not value or not value.endswith("%"):
    return 0
  try:
    num = float(value[:-1])
  except ValueError:
    return 0
  return int(num) if num.is_integer() else num


def add(values):
  # plain left-to-right float addition like JS; Python 3.12+ sum() compensates
  # rounding error and would shift some averages by 0.01
  total = 0
  for value in values:
    total += value
  return total


def convert(text):
  delimiter = ";" if text.splitlines()[0].count(";") > text.splitlines()[0].count(",") else ","
  rows = []
  curr_subject = ""
  for item in csv.DictReader(io.StringIO(text), delimiter=delimiter):
    totals = {key: percentage(item.get(col)) for col, key in GRADES}
    students = add(totals.values())
    avg = add(totals[k] * points for k, points in POINTS.items()) / students if students else None

    # subject is only filled in on the first row of each subject
    if item["Subject"]:
      curr_subject = item["Subject"]

    rows.append({
      "subject": curr_subject,
      "course number": item["Course Number"],
      "title": item["Title"],
      "academic period desc": item["Academic Period Desc"],
      "instructor": item["Instructor"],
      # JS toFixed(2) rounds exact halves up
      "avg gpa": "NaN" if avg is None else str(Decimal(avg).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
      **totals,
      "CRN": item["CRN"],
    })
  return rows


# runner IPs share GitHub's unauthenticated rate limit, so use the workflow token when present
headers = {"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}"} if os.environ.get("GITHUB_TOKEN") else {}
listing = requests.get(f"https://api.github.com/repos/{REPO}/contents", headers=headers, timeout=30)
listing.raise_for_status()

semesters = []
for f in listing.json():
  m = re.fullmatch(r"(fall|spring)(\d{4})\.csv", f["name"])
  if m:
    season, year = m.groups()
    semesters.append(((int(year), season == "fall"), season[0] + year[2:], f["download_url"]))
semesters.sort(reverse=True)

os.makedirs(args.out, exist_ok=True)
for _, slug, url in semesters[:args.latest]:
  res = requests.get(url, timeout=60)
  res.raise_for_status()
  rows = convert(res.content.decode("utf-8-sig"))
  path = os.path.join(args.out, f"classes_{slug}.json")
  with open(path, "w") as out:
    json.dump(rows, out, indent=2)
  print(f"wrote {len(rows)} rows to {path}")
