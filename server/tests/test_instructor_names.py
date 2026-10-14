import ast
import re
import unittest
from pathlib import Path

# harmonize.py runs the pipeline at module scope. Load only the formatter so
# this regression test does not regenerate datasets when importing it.
source = Path(__file__).resolve().parents[1] / "harmonize.py"
tree = ast.parse(source.read_text())
function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "first_last")
namespace = {"re": re}
exec(compile(ast.Module(body=[function], type_ignores=[]), str(source), "exec"), namespace)
first_last = namespace["first_last"]


class InstructorNameTests(unittest.TestCase):
    def test_suffixes_keep_surname(self):
        for name, expected in [
            ("George Bunch Adams III", "George Adams"),
            ("Robert Bruce Alstrom Ii", "Robert Alstrom"),
            ("John Smith, Jr.", "John Smith"),
            ("John Smith Sr", "John Smith"),
            ("George Bunch Adams", "George Adams"),
            ("Gustavo Rodriguez-Rivera", "Gustavo Rodriguez-Rivera"),
            ("TBA", "TBA"),
        ]:
            with self.subTest(name=name):
                self.assertEqual(first_last(name), expected)
