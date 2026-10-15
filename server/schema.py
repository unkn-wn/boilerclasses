"""Validate course JSON before writing files or replacing Redis data."""
import argparse
import json
import math
import re
from types import UnionType
from typing import get_args, get_origin

COMMON = dict(title=str, subjectCode=str, description=str, credits=list[int], crn=list[int], sched=list[str])
SCHEMAS = {
    'scraped': COMMON | dict(courseCode=str, instructor=list[str], capacity=int, term=str),
    'harmonized': COMMON | dict(courseCode=int, instructor=dict[str, list[str]], terms=list[str],
                               fullTitle=str, detailId=str, gened=list[str]),
}
OPTIONAL = {
    'scraped': dict(prereqs=list[str] | None),
    'harmonized': dict(prereqs=list[str], gpa=dict[str, dict[str, list[int | float]]]),
}
TERM = r'(?:Fall|Spring|Summer) \d{4}'


def matches(value, expected):
    """Check nested Python types without coercion (including bool vs int)."""
    origin, args = get_origin(expected), get_args(expected)
    if origin is UnionType:
        return any(matches(value, option) for option in args)
    if origin is list:
        return isinstance(value, list) and all(matches(item, args[0]) for item in value)
    if origin is dict:
        return isinstance(value, dict) and all(matches(k, args[0]) and matches(v, args[1]) for k, v in value.items())
    return type(value) is expected


def validate_courses(data, *, kind, source='dataset', allow_empty=False, expected_term=None):
    if kind not in SCHEMAS:
        raise ValueError(f'Unknown dataset kind: {kind}')
    if not isinstance(data, list) or (not data and not allow_empty):
        raise ValueError(f'{source}: expected a nonempty course list')
    required, optional = SCHEMAS[kind], OPTIONAL[kind]
    seen = set()
    for index, course in enumerate(data):
        def check(condition, message):
            if not condition:
                raise ValueError(f'{source}[{index}]: {message}')
        check(isinstance(course, dict), 'expected a course object')
        check(required.keys() <= course.keys(), f'missing fields: {sorted(required.keys() - course.keys())}')
        check(course.keys() <= (required | optional).keys(), 'unexpected fields')
        for field, expected in (required | optional).items():
            if field in course:
                check(matches(course[field], expected), f'{field} has the wrong type')
        check(bool(course['title'].strip()) and bool(re.fullmatch(r'[A-Z]{1,5}', course['subjectCode'])), 'invalid course identity')
        credits = course['credits']
        check(len(credits) == 2 and 0 <= credits[0] <= credits[1], 'credits must be a nonnegative, ordered pair')
        check(bool(course['crn']) and all(crn > 0 for crn in course['crn']), 'crn must contain positive integers')
        if kind == 'scraped':
            check(bool(re.fullmatch(r'[A-Z0-9]\d{4}', course['courseCode'])), 'invalid courseCode')
            check(course['capacity'] >= 0 and bool(re.fullmatch(TERM, course['term'])), 'invalid capacity or term')
            if expected_term is None:
                expected_term = course['term']
            check(course['term'] == expected_term, f'expected term {expected_term!r}')
            names = course['instructor']
        else:
            check(course['courseCode'] >= 0 and bool(course['terms']) and all(re.fullmatch(TERM, term) for term in course['terms']), 'invalid courseCode or terms')
            check(set(course['instructor']) == set(course['terms']), 'instructor terms must match terms')
            check(all(course['instructor'].values()), 'instructor lists must not be empty')
            names = [name for values in course['instructor'].values() for name in values]
            check(not any(re.search(r'\s(?:Jr|Sr|II|III|IV|V|VI|VII|VIII|IX|X)\.?$', name, re.I) for name in names), 'instructor contains a suffix as a surname')
            title = f"{course['subjectCode']} {course['courseCode']} {course['title']}"
            check(course['fullTitle'] == title and course['detailId'] == re.sub('[^a-zA-Z0-9]', '', title), 'invalid fullTitle or detailId')
            check(course['detailId'] not in seen, 'duplicate detailId')
            seen.add(course['detailId'])
            for semesters in course.get('gpa', {}).values():
                check(all(len(row) == 14 and all(math.isfinite(x) for x in row) for row in semesters.values()), 'gpa records must contain 14 finite numbers')
        check(bool(names) and all(name.strip() for name in names), 'instructor names must not be empty')
        check(all(value.strip() for value in course['sched'] + course.get('gened', [])), 'empty schedule or gened')
        pattern = r'[A-Z]{1,5} [A-Z0-9]\d{4} (?:True|False)' if kind == 'scraped' else r'(?:[A-Z]{1,5} [A-Z0-9]\d{4}|[a-zA-Z0-9]+) (?:True|False)'
        check(all(token in ('(', ')', 'and', 'or') or re.fullmatch(pattern, token) for token in course.get('prereqs') or []), 'invalid prerequisite token')
    return data


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Validate course JSON')
    parser.add_argument('--kind', choices=SCHEMAS, required=True)
    parser.add_argument('files', nargs='+')
    args = parser.parse_args()
    for filename in args.files:
        with open(filename) as file:
            courses = json.load(file)
        validate_courses(courses, kind=args.kind, source=filename)
        print(f'{filename}: {len(courses)} valid {args.kind} courses')
