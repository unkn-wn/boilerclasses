import json

f = open("class_out.json")
data = json.load(f)

for d in data:
  for x in d["gpa"]:
    count = {}
    asum = {}
    for y in d["gpa"][x]:
      if y[0] not in count:
        count[y[0]] = 1
      else:
        count[y[0]] += 1
      
      if y[0] not in asum:
        asum[y[0]] = float(y[1])
      else:
        asum[y[0]] += float(y[1])
    d["gpa"][x] = []
    for y in asum:
      asum[y] /= count[y]
      asum[y] = round(asum[y], 2)
      d["gpa"][x].append([y, asum[y]])

outfile = open(f"class_out2.json", "w")
json.dump(data, outfile, indent=4)