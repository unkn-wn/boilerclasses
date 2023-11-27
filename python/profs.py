import json

f = open("out.json")
data = json.load(f)

profs = []
for c in data:
  for x in c["instructor"]:
    profs.extend(c["instructor"][x])

profs = list(set(profs))
profs.sort()
print(profs)