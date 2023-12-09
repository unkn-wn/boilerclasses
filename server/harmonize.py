import json
import os
import argparse
from tqdm import tqdm

'''
structure for data: 
{
  title:
  subjectCode:
  courseCode:
  instructor: [
    spring24: [],
    fall23: []..
  ]
  description:
  credits: [x, y]
  terms: [..]
  gened: [..]
  gpa: {
    prof1: [A+, A, A-, .. F, average],
    prof2: [A+, A, A-, .. F, average]
  }
}
'''


# combining scraped JSONs into one file
out = {}
semesters = []
all_classes = []

for file_name in os.listdir("data"):
  path = "data/"+ file_name
  if "json" not in path:
    continue
  f = open(path)
  data = json.load(f)
  semesters.append(data)
  for class_data in data:
    all_classes.append(class_data["subjectCode"] + " " + class_data["courseCode"] + ": " + class_data["title"])
  
all_classes = list(set(all_classes))
all_classes.sort()

print("syncing up classes.....")
for class_id in tqdm(all_classes):
  s, c = class_id.split(": ")[0].split(" ")
  t = ": ".join(class_id.split(": ")[1:])
  instances = []
  class_data = {}
  class_data["terms"] = []
  class_data["instructor"] = {}
  for semester in semesters:
    for class_sem in semester:
      if class_sem["subjectCode"] == s and class_sem["courseCode"] == c and class_sem["title"] == t:
        instances.append(class_sem)
        class_data["terms"].append(class_sem["term"])
        class_data["instructor"][class_sem["term"]] = class_sem["instructor"]
  class_data["title"] = instances[0]["title"]
  class_data["subjectCode"] = s
  class_data["courseCode"] = c
  class_data["description"] = instances[0]["description"]
  class_data["credits"] = instances[0]["credits"]
  for instance in instances:
    class_data["credits"][0] = min(instance["credits"][0], class_data["credits"][0])
    class_data["credits"][1] = max(instance["credits"][1], class_data["credits"][1])
  out[class_id] = class_data

course_data = []
for x in out:
  course_data.append(out[x])

for i in range(len(course_data)):
  course_data[i]["gened"] = []
  if "gpa" not in course_data[i]:
    course_data[i]["gpa"] = {}

# adding grade information

print("adding grades....")
for file_name in tqdm(os.listdir("data/grades")):
  currSubjectCode = ""
  currCourseCode = ""
  currTitle = ""
  currSemester = ""

  grade_file = open("data/grades/" + file_name)
  grade_data = json.load(grade_file)

  for grade in grade_data:
    if grade["subject"] != "":
      currSubjectCode = grade["subject"]

    if grade["course number"] != "":
      currCourseCode = grade["course number"]

    if grade["academic period desc"] != "":
      currSemester = grade["academic period desc"]

    if grade["title"] != "":
      currTitle = grade["title"]
    
    if grade["avg gpa"] == "NaN" or "-Honors" in grade["title"]:
      continue
    for i in range(len(course_data)):
      if course_data[i]["subjectCode"] == currSubjectCode and course_data[i]["courseCode"] == currCourseCode and currTitle == course_data[i]["title"]:
        if currSemester in course_data[i]["gpa"]:
          course_data[i]["gpa"][currSemester].append([grade["instructor"], [grade["totalAplus"], grade["totalA"], grade["totalAminus"], grade["totalBplus"], grade["totalB"], grade["totalBminus"], grade["totalCplus"], grade["totalC"], grade["totalCminus"], grade["totalDplus"], grade["totalD"], grade["totalDminus"], grade["totalF"], float(grade["avg gpa"])]])
        else:
          course_data[i]["gpa"][currSemester] = [[grade["instructor"], [grade["totalAplus"], grade["totalA"], grade["totalAminus"], grade["totalBplus"], grade["totalB"], grade["totalBminus"], grade["totalCplus"], grade["totalC"], grade["totalCminus"], grade["totalDplus"], grade["totalD"], grade["totalDminus"], grade["totalF"], float(grade["avg gpa"])]]]

print("syncing grades....")
for i in range(len(course_data)):
  gpa_data = {}
  gpa_data_count = {}
  for semester in course_data[i]["gpa"]:
    for entry in course_data[i]["gpa"][semester]:
      instructor = entry[0]
      if instructor in gpa_data:
        for k in range(len(gpa_data[instructor])):
          gpa_data[instructor][k] = round((gpa_data[instructor][k] * gpa_data_count[instructor] + entry[1][k]) / (gpa_data_count[instructor] + 1), 2)
        gpa_data_count[instructor] += 1
      else:
        gpa_data[instructor] = entry[1]
        gpa_data_count[instructor] = 1
  course_data[i]["gpa"] = gpa_data

# adding geneds
gened_file = open("data/gened/class_gened.json")
gened_data = json.load(gened_file)

print("adding geneds.....")
tags = []
for tag in tqdm(gened_data):
  for c in gened_data[tag]:
    sub, code = c.split(" ")
    for i in range(len(course_data)):
      if course_data[i]["subjectCode"] == sub and course_data[i]["courseCode"] == code and tag not in course_data[i]["gened"]:
        course_data[i]["gened"].append(tag)

outfile = open("class_out_new.json", "w")
json.dump(course_data, outfile, indent=4)