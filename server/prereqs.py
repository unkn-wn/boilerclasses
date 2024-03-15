import json

from selenium import webdriver
from selenium.webdriver.support import ui
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import re
from tqdm import tqdm

import re
import json
 
class Course(object):
    def __init__(self, dep, num, concurrent):
        self.department = dep
        self.course_num = num
        self.concurrent = concurrent
    def __repr__(self) -> str:
        return self.department + " " + str(self.course_num) + " " + str(self.concurrent)
 
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

    grps = [s.strip() for s in grps]
    grps = [s for s in grps if len(s) > 0]
    return grps
 
def build_tree(clauses):

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
    class_codes = ['AAE', 'AAS', 'ABE', 'AD', 'AFT', 'AGEC', 'AGR', 'AGRY', 'AIS', 'AMST', 'ANSC', 'ANTH', 'ARAB', 'ARCH', 'ASAM', 'ASEC', 'ASL', 'ASM', 'AST', 'ASTR', 'AT', 'BAND', 'BCHM', 'BIOL', 'BME', 'BMS', 'BTNY', 'BUS', 'CAND', 'CDIS', 'CE', 'CEM', 'CGT', 'CHE', 'CHM', 'CHNS', 'CIT', 'CLCS', 'CLPH', 'CM', 'CMGT', 'CMPL', 'CNIT', 'COM', 'CPB', 'CS', 'CSCI', 'CSR', 'DANC', 'EAPS', 'ECE', 'ECET', 'ECON', 'EDCI', 'EDPS', 'EDST', 'EEE', 'ENE', 'ENGL', 'ENGR', 'ENGT', 'ENTM', 'ENTR', 'EPCS', 'FLM', 'FMGT', 'FNR', 'FR', 'FS', 'FVS', 'GEP', 'GER', 'GRAD', 'GREK', 'GS', 'GSLA', 'HDFS', 'HEBR', 'HER', 'HETM', 'HIST', 'HK', 'HONR', 'HORT', 'HSCI', 'HSOP', 'HTM', 'IDE', 'IDIS', 'IE', 'IET', 'ILS', 'IMPH', 'INFO', 'INT', 'IPPH', 'IT', 'ITAL', 'JPNS', 'JWST', 'KOR', 'LA', 'LALS', 'LATN', 'LC', 'LING', 'MA', 'MCMP', 'ME', 'MET', 'MFET', 'MGMT', 'MSE', 'MSL', 'MSPE', 'MUS', 'NRES', 'NS', 'NUCL', 'NUPH', 'NUR', 'NUTR', 'OBHR', 'OLS', 'PES', 'PHIL', 'PHPR', 'PHRM', 'PHSC', 'PHYS', 'POL', 'PSY', 'PTGS', 'PUBH', 'REG', 'REL', 'RUSS', 'SA', 'SCI', 'SCLA', 'SFS', 'SLHS', 'SOC', 'SPAN', 'STAT', 'SYS', 'TCM', 'TDM', 'TECH', 'TESM', 'THTR', 'TLI', 'VCS', 'VIP', 'VM', 'WGSS']
 
    grammar = '|'.join(class_codes) 
 
    clauses = []
    for course in grps:
        if course in ["(", ")", "and", "or"]:
            clauses.append(course)
            continue
        department = re.findall(grammar, course)
        if len(department) == 0:
            return (None, course)

        num = re.findall("[A-z0-9][0-9][0-9][0-9][0-9]", course)
        if len(num) == 0:
            return (None, course)
        
        if len(department) != 1 or len(num) != 1:
          return (None, course)
 
        concurrent = ("concurrent" in course)
 
        c = Course(department[0], num[0], concurrent)
        clauses.append(str(c))

    return (clauses, -1)

options = Options()
options.add_experimental_option("detach", True)

options.add_argument("--headless")
options.add_argument("--disable-extensions")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

f = open('classes_out.json', 'r')
classes = json.load(f)

def getDetailId(sub, code):
  for class_data in classes:
    if class_data["subjectCode"] == sub and str(class_data["courseCode"]) == str(code):
      return class_data["detailId"]
  return None

data = {}
done_alr = []
for i in tqdm(range(len(classes))):
  try:
    class_data = classes[i]
    key_data = f'{class_data["subjectCode"]} {class_data["courseCode"]}'
    if key_data in done_alr:
      continue
    done_alr.append(key_data)
    link = f"https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202420&subj_code_in={class_data['subjectCode']}&crse_numb_in={class_data['courseCode']}"
    driver.get(link)

    tds_ntdefault = driver.find_elements(By.XPATH, "//td[@class='ntdefault']")
    td = tds_ntdefault[0]

    content = td.get_attribute('innerHTML')
    if 'Prerequisites' not in content:
      continue
    pattern = r'Prerequisites:.*?<br>(.*?)<br>'
    match = re.search(pattern, content, re.DOTALL)

    if match:
      prerequisites_text = match.group(1)
      pattern = r' <a\s+(?:[^>]*?\s+)?href=(["\'])(.*?)\1>'
      clean_content = re.sub(pattern, '', prerequisites_text)
      pattern = r'</a>'
      clean_content = re.sub(pattern, '', clean_content)
      
      s, ecode = prereqs(clean_content, key_data)
      if s != None:
          for i in range(len(s)):
              if len(s[i].split(' ')) == 3:
                  sub, code, concurrent = s[i].split(' ')
                  detailId = getDetailId(sub, code)
                  if detailId != None:
                    s[i] = f'{detailId} {concurrent}'
          data[key_data] = s
  except:
    continue
with open('../data/prereqs/classes_prereqs.json', 'w') as fp:
    json.dump(data, fp)




