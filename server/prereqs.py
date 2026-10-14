import html as html_lib
import re

"""
Prerequisite parsing for Purdue catalog pages, used by scrape.py.

extract() turns the "Prerequisites:" section of a catalog entry into a token list, e.g.
  ["(", "PHYS 17200 False", "or", "ENGR 16200 False", ")", "and", "MA 26100 True"]
where each course token is "SUBJ CODE <may be taken concurrently>". harmonize.py swaps
in detailIds for courses we have pages for.
"""

def parse(text):
  # "(Undergraduate level PHYS 17200 Minimum Grade of D- or ...) and ..." -> tokens.
  # Returns None if any clause isn't a single course (test scores, standing, etc.)
  tokens = []
  for part in re.split(r"(\(|\)|\bor\b|\band\b)", text):
    part = part.strip()
    if not part:
      continue
    if part in ["(", ")", "or", "and"]:
      tokens.append(part)
      continue
    found = re.findall(r"\b([A-Z]{1,5}) ([A-Z0-9]\d{4})\b", part)
    if len(found) != 1:
      return None
    sub, code = found[0]
    tokens.append(f"{sub} {code} {'may be taken concurrently' in part}")
  return tokens

def extract(html):
  # html of the catalog entry; None if the course has no (parseable) prereqs
  match = re.search(r"Prerequisites:\s*</span>\s*<br\s*/?>(.*?)<br", html, re.DOTALL | re.IGNORECASE)
  if not match:
    return None
  text = re.sub(r"<[^>]+>", "", match.group(1)).replace("&nbsp;", " ")
  return parse(" ".join(text.split()))


def _text(fragment):
  return " ".join(html_lib.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def extract_banner(html):
  """Read Banner CAPP expressions or basic prerequisite tables.

  Keep the existing token contract; a test-score/standing clause makes the
  whole expression unrepresentable, rather than silently dropping a clause.
  """
  if not re.search(r'<section\b[^>]*aria-labelledby=["\']preReqs["\']', html, re.I):
    raise ValueError("Missing Banner prerequisite section")
  if "No prerequisite information available." in _text(html):
    return None
  table = re.search(r'<table\b[^>]*class=["\']cappPreqTable["\'][^>]*>(.*?)</table>', html, re.S | re.I)
  if table:
    blocks = re.findall(r"<pre\b[^>]*>(.*?)</pre>", table[1], re.S | re.I)
    if not blocks:
      raise ValueError("Missing Banner CAPP prerequisite expression")
    # The initial block is a heading containing the course itself.
    blocks = [block for block in blocks if not _text(block).startswith("Prerequisites:")]
    expression = " ".join(_text(block) for block in blocks)
    expression = re.sub(r"Course or Test:\s*([A-Z]{1,5})-.*?\s+([A-Z0-9]\d{4})\b",
                        r"\1 \2", expression)
    expression = expression.replace("May be taken concurrently", "may be taken concurrently")
    return parse(expression)
  table = re.search(r'<table\b[^>]*class=["\']basePreqTable["\'][^>]*>(.*?)</table>', html, re.S | re.I)
  if not table:
    raise ValueError("Unknown Banner prerequisite markup")
  body = re.search(r"<tbody\b[^>]*>(.*?)</tbody>", table[1], re.S | re.I)
  if not body:
    raise ValueError("Missing Banner prerequisite rows")
  tokens = []
  for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", body[1], re.S | re.I):
    cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row, re.S | re.I)
    if len(cells) != 9:
      raise ValueError("Unknown Banner prerequisite columns")
    conjunction, opening, test, score, subject, course, level, grade, closing = map(_text, cells)
    if test or score:
      return None
    subject = subject.split("-", 1)[0]
    concurrent = "*" in course or "may be taken concurrently" in row.lower()
    course = course.rstrip("*").strip()
    if not re.fullmatch(r"[A-Z]{1,5}", subject) or not re.fullmatch(r"[A-Z0-9]\d{4}", course):
      return None
    if conjunction:
      if conjunction.lower() not in ("and", "or") or not tokens:
        raise ValueError("Invalid Banner prerequisite conjunction")
      tokens.append(conjunction.lower())
    if opening and set(opening) != {"("}:
      raise ValueError("Invalid Banner prerequisite parentheses")
    tokens.extend(opening)
    # Banner marks courses that may be concurrent with a starred number.
    tokens.append(f"{subject} {course} {concurrent}")
    if closing and set(closing) != {")"}:
      raise ValueError("Invalid Banner prerequisite parentheses")
    tokens.extend(closing)
  return tokens or None
