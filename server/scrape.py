import argparse
import json
from selenium import webdriver
from selenium.webdriver.support import ui
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
from tqdm import tqdm


parser = argparse.ArgumentParser(description='which semester')
parser.add_argument("-sem", default="Spring 2024", dest="sem", help="which semester (default: Spring 2024)")

args = parser.parse_args()


options = Options()
options.add_experimental_option("detach", True)

link = "https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_dyn_sched"

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


class_codes = ["AAE","AAS","ABE","AD","AFT","AGEC","AGR","AGRY","AMST","ANSC","ANTH","ARAB","ASAM","ASEC","ASL","ASM","ASTR","AT","BAND","BCHM","BIOL","BME","BMS","BTNY","CAND","CDIS","CE","CEM","CGT","CHE","CHM","CHNS","CLCS","CLPH","CM","CMPL","CNIT","COM","CPB","CS","CSR","DANC","EAPS","ECE","ECET","ECON","EDCI","EDPS","EDST","EEE","ENE","ENGL","ENGR","ENGT","ENTM","ENTR","EPCS","FNR","FR","FS","FVS","GEP","GER","GRAD","GREK","GS","GSLA","HDFS","HEBR","HIST","HK","HONR","HORT","HSCI","HSOP","HTM","IDE","IDIS","IE","IET","ILS","IPPH","IT","ITAL","JPNS","JWST","KOR","LA","LALS","LATN","LC","LING","MA","MCMP","ME","MET","MFET","MGMT","MSE","MSL","MUS","NRES","NS","NUCL","NUPH","NUR","NUTR","OBHR","OLS","PES","PHIL","PHPR","PHRM","PHYS","POL","PSY","PTGS","PUBH","REG","REL","RUSS","SA","SCI","SCLA","SFS","SLHS","SOC","SPAN","STAT","SYS","TDM","TECH","THTR","TLI", "VCS", "VIP", "VM", "WGSS"]

jsonData = []
for code in class_codes:
  print(f"starting {code}...")
  driver.get(link)

  dropdown_element = driver.find_element(By.NAME, "p_term")
  dropdown = ui.Select(dropdown_element)
  try:
    dropdown.select_by_visible_text(args.sem)
  except:
    dropdown.select_by_visible_text(f"{args.sem} (View only)")

  xpath_expression = "//input[@type='submit']"
  element = driver.find_element(By.XPATH, xpath_expression)
  element.click()

  time.sleep(1)

  code_dropdown = driver.find_element(By.XPATH, "//select[@name='sel_subj']")
  code_dropdown = ui.Select(code_dropdown)
  try:
    code_dropdown.select_by_value(code)
  except:
    print("no classes found")
    continue
  type_dropdown = driver.find_element(By.XPATH, "//select[@name='sel_schd']")
  type_dropdown = ui.Select(type_dropdown)
  type_dropdown.deselect_all()
  type_dropdown.select_by_value("LEC")
  type_dropdown.select_by_value("DIS")

  class_search_element = driver.find_element(By.XPATH, xpath_expression)
  class_search_element.click()

  time.sleep(3)

  table = driver.find_elements(By.XPATH, "//table[@summary='This layout table is used to present the sections found']")
  if (len(table) == 0):
    print("no classes found")
    continue
  table = table[0]
  tbody = table.find_element(By.TAG_NAME, "tbody")
  ths = tbody.find_elements(By.CLASS_NAME, "ddlabel")
  tds = tbody.find_elements(By.XPATH, "//td[@class='dddefault' and a[text()='View Catalog Entry']]")
  assert(len(ths) == len(tds))
  doneIds = {}
  catalogEntries = {}
  for i in range(len(ths)):
    classStruct = {
      "title": None,
      "subjectCode": None,
      "courseCode": None,
      "instructor": None,
      "description": None,
      "capacity": 0,
      "credits": None,
      "term": args.sem,
      "crn": None,
      "sched": None
    }
    th = ths[i]
    a = th.find_element(By.TAG_NAME, 'a')
    fullTitle = a.get_attribute('innerHTML').split(" - ")
    classStruct["title"] = fullTitle[0]
    curr_crn = int(fullTitle[-3])
    classStruct["subjectCode"] = fullTitle[-2].split(' ')[0]
    classStruct["courseCode"] = fullTitle[-2].split(' ')[1]
    classfullId = classStruct["courseCode"] + classStruct["title"]
    
    try:
      curr_table = tds[i].find_element(By.TAG_NAME, "table")
    except:
      continue
    
    curr_td = curr_table.find_elements(By.TAG_NAME, "td")[-1]
    # possible improvement: add prof email 
    sched_type = curr_table.find_elements(By.TAG_NAME, "td")[-2].text
    instructor_name = curr_td.text.split("(")[0].strip()

    if classfullId in doneIds:
      doneIds[classfullId]["instructor"].append(instructor_name)
      doneIds[classfullId]["crn"].append(curr_crn)
      doneIds[classfullId]["sched"].append(sched_type)
      continue
    else:
      classStruct["instructor"] = [instructor_name]
      classStruct["crn"] = [curr_crn]
      classStruct["sched"] = [sched_type]
      viewCatalog = tds[i].find_elements(By.TAG_NAME, "a")[0]
      catalogLink = viewCatalog.get_attribute('href')
      catalogEntries[classfullId] = catalogLink

      doneIds[classfullId] = classStruct

  for courseId in doneIds:
    doneIds[courseId]["instructor"] = set(doneIds[courseId]["instructor"])
    doneIds[courseId]["sched"] = list(set(doneIds[courseId]["sched"]))
    if "TBA" in doneIds[courseId]["instructor"] and len(doneIds[courseId]["instructor"]) > 1:
      doneIds[courseId]["instructor"].remove("TBA")
    doneIds[courseId]["instructor"] = list(doneIds[courseId]["instructor"])
    

  for courseId in tqdm(catalogEntries):
    driver.get(catalogEntries[courseId])
    tds_catalog = driver.find_elements(By.CLASS_NAME, "ntdefault")[0]
    desc = tds_catalog.get_attribute('innerHTML').split("\n")[1]
    doneIds[courseId]["description"] = desc.split(".00.")[-1].strip()
    cred = desc.split('.00.')[0].split(': ')[-1]
    try:
      if "to" in cred:
        doneIds[courseId]["credits"] = [int(float(cred.split(" to ")[0])), int(float(cred.split(" to ")[1]))]
      elif "or" in cred:
        doneIds[courseId]["credits"] = [int(float(cred.split(" or ")[0])), int(float(cred.split(" or ")[1]))]
      else:
        doneIds[courseId]["credits"] = [int(float(cred)), int(float(cred))]
    except:
      doneIds[courseId]["credits"] = [0, 0]


  for x in doneIds:
    doneIds[x]["title"] = doneIds[x]["title"].replace("&amp;", "&")
    doneIds[x]["title"] = doneIds[x]["title"].replace("&nbsp;", " ")
    doneIds[x]["title"] = doneIds[x]["title"].strip()
    doneIds[x]["description"] = doneIds[x]["description"].replace("&nbsp;", " ")
    doneIds[x]["description"] = doneIds[x]["description"].replace("&amp;", "&")
    doneIds[x]["description"] = doneIds[x]["description"].strip()
    jsonData.append(doneIds[x])
sem_name = args.sem.replace(" ", "").lower()
outfile = open(f"data/classes_{sem_name}.json", "w")
json.dump(jsonData, outfile, indent=4)