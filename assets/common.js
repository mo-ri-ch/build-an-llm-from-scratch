// common.js — shared parts of every page:
// the lesson list, progress, one-part-per-screen lessons, quizzes, teach mode.

const LESSONS = [
  { n: 1, step: "numbers", title: "Tensors", file: "lesson1.html", ready: true,
    summary: "A box that holds numbers and does math on all of them at once.",
    leaves: "An LLM reads text, but tensors hold only numbers. How do we turn text into numbers?" },
  { n: 2, step: "text to numbers", title: "Text into numbers", file: "lesson2.html", ready: true,
    summary: "Give every character a number. Turn text into numbers and back.",
    leaves: "An LLM's whole job is guessing the next character. Now that text is numbers, how do we make our first guess?" },
  { n: 3, step: "first guess", title: "Counting what comes next", file: "lesson3.html", ready: true,
    summary: "Count which character follows which, then generate text.",
    leaves: "Looking further back needs shared boxes, and shared boxes can't be counted. How can Neo find numbers without counting?" },
  { n: 4, step: "learning", title: "Let the model learn", file: "lesson4.html", ready: true,
    summary: "Start random. Predict, measure, find directions, move. Repeat.",
    leaves: "Neo can learn now, but it still sees only 1 letter. How can it look further back without the table exploding?" },
  { n: 5, step: "more letters", title: "Looking further back", file: "lesson5.html", ready: false,
    summary: "Three small tables vote on the next character.",
    leaves: "Votes can't understand combinations. Can a character carry meaning?" },
  { n: 6, step: "meaning", title: "Embeddings", file: "lesson6.html", ready: false,
    summary: "Give each character a list of numbers that describes it.",
    leaves: "Characters still ignore each other. How can they look at each other?" },
  { n: 7, step: "attention", title: "Attention", file: "lesson7.html", ready: false,
    summary: "Each character decides which earlier characters matter.",
    leaves: "How do the pieces fit together into a real model?" },
  { n: 8, step: "transformer", title: "The Transformer block", file: "lesson8.html", ready: false,
    summary: "The building block of GPT.",
    leaves: "Our model is ready, but our text is tiny. What about real text?" },
  { n: 9, step: "real text", title: "Training on real text", file: "lesson9.html", ready: false,
    summary: "Train on a real book and generate new text.",
    leaves: "How do size, data and training time change the model?" },
  { n: 10, step: "your LLM", title: "Experiments and your project", file: "lesson10.html", ready: false,
    summary: "Change the model, measure it, and make it your portfolio project.",
    leaves: null },
];

// ---------- "Building the LLM" path in each lesson's closing question ----------
// One row of steps: done ones get a ✓, the next one is highlighted.
function setupLlmPath() {
  const box = document.querySelector(".open-question");
  if (!box) return;
  const file = location.pathname.split("/").pop();
  const lesson = LESSONS.find(l => l.file === file);
  if (!lesson) return;
  const row = document.createElement("div");
  row.className = "llm-path";
  row.setAttribute("aria-label", `Building the LLM: step ${lesson.n} of ${LESSONS.length} done`);
  let html = '<span class="llm-path-label">Building the LLM:</span>';
  LESSONS.forEach((l, i) => {
    const state = l.n <= lesson.n ? "done" : l.n === lesson.n + 1 ? "next" : "later";
    html += (i ? '<span class="llm-arrow" aria-hidden="true">→</span>' : "") +
      `<span class="llm-step ${state}">${state === "done" ? "✓ " : ""}${l.step}</span>`;
  });
  row.innerHTML = html;
  box.appendChild(row);
}

// ---------- Progress (saved in this browser only) ----------
const PROGRESS_KEY = "tiny-llm-progress";

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) { /* storage blocked */ }
}
function isDone(n) { return !!loadProgress()[n]; }
function setDone(n, value) { const p = loadProgress(); p[n] = value; saveProgress(p); }

// ---------- One part per screen ----------
// A lesson page with <main data-paged> shows one <section class="part"> at a time.
let pagedGo = null;

