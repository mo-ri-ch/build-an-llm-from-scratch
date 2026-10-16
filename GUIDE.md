# How we build lessons (read before changing or adding a lesson)

These are the rules agreed while building Lessons 1–4. Follow all of them for every new lesson and every change.

## Teaching
- **Every word matters.** Re-read each changed page as a student before calling it done. Check facts against the real text and real numbers (run the code).
- **Never use a term before it's taught.** If a later idea must be mentioned, say it's coming ("you'll build it in Lesson 5") and teach it properly there. No half-explanations.
- **Plain, short words.** Hand examples with real numbers first, then code. Explain any maths symbol (e, log, …) the first time it appears.
- **Nobody should ever think "why am I learning this?"** Each page opens with why Neo needs it, and ends with a closing line (`<p class="hook">`) that leads to the next page. The closing line is shown just above the Next link.
- Simple code style: `char_to_number`, plain loops, no `zip`, outputs as comments.

## Lesson structure (same in every lesson)
1. **The problem:** uses only things the student already knows. Recaps the previous lesson's closing question (linked to that page) and shows something familiar that doesn't work yet. No new words, no solution.
2. Teaching pages, each with an activity, a reason at the top and a closing line.
3. **The code:** guess-first, ▶ Run (terminal), 👣 Step through, Python-word cards, Run in Colab.
4. **Check yourself:** quiz only, on what was taught (never test something not taught).
5. **Last page:** the problem the next lesson solves, Neo's line, the closing question with the "Building the LLM" path, Mark lesson as done.
- The closing question must point to exactly what the next lesson delivers. Don't give away the next lesson's solution.
- Mentions of other lessons link to the exact page (`<a class="xref" href="lesson3.html#3">`). Unbuilt lessons stay plain text.

## Look and feel
- Notebook style, light background, lots of empty space, few words, no clutter.
- Sentences use the full content width: don't break a short sentence across lines (no narrow text columns).
- Activities everywhere, each with ↺ Reset. Show the real thing (the whole table, the spinning wheel) rather than describing it.
- "Pages", not "slides". Page list on the right: all lessons, current lesson's pages indented, no scrolling.
- Previous / Next as plain text in the bottom corners, at the end of the page (not fixed to the screen); arrows cross into the next/previous lesson.
- Must look good on phones too: check at 400px width.

## Neo
- Neo is the model the student builds, a sticky note with a face. One line at the start and end of each lesson.

## Workflow
- Bump `?v=` on changed assets. Regenerate notebooks/code (`tools/make_notebooks.py`) and traces (`tools/make_traces.py`) after code changes; add a plain explanation for every new code line in `tools/explanations.py`.
- Test with Playwright (desktop and phone), then check the GitHub Pages deploy succeeded.
- Lesson 5 plan: `drafts/lesson5-plan.md` (teach shared numbers properly, starting from the pairs table).

## Progress (keep this up to date)
- Lessons 1–4: built and reviewed as a student (Oct 16). Lesson 4 reworked into one connected story.
- Home page: Neo demo (after Lesson 5 / after the course), note on why Neo is tiny, lesson path.
- Site tools: pen and sticky notes, Step through, Python-word cards, page list, cross-lesson arrows.
- **Next:** the user finishes going through Lesson 4 as a student → then learn Lesson 5 together → build its pages (plan in drafts/lesson5-plan.md).
- Later: Lessons 6–10; Lesson 9 introduces VS Code and the terminal; option of loading real GPT-2 weights in Lesson 10 (not decided).
