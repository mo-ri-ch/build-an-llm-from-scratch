"""Check every lesson page against the writing rules before publishing.

Counts the words outside the activity (hidden 🤔 notes and activities don't count) and flags pages over the limit.
Run: python3 tools/check_pages.py
"""
import re, glob, sys

LIMIT = 120        # words outside the activity (tables don't count: they're data)
RULE_LIMIT = 150   # allowed for a page that introduces a new rule, if it keeps one worked example

def outside_text(body):
    b = re.sub(r'<div hidden[^>]*>.*?</div>\s*(?=<)', '', body, flags=re.S)   # 🤔 notes and peeks
    out, k = '', 0
    while True:   # drop each activity box, nested divs included
        js = [x for x in (b.find('<div class="activity"', k), b.find('<div class="cl"', k)) if x >= 0]
        j = min(js) if js else -1
        if j < 0:
            return out + b[k:]
        out += b[k:j]
        depth = 0
        for m in re.finditer(r'<(/?)div\b', b[j:]):
            depth += -1 if m.group(1) else 1
            if depth == 0:
                end = j + m.end()
                break
        k = b.find('>', end) + 1

over = 0
for path in sorted(glob.glob('lessons/lesson*.html')):
    s = open(path).read()
    for title, body in re.findall(r'<section class="part" data-title="([^"]+)">(.*?)</section>', s, re.S):
        if title in ('The code', 'Lesson test'):
            continue
        text = re.sub(r'<h2>.*?</h2>|<p class="step-label">.*?</p>|<table.*?</table>', ' ', outside_text(body), flags=re.S)   # headings and tables aren't reading
        words = [w for w in re.sub(r'<[^>]+>', ' ', text).split() if re.search(r'[A-Za-z0-9]', w)]   # symbols like → = − aren't words
        numbers = sum(1 for w in words if re.search(r'\d', w))
        if len(words) > RULE_LIMIT:
            over += 1
            print(f'OVER   {path}  "{title}": {len(words)} words ({numbers} are numbers)')
        elif len(words) > LIMIT:
            print(f'check  {path}  "{title}": {len(words)} words: fine only if it introduces a new rule')
# every lesson needs practice pages: problems that apply the ideas (not recall), after each group of 2-3 idea pages
for path in sorted(glob.glob('lessons/lesson*.html')):
    s = open(path).read()
    if '✏️ Practice' not in s:
        print(f'NOTE   {path}: no "✏️ Practice" page yet')

print('no page over the limit' if not over else f'{over} page(s) over {RULE_LIMIT} words')
sys.exit(0)
