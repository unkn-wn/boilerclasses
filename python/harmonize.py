import json

'''
class code: {
  title:
  subjectCode:
  courseCode:
  instructor: [
    spring24: [],
    fall23: []..
  ]
  description:
  credits: []
  terms: []
}


'''

folders = ["classes_spring24", "classes_fall23", "classes_spring23", "classes_fall22"]
subjects = ["AAE","AAS","ABE","AD","AFT","AGEC","AGR","AGRY","AMST","ANSC","ANTH","ARAB","ASAM","ASEC","ASL","ASM","ASTR","AT","BAND","BCHM","BIOL","BME","BMS","BTNY","CAND","CDIS","CE","CEM","CGT","CHE","CHM","CHNS","CLCS","CLPH","CM","CMPL","CNIT","COM","CPB","CS","CSR","DANC","EAPS","ECE","ECET","ECON","EDCI","EDPS","EDST","EEE","ENE","ENGL","ENGR","ENGT","ENTM","ENTR","EPCS","FNR","FR","FS","FVS","GEP","GER","GRAD","GREK","GS","GSLA","HDFS","HEBR","HIST","HK","HONR","HORT","HSCI","HSOP","HTM","IDE","IDIS","IE","IET","ILS","IPPH","IT","ITAL","JPNS","JWST","KOR","LA","LALS","LATN","LC","LING","MA","MCMP","ME","MET","MFET","MGMT","MSE","MSL","MUS","NRES","NS","NUCL","NUPH","NUR","NUTR","OBHR","OLS","PES","PHIL","PHPR","PHRM","PHYS","POL","PSY","PTGS","PUBH","REG","REL","RUSS","SA","SCI","SCLA","SFS","SLHS","SOC","SPAN","STAT","SYS","TDM","TECH","THTR","TLI", "VCS", "VIP", "VM", "WGSS"]

out = {}

for subj in subjects:
  semesters = []
  all_classes = []
  for folder in folders:
    path = folder + f"/{subj}.json"
    try:
      f = open(path)
    except:
      continue
    data = json.load(f)
    semesters.append(data)
    for class_data in data:
      all_classes.append(class_data["subjectCode"] + " " + class_data["courseCode"] + ": " + class_data["title"])

  all_classes = list(set(all_classes))
  all_classes.sort()


  for class_id in all_classes:
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

out_final = []
for x in out:
  out_final.append(out[x])

outfile = open("out.json", "w")
json.dump(out_final, outfile, indent=4)
