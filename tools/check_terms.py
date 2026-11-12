"""Teach before you use: flag any new word that appears on a page before the page that teaches it.

Each lesson lists its new words and the page title where each is taught. Everything on a page counts,
hidden 🤔 notes, hovers and activity text included, because a reader can open them all.
Run: python3 tools/check_terms.py
"""
import glob, html, re

TAUGHT = {   # lesson -> {word (lowercase, as it appears): title of the page that teaches it}
    6: {"embedding": "A letter as numbers", "weight": "Numbers to a guess"},
    7: {"dot product": "✏️ Quick basics: the dot product", "seat": "Letters in a row",
        "position number": "Letters in a row", "question": "A question and labels", "label": "A question and labels",
        "query": "A question and labels", "key weight": "A question and labels", "match": "Matches",
        "attention": "Who to listen to", "share": "Who to listen to", "value": "Mix", "mix": "Mix",
        "output weight": "Mix"},
}

def pages(path):
    s = open(path).read()
    for m in re.finditer(r'<section class="part"[^>]*data-title="([^"]+)"[^>]*>(.*?)</section>', s, re.S):
        title, body = m.group(1), m.group(2)
        body = re.sub(r'<pre>.*?</pre>', ' ', body, flags=re.S)            # code is checked by its own hovers
        attrs = " ".join(re.findall(r'(?:data-peek|data-why|data-right|aria-label)="([^"]*)"', body))
        text = html.unescape(re.sub(r'<[^>]+>', ' ', body) + " " + attrs).lower()
        yield title, text

bad = 0
for n, words in TAUGHT.items():
    path = f"lessons/lesson{n}.html"
    seen = []
    for title, text in pages(path):
        for word, where in words.items():
            if where not in seen and title != where and re.search(r'\b' + re.escape(word), text):
                print(f"lesson{n}  “{title}” uses “{word}”, taught later on “{where}”")
                bad += 1
        seen.append(title)
print("every word is taught before it is used" if not bad else f"{bad} word(s) used before they are taught")
