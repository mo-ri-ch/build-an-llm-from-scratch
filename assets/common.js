// common.js — shared parts of every page:
// the lesson list, progress, one-part-per-screen lessons, quizzes, teach mode.

const LESSONS = [
  { n: 1, title: "Tensors", file: "lesson1.html", ready: true,
    summary: "A box that holds numbers and does math on all of them at once.",
    leaves: "Computers only understand numbers. How do we turn text into numbers?" },
  { n: 2, title: "Text into numbers", file: "lesson2.html", ready: true,
    summary: "Give every character a number. Turn text into numbers and back.",
    leaves: "Now text is numbers. How can we guess the next character?" },
  { n: 3, title: "Counting what comes next", file: "lesson3.html", ready: true,
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

  // Previous / Next sit right below the slide, as quiet text
  const pagebar = document.querySelector(".pagebar");
  if (pagebar) main.appendChild(pagebar);

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
// Small copies of every part, like the slide strip in a presentation app.
const THUMBS_KEY = "tiny-llm-thumbs-hidden";

function buildThumbnails(parts, onPick) {
  const aside = document.createElement("aside");
  aside.className = "thumbs";
  aside.setAttribute("aria-label", "Slides in this lesson");

  const toggle = document.createElement("button");
  toggle.className = "thumbs-toggle";
  document.body.appendChild(toggle);

  const list = document.createElement("ol");
  list.className = "thumb-list";
  aside.appendChild(list);

  const items = parts.map((part, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.className = "thumb";
    b.setAttribute("aria-label", `Slide ${i + 1}: ${part.dataset.title || ""}`);

    const frame = document.createElement("div");
    frame.className = "thumb-frame";
    const copy = part.cloneNode(true);
    copy.removeAttribute("hidden");
    copy.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
    copy.querySelectorAll("input, button, select, textarea, a, details, summary").forEach(el => {
      el.setAttribute("tabindex", "-1"); el.setAttribute("aria-hidden", "true");
    });
    copy.setAttribute("aria-hidden", "true");
    const inner = document.createElement("div");
    inner.className = "thumb-inner";
    inner.appendChild(copy);
    frame.appendChild(inner);

    const cap = document.createElement("span");
    cap.className = "thumb-cap";
    cap.innerHTML = `<b>${i + 1}</b> ${part.dataset.title || ""}`;

    b.append(frame, cap);
    b.addEventListener("click", () => onPick(i));
    li.appendChild(b);
    list.appendChild(li);
    return b;
  });
  document.body.appendChild(aside);

  function setHidden(hidden) {
    document.body.classList.toggle("thumbs-off", hidden);
    toggle.textContent = hidden ? "Show slides" : "Hide slides";
    toggle.setAttribute("aria-expanded", hidden ? "false" : "true");
    try { localStorage.setItem(THUMBS_KEY, hidden ? "1" : ""); } catch (e) { /* ignore */ }
  }
  // Size the previews so every slide fits in the strip without scrolling
  function fit() {
    const n = items.length;
    const gap = 10, cap = 26, pad = 12 + 6;     // caption height and button padding
    const avail = aside.clientHeight - 20;
    const per = avail / n - gap;
    const fh = Math.floor(per - cap - pad);
    aside.classList.toggle("compact", fh < 44);
    const h = Math.min(116, Math.max(44, fh));
    const w = Math.min(186, Math.round(h * 1.6));
    aside.style.setProperty("--fh", h + "px");
    aside.style.setProperty("--fw", w + "px");
    aside.style.setProperty("--sc", (w / 930).toFixed(4));
    aside.style.setProperty("--tgap", gap + "px");
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
      // Leave out the outputs
      code.querySelectorAll(".pout").forEach(o => o.remove());
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

// ---------- ▶ Run: show each output right under the line that printed it ----------
function setupRun() {
  document.querySelectorAll(".run-area").forEach(area => {
    const button = area.querySelector(".run-code");
    const pre = area.previousElementSibling;
    if (!pre || !pre.classList.contains("runnable")) return;
    button.addEventListener("click", () => {
      const on = pre.classList.toggle("ran");
      button.textContent = on ? "Hide output" : "▶ Run";
      button.setAttribute("aria-pressed", on ? "true" : "false");
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
  setupPagedLesson();
  setupCopy();
  setupRun();
  setupTeachMode();
  setupKeys();
  setupQuizzes();
  setupPredictions();
  setupWalkthroughs();
  setupDoneToggle();
});
