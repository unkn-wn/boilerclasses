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
import os
import re
import shutil
import sys
import requests
import prereqs

def format_instructors(by_sched):
  special_sched = ["Laboratory", "Laboratory Preparation", "Recitation", "Practice Study Observation"]
  count = 0
  for sched in special_sched:
    if sched in by_sched:
      count += 1

  if len(by_sched) == count:
    return by_sched

  for sched in special_sched:
    if sched in by_sched:
      del by_sched[sched]

  return by_sched

parser = argparse.ArgumentParser(description='which semester')
parser.add_argument("-sem", default="Fall 2026", dest="sem", help="which semester (default: Fall 2026)")
parser.add_argument("--latest", type=int, dest="latest", help="print the newest N Fall/Spring terms as JSON and exit")
parser.add_argument("--fresh", action="store_true", dest="fresh", help="ignore existing per-subject checkpoints")
parser.add_argument("-subjects", dest="subjects", help="comma-separated subjects for a quick test scrape, e.g. CS,MA (output goes to test_classes_<sem>.json)")

args = parser.parse_args()

link = "https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_dyn_sched"

session = requests.Session()
session.headers["User-Agent"] = "boilerclasses-scraper (+https://www.boilerclasses.com)"

if args.latest:
  html = session.get(link, timeout=30).text
  terms = re.findall(r'<OPTION VALUE="\d+">((?:Fall|Spring) \d{4})', html)
  print(json.dumps(terms[:args.latest]))
  sys.exit(0)


options = Options()
options.add_argument("--headless")
options.add_experimental_option("detach", True)

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


class_codes = ["AAE", "AAS", "ABE", "ACCT", "AD", "AFT", "AGEC", "AGR", "AGRY", "AMST", "ANSC", "ANTH", "ARAB", "ARCH", "ASAM", "ASEC", "ASL", "ASM", "ASTR", "AT", "BAND", "BCHM", "BIOL", "BME", "BMS", "BTNY", "BUS", "CAND", "CCE", "CDIS", "CE", "CEM", "CGT", "CHE", "CHM", "CHNS", "CIT", "CLCS", "CLPH", "CM", "CMGT", "CMPL", "CNIT", "COM", "CPB", "CS", "CSCI", "CSR", "DANC", "DCTC", "DSB", "EAPS", "ECE", "ECET", "ECON", "EDCI", "EDPS", "EDST", "EEE", "ENE", "ENGL", "ENGR", "ENGT", "ENTM", "ENTR", "EPCS", "EXPL", "FIN", "FLM", "FNR", "FR", "FS", "FVS", "GEP", "GER", "GRAD", "GREK", "GS", "GSLA", "HDFS", "HEBR", "HER", "HETM", "HHS", "HIST", "HK", "HONR", "HORT", "HSCI", "HSOP", "HTM", "IBE", "IDE", "IDIS", "IE", "IET", "ILS", "IMPH", "IPPH", "INT", "IT", "ITAL", "JPNS", "JWST", "KOR", "LA", "LALS", "LATN", "LC", "LING", "MA", "MATH", "MCMP", "ME", "MET", "MFET", "MGMT", "MIS", "MKTG", "MSE", "MSL", "MSPE", "MUS", "NRES", "NS", "NUCL", "NUPH", "NUR", "NUTR", "OBHR", "OLS", "OPP", "PES", "PHIL", "PHPR", "PHRM", "PHSC", "PHYS", "POL", "PSY", "PTGS", "PUBH", "QM", "REAL", "REG", "REL", "RPMP", "RUSS", "SA", "SCI", "SCLA", "SCOM", "SFS", "SLHS", "SOC", "SPAN", "STAT", "STRT", "SYS", "TCM", "TDM", "TECH", "THTR", "TLI", "VCS", "VIP", "VM", "WGSS"]
none_found = []

jsonData = []
sem_name = args.sem.replace(" ", "").lower()
temp_dir = f"data/temp_{sem_name}"

def ensure_temp_dir(temp_dir):
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)

if args.fresh and os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)
ensure_temp_dir(temp_dir)

if args.subjects:
    class_codes = [code.strip().upper() for code in args.subjects.split(",")]

