"""Scrape a term's section meetings from Banner into data/sections_<term code>.json.

Output maps detailId -> sections. The data pipeline uploads it to S3 and
src/pages/api/sections.js serves it from memory.
"""

import argparse
import html
import json
import re
import sys
from pathlib import Path

import requests

from scrape import MIN_COURSES, get_sections, get_terms, lookup, make_session, request, term_name

# PIN sections only feed the schedule's Indy/WL filter; course pages come from PWL.
CAMPUSES = ["PWL", "PIN"]
DAYS = [("monday", "Mon"), ("tuesday", "Tue"), ("wednesday", "Wed"), ("thursday", "Thu"),
        ("friday", "Fri"), ("saturday", "Sat"), ("sunday", "Sun")]


def detail_id(section):
    # Must match harmonize.py's detailId so files line up with course pages.
    title = html.unescape(section["courseTitle"]).strip()
    return re.sub(r"[^a-zA-Z0-9]", "", f"{section['subject']} {section['courseNumber']} {title}")


def banner_time(value):
    return f"{value[:2]}:{value[2:]}" if value else None


def banner_date(value):
    month, day, year = value.split("/")
    return f"{year}-{month}-{day}"


def format_section(section):
    meetings = []
    for entry in section.get("meetingsFaculty") or []:
        time = entry["meetingTime"]
        building, room = time.get("building"), time.get("room")
        meetings.append({
            "days": [abbr for day, abbr in DAYS if time[day]],
            "start": banner_time(time["beginTime"]), "end": banner_time(time["endTime"]),
            "startDate": banner_date(time["startDate"]), "endDate": banner_date(time["endDate"]),
            "room": f"{building} {room}" if building and room else building or "TBA",
        })
    faculty = section.get("faculty") or []
    return {
        "crn": int(section["courseReferenceNumber"]), "type": section["scheduleTypeDescription"],
        "instructors": [person["displayName"].strip() for person in faculty if person.get("displayName")],
        "meetings": meetings,
    }


def schedule_sections(session, term, rows):
    """Format a course's sections, giving linked sections (a lecture and its labs) one classId."""
    parent = {int(row["courseReferenceNumber"]): int(row["courseReferenceNumber"]) for row in rows}

    def find(crn):
        while parent[crn] != crn:
            crn = parent[crn]
        return crn

    links = {}
    for row in rows:
        if row.get("linkIdentifier"):
            links.setdefault(row["linkIdentifier"], []).append(int(row["courseReferenceNumber"]))
    for crns in links.values():
        for crn in crns[1:]:
            parent[find(crn)] = find(crns[0])
    # A section's link identifier names its own group, not its partners (lecture A1
    # pairs with labs A2), so ask Banner. A lecture's response already covers its labs.
    queried = set()
    for crns in links.values():
        if find(crns[0]) in queried:
            continue
        linked = request(session, "searchResults/fetchLinkedSections",
                         params={"term": term, "courseReferenceNumber": crns[0]}).json()["linkedData"]
        for combination in linked:
            for other in combination:
                crn = int(other["courseReferenceNumber"])
                if crn in parent:
                    parent[find(crn)] = find(crns[0])
        queried.add(find(crns[0]))
    return [{**format_section(row), "classId": str(find(int(row["courseReferenceNumber"])))} for row in rows]


def scrape_subject(term, subject):
    rows = []
    # Banner caches the first search per session, so each campus needs its own.
    for campus in CAMPUSES:
        with make_session() as session:
            rows += get_sections(session, term, subject, campus)
    courses = {}
    for row in rows:
        courses.setdefault(detail_id(row), []).append(row)
    with make_session() as session:
        request(session, "term/search", method="POST", params={"mode": "search"}, data={"term": term})
        result = {}
        for key, course_rows in courses.items():
            try:
                result[key] = schedule_sections(session, term, course_rows)
            except (requests.RequestException, ValueError, KeyError) as error:
                raise ValueError(f"{key}: {error}") from error
        return result


def main():
    parser = argparse.ArgumentParser(description="Scrape Purdue Banner section meetings")
    parser.add_argument("-sem", default="Fall 2026", help="semester name (default: Fall 2026)")
    parser.add_argument("-subjects", help="comma-separated subjects for a test scrape")
    args = parser.parse_args()
    term = next((term for term in get_terms() if term_name(term) == args.sem), None)
    if term is None:
        raise ValueError(f"Term {args.sem!r} not found in Banner")
    with make_session() as session:
        subjects = [row["code"] for row in lookup(session, "get_subject", term=term["code"])]
    if args.subjects is not None:
        selected = list(dict.fromkeys(code.strip().upper() for code in args.subjects.split(",") if code.strip()))
        if not selected or set(selected) - set(subjects):
            raise ValueError(f"Invalid subjects: {args.subjects!r}")
        subjects = selected
    courses = {}
    for subject in subjects:
        print(f"Scraping {subject}...", flush=True)
        courses.update(scrape_subject(term["code"], subject))
    # The pipeline replaces the live file with this one, so never write a partial term.
    if args.subjects is None and len(courses) < MIN_COURSES:
        raise ValueError(f"Only {len(courses)} courses scraped for {args.sem}; refusing to write output")
    output = Path(f"data/sections_{term['code']}.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(courses, separators=(",", ":"), sort_keys=True))
    print(f"Wrote {len(courses)} courses ({sum(map(len, courses.values()))} sections) to {output}")


if __name__ == "__main__":
    try:
        main()
    except (requests.RequestException, ValueError, KeyError, TypeError) as error:
        print(f"Section scrape failed: {error}", file=sys.stderr)
        sys.exit(1)
