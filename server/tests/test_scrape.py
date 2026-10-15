import sys
import socket
import threading
import unittest
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from unittest.mock import Mock, patch
import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import prereqs
import scrape


def section(crn, schedule="Lecture", faculty=None):
    return {
        "subject": "CS", "courseNumber": "18000", "courseTitle": "Problem Solving &amp; Programming",
        "term": "202720", "courseReferenceNumber": str(crn), "campusDescription": "West Lafayette",
        "scheduleTypeDescription": schedule, "faculty": faculty or [],
    }


def response(value):
    result = Mock()
    result.json.return_value = value
    return result


@contextmanager
def dropping_server(failures):
    class Handler(BaseHTTPRequestHandler):
        attempts = 0

        def do_POST(self):
            self.rfile.read(int(self.headers.get('Content-Length', 0)))
            type(self).attempts += 1
            if self.attempts <= failures:
                self.connection.shutdown(socket.SHUT_RDWR)
                self.connection.close()
                return
            self.send_response(200)
            self.send_header('Content-Length', '2')
            self.end_headers()
            self.wfile.write(b'{}')

        do_GET = do_POST

        def log_message(self, *args):
            pass

    server = HTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}/', Handler
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


class ScrapeTests(unittest.TestCase):
    def test_dropped_connections_retry_get_and_search_post(self):
        for method in ('GET', 'POST'):
            with self.subTest(method=method), dropping_server(1) as (url, handler), scrape.make_session() as session:
                adapter = session.get_adapter('https://')
                adapter.max_retries.backoff_factor = 0
                session.mount('http://', adapter)
                with patch.object(scrape, 'BASE_URL', url):
                    self.assertEqual(scrape.request(session, 'term/search', method=method, data={'term': '202720'}).json(), {})
                self.assertEqual(handler.attempts, 2)

    def test_persistent_disconnect_stops_after_retry_budget(self):
        with dropping_server(10) as (url, handler), scrape.make_session() as session:
            adapter = session.get_adapter('https://')
            adapter.max_retries.backoff_factor = 0
            session.mount('http://', adapter)
            with patch.object(scrape, 'BASE_URL', url), self.assertRaisesRegex(requests.RequestException, 'term/search'):
                scrape.request(session, 'term/search', method='POST', data={'term': '202720'})
            self.assertEqual(handler.attempts, 4)

    def test_real_cce_description_uses_catalog_credits(self):
        fixtures = Path(__file__).parent / 'fixtures'
        fragment = (fixtures / 'banner_cce320_description.html').read_text()
        catalog = (fixtures / 'banner_cce320_catalog.html').read_text()
        self.assertEqual(scrape.course_description(fragment, catalog), ('1.0 | LAB 3 1.0 | 1.0 | DIS 0 1.0 |', [1, 1]))
        with self.assertRaises(ValueError):
            scrape.course_description('<html>Page not found</html>', catalog)
        with self.assertRaisesRegex(ValueError, 'Missing catalog credit'):
            scrape.course_description(fragment, '<html>Page not found</html>')

    def test_lookup_uses_page_numbers(self):
        with patch.object(scrape, "request", side_effect=[response([{"code": "CS"}]), response([{"code": "MA"}]), response([])]) as request:
            self.assertEqual([x["code"] for x in scrape.lookup(Mock(), "get_subject", term="202720")], ["CS", "MA"])
            self.assertEqual([call.kwargs["params"]["offset"] for call in request.call_args_list], [1, 2, 3])

    def test_sections_use_row_offsets_and_reject_repeated_pages(self):
        pages = [response({"fwdURL": "/search"}), response({"success": True, "pathMode": "search", "totalCount": 2, "data": [section(1)]}), response({"success": True, "pathMode": "search", "totalCount": 2, "data": [section(2)]})]
        with patch.object(scrape, "request", side_effect=pages) as request:
            self.assertEqual(len(scrape.get_sections(Mock(), "202720", "CS")), 2)
            self.assertEqual([call.kwargs["params"]["pageOffset"] for call in request.call_args_list[1:]], [0, 1])
        pages[-1] = pages[-2]
        with patch.object(scrape, "request", side_effect=pages):
            with self.assertRaisesRegex(ValueError, "repeated section"):
                scrape.get_sections(Mock(), "202720", "CS")

    def test_wrong_subject_and_truncated_search_fail(self):
        for rows in ([{**section(1), "subject": "MA"}], []):
            with patch.object(scrape, "request", side_effect=[response({"fwdURL": "/search"}), response({"success": True, "pathMode": "search", "totalCount": 1, "data": rows})]):
                with self.assertRaises(ValueError):
                    scrape.get_sections(Mock(), "202720", "CS")

    def test_aggregation_preserves_grouping_and_instructor_selection(self):
        rows = [section(1, "Laboratory", [{"displayName": "Lab Instructor"}]), section(2, faculty=[{"displayName": "Professor"}]), section(3)]
        course = scrape.aggregate_sections(rows, "Spring 2027")[0]
        self.assertEqual(course["crn"], [1, 2, 3])
        self.assertEqual(course["sched"], ["Laboratory", "Lecture"])
        self.assertEqual(course["instructor"], ["Professor"])
        self.assertEqual(course["capacity"], 0)
        self.assertEqual(course["title"], "Problem Solving & Programming")
        rows.append({**section(4), "courseTitle": "Different Topic"})
        self.assertEqual(len(scrape.aggregate_sections(rows, "Spring 2027")), 2)

    def test_catalog_credits_and_description(self):
        fragment = '<section><!-- comment -->Credit Hours: 1.00 to 3.00. Text &amp; more.<br/><b>Section information text:</b>Ignore me</section>'
        self.assertEqual(scrape.course_description(fragment), ("Text & more.", [1, 3]))
        self.assertEqual(scrape.course_description("Credit Hours: 0.00."), ("", [0, 0]))
        self.assertEqual(scrape.course_description("Description: Credit Hours: 1.00. Reflective practice."), ("Reflective practice.", [1, 1]))
        self.assertEqual(scrape.course_description("Credit Hours: 2.00 or 3.00 (West Lafayette) 3.00 (Calumet, North Central). Accounting."), ("Accounting.", [2, 3]))
        self.assertEqual(scrape.course_description("Credit Hours: 1.00 or 2.00 or 3.00. Variable credit."), ("Variable credit.", [1, 3]))
        with self.assertRaises(ValueError):
            scrape.course_description("<html>Page not found</html>")

    def test_empty_term_discovery_fails(self):
        with patch.object(scrape, "lookup", return_value=[]):
            with self.assertRaisesRegex(ValueError, "no terms"):
                scrape.get_terms()


