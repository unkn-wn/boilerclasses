import json
import os
import argparse
from tqdm import tqdm
import re

"""
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
  prereqs: [..]
}
"""

parser = argparse.ArgumentParser(description="in/out files")
parser.add_argument(
    "-folder",
    default="data/",
    dest="folder",
    help="which folder for original class data: format is 'classes_<year>' ",
)
parser.add_argument(
    "-grades",
    default="data/grades/",
    dest="gradefolder",
    help="which folder for the grade data",
)
parser.add_argument(
    "-gened",
    default="data/gened/classes_gened.json",
    dest="genedfile",
    help="gened JSON file",
)
parser.add_argument(
    "-prereqs",
    default="data/prereqs/classes_prereqs.json",
    dest="prereqsfile",
    help="prereqs JSON file",
)

parser.add_argument(
    "-outfile",
    default="classes_out.json",
    dest="outfile",
    help="where to write result JSON",
)

args = parser.parse_args()


# combining scraped JSONs into one file
out = {}
semesters = []
all_classes = []
# TODO: change for semester
latest_sem = "Fall 2024"

for file_name in os.listdir(args.folder):
    path = args.folder + file_name
    if "json" not in path:
        continue
    f = open(path)
    data = json.load(f)
    f.close()
    semesters.append(data)
    for class_data in data:
        all_classes.append(
            class_data["subjectCode"]
            + " "
            + class_data["courseCode"]
            + ": "
            + ''.join(e for e in class_data["title"] if e.isalnum())
        )

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
    class_data["crn"] = []
    class_data["sched"] = []
    for semester in semesters:
        for class_sem in semester:
            if (
                class_sem["subjectCode"] == s
                and class_sem["courseCode"] == c
                and ''.join(e for e in class_sem["title"] if e.isalnum()) == t
            ):
                instances.append(class_sem)
                class_data["crn"].extend(class_sem["crn"])
                if "Distance Learning" in class_sem["sched"]:
                    if class_sem["term"] == latest_sem:
                        class_data["sched"].extend(class_sem["sched"])
                else:
                    class_data["sched"].extend(class_sem["sched"])
                class_data["terms"].append(class_sem["term"])
                class_data["instructor"][class_sem["term"]] = class_sem["instructor"]
                if "<a href=" not in class_sem["description"]:
                    class_data["description"] = class_sem["description"]
    class_data["title"] = instances[0]["title"]
    class_data["subjectCode"] = s
    class_data["courseCode"] = c
    class_data["crn"] = list(set(class_data["crn"]))
    class_data["sched"] = list(set(class_data["sched"]))
    if "description" not in class_data:
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
for file_name in tqdm(os.listdir(args.gradefolder)):
    if "json" not in file_name:
        continue
    currSubjectCode = ""
    currCourseCode = ""
    currTitle = ""
    currSemester = ""

    grade_file = open(args.gradefolder + file_name)
    grade_data = json.load(grade_file)
    grade_file.close()
    # count = 0
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
        # found = False
        for i in range(len(course_data)):
            if (
                int(grade["CRN"]) in course_data[i]["crn"]
                and currSubjectCode == course_data[i]["subjectCode"]
                and currCourseCode == course_data[i]["courseCode"]
            ):
                found = True
                if currSemester in course_data[i]["gpa"]:
                    course_data[i]["gpa"][currSemester].append(
                        [
                            grade["instructor"],
                            [
                                grade["totalAplus"],
                                grade["totalA"],
                                grade["totalAminus"],
                                grade["totalBplus"],
                                grade["totalB"],
                                grade["totalBminus"],
                                grade["totalCplus"],
                                grade["totalC"],
                                grade["totalCminus"],
                                grade["totalDplus"],
                                grade["totalD"],
                                grade["totalDminus"],
                                grade["totalF"],
                                float(grade["avg gpa"]),
                            ],
                        ]
                    )
                else:
                    course_data[i]["gpa"][currSemester] = [
                        [
                            grade["instructor"],
                            [
                                grade["totalAplus"],
                                grade["totalA"],
                                grade["totalAminus"],
                                grade["totalBplus"],
                                grade["totalB"],
                                grade["totalBminus"],
                                grade["totalCplus"],
                                grade["totalC"],
                                grade["totalCminus"],
                                grade["totalDplus"],
                                grade["totalD"],
                                grade["totalDminus"],
                                grade["totalF"],
                                float(grade["avg gpa"]),
                            ],
                        ]
                    ]
        # if found:
        #   count += 1
    # print(count, len(grade_data))
print("syncing grades....")
for i in range(len(course_data)):
    gpa_data = {}
    gpa_data_count = {}
    for semester in course_data[i]["gpa"]:
        for entry in course_data[i]["gpa"][semester]:
            instructor = entry[0]
            if instructor in gpa_data:
                for k in range(len(gpa_data[instructor])):
                    gpa_data[instructor][k] = round(
                        (
                            gpa_data[instructor][k] * gpa_data_count[instructor]
                            + entry[1][k]
                        )
                        / (gpa_data_count[instructor] + 1),
                        2,
                    )
                gpa_data_count[instructor] += 1
            else:
                gpa_data[instructor] = entry[1]
                gpa_data_count[instructor] = 1
    course_data[i]["gpa"] = gpa_data

# adding geneds
gened_file = open(args.genedfile)
gened_data = json.load(gened_file)
gened_file.close()

print("adding geneds.....")
tags = []
for tag in tqdm(gened_data):
    for c in gened_data[tag]:
        sub, code = c.split(" ")
        for i in range(len(course_data)):
            if (
                course_data[i]["subjectCode"] == sub
                and course_data[i]["courseCode"] == code
                and tag not in course_data[i]["gened"]
            ):
                course_data[i]["gened"].append(tag)

# adding prereqs
prereqs_file = open(args.prereqsfile)
prereqs_data = json.load(prereqs_file)
prereqs_file.close()

print("adding prereqs.....")
for class_data in tqdm(prereqs_data):
    sub, code = class_data.split()
    for i in range(len(course_data)):
        if (course_data[i]["subjectCode"] == sub and course_data[i]["courseCode"] == code):
            course_data[i]["prereqs"] = prereqs_data[class_data]


test = []
invalid_indices = []
for i in range(len(course_data)):
    course_data[i]["fullTitle"] = " ".join(
        [
            course_data[i]["subjectCode"],
            course_data[i]["courseCode"],
            course_data[i]["title"],
        ]
    )
    course_data[i]["detailId"] = re.sub("[^a-zA-Z0-9]", "", course_data[i]["fullTitle"])
    test.append(course_data[i]["detailId"])
    # THTR T1200 seems to be an issue here, can just remove (it is outdated)
    try:
        course_data[i]["courseCode"] = int(course_data[i]["courseCode"])
    except:
        invalid_indices.append(i)

for idx in invalid_indices:
    course_data.pop(idx)

print(f"writing to {args.outfile}...")
outfile = open(args.outfile, "w")
json.dump(course_data, outfile, indent=4)
outfile.close()
print("done!")


freq = {}
for item in test:
    if (item in freq):
        freq[item] += 1
    else:
        freq[item] = 1

for x in freq:
    if freq[x] > 1:
        print(x)
print(len(test), len(course_data))
