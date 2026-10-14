"""Scrape public Banner sections into the existing BoilerClasses course schema."""

import argparse
import html
import json
import re
import sys
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

import prereqs
from schema import validate_courses

BASE_URL = "https://apps.mypurdue.purdue.edu/StudentRegistrationSsb/ssb/"
PAGE_SIZE = 100
MIN_COURSES = 3500
SPECIAL_SCHEDULES = {"Laboratory", "Laboratory Preparation", "Recitation", "Practice Study Observation"}


def make_session():
    session = requests.Session()
    session.headers["User-Agent"] = "boilerclasses-scraper (+https://www.boilerclasses.com)"
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def request(session, endpoint, **kwargs):
    response = session.request(kwargs.pop("method", "GET"), BASE_URL + endpoint, timeout=30, **kwargs)
    response.raise_for_status()
    if not response.url.startswith(BASE_URL):
        raise ValueError(f"Banner redirected {endpoint} to {response.url}")
    return response


def lookup(session, endpoint, **params):
    """Lookup offsets are one-based page numbers, unlike section search."""
    rows = []
    offset = 1
    while True:
        page = request(session, "classSearch/" + endpoint,
                       params={**params, "searchTerm": "", "offset": offset, "max": PAGE_SIZE}).json()
        if not isinstance(page, list):
            raise ValueError(f"Invalid {endpoint} response")
        if not page:
            return rows
        known = {row["code"] for row in rows}
        if any(row["code"] in known for row in page):
            raise ValueError(f"Repeated {endpoint} page at offset {offset}")
        rows.extend(page)
        offset += 1


def term_name(term):
    return re.sub(r"\s*\(View Only\)\s*$", "", term["description"], flags=re.I).strip()


def get_terms():
    with make_session() as session:
        terms = lookup(session, "getTerms")
    if not terms:
        raise ValueError("Banner returned no terms")
    return sorted(terms, key=lambda term: term["code"], reverse=True)


def get_sections(session, term, subject):
    # Banner caches the first search. Use a fresh session per subject and keep
    # that session for its pages and details.
    result = request(session, "term/search", method="POST", params={"mode": "search"},
                     data={"term": term}).json()
    if "fwdURL" not in result:
        raise ValueError("Banner did not initialize class search")
    rows, seen = [], set()
    expected = None
    while True:
        page = request(session, "searchResults/searchResults", params={
            "txt_subject": subject, "txt_term": term, "txt_campus": "PWL",
            "pageOffset": len(rows), "pageMaxSize": PAGE_SIZE,
            "sortColumn": "subjectDescription", "sortDirection": "asc",
        }).json()
        if page.get("success") is not True or page.get("pathMode") != "search":
            raise ValueError(f"Invalid section search for {subject}")
        total = int(page["totalCount"])
        if expected is not None and total != expected:
            raise ValueError(f"Section count changed while paging {subject}; retry the scrape")
        expected = total
        sections = page.get("data") or []
        for section in sections:
            crn = section["courseReferenceNumber"]
            if section["subject"] != subject or section["term"] != term or crn in seen:
                raise ValueError(f"Unexpected or repeated section in {subject}: {crn}")
            if section["campusDescription"] != "West Lafayette":
                raise ValueError(f"Unexpected campus in {subject}: {section['campusDescription']}")
            seen.add(crn)
        rows.extend(sections)
        if len(rows) == total:
            return rows
        if not sections or len(rows) > total:
            raise ValueError(f"Incomplete pagination for {subject}: {len(rows)}/{total}")


def text_content(fragment):
    fragment = re.sub(r"<!--.*?-->", "", fragment, flags=re.S)
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def course_description(fragment):
    # Retain catalog text rather than section-specific information.
    fragment = re.split(r"<b>\s*Section information text:\s*</b>", fragment, flags=re.I)[0]
    text = text_content(fragment)
    text = re.sub(r"^Description:\s*", "", text, flags=re.I)
    match = re.match(r"Credit Hours:\s*(.*?)\.(?:\s+|$)(.*)", text, re.I)
    if not match:
        raise ValueError(f"Missing or invalid catalog description: {text[:160]}")
    # Preserve integer catalog credit ranges; labs may have zero section hours.
    credit_range = re.match(r"\d+(?:\.\d+)?(?:\s+(?:to|or)\s+\d+(?:\.\d+)?)*", match[1], re.I)
    if not credit_range:
        raise ValueError(f"Invalid catalog credits: {match[1]}")
    hours = [int(float(value)) for value in re.findall(r"\d+(?:\.\d+)?", credit_range[0])]
    return match[2].strip(), [min(hours), max(hours)]


def format_instructors(by_sched):
    if any(schedule not in SPECIAL_SCHEDULES for schedule in by_sched):
        by_sched = {schedule: names for schedule, names in by_sched.items() if schedule not in SPECIAL_SCHEDULES}
    names = {name for instructors in by_sched.values() for name in instructors}
    if len(names) > 1:
        names.discard("TBA")
    return sorted(names)


