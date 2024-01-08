import json
import os
import argparse
from tqdm import tqdm

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

# TODO: solidify matching thing
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
            + class_data["title"]
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
    for semester in semesters:
        for class_sem in semester:
            if (
                class_sem["subjectCode"] == s
                and class_sem["courseCode"] == c
                and class_sem["title"] == t
            ):
                instances.append(class_sem)
                class_data["terms"].append(class_sem["term"])
                class_data["instructor"][class_sem["term"]] = class_sem["instructor"]
                if "<a href=" not in class_sem["description"]:
                    class_data["description"] = class_sem["description"]
    class_data["title"] = instances[0]["title"]
    class_data["subjectCode"] = s
    class_data["courseCode"] = c
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
            if (
                course_data[i]["subjectCode"] == currSubjectCode
                and course_data[i]["courseCode"] == currCourseCode
                and currTitle == course_data[i]["title"]
            ):
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

invalid_indices = []
for i in range(len(course_data)):
    course_data[i]["fullTitle"] = " ".join(
        [
            course_data[i]["subjectCode"],
            course_data[i]["courseCode"],
            course_data[i]["title"],
        ]
    )
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
