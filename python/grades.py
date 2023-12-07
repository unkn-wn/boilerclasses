import json
import argparse

parser = argparse.ArgumentParser(description='which file')
parser.add_argument("-file", default="data/grades/classes_f21.json", dest="file", help="which file")
parser.add_argument("-sem", default="Fall 2021", dest="sem", help="which semester (default: Fall 2021)")
parser.add_argument("-outfile", default="class_out.json", dest="outfile")

args = parser.parse_args()

f = open(args.file)
grade_list = json.load(f)

out_f = open(args.outfile)
full_data = json.load(out_f)

for i in range(len(full_data)):
  if "gpa" not in full_data[i]:
    full_data[i]["gpa"] = {}

subjectCode = ""
courseCode = ""
title = ""

for grade in grade_list:
  if grade["subject"] != "":
    subjectCode = grade["subject"]

  if grade["course number"] != "":
    courseCode = grade["course number"]

  if grade["title"] != "":
    title = grade["title"]
  
  if grade["avg gpa"] == "NaN" or "-Honors" in grade["title"]:
    continue
  for i in range(len(full_data)):
    if full_data[i]["subjectCode"] == subjectCode and full_data[i]["courseCode"] == courseCode and title == full_data[i]["title"]:
      if args.sem in full_data[i]["gpa"]:
        full_data[i]["gpa"][args.sem].append([grade["instructor"], [grade["totalAplus"], grade["totalA"], grade["totalAminus"], grade["totalBplus"], grade["totalB"], grade["totalBminus"], grade["totalCplus"], grade["totalC"], grade["totalCminus"], grade["totalDplus"], grade["totalD"], grade["totalDminus"], grade["totalF"], grade["avg gpa"]]])
      else:
        full_data[i]["gpa"][args.sem] = [[grade["instructor"], [grade["totalAplus"], grade["totalA"], grade["totalAminus"], grade["totalBplus"], grade["totalB"], grade["totalBminus"], grade["totalCplus"], grade["totalC"], grade["totalCminus"], grade["totalDplus"], grade["totalD"], grade["totalDminus"], grade["totalF"], grade["avg gpa"]]]]
  
outfile = open(f"class_out2.json", "w")
json.dump(full_data, outfile, indent=4)