function setupPagedLesson() {
  const main = document.querySelector("main[data-paged]");
  if (!main) return;
  const parts = Array.from(main.querySelectorAll("section.part"));
  const bar = document.querySelector(".progress");
  const back = document.querySelector("[data-page-back]");
  const next = document.querySelector("[data-page-next]");
  const label = document.querySelector("[data-page-label]");

  // Previous / Next sit right below the slide, as quiet text
  const pagebar = document.querySelector(".pagebar");
  if (pagebar) (document.querySelector(".wrap") || main).appendChild(pagebar);

  // Progress bar: one segment per part, each one clickable
  if (bar) {
    parts.forEach((p, i) => {
      const seg = document.createElement("button");
      seg.className = "seg";
      seg.setAttribute("aria-label", `Go to part ${i + 1}: ${p.dataset.title || ""}`);
      seg.addEventListener("click", () => go(i));
      bar.appendChild(seg);
    });
  }

  const thumbs = buildThumbnails(parts, (i) => go(i));
  const seen = new Set();

  let current = 0;
  function go(i) {
    current = Math.max(0, Math.min(parts.length - 1, i));
    seen.add(current);
    parts.forEach((p, k) => { p.hidden = k !== current; });
    if (bar) Array.from(bar.children).forEach((s, k) => {
      s.classList.toggle("now", k === current);
      s.classList.toggle("seen", seen.has(k) && k !== current);
    });
    thumbs.forEach((t, k) => {
      t.classList.toggle("now", k === current);
      t.classList.toggle("seen", seen.has(k) && k !== current);
      if (k === current) t.setAttribute("aria-current", "step"); else t.removeAttribute("aria-current");
    });
    if (thumbs[current]) thumbs[current].scrollIntoView({ block: "nearest" });
    if (back) back.disabled = current === 0;
    if (next) {
      next.hidden = current === parts.length - 1;
    }
    if (label) label.textContent = `${current + 1} / ${parts.length}  ${parts[current].dataset.title || ""}`;
    try { history.replaceState(null, "", `#${current + 1}`); } catch (e) { /* file:// */ }
    window.scrollTo(0, 0);
    const area = document.querySelector(".wrap");
    if (area) area.scrollTop = 0;
  }
  pagedGo = (delta) => go(current + delta);

  if (back) back.addEventListener("click", () => go(current - 1));
  if (next) next.addEventListener("click", () => go(current + 1));

  const start = parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(start) ? start - 1 : 0);

  // Links like lesson4.html#5 jump straight to part 5
  window.addEventListener("hashchange", () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (Number.isFinite(n) && n - 1 !== current) go(n - 1);
  });
}

// ---------- Slide thumbnails on the right ----------
// A list of every part by name; click one to jump to it.
const THUMBS_KEY = "tiny-llm-thumbs-hidden";

function buildThumbnails(parts, onPick) {
  const aside = document.createElement("aside");
  aside.className = "thumbs";
  aside.setAttribute("aria-label", "Pages in this lesson");

  const toggle = document.createElement("button");
  toggle.className = "thumbs-toggle";
  document.body.appendChild(toggle);

  // Every lesson in order, like a table of contents. The current lesson is open, with its slides indented below it.
  const toc = document.createElement("ol");
  toc.className = "toc";
  aside.appendChild(toc);
  const file = location.pathname.split("/").pop();
  const list = document.createElement("ol");
  list.className = "thumb-list";

  LESSONS.forEach(l => {
    const li = document.createElement("li");
    const here = l.file === file;
    const done = isDone(l.n);
    let head;
    if (here) {
      head = document.createElement("span");
      head.setAttribute("aria-current", "page");
    } else if (l.ready) {
      head = document.createElement("a");
      head.href = l.file;
    } else {
      head = document.createElement("span");
      head.title = "Coming soon";
    }
    head.className = "toc-lesson" + (here ? " here" : "") + (done ? " done" : "") + (l.ready ? "" : " soon");
    head.innerHTML = `<span class="toc-n">${done ? "✓" : l.n}</span><span class="toc-t">${l.title}</span>`;
    li.appendChild(head);
    if (here) li.appendChild(list);
    toc.appendChild(li);
  });

  const items = parts.map((part, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.className = "thumb";
    b.setAttribute("aria-label", `Page ${i + 1}: ${part.dataset.title || ""}`);

    const cap = document.createElement("span");
    cap.className = "thumb-cap";
    cap.innerHTML = `<b>${i + 1}</b> ${part.dataset.title || ""}`;

    b.append(cap);
    b.addEventListener("click", () => onPick(i));
    li.appendChild(b);
    list.appendChild(li);
    return b;
  });
  document.body.appendChild(aside);

  function setHidden(hidden) {
    document.body.classList.toggle("thumbs-off", hidden);
    toggle.textContent = hidden ? "Show pages" : "Hide pages";
    toggle.setAttribute("aria-expanded", hidden ? "false" : "true");
    try { localStorage.setItem(THUMBS_KEY, hidden ? "1" : ""); } catch (e) { /* ignore */ }
  }
  // A simple list of slide names (no previews), like a table of contents
  // Always fits without scrolling: if it's too tall, make it a bit tighter
  function fit() {
    aside.classList.add("compact");
    aside.classList.remove("tight", "tighter");
    if (aside.scrollHeight > aside.clientHeight + 1) aside.classList.add("tight");
    if (aside.scrollHeight > aside.clientHeight + 1) aside.classList.add("tighter");
  }
  window.addEventListener("resize", fit);

  let startHidden = false;
  try { startHidden = localStorage.getItem(THUMBS_KEY) === "1"; } catch (e) { /* ignore */ }
  toggle.addEventListener("click", () => { setHidden(!document.body.classList.contains("thumbs-off")); fit(); });
  setHidden(startHidden);
  document.body.classList.add("has-thumbs");
  fit();

  // Put the lesson title next to "Lesson N of 10" (the big title is hidden on wide screens)
  const where = document.querySelector(".topbar .where");
  const title = document.querySelector(".paged-head h1");
  if (where && title) where.dataset.full = `${where.textContent}: ${title.textContent}`;
  return items;
}

