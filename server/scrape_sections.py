"""
Proof of Concept: Scrape current term course sections and meetings from Banner 9
and output a compact, normalized schedule dataset for BoilerClasses.
"""

import argparse
import html
import json
import re
import sys
import time
from pathlib import Path
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://apps.mypurdue.purdue.edu/StudentRegistrationSsb/ssb/"
PAGE_SIZE = 100

def make_session():
    session = requests.Session()
    session.headers["User-Agent"] = "boilerclasses-sections-scraper (+https://www.boilerclasses.com)"
    retry = Retry(total=3, backoff_factor=1, allowed_methods={"GET", "POST"},
                  status_forcelist=[429, 500, 502, 503, 504])
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session

def calculate_iso_duration(start_time_str, end_time_str):
    """
    Given '0930' and '1120', returns 'PT1H50M'
    """
    if not start_time_str or not end_time_str or len(start_time_str) < 4 or len(end_time_str) < 4:
        return "PT50M"
    try:
        sh, sm = int(start_time_str[:2]), int(start_time_str[2:])
        eh, em = int(end_time_str[:2]), int(end_time_str[2:])
        diff = (eh * 60 + em) - (sh * 60 + sm)
        if diff <= 0:
            return "PT50M"
        hours = diff // 60
        mins = diff % 60
        if hours > 0 and mins > 0:
            return f"PT{hours}H{mins}M"
        elif hours > 0:
            return f"PT{hours}H"
        else:
            return f"PT{mins}M"
    except Exception:
        return "PT50M"

def format_start_time(time_str):
    """
    Converts '0930' to '09:30:00.0000000' for purdue.io OData compatibility
    """
    if not time_str or len(time_str) < 4:
        return "00:00:00.0000000"
    return f"{time_str[:2]}:{time_str[2:]}:00.0000000"

def format_date(date_str):
    """
    Converts MM/DD/YYYY to YYYY-MM-DD
    """
    if not date_str:
        return ""
    parts = date_str.split("/")
    if len(parts) == 3:
        return f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
    return date_str

def extract_days_string(meeting_time):
    day_map = [
        ("Monday", "monday"),
        ("Tuesday", "tuesday"),
        ("Wednesday", "wednesday"),
        ("Thursday", "thursday"),
        ("Friday", "friday"),
        ("Saturday", "saturday"),
        ("Sunday", "sunday")
    ]
    days = [d_name for d_name, key in day_map if meeting_time.get(key)]
    return ", ".join(days) if days else "None"

def get_sections_for_subject(session, term_code, subject):
    """
    Fetches all sections for a subject. A fresh search session is required
    because Banner caches parameters on the session.
    """
    init_res = session.post(
        BASE_URL + "term/search?mode=search",
        data={"term": term_code},
        timeout=15
    ).json()
    
    if "fwdURL" not in init_res:
        raise ValueError("Banner did not initialize class search")

    rows = []
    seen_crns = set()
    offset = 0
    
    while True:
        page = session.get(
            BASE_URL + "searchResults/searchResults",
            params={
                "txt_subject": subject,
                "txt_term": term_code,
                "pageOffset": offset,
                "pageMaxSize": PAGE_SIZE,
                "sortColumn": "courseNumber",
                "sortDirection": "asc"
            },
            timeout=30
        ).json()

        if page.get("success") is not True:
            raise ValueError(f"Banner returned unsuccessful response for {subject}")

        total = int(page.get("totalCount", 0))
        data = page.get("data") or []

        for sec in data:
            crn = str(sec.get("courseReferenceNumber"))
            if crn not in seen_crns:
                seen_crns.add(crn)
                rows.append(sec)

        offset += len(data)
        if offset >= total or not data:
            break

    return rows

