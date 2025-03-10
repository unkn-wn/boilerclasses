import subprocess
import argparse
import wget
import os

print("into download.py")
semesters = ["Spring 2025", "Fall 2024", "Spring 2024",  "Fall 2023",  "Spring 2023",  "Fall 2022",  "Spring 2022",  "Fall 2021",  "Spring 2021",  "Fall 2020",  "Spring 2020",  "Fall 2019"]
grade_semesters = ["f21", "s22", "f22", "s23", "f23", "s24", "f24"]

parser = argparse.ArgumentParser(description="scrape or download before running harmonize")
parser.add_argument("--scrape", action='store_true', dest='scrape')
link = "https://boilerclasses.s3.amazonaws.com/"

args = parser.parse_args()

if not os.path.exists('data'):
  os.mkdir("data")

# clearing existing JSON files
for foldername, subfolders, filenames in os.walk('data'):
  for filename in filenames:

    file_path = os.path.join(foldername, filename)
    if "json" in file_path:
      os.remove(file_path)

for filename in os.listdir(os.getcwd()):
  if "json" in filename:
    os.remove(filename)

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

# download prereq data
if not os.path.exists('data/prereqs'):
  os.mkdir("data/prereqs")
url = link + "data/prereqs/classes_prereqs.json"
filename = wget.download(url, out="data/prereqs/")
print("finished downloading prereq data...")


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