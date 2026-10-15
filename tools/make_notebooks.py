"""Build a Google Colab notebook (and the matching .py file) for each lesson
from the code on its "The code" slide, so the page, the notebook and the file always match.

Run from the repo root:  python tools/make_notebooks.py
Writes notebooks/lessonN.ipynb (one cell per commented block) and code/lessonN.py.
"""
import glob
import html
import json
import re
import sys

sys.path.insert(0, "tools")
from outputs import mark_outputs

for path in sorted(glob.glob("lessons/lesson*.html")):
    n = int(re.search(r"lesson(\d+)", path).group(1))
    page = open(path, encoding="utf-8").read()
    if 'data-title="The code"' not in page:
        continue
    title = re.search(r"<h1>(.*?)</h1>", page).group(1)
    start = page.index('data-title="The code"')
    block = re.search(r"<pre[^>]*><code>(.*?)</code></pre>", page[start:], re.S).group(1)
    block = re.sub(r'<span class="c hide">.*?</span>', "", block)   # drop the "# ?" placeholders
    block = re.sub(r'<span class="pout">.*?</span>', "", block, flags=re.S)   # outputs shown on the page
    code = html.unescape(re.sub(r"<[^>]+>", "", block)).strip("\n")
    code = "\n".join(line for line in code.split("\n") if not line.strip().startswith("→"))   # outputs shown on the page

    cells = [{
        "cell_type": "markdown", "metadata": {},
        "source": [
            f"# Lesson {n}: {title}\n", "\n",
            "For each cell: **guess what it will print first**, then press ▶ and check.\n", "\n",
            f"From [Build a Tiny LLM](https://mo-ri-ch.github.io/build-an-llm-from-scratch/lessons/lesson{n}.html).",
        ],
    }]
    for part in re.split(r"\n\n(?=#)", code):
        lines = part.strip("\n").split("\n")
        marks = mark_outputs(lines)
        lines = [line for line, is_answer in zip(lines, marks) if not is_answer]   # no answers in Colab
        while lines and not lines[-1].strip():
            lines.pop()
        if any("print(" in line for line in lines):
            cells.append({"cell_type": "markdown", "metadata": {}, "source": ["🤔 *Guess what this prints, then press ▶.*"]})
        cells.append({
            "cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
            "source": [line + "\n" for line in lines[:-1]] + [lines[-1]],
        })

    notebook = {
        "cells": cells,
        "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
                     "language_info": {"name": "python"}},
        "nbformat": 4, "nbformat_minor": 5,
    }
    with open(f"notebooks/lesson{n}.ipynb", "w", encoding="utf-8") as f:
        json.dump(notebook, f, indent=1, ensure_ascii=False)
    with open(f"code/lesson{n}.py", "w", encoding="utf-8") as f:
        f.write(code + "\n")
    print(f"notebooks/lesson{n}.ipynb: {len(cells) - 1} code cells")
