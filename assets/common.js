// common.js — shared parts of every page:
// the lesson list, progress, one-part-per-screen lessons, quizzes, teach mode.

const LESSONS = [
  { n: 1, title: "Tensors", file: "lesson1.html", ready: true,
    summary: "A box that holds numbers and does math on all of them at once.",
    leaves: "Computers only understand numbers. How do we turn text into numbers?" },
  { n: 2, title: "Text into numbers", file: "lesson2.html", ready: false,
    summary: "Give every character a number. Turn text into numbers and back.",
    leaves: "Now text is numbers. How can we guess the next character?" },
  { n: 3, title: "Counting what comes next", file: "lesson3.html", ready: false,
    summary: "Count which character follows which, then generate text.",
    leaves: "Counting only works for tiny tables. Can a model learn by itself?" },
  { n: 4, title: "Let the model learn", file: "lesson4.html", ready: true,
    summary: "Start random. Predict, measure, find directions, move. Repeat.",
    leaves: "How can a model look at several characters without a giant table?" },
  { n: 5, title: "Looking further back", file: "lesson5.html", ready: false,
    summary: "Three small tables vote on the next character.",
    leaves: "Votes can't understand combinations. Can a character carry meaning?" },
  { n: 6, title: "Embeddings", file: "lesson6.html", ready: false,
    summary: "Give each character a list of numbers that describes it.",
    leaves: "Characters still ignore each other. How can they look at each other?" },
  { n: 7, title: "Attention", file: "lesson7.html", ready: false,
    summary: "Each character decides which earlier characters matter.",
    leaves: "How do the pieces fit together into a real model?" },
  { n: 8, title: "The Transformer block", file: "lesson8.html", ready: false,
    summary: "The building block of GPT.",
    leaves: "Our model is ready, but our text is tiny. What about real text?" },
  { n: 9, title: "Training on real text", file: "lesson9.html", ready: false,
    summary: "Train on a real book and generate new text.",
    leaves: "How do size, data and training time change the model?" },
  { n: 10, title: "Experiments and your project", file: "lesson10.html", ready: false,
    summary: "Change the model, measure it, and make it your portfolio project.",
    leaves: null },
];

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

  let current = 0;
  function go(i) {
    current = Math.max(0, Math.min(parts.length - 1, i));
    parts.forEach((p, k) => { p.hidden = k !== current; });
    if (bar) Array.from(bar.children).forEach((s, k) => {
      s.classList.toggle("now", k === current);
      s.classList.toggle("seen", k < current);
    });
    if (back) back.disabled = current === 0;
    if (next) {
      next.hidden = current === parts.length - 1;
    }
    if (label) label.textContent = `${current + 1} / ${parts.length}  ${parts[current].dataset.title || ""}`;
    try { history.replaceState(null, "", `#${current + 1}`); } catch (e) { /* file:// */ }
    window.scrollTo(0, 0);
  }
  pagedGo = (delta) => go(current + delta);

  if (back) back.addEventListener("click", () => go(current - 1));
  if (next) next.addEventListener("click", () => go(current + 1));

  const start = parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(start) ? start - 1 : 0);
}

// ---------- Teach mode: big text for a projector ----------
function setupTeachMode() {
  const button = document.querySelector("[data-teach-toggle]");
  if (!button) return;
  function toggle() {
    const on = document.body.classList.toggle("teach");
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.textContent = on ? "Exit teach mode" : "Teach mode";
  }
  button.addEventListener("click", toggle);
  document.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "t" || e.key === "T") toggle();
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

// ---------- Clickable quizzes ----------
// <div class="quiz"><button data-right>…</button><button>…</button><div class="feedback"></div></div>
function setupQuizzes() {
  document.querySelectorAll(".quiz").forEach(quiz => {
    const feedback = quiz.querySelector(".feedback");
    quiz.querySelectorAll(".options button").forEach(b => {
      b.addEventListener("click", () => {
        quiz.querySelectorAll(".options button").forEach(x => x.classList.remove("right", "wrong"));
        const right = b.hasAttribute("data-right");
        b.classList.add(right ? "right" : "wrong");
        if (feedback) {
          feedback.innerHTML = right ? (quiz.dataset.right || "Right!") : (b.dataset.why || "Not quite. Try another.");
          feedback.className = "feedback " + (right ? "good" : "bad");
        }
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
  setupPagedLesson();
  setupTeachMode();
  setupKeys();
  setupQuizzes();
  setupPredictions();
  setupWalkthroughs();
  setupDoneToggle();
});