def parse_subject_sections(raw_sections, term_code):
    """
    Transforms raw Banner sections into courses with Classes, Sections, and Meetings.
    Matches the schema expected by BoilerClasses calendar.js and scheduleManager.js.
    """
    courses_map = {}

    for sec in raw_sections:
        subj = sec.get("subject")
        num = sec.get("courseNumber")
        title = html.unescape(sec.get("courseTitle", "")).strip()
        course_key = f"{subj} {num}"
        crn = str(sec.get("courseReferenceNumber"))
        sec_type = sec.get("scheduleTypeDescription") or "Lecture"
        link_id = sec.get("linkIdentifier") or "DEFAULT"
        class_id = f"{course_key}_{link_id}" if sec.get("isSectionLinked") else f"{course_key}_{crn}"

        if course_key not in courses_map:
            courses_map[course_key] = {
                "Id": f"{subj}_{num}",
                "Number": num,
                "Subject": subj,
                "Title": title,
                "Classes": {}
            }

        course = courses_map[course_key]

        if class_id not in course["Classes"]:
            course["Classes"][class_id] = {
                "Id": class_id,
                "Sections": []
            }

        class_obj = course["Classes"][class_id]

        # Extract faculty
        instructors = []
        for fac in (sec.get("faculty") or []):
            if fac.get("displayName"):
                instructors.append({
                    "Id": str(fac.get("bannerId") or fac.get("emailAddress") or fac.get("displayName")),
                    "Name": fac.get("displayName"),
                    "Email": fac.get("emailAddress", "")
                })

        if not instructors:
            instructors.append({
                "Id": "tba",
                "Name": "TBA",
                "Email": ""
            })

        # Extract meetings
        meetings = []
        meetings_faculty = sec.get("meetingsFaculty") or []
        for idx, mf in enumerate(meetings_faculty):
            mt = mf.get("meetingTime")
            if not mt:
                continue

            days_str = extract_days_string(mt)
            start_time_raw = mt.get("beginTime")
            end_time_raw = mt.get("endTime")
            duration_iso = calculate_iso_duration(start_time_raw, end_time_raw)
            start_time_iso = format_start_time(start_time_raw) if start_time_raw else None
            
            bldg_code = mt.get("building") or "TBA"
            bldg_name = mt.get("buildingDescription") or "TBA"
            room_num = mt.get("room") or "TBA"

            meetings.append({
                "Id": f"{crn}_{idx}",
                "SectionId": crn,
                "Type": sec_type,
                "StartDate": format_date(mt.get("startDate")),
                "EndDate": format_date(mt.get("endDate")),
                "DaysOfWeek": days_str,
                "StartTime": start_time_iso,
                "Duration": duration_iso,
                "Instructors": instructors,
                "Room": {
                    "Number": room_num,
                    "Building": {
                        "ShortCode": bldg_code,
                        "Name": bldg_name
                    }
                }
            })

        # Fallback if no meetingFaculty was provided (e.g. async/arr)
        if not meetings:
            meetings.append({
                "Id": f"{crn}_0",
                "SectionId": crn,
                "Type": sec_type,
                "StartDate": "",
                "EndDate": "",
                "DaysOfWeek": "None",
                "StartTime": None,
                "Duration": "PT0M",
                "Instructors": instructors,
                "Room": {
                    "Number": "TBA",
                    "Building": {
                        "ShortCode": "TBA",
                        "Name": "TBA"
                    }
                }
            })

        class_obj["Sections"].append({
            "Id": crn,
            "Crn": crn,
            "Type": sec_type,
            "StartDate": format_date(sec.get("startDate")),
            "EndDate": format_date(sec.get("endDate")),
            "Meetings": meetings
        })

    # Convert Classes dict to list
    final_courses = {}
    for key, c_data in courses_map.items():
        classes_list = list(c_data["Classes"].values())
        final_courses[key] = {
            "Id": c_data["Id"],
            "Number": c_data["Number"],
            "Subject": c_data["Subject"],
            "Title": c_data["Title"],
            "Classes": classes_list
        }

    return final_courses

def get_all_subjects(term_code):
    with make_session() as session:
        res = session.get(
            BASE_URL + "classSearch/get_subject",
            params={"searchTerm": "", "term": term_code, "offset": 1, "max": 500},
            timeout=15
        ).json()
        return [row["code"] for row in res if row.get("code")]

def scrape_subject_worker(term_code, subj):
    with make_session() as session:
        t0 = time.time()
        raw_sections = get_sections_for_subject(session, term_code, subj)
        parsed = parse_subject_sections(raw_sections, term_code)
        elapsed = time.time() - t0
        return subj, raw_sections, parsed, elapsed

def main():
    parser = argparse.ArgumentParser(description="Scrape Purdue course sections")
    parser.add_argument("-term", default="202720", help="term code (default: 202720 for Spring 2027)")
    parser.add_argument("-subjects", default="all", help="comma-separated subjects to scrape, or 'all' for every subject")
    parser.add_argument("-workers", type=int, default=4, help="number of concurrent worker threads (default: 4)")
    parser.add_argument("-outfile", default="../src/data/sections_202720.json", help="output file path")
    parser.add_argument("--pretty", action="store_true", help="pretty print JSON output with 2 spaces")
    args = parser.parse_args()

    if args.subjects.lower() == "all" or not args.subjects.strip():
        print(f"Fetching all available subjects for term {args.term}...")
        subjects = get_all_subjects(args.term)
        print(f"Found {len(subjects)} subjects across the university.")
    else:
        subjects = [s.strip().upper() for s in args.subjects.split(",") if s.strip()]

    print(f"Scraping sections for term {args.term} using {args.workers} workers...")
    t_start = time.time()

    all_courses = {}
    total_sections_count = 0
    completed = 0

    from concurrent.futures import ThreadPoolExecutor, as_completed

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_subj = {executor.submit(scrape_subject_worker, args.term, subj): subj for subj in subjects}
        for future in as_completed(future_to_subj):
            subj = future_to_subj[future]
            completed += 1
            try:
                subj, raw_sections, parsed, elapsed = future.result()
                all_courses.update(parsed)
                total_sections_count += len(raw_sections)
                print(f"[{completed}/{len(subjects)}] {subj}: {len(raw_sections)} sections, {len(parsed)} courses ({elapsed:.2f}s)")
            except Exception as e:
                print(f"[{completed}/{len(subjects)}] {subj} ERROR: {e}", file=sys.stderr)

    out_path = Path(args.outfile)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        if args.pretty:
            json.dump(all_courses, f, indent=2)
        else:
            json.dump(all_courses, f, separators=(',', ':'))

    file_size_kb = out_path.stat().st_size / 1024
    total_time = time.time() - t_start
    print(f"\nCompleted in {total_time:.2f}s!")
    print(f"Saved {len(all_courses)} courses ({total_sections_count} sections) to {out_path} ({file_size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
