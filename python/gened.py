import json

path = "data/gened.json"
f = open(path)
data = json.load(f)

out_path = "out.json"
f2 = open(out_path)
out_data = json.load(f2)

for i in range(len(out_data)):
  out_data[i]["gened"] = []

tags = []
for tag in data:
  for c in data[tag]:
    sub, code = c.split(" ")
    for i in range(len(out_data)):
      if out_data[i]["subjectCode"] == sub and out_data[i]["courseCode"] == code:
        out_data[i]["gened"].append(tag)
  
outfile = open(f"out2.json", "w")
json.dump(out_data, outfile, indent=4)
