// common.js — shared parts of every page:
// the lesson list, progress tracking, teach mode, and reveal buttons.

const LESSONS = [
  { n: 1, title: "Tensors", file: "lesson1.html", ready: false,
    summary: "PyTorch's container for numbers, and doing math on many numbers at once.",
    answers: "How does a computer hold and work with lots of numbers?",
    leaves: "A computer only understands numbers. How do we turn text into numbers?" },
  { n: 2, title: "Text into numbers", file: "lesson2.html", ready: false,
    summary: "Give every character a number, then encode text and decode it back.",
    answers: "How do we turn text into numbers?",
    leaves: "Now the text is numbers. How can we guess which character comes next?" },
  { n: 3, title: "Counting what comes next", file: "lesson3.html", ready: false,
    summary: "Tally which character follows which, turn the counts into probabilities, and generate text.",
    answers: "How can we guess which character comes next?",
    leaves: "Counting only works for a tiny table. Can a model learn the probabilities by itself instead?" },
  { n: 4, title: "Let the model learn", file: "lesson4.html", ready: true,
    summary: "Start with random numbers and improve them: predict, measure the loss, find directions, move.",
    answers: "Can a model learn the probabilities by itself?",
    leaves: "How can a model look at several previous characters without a giant table?" },
  { n: 5, title: "Looking at more than one character", file: "lesson5.html", ready: false,
    summary: "Three small tables vote on the next character, so the model sees 3 characters back.",
    answers: "How can a model look at several previous characters?",
    leaves: "Adding votes can't understand combinations of characters. Can a character carry meaning?" },
  { n: 6, title: "Embeddings", file: "lesson6.html", ready: false,
    summary: "Give each character a list of numbers that describes it, and let the model learn them.",
    answers: "Can a character carry meaning the model learns?",
    leaves: "Each character still ignores the others. How can characters look at each other?" },
  { n: 7, title: "Attention", file: "lesson7.html", ready: false,
    summary: "Let every character decide which earlier characters matter to it.",
    answers: "How can characters look at each other?",
    leaves: "Attention is one piece. How do the pieces fit together into a real model?" },
  { n: 8, title: "The Transformer block", file: "lesson8.html", ready: false,
    summary: "Stack attention and small networks into the building block of GPT.",
    answers: "How do the pieces fit together?",
    leaves: "Our model is ready, but our text is tiny. What happens with real text?" },
  { n: 9, title: "Training on real text", file: "lesson9.html", ready: false,
    summary: "Train our mini-GPT on a real book and generate new text from it.",
    answers: "What happens with real text?",
    leaves: "How do size, data and training time change what the model can do?" },
  { n: 10, title: "Experiments and your project", file: "lesson10.html", ready: false,
    summary: "Change the model, measure the results, and turn it into a portfolio project.",
    answers: "How do size, data and training time change the model?",
    leaves: null },
];

// ---------- Progress (saved in this browser only) ----------
const PROGRESS_KEY = "tiny-llm-progress";

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) { /* storage blocked: ignore */ }
}
function isDone(n) { return !!loadProgress()[n]; }
function setDone(n, value) { const p = loadProgress(); p[n] = value; saveProgress(p); }

// ---------- Teach mode: big text, arrow keys move between parts ----------
function setupTeachMode() {
  const button = document.querySelector("[data-teach-toggle]");
  if (!button) return;
  const hint = document.createElement("div");
  hint.className = "teach-hint";
  hint.textContent = "Teach mode: ← and → move between parts. Press T to exit.";
  document.body.appendChild(hint);

  function toggle() {
    const on = document.body.classList.toggle("teach");
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.textContent = on ? "Exit teach mode" : "Teach mode";
  }
  button.addEventListener("click", toggle);

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (typing) return;
    if (e.key === "t" || e.key === "T") toggle();
    if (!document.body.classList.contains("teach")) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const parts = Array.from(document.querySelectorAll("section.part"));
    const y = window.scrollY + 40;
    let index = parts.findIndex(p => p.offsetTop > y);
    if (index === -1) index = parts.length;
    const target = e.key === "ArrowRight" ? parts[index] : parts[Math.max(0, index - 2)];
    if (target) { e.preventDefault(); target.scrollIntoView(); }
  });
}

// ---------- Predict-first questions: click to reveal the answer ----------
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

// ---------- "Mark as done" button on lesson pages ----------
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
  setupTeachMode();
  setupPredictions();
  setupWalkthroughs();
  setupDoneToggle();
});