def aggregate_sections(sections, name):
    courses = {}
    for section in sections:
        key = (section["subject"], section["courseNumber"], html.unescape(section["courseTitle"]).strip())
        if key not in courses:
            courses[key] = {
                "title": key[2], "subjectCode": key[0], "courseCode": key[1],
                "instructor": {}, "description": None, "capacity": 0,
                "credits": None, "term": name, "crn": [], "sched": [],
            }
        course = courses[key]
        schedule = section["scheduleTypeDescription"]
        faculty = section.get("faculty") or []
        names = [person["displayName"].strip() for person in faculty if person.get("displayName")]
        course["instructor"].setdefault(schedule, []).extend(names or ["TBA"])
        course["crn"].append(int(section["courseReferenceNumber"]))
        course["sched"].append(schedule)
    for course in courses.values():
        course["instructor"] = format_instructors(course["instructor"])
        course["sched"] = sorted(set(course["sched"]))
    return list(courses.values())


def scrape_subject(term, name, subject):
    with make_session() as session:
        courses = aggregate_sections(get_sections(session, term, subject), name)
        # Cache catalog details across different titles for the same course.
        details = {}
        for course in courses:
            key = (course["subjectCode"], course["courseCode"])
            if key not in details:
                params = {"term": term, "courseReferenceNumber": course["crn"][0]}
                description, credits = course_description(request(
                    session, "searchResults/getCourseDescription", params=params).text)
                requirements = prereqs.extract_banner(request(
                    session, "searchResults/getSectionPrerequisites", params=params).text)
                details[key] = description, credits, requirements
            course["description"], course["credits"], course["prereqs"] = details[key]
        validate_courses(courses, kind="scraped", source=f"Banner {subject}", allow_empty=True, expected_term=name)
        return courses


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=4) + "\n")
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description="Scrape Purdue Banner courses")
    parser.add_argument("-sem", default="Fall 2026", help="semester name (default: Fall 2026)")
    parser.add_argument("--latest", type=int, help="print the newest N Fall/Spring terms as JSON and exit")
    parser.add_argument("--fresh", action="store_true", help="ignore existing per-subject checkpoints")
    parser.add_argument("-subjects", help="comma-separated subjects for a test scrape (no production output)")
    args = parser.parse_args()
    terms = get_terms()
    if args.latest is not None:
        if args.latest < 1:
            parser.error("--latest must be positive")
        names = [term_name(term) for term in terms if re.fullmatch(r"(?:Fall|Spring) \d{4}", term_name(term))]
        if len(names) < args.latest:
            raise ValueError(f"Requested {args.latest} Fall/Spring terms, found {len(names)}")
        print(json.dumps(names[:args.latest]))
        return
    term = next((term for term in terms if term_name(term) == args.sem), None)
    if term is None:
        raise ValueError(f"Term {args.sem!r} not found in Banner")
    with make_session() as session:
        subjects = [row["code"] for row in lookup(session, "get_subject", term=term["code"])]
    if not subjects:
        raise ValueError(f"No subjects found for {args.sem}")
    if args.subjects is not None:
        selected = list(dict.fromkeys(code.strip().upper() for code in args.subjects.split(",") if code.strip()))
        if not selected or set(selected) - set(subjects):
            raise ValueError(f"Invalid subjects: {args.subjects!r}")
        subjects = selected
    slug = args.sem.replace(" ", "").lower()
    # Version checkpoints to avoid reusing old scraper data; isolate test runs.
    mode = "test" if args.subjects is not None else "full"
    directory = Path(f"data/temp_banner_{mode}_{slug}")
    courses = []
    for subject in subjects:
        checkpoint = directory / f"{subject}.json"
        if checkpoint.exists() and not args.fresh:
            print(f"Loading existing data for {subject}...", flush=True)
            data = json.loads(checkpoint.read_text())
            validate_courses(data, kind="scraped", source=str(checkpoint), allow_empty=True, expected_term=args.sem)
        else:
            print(f"Scraping {subject}...", flush=True)
            data = scrape_subject(term["code"], args.sem, subject)
            write_json(checkpoint, data)
        courses.extend(data)
        print(f"{subject}: {len(data)} courses", flush=True)
    if args.subjects is not None:
        if not courses:
            raise ValueError("Test scrape returned no courses")
        output = Path(f"test_classes_{slug}.json")
    else:
        if len(courses) < MIN_COURSES:
            raise ValueError(f"Only {len(courses)} courses scraped for {args.sem}; refusing to write output")
        output = Path(f"data/classes_{slug}.json")
    validate_courses(courses, kind="scraped", source=str(output), expected_term=args.sem)
    write_json(output, courses)
    print(f"Wrote {len(courses)} courses to {output}")


if __name__ == "__main__":
    try:
        main()
    except (requests.RequestException, ValueError, KeyError, TypeError) as error:
        print(f"Scrape failed: {error}", file=sys.stderr)
        sys.exit(1)