// ---------- Teach mode: press T for big text (for a projector) ----------
function setupTeachMode() {
  document.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "t" || e.key === "T") document.body.classList.toggle("teach");
  });
}

// ---------- Arrow keys move between parts ----------
function setupKeys() {
  document.addEventListener("keydown", (e) => {
    if (!pagedGo) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") pagedGo(1);
    if (e.key === "ArrowLeft") pagedGo(-1);
  });
}

// ---------- Reset: every activity can go back to how it started ----------
// addReset(anyElementInsideTheActivity, functionThatResetsIt)
function addReset(inside, fn) {
  const el = typeof inside === "string" ? document.getElementById(inside) : inside;
  const box = el && el.closest(".activity");
  if (!box) return;
  const b = document.createElement("button");
  b.className = "reset";
  b.type = "button";
  b.textContent = "↺ Reset";
  b.setAttribute("aria-label", "Reset this activity");
  b.addEventListener("click", () => { fn(); b.blur(); });
  box.appendChild(b);
}

// ---------- Neo: a little sticky note who learns to write ----------
// <p class="neo-say">Hello!</p>  becomes Neo with a speech bubble.
const NEO_SVG = `
<svg class="neo-face" viewBox="0 0 64 64" aria-hidden="true">
  <path d="M10 10 H50 L56 16 V54 H10 Z" class="neo-note" />
  <path d="M50 10 V16 H56" class="neo-fold" />
  <circle cx="25" cy="30" r="2.6" class="neo-eye" />
  <circle cx="41" cy="30" r="2.6" class="neo-eye" />
  <path d="M25 39 Q33 45 41 39" />
  <path d="M18 46 H30" class="neo-line" />
</svg>`;

function setupNeo() {
  document.querySelectorAll("p.neo-say").forEach(p => {
    const box = document.createElement("div");
    box.className = "neo";
    box.innerHTML = NEO_SVG;
    const bubble = document.createElement("div");
    bubble.className = "neo-bubble";
    bubble.innerHTML = `<span class="neo-name">${p.dataset.name || "Neo"}</span>${p.innerHTML}`;
    box.appendChild(bubble);
    p.replaceWith(box);
  });
}

// ---------- Copy button on every code block ----------
function setupCopy() {
  document.querySelectorAll("main pre:not(.term-out)").forEach(pre => {
    const b = document.createElement("button");
    b.className = "copy";
    b.type = "button";
    b.textContent = "Copy";
    b.setAttribute("aria-label", "Copy this code");
    // Code with hidden answers gets a "Show output" toggle
    if (pre.classList.contains("has-answers")) {
      const t = document.createElement("button");
      t.className = "copy show-out";
      t.type = "button";
      t.textContent = "Show output";
      t.setAttribute("aria-pressed", "false");
      t.addEventListener("click", () => {
        const on = pre.classList.toggle("answers-on");
        t.textContent = on ? "Hide output" : "Show output";
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });
      pre.appendChild(t);
    }
    b.addEventListener("click", async () => {
      // Copy just the code, without the answers
      const code = (pre.querySelector("code") || pre).cloneNode(true);
      code.querySelectorAll(".ans").forEach(a => {
        const nl = a.nextSibling;
        if (nl && nl.nodeType === 3 && nl.textContent.startsWith("\n")) nl.textContent = nl.textContent.slice(1);
        a.remove();
      });
      const text = code.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        // Older browsers: copy through a hidden text box
        const area = document.createElement("textarea");
        area.value = text; document.body.appendChild(area); area.select();
        try { document.execCommand("copy"); } catch (e2) { /* nothing more we can do */ }
        area.remove();
      }
      b.textContent = "✓ Copied";
      setTimeout(() => { b.textContent = "Copy"; }, 1500);
    });
    pre.appendChild(b);
  });
}

