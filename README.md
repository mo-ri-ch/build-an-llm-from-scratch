# Build a Tiny LLM, one question at a time

Interactive lessons that build a small language model from scratch, starting from a list of numbers.
Every lesson ends with a question it can't answer, and the next lesson answers it.

**Website:** https://mo-ri-ch.github.io/build-an-llm-from-scratch/

## Before you start

This course is for beginners.

**You need:**
- Basic Python: variables, lists, dictionaries, `for` loops, `if`, functions and `print`
  ([official Python tutorial](https://docs.python.org/3/tutorial/) if you need a refresher)
- Python and PyTorch installed, and a way to run a file (terminal or VS Code)
- School math: adding, multiplying, fractions, and what "a 50% chance" means

**You don't need:** calculus, any AI or machine learning experience, a GPU, or to know
e^x, log or matrices. Each one is explained when it first appears.

## Lessons

| # | Lesson | Page | Code |
|---|---|---|---|
| 1 | Tensors | [lesson1.html](lessons/lesson1.html) | [lesson1.py](code/lesson1.py) |
| 2 | Text into numbers | coming soon | [lesson2.py](code/lesson2.py) |
| 3 | Counting what comes next | coming soon | [lesson3.py](code/lesson3.py) |
| 4 | Let the model learn | [lesson4.html](lessons/lesson4.html) | [lesson4.py](code/lesson4.py) |
| 5 | Looking at more than one character | coming soon | [lesson5.py](code/lesson5.py) |
| 6 | Embeddings | coming soon | |
| 7 | Attention | coming soon | |
| 8 | The Transformer block | coming soon | |
| 9 | Training on real text | coming soon | |
| 10 | Experiments and your project | coming soon | |

## Run the Python code

You need Python 3 and PyTorch:

```
pip install torch
python code/lesson4.py
```

Each file shows its expected output as comments, so you can check your results.

## How the site is built

Plain HTML, CSS and JavaScript, with no build step.

```
index.html          home page and roadmap
lessons/            one page per lesson
assets/style.css    shared look
assets/common.js    lesson list, progress, teach mode
assets/tinylm.js    the lesson models rewritten in JavaScript, so they run in the browser
code/               the real Python code for each lesson
```

The JavaScript models start from the same random numbers as PyTorch (`torch.manual_seed(42)`),
so the numbers on the page match what the Python code prints.

To preview locally, open `index.html` in a browser, or run `python -m http.server` in this folder.
