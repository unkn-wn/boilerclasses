import json

f = open("class_out.json")
data = json.load(f)

for d in data:
  for x in d["gpa"]:
    out = []
    done = []
    for y in d["gpa"][x]:
      prof = y[0]
      if prof in done:
        continue
      done.append(prof)
      out.append(y)
    d["gpa"][x] = out

outfile = open(f"class_out2.json", "w")
json.dump(data, outfile, indent=4)