// ---------- ▶ Run: show the code's real output in a small terminal ----------
function setupRun() {
  document.querySelectorAll(".run-area").forEach(area => {
    const button = area.querySelector(".run-code");
    const term = area.querySelector(".terminal");
    button.addEventListener("click", () => {
      const open = term.hidden;
      term.hidden = !open;
      button.textContent = open ? "Hide output" : "▶ Run";
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) term.scrollIntoView({ block: "nearest" });
    });
  });
}

// ---------- Clickable quizzes ----------
// <div class="quiz"><button data-right>…</button><button>…</button><div class="feedback"></div></div>
function setupQuizzes() {
  document.querySelectorAll(".quiz").forEach(quiz => {
    const feedback = quiz.querySelector(".feedback");
    const again = document.createElement("button");
    again.className = "reset quiz-reset";
    again.type = "button";
    again.textContent = "↺ Try again";
    again.hidden = true;
    again.addEventListener("click", () => {
      quiz.querySelectorAll(".options button").forEach(x => x.classList.remove("right", "wrong"));
      if (feedback) { feedback.textContent = ""; feedback.className = "feedback"; }
      again.hidden = true;
    });
    quiz.appendChild(again);
    quiz.querySelectorAll(".options button").forEach(b => {
      b.addEventListener("click", () => {
        quiz.querySelectorAll(".options button").forEach(x => x.classList.remove("right", "wrong"));
        const right = b.hasAttribute("data-right");
        b.classList.add(right ? "right" : "wrong");
        if (feedback) {
          feedback.innerHTML = right ? (quiz.dataset.right || "Right!") : (b.dataset.why || "Not quite. Try another.");
          feedback.className = "feedback " + (right ? "good" : "bad");
        }
        again.hidden = false;
      });
    });
  });
}

// ---------- Predict-first boxes (click to reveal) ----------
function setupPredictions() {
  document.querySelectorAll(".predict").forEach(box => {
    const button = box.querySelector("[data-reveal]");
    if (!button) return;
    button.addEventListener("click", () => {
      const open = box.classList.toggle("open");
      button.textContent = open ? "Hide answer" : "Show answer";
    });
  });
}

// ---------- Walkthroughs: show one step at a time ----------
function setupWalkthroughs() {
  document.querySelectorAll(".walk").forEach(walk => {
    const stages = Array.from(walk.querySelectorAll(".stage"));
    const next = walk.querySelector("[data-walk-next]");
    const all = walk.querySelector("[data-walk-all]");
    const count = walk.querySelector(".count");
    let shown = 1;
    function render() {
      stages.forEach((s, i) => s.classList.toggle("shown", i < shown));
      if (count) count.textContent = `Step ${shown} of ${stages.length}`;
      if (next) next.disabled = shown >= stages.length;
    }
    if (next) next.addEventListener("click", () => {
      shown = Math.min(stages.length, shown + 1);
      render();
      stages[shown - 1].scrollIntoView({ block: "nearest" });
    });
    if (all) all.addEventListener("click", () => { shown = stages.length; render(); });
    render();
  });
}

// ---------- "Mark as done" button ----------
function setupDoneToggle() {
  const button = document.querySelector("[data-done]");
  if (!button) return;
  const n = Number(button.dataset.done);
  function render() {
    const done = isDone(n);
    button.setAttribute("aria-pressed", done ? "true" : "false");
    button.textContent = done ? "✓ Lesson done" : "Mark lesson as done";
  }
  button.addEventListener("click", () => { setDone(n, !isDone(n)); render(); });
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  setupNeo();
  setupPagedLesson();
  setupCopy();
  setupRun();
  setupTeachMode();
  setupKeys();
  setupQuizzes();
  setupPredictions();
  setupWalkthroughs();
  setupDoneToggle();
  setupLlmPath();
});
