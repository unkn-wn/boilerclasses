import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import scrape_sections


def section(crn, schedule="Lecture", link=None, meetings=(), faculty=()):
    return {
        "subject": "CS", "courseNumber": "18000", "courseTitle": "Problem Solving &amp; Programming",
        "courseReferenceNumber": str(crn), "scheduleTypeDescription": schedule, "linkIdentifier": link,
        "meetingsFaculty": [{"meetingTime": time} for time in meetings], "faculty": list(faculty),
    }


class ScrapeSectionsTest(unittest.TestCase):
    def test_detail_id_matches_harmonize(self):
        self.assertEqual(scrape_sections.detail_id(section(1)), "CS18000ProblemSolvingProgramming")

    def test_format_meetings_and_group_linked_sections(self):
        time = {"beginTime": "1630", "endTime": "1720", "startDate": "08/24/2026", "endDate": "12/12/2026",
                "building": "LILY", "room": "1105", **{day: day in ("monday", "friday") for day, _ in scrape_sections.DAYS}}
        rows = [section(1, link="A1", meetings=[time], faculty=[{"displayName": "Professor"}]),
                section(2, "Laboratory", "A2", [{**time, "beginTime": None, "endTime": None, "building": None}]),
                section(3, "Laboratory", "A2"),
                section(4)]
        response = Mock()
        response.json.return_value = {"linkedData": [[{"courseReferenceNumber": "2"}], [{"courseReferenceNumber": "99"}]]}
        with patch.object(scrape_sections, "request", return_value=response) as request:
            sections = scrape_sections.schedule_sections(Mock(), "202710", rows)
        self.assertEqual(request.call_count, 1)  # A2 was covered by A1's lookup
        self.assertEqual([s["classId"] for s in sections], ["1", "1", "1", "4"])
        self.assertEqual(sections[0]["meetings"], [{"days": ["Mon", "Fri"], "start": "16:30", "end": "17:20",
                                                    "startDate": "2026-08-24", "endDate": "2026-12-12", "room": "LILY 1105"}])
        self.assertEqual(sections[0]["instructors"], ["Professor"])
        self.assertEqual((sections[1]["meetings"][0]["start"], sections[1]["meetings"][0]["room"]), (None, "TBA"))


if __name__ == "__main__":
    unittest.main()
