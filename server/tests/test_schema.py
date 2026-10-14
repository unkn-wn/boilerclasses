import copy
import json
import runpy
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from schema import validate_courses


RAW = {
    'title': 'Computer Architecture', 'subjectCode': 'CS', 'courseCode': '25000',
    'instructor': ['George Bunch Adams III'], 'description': '', 'capacity': 0,
    'credits': [4, 4], 'term': 'Fall 2026', 'crn': [12345], 'sched': ['Lecture'],
    'prereqs': ['CS 18200 False'],
}
FINAL = {
    'title': RAW['title'], 'subjectCode': 'CS', 'courseCode': 25000,
    'instructor': {'Fall 2026': ['George Adams']}, 'description': '',
    'credits': [4, 4], 'terms': ['Fall 2026'], 'crn': [12345], 'sched': ['Lecture'],
    'fullTitle': 'CS 25000 Computer Architecture', 'detailId': 'CS25000ComputerArchitecture',
    'gened': [], 'prereqs': ['CS18200DiscreteMathematics False'],
}


class SchemaTests(unittest.TestCase):
    def test_valid_legacy_and_new_records(self):
        for row in [RAW, {k:v for k,v in RAW.items() if k != 'prereqs'}, {**RAW, 'prereqs': None}]:
            validate_courses([row], kind='scraped')
        validate_courses([FINAL], kind='harmonized')
        validate_courses([], kind='scraped', allow_empty=True)

    def test_missing_wrong_and_extra_fields_fail(self):
        invalid = [
            {k:v for k,v in RAW.items() if k != 'description'},
            {**RAW, 'credits': [4]}, {**RAW, 'credits': [True, 4]},
            {**RAW, 'credits': [4, 3]}, {**RAW, 'crn': ['12345']},
            {**RAW, 'instructor': 'George Adams'}, {**RAW, 'unexpected': 1},
            {**RAW, 'prereqs': ['CS 18200 maybe']},
        ]
        for row in invalid:
            with self.subTest(row=row), self.assertRaises(ValueError):
                validate_courses([row], kind='scraped')

    def test_term_mismatch_and_empty_dataset_fail(self):
        with self.assertRaisesRegex(ValueError, 'expected term'):
            validate_courses([RAW], kind='scraped', expected_term='Spring 2027')
        with self.assertRaises(ValueError):
            validate_courses([], kind='harmonized')

    def test_final_names_identity_and_gpa_fail(self):
        invalid = [
            {**FINAL, 'instructor': {'Fall 2026': ['George III']}},
            {**FINAL, 'instructor': {'Spring 2026': ['George Adams']}},
            {**FINAL, 'detailId': 'wrong'}, {**FINAL, 'prereqs': None},
            {**FINAL, 'gpa': {'George Adams': {'Fall 2026': [0] * 13}}},
            {**FINAL, 'gpa': {'George Adams': {'Fall 2026': [float('nan')] * 14}}},
        ]
        for row in invalid:
            with self.subTest(row=row), self.assertRaises(ValueError):
                validate_courses([row], kind='harmonized')
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            validate_courses([FINAL, FINAL], kind='harmonized')

    def test_validation_does_not_modify_data(self):
        data = [copy.deepcopy(RAW)]
        original = copy.deepcopy(data)
        validate_courses(data, kind='scraped')
        self.assertEqual(data, original)

    def test_invalid_push_input_never_connects_to_redis(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'invalid.json'
            path.write_text(json.dumps([{**FINAL, 'credits': '4'}]))
            with patch('sys.argv', ['push.py', '-data', str(path)]), patch('redis.Redis') as redis_client:
                with self.assertRaisesRegex(ValueError, 'credits'):
                    runpy.run_path(str(Path(__file__).resolve().parents[1] / 'push.py'), run_name='__main__')
                redis_client.assert_not_called()


if __name__ == '__main__':
    unittest.main()
