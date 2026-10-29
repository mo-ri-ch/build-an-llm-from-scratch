// course.js — everything that belongs to this course only.
// The shared look and features come from study-notebook-design (loaded after this file),
// which reads the settings below.

const COURSE_LESSONS = [
  { n: 1, step: "numbers", title: "Tensors", file: "lesson1.html", ready: true, test: 6,
    summary: "A box that holds numbers and does math on all of them at once.",
    leaves: "An LLM reads text, but tensors hold only numbers. How do we turn text into numbers?" },
  { n: 2, step: "text to numbers", title: "Text into numbers", file: "lesson2.html", ready: true, test: 5,
    summary: "Give every character a number. Turn text into numbers and back.",
    leaves: "An LLM's whole job is guessing the next character. Now that text is numbers, how do we make our first guess?" },
  { n: 3, step: "first guess", title: "Counting what comes next", file: "lesson3.html", ready: true, test: 6,
    summary: "Count which character follows which, then generate text.",
    leaves: "Counting can't look further back, and the smarter model's numbers can't be counted. How can your model find numbers without counting?" },
  { n: 4, step: "learning", title: "Let the model learn", file: "lesson4.html", ready: true, test: 13,
    summary: "Start random. Predict, measure, find directions, move. Repeat.",
    leaves: "Your model can learn now, but it still sees only 1 letter. How can it look further back without the table exploding?" },
  { n: 5, step: "more letters", title: "Looking further back", file: "lesson5.html", ready: true, test: 10,
    summary: "Three small tables, one per letter, add up to one guess.",
    leaves: "Each letter adds its own scores, without looking at the others. How can your model understand letters together?" },
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

// ---------- Your model: a little sticky note who learns to write ----------
// <p class="neo-say">Hello!</p>  becomes your model, with a speech bubble.
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
    bubble.innerHTML = `<span class="neo-name">${p.dataset.name || "Your model"}</span>${p.innerHTML}`;
    box.appendChild(bubble);
    p.replaceWith(box);
  });
}

// ---------- "Our text": the training text, always in view on pages that use it ----------
// <p class="our-text" data-after="t"></p>  highlights every t and the character after it
// <p class="our-text" data-pair="0"></p>   highlights one pair (here the first: t → h)
const OUR_TEXT = "the cat sat on the mat. the dog sat on the log.";
function markOurText(el, opts) {
  const text = OUR_TEXT, starts = [];
  if (opts.pair != null) starts.push(Number(opts.pair));
  if (opts.after) for (let i = 0; i < text.length - 1; i++) if (text[i] === opts.after) starts.push(i);
  let html = "", i = 0;
  const esc = c => c === " " ? "&nbsp;" : c;
  while (i < text.length) {
    if (starts.includes(i)) { html += `<mark class="pair">${esc(text[i])}${esc(text[i + 1])}</mark>`; i += 2; }
    else { html += esc(text[i]) === "&nbsp;" ? " " : text[i]; i += 1; }
  }
  const count = opts.after ? ` <span class="our-note">(${starts.length} pair${starts.length === 1 ? "" : "s"})</span>` : "";
  el.innerHTML = `<span class="our-label">from our text:</span> <span class="our-line">${html}</span>${count}`;
}
function setupOurText() {
  document.querySelectorAll(".our-text:not([data-live])").forEach(el => markOurText(el, { pair: el.dataset.pair, after: el.dataset.after }));
}


window.COURSE = {
  id: "tiny-llm",                 // keeps everything students already saved (progress, notes)
  pathLabel: "Building the LLM",
  lessons: COURSE_LESSONS,
  setup: [setupNeo, setupOurText],
};
