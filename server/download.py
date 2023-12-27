import subprocess
import argparse
import wget
import os

print("into download.py")
semesters = ["Spring 2024",  "Fall 2023",  "Spring 2023",  "Fall 2022",  "Spring 2022",  "Fall 2021",  "Spring 2021",  "Fall 2020",  "Spring 2020",  "Fall 2019"]
grade_semesters = ["f21", "s22", "f22", "s23"]

parser = argparse.ArgumentParser(description="scrape or download before running harmonize")
parser.add_argument("--scrape", action='store_true', dest='scrape')
link = "https://boilerclasses.s3.amazonaws.com/"

args = parser.parse_args()

if not os.path.exists('data'):
  os.mkdir("data")

# download gened
if not os.path.exists('data/gened'):
  os.mkdir("data/gened")
url = link + "data/gened/classes_gened.json"
filename = wget.download(url, out="data/gened/")
print("finished downloading geneds...")

# download grade data
if not os.path.exists('data/grades'):
  os.mkdir("data/grades")
for sem in grade_semesters:
  url = link + f"data/grades/classes_{sem}.json"
  filename = wget.download(url, out="data/grades/")
print("finished downloading grade data...")

# download/scrape class data
if args.scrape:
  for sem in semesters:
    subprocess.run(["python3", "scrape.py", "-sem", sem])
else:
  for sem in semesters:
    sem_name = sem.replace(" ", "").lower()
    url = link + f"data/classes_{sem_name}.json"
    filename = wget.download(url, out="data/")
print("finished downloading class data...")