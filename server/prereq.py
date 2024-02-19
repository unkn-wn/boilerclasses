import re
import json

class Course(object):
	def __init__(self, dep, num, concurrent):
		self.department = dep
		self.course_num = num
		self.concurrent = concurrent
	def __repr__(self) -> str:
		return "( " + self.department + " " + str(self.course_num) + " " + str(self.concurrent) + " )"

def group(s):
	grps = []
	cur = ""
	i = 0
	while i < len(s):
		if s[i] == ")":
			grps.append(cur)
			grps.append(")")
			cur = ""
			i += 1
		elif s[i] == "(":
			grps.append(cur)
			grps.append("(")
			cur = ""
			i += 1
		elif i+2 < len(s) and s[i:i+2] == "or":
			grps.append(cur)
			grps.append("or")
			cur = ""
			i += 2
		elif i+3 < len(s) and s[i:i+3] == "and":
			grps.append(cur)
			grps.append("and")
			cur = ""
			i += 3
		else:
			cur += s[i]
			i += 1
	if len(cur) > 0:
		grps.append(cur)
	# print(grps)

	# print(''.join(grps))
	grps = [s.strip() for s in grps]
	grps = [s for s in grps if len(s) > 0]
	return grps

def build_tree(clauses):
	# if clauses[i] == [")"]:
	# 	return i + 1, info
	# if clauses[i] == ["("]:
	# 	index, data = build_tree(i + 1, [], clauses)
	# 	info.append(data)
	# 	return index, info
	# if clauses[i] == ["and"]:
	# 	info[-1].append("&")
	# 	return build_tree(i + 1, info, clauses)
	# if clauses[i] == ["or"]:

	# loop through () --> prereq
	# or -->  OR\n
	# and --> & 

	output = ""
	cur = ""
	for x in clauses:
		if x == "or":
			cur += " OR "
		elif x == "and":
			cur += " & "
		elif x == "(":
			cur += "\n( "
		elif x == ")":
			cur += ")\n"
		else:
			cur += str(x)
	# print(cur)
	return cur

def prereqs(s, link=""):
	grps = group(s)
	class_codes = ["AAE","AAS","ABE","AD","AFT","AGEC","AGR","AGRY","AMST","ANSC","ANTH","ARAB","ASAM","ASEC","ASL","ASM","ASTR","AT","BAND","BCHM","BIOL","BME","BMS","BTNY","CAND","CDIS","CE","CEM","CGT","CHE","CHM","CHNS","CLCS","CLPH","CM","CMPL","CNIT","COM","CPB","CS","CSR","DANC","EAPS","ECE","ECET","ECON","EDCI","EDPS","EDST","EEE","ENE","ENGL","ENGR","ENGT","ENTM","ENTR","EPCS","FNR","FR","FS","FVS","GEP","GER","GRAD","GREK","GS","GSLA","HDFS","HEBR","HIST","HK","HONR","HORT","HSCI","HSOP","HTM","IDE","IDIS","IE","IET","ILS","IPPH","IT","ITAL","JPNS","JWST","KOR","LA","LALS","LATN","LC","LING","MA","MCMP","ME","MET","MFET","MGMT","MSE","MSL","MUS","NRES","NS","NUCL","NUPH","NUR","NUTR","OBHR","OLS","PES","PHIL","PHPR","PHRM","PHYS","POL","PSY","PTGS","PUBH","REG","REL","RUSS","SA","SCI","SCLA","SFS","SLHS","SOC","SPAN","STAT","SYS","TDM","TECH","THTR","TLI", "VCS", "VIP", "VM", "WGSS"]

	grammar = '|'.join(class_codes)	

	clauses = []
	for course in grps:
		if course in ["(", ")", "and", "or"]:
			clauses.append(course)
			continue
		department = re.findall(grammar, course)
		if len(department) == 0:
			print(course, "NOT FOUND of class", link)
			print("BROKEN:", s)
			print()
			return
		num = re.findall("[A-z0-9][0-9][0-9][0-9][0-9]", course)
		if len(num) == 0:
			print(course, "NOT FOUND of class", link)
			print("BROKEN:", s)
			print()
			return

		assert(len(department) == 1)
		assert(len(num) == 1)

		concurrent = ("concurrent" in course)
		# print(course, department, num, concurrent)

		c = Course(department[0], num[0], concurrent)
		clauses.append(c)
	# print(clauses)
	return build_tree(clauses)

# s = " (Undergraduate level PHYS 17200 Minimum Grade of D- or (Undergraduate level PHYS 16200 Minimum Grade of D- and Undergraduate level PHYS 16300 Minimum Grade of D-) or Undergraduate level ENGR 16200 Minimum Grade of D-) and (Undergraduate level MA 26100 Minimum Grade of D- [may be taken concurrently] or Undergraduate level MATH 26100 Minimum Grade of D- [may be taken concurrently] or Undergraduate level MA 26300 Minimum Grade of D- [may be taken concurrently] or Undergraduate level MA 17200 Minimum Grade of D- [may be taken concurrently] or Undergraduate level MA 18200 Minimum Grade of D- [may be taken concurrently] or Undergraduate level MA 27101 Minimum Grade of D- [may be taken concurrently] or Undergraduate level MA 17400 Minimum Grade of D- [may be taken concurrently])"

# print(prereqs(s))

# s = "(Undergraduate level ENGR 13200 Minimum Grade of C- or Undergraduate level ENGR 14200 Minimum Grade of C- or Undergraduate level ENGR 16200 Minimum Grade of C- or Undergraduate level ENGR 13000 Minimum Grade of C- or Undergraduate level EPCS 12100 Minimum Grade of C- or Undergraduate level VIP 17912 Minimum Grade of C-) and (Undergraduate level CGT 16300 Minimum Grade of C- [may be taken concurrently] or Undergraduate level MFET 16300 Minimum Grade of C- [may be taken concurrently]) and (Undergraduate level CS 15900 Minimum Grade of C- [may be taken concurrently] or Undergraduate level CS 17700 Minimum Grade of C- [may be taken concurrently] or Undergraduate level CS 18000 Minimum Grade of C- [may be taken concurrently])"

# print(prereqs(s))

# s = " (Undergraduate level AAE 20400 Minimum Grade of D- [may be taken concurrently] or Undergraduate level NUCL 27300 Minimum Grade of D- [may be taken concurrently] or Undergraduate level ME 32300 Minimum Grade of D- [may be taken concurrently] or Undergraduate level CE 27300 Minimum Grade of D- [may be taken concurrently])"

# print(prereqs(s))

# s = "Undergraduate level AAE 33300 Minimum Grade of D- and Undergraduate level AAE 33301 Minimum Grade of D- and Undergraduate level ME 20000 Minimum Grade of D-"

# print(prereqs(s))

if __name__ == "__main__":
	file = open("./data/scraped.json").readline()

	data = json.loads(file)

	for course in data:
		prereqs(data[course], course)