for code in class_codes:
    temp_file = f"{temp_dir}/{code}.json"

    if os.path.exists(temp_file):
        print(f"Loading existing data for {code}...")
        with open(temp_file, 'r') as f:
            code_data = json.load(f)
            jsonData.extend(code_data)
        continue

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
      none_found.append(code)
      continue
    # type_dropdown = driver.find_element(By.XPATH, "//select[@name='sel_schd']")
    # type_dropdown = ui.Select(type_dropdown)
    # type_dropdown.deselect_all()
    # type_dropdown.select_by_value("LEC")
    # type_dropdown.select_by_value("DIS")
    # type_dropdown.select_by_value("SD")
    # type_dropdown.select_by_value("IND")

    campus_dropdown = driver.find_element(By.XPATH, "//select[@name='sel_camp']")
    campus_dropdown = ui.Select(campus_dropdown)
    campus_dropdown.deselect_all()
    campus_dropdown.select_by_value("PWL")

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
      instructors = []
      tmp_instructors = curr_td.text.split(",")
      for j in range(len(tmp_instructors)):
        instructors.append(tmp_instructors[j].split("(")[0].strip())

      if classfullId in doneIds:
        if sched_type in doneIds[classfullId]["instructor"]:
          doneIds[classfullId]["instructor"][sched_type].extend(instructors)
        else:
          doneIds[classfullId]["instructor"][sched_type] = instructors
        doneIds[classfullId]["crn"].append(curr_crn)
        doneIds[classfullId]["sched"].append(sched_type)
        continue
      else:
        classStruct["instructor"] = {}
        classStruct["instructor"][sched_type] = instructors
        classStruct["crn"] = [curr_crn]
        classStruct["sched"] = [sched_type]
        viewCatalog = tds[i].find_elements(By.TAG_NAME, "a")[0]
        catalogLink = viewCatalog.get_attribute('href')
        # the link goes to the catalog listing; the detail page has the same description
        # plus prerequisites
        term_in = re.search(r"term_in=(\d+)", catalogLink).group(1)
        catalogEntries[classfullId] = f"https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in={term_in}&subj_code_in={classStruct['subjectCode']}&crse_numb_in={classStruct['courseCode']}"

        doneIds[classfullId] = classStruct

    for courseId in doneIds:
      # final processing for instructor
      doneIds[courseId]["instructor"] = format_instructors(doneIds[courseId]["instructor"])
      all_instructors = []
      for x in doneIds[courseId]["instructor"]:
        all_instructors.extend(doneIds[courseId]["instructor"][x])
      doneIds[courseId]["instructor"] = set(all_instructors)
      doneIds[courseId]["sched"] = list(set(doneIds[courseId]["sched"]))
      if "TBA" in doneIds[courseId]["instructor"] and len(doneIds[courseId]["instructor"]) > 1:
        doneIds[courseId]["instructor"].remove("TBA")
      doneIds[courseId]["instructor"] = list(doneIds[courseId]["instructor"])

    for courseId in tqdm(catalogEntries):
      driver.get(catalogEntries[courseId])
      if len(driver.find_elements(By.CLASS_NAME, "ntdefault")) == 0:
        continue
      tds_catalog = driver.find_elements(By.CLASS_NAME, "ntdefault")[0]
      catalog_html = tds_catalog.get_attribute('innerHTML')
      doneIds[courseId]["prereqs"] = prereqs.extract(catalog_html)
      desc = catalog_html.split("\n")[1]
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


    code_data = []
    for x in doneIds:
      try:
        doneIds[x]["title"] = doneIds[x]["title"].replace("&amp;", "&")
        doneIds[x]["title"] = doneIds[x]["title"].replace("&nbsp;", " ")
        doneIds[x]["title"] = doneIds[x]["title"].strip()
        doneIds[x]["description"] = doneIds[x]["description"].replace("&nbsp;", " ")
        doneIds[x]["description"] = doneIds[x]["description"].replace("&amp;", "&")
        doneIds[x]["description"] = doneIds[x]["description"].strip()
        code_data.append(doneIds[x])
      except:
        continue

    with open(temp_file, 'w') as f:
        json.dump(code_data, f, indent=4)

    jsonData.extend(code_data)

if args.subjects:
    # test scrape: keep it out of data/ so harmonize never picks it up
    print(f"scraped {len(jsonData)} courses from {', '.join(class_codes)}")
    with open(f"test_classes_{sem_name}.json", "w") as outfile:
        json.dump(jsonData, outfile, indent=4)
    if len(jsonData) == 0:
        sys.exit(1)
    sys.exit(0)

# a partial scrape (Purdue down, markup change) must never be uploaded
if len(jsonData) < 1000:
    print(f"only {len(jsonData)} courses scraped for {args.sem}, refusing to write output")
    sys.exit(1)

outfile = open(f"data/classes_{sem_name}.json", "w")
json.dump(jsonData, outfile, indent=4)