class PrerequisiteTests(unittest.TestCase):
    def test_live_capp_fixture(self):
        fragment = (Path(__file__).parent / "fixtures/banner_cs182_prereqs.html").read_text()
        tokens = prereqs.extract_banner(fragment)
        self.assertEqual(tokens[:9], ["(", "CS 17600 False", ")", "or", "(", "CS 18000 False", ")", "and", "("])
        self.assertIn("MATH 16500 False", tokens)
        self.assertEqual(tokens.count("("), tokens.count(")"))

    def test_basic_course_and_test_clauses(self):
        def table(test="", course="16100*", closing=")"):
            return '<section aria-labelledby="preReqs"><table class="basePreqTable"><tbody><tr>' + ''.join(f'<td>{value}</td>' for value in ["", "(", test, "", "MA-Mathematics", course, "Undergraduate", "C", closing]) + '</tr></tbody></table></section>'
        self.assertEqual(prereqs.extract_banner(table()), ["(", "MA 16100 True", ")"])
        self.assertIsNone(prereqs.extract_banner(table(test="ALEKS Math Assessment")))

    def test_capp_concurrent_and_unsupported_clauses(self):
        def table(text):
            return '<section aria-labelledby="preReqs"><table class="cappPreqTable"><pre>Prerequisites:CS 20000 Requisites</pre><pre>' + text + '</pre></table></section>'
        self.assertEqual(prereqs.extract_banner(table("Course or Test: CS-Computer Sciences 18000 Minimum Grade of C May be taken concurrently.")), ["CS 18000 True"])
        self.assertIsNone(prereqs.extract_banner(table("Course or Test: CS-Computer Sciences 18000 or Student must have Junior standing")))
        with self.assertRaises(ValueError):
            prereqs.extract_banner("<html>Page not found</html>")


if __name__ == "__main__":
    unittest.main()
