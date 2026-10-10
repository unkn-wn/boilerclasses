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
