// codewalk.js — help for reading the lesson code:
//   1. "Step through": run the code one line at a time, like Thonny, and watch every variable change.
//   2. Python words: tap a dotted word in any code block for a tiny explanation and example.
// The steps come from assets/traces/lessonN.json (made by tools/make_traces.py from the real Python run).
(function () {
  // ---------------- 2. Python words ----------------
  const WORDS = {
    "import": { what: "Loads a library, so you can use its tools.", ex: "import torch\nprint(torch.tensor([1, 2]))", out: "tensor([1, 2])" },
    "def": { what: "Makes a function: a named recipe. The lines inside only run when you call it.", ex: "def double(x):\n    return x * 2\n\nprint(double(5))", out: "10" },
    "return": { what: "Ends the function and hands a value back to whoever called it.", ex: "def add_one(x):\n    return x + 1\n\nanswer = add_one(4)\nprint(answer)", out: "5" },
    "for": { what: "Repeats the indented lines once for each item.", ex: "for letter in \"hi\":\n    print(letter)", out: "h\ni" },
    "in": { what: "Used with for: go through each item in this list or text.", ex: "for n in [1, 2, 3]:\n    print(n * 10)", out: "10\n20\n30" },
    "if": { what: "Runs the indented lines only when the condition is true.", ex: "x = 7\nif x > 5:\n    print(\"big\")", out: "big" },
    "enumerate": { what: "Gives each item together with its position (0, 1, 2, …).", ex: "for i, letter in enumerate(\"cat\"):\n    print(i, letter)", out: "0 c\n1 a\n2 t" },
    "sorted": { what: "Returns the items in order: numbers small to big, text A to Z.", ex: "print(sorted([3, 1, 2]))", out: "[1, 2, 3]" },
    "set": { what: "Keeps each item only once (removes repeats).", ex: "print(set(\"hello\"))", out: "{'h', 'e', 'l', 'o'}   (order may vary)" },
    "len": { what: "Counts the items.", ex: "print(len(\"hello\"))\nprint(len([5, 6]))", out: "5\n2" },
    "range": { what: "The numbers from 0 up to (but not including) the number you give.", ex: "for i in range(3):\n    print(i)", out: "0\n1\n2" },
    "append": { what: "Adds one item to the end of a list.", ex: "numbers = []\nnumbers.append(7)\nnumbers.append(9)\nprint(numbers)", out: "[7, 9]" },
    "print": { what: "Shows a value on the screen.", ex: "print(\"hi\", 5)", out: "hi 5" },
    "repr": { what: "Shows a value the way Python writes it, so you can see spaces and quotes.", ex: "print(repr(\" \"))", out: "' '" },
    "round": { what: "Rounds a number to this many decimals.", ex: "print(round(3.14159, 2))", out: "3.14" },
    "{}": { what: "An empty dictionary: it stores pairs, key → value.", ex: "ages = {}\nages[\"neo\"] = 1\nprint(ages[\"neo\"])", out: "1" },
    "%": { what: "The remainder after dividing.", ex: "print(7 % 3)\nprint(100 % 50)", out: "1\n0" },
    "tensor": { what: "Makes a tensor (a box of numbers) from a list.", ex: "print(torch.tensor([1, 2, 3]) * 2)", out: "tensor([2, 4, 6])" },
    "zeros": { what: "Makes a tensor full of zeros, in the shape you give.", ex: "print(torch.zeros((2, 3)))", out: "tensor([[0., 0., 0.],\n        [0., 0., 0.]])" },
    "randn": { what: "Makes a tensor of random numbers (mostly between -2 and 2).", ex: "torch.manual_seed(42)\nprint(torch.randn(3))", out: "tensor([0.3367, 0.1288, 0.2345])" },
    "sum": { what: "Adds numbers up. dim=1 adds along each row.", ex: "t = torch.tensor([[1, 2], [3, 4]])\nprint(t.sum(dim=1))", out: "tensor([3, 7])" },
    "manual_seed": { what: "Fixes the random numbers, so every run gives the same result.", ex: "torch.manual_seed(42)", out: "" },
    "multinomial": { what: "Rolls a weighted dice: picks a position, using the chances you give.", ex: "chances = torch.tensor([0.1, 0.9])\nprint(torch.multinomial(chances, num_samples=1))", out: "tensor([1])   (most of the time)" },
    "item": { what: "Takes the single number out of a tensor, as a normal Python number.", ex: "t = torch.tensor([5])\nprint(t.item())", out: "5" },
    "softmax": { what: "Turns scores into chances that add up to 1. Bigger score, bigger chance.", ex: "print(F.softmax(torch.tensor([1.0, 2.0]), dim=0))", out: "tensor([0.2689, 0.7311])" },
    "cross_entropy": { what: "The loss: how wrong the scores were about the right answers. Smaller is better.", ex: "scores = torch.tensor([[2.0, 0.0]])\nprint(F.cross_entropy(scores, torch.tensor([0])))", out: "tensor(0.1269)" },
    "backward": { what: "Finds the gradients: which way to move each number to lower the loss. They land in .grad.", ex: "loss.backward()\nprint(weights.grad)", out: "(one gradient per weight)" },
    "requires_grad": { what: "Tells PyTorch to keep track of this tensor, so backward() can find its gradients.", ex: "w = torch.randn(3, requires_grad=True)", out: "" },
  };

  function addPythonWords(code) {
    const used = new Set();
    const names = Object.keys(WORDS).filter(w => /^\w+$/.test(w));
    const wordRe = new RegExp("\\b(" + names.join("|") + ")\\b|(\\{\\})|( % )", "g");
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest(".c, .pyword") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const text = node.nodeValue;
      // Don't touch words inside "strings"
      const inString = new Array(text.length).fill(false);
      let quote = null;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quote) { inString[i] = true; if (ch === quote) quote = null; }
        else if (ch === '"' || ch === "'") { quote = ch; inString[i] = true; }
        else if (ch === "\n") quote = null;
      }
      const frag = document.createDocumentFragment();
      let last = 0, m, changed = false;
      wordRe.lastIndex = 0;
      while ((m = wordRe.exec(text))) {
        const word = m[1] || m[2] || "%";
        const start = m[3] ? m.index + 1 : m.index;
        if (inString[start] || used.has(word)) continue;
        used.add(word);
        changed = true;
        frag.append(text.slice(last, start));
        const b = document.createElement("button");
        b.type = "button"; b.className = "pyword"; b.textContent = word;
        b.setAttribute("aria-label", `${word}: what does it do?`);
        b.addEventListener("click", (e) => { e.stopPropagation(); openWord(b, word); });
        frag.append(b);
        last = start + word.length;
      }
      if (!changed) return;
      frag.append(text.slice(last));
      node.replaceWith(frag);
    });
  }

  const card = document.createElement("div");
  card.className = "pyword-card"; card.hidden = true; card.setAttribute("role", "dialog");
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function openWord(anchor, word) {
    const w = WORDS[word];
    card.innerHTML = `<button type="button" class="pyword-x" aria-label="Close">✕</button>` +
      `<div class="pyword-title"><code>${esc(word)}</code></div><p>${esc(w.what)}</p>` +
      `<div class="pyword-label">Example</div><pre>${esc(w.ex)}</pre>` +
      (w.out ? `<div class="pyword-label">Prints</div><pre class="pyword-out">${esc(w.out)}</pre>` : "");
    card.hidden = false;
    card.querySelector(".pyword-x").onclick = closeWord;
    const r = anchor.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    card.style.width = width + "px";
    let left = Math.min(Math.max(12, r.left), window.innerWidth - width - 12);
    card.style.left = left + "px";
    const h = card.offsetHeight;
    card.style.top = (r.bottom + 8 + h < window.innerHeight ? r.bottom + 8 : Math.max(12, r.top - h - 8)) + "px";
  }
  function closeWord() { card.hidden = true; }
  document.addEventListener("click", (e) => { if (!card.hidden && !card.contains(e.target)) closeWord(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeWord(); });
  document.addEventListener("scroll", closeWord, true);

  // ---------------- 1. Step through ----------------
  function setupStepper(section) {
    const pre = section.querySelector("pre");
    const code = pre && pre.querySelector("code");
    const runArea = section.querySelector(".run-area");
    const file = location.pathname.split("/").pop();
    const n = (file.match(/lesson(\d+)/) || [])[1];
    if (!code || !runArea || !n) return;

    const startBtn = document.createElement("button");
    startBtn.type = "button"; startBtn.className = "step-start";
    startBtn.textContent = "👣 Step through";
    startBtn.setAttribute("aria-expanded", "false");
    const runBtn = runArea.querySelector(".run-code");
    if (runBtn) runBtn.after(startBtn); else runArea.prepend(startBtn);

    let data = null, lines = [], at = 0, wrap = null, panel = null;

    function splitLines() {
      if (lines.length) return;
      const parts = code.innerHTML.split("\n");
      code.innerHTML = parts.map((h, i) => `<span class="ln" data-n="${i + 1}">${h}</span>`).join("\n");
      lines = Array.from(code.querySelectorAll(".ln"));
    }

    function build() {
      wrap = document.createElement("div");
      wrap.className = "walk-wrap";
      pre.replaceWith(wrap);
      wrap.appendChild(pre);
      panel = document.createElement("div");
      panel.className = "walk-panel";
      panel.innerHTML =
        '<div class="walk-top"><span class="walk-count"></span>' +
        '<button type="button" class="walk-close" aria-label="Stop stepping">✕</button></div>' +
        '<div class="walk-controls"><button type="button" class="walk-back">◀ Back</button>' +
        '<button type="button" class="primary walk-next">Next line ▶</button>' +
        '<button type="button" class="walk-reset">↺</button></div>' +
        '<p class="walk-say" aria-live="polite"></p>' +
        '<div class="walk-vars"></div>' +
        '<div class="walk-out-label">Output</div><pre class="walk-out"></pre>';
      wrap.appendChild(panel);
      panel.querySelector(".walk-next").onclick = () => go(at + 1);
      panel.querySelector(".walk-back").onclick = () => go(at - 1);
      panel.querySelector(".walk-reset").onclick = () => go(0);
      panel.querySelector(".walk-reset").title = "Start again";
      panel.querySelector(".walk-close").onclick = stop;
    }

    // A small 2-D tensor is drawn as a grid, with the characters as row and column labels
    function fmt(x) {
      if (Number.isInteger(x)) return String(x);
      const t = x.toFixed(2);
      return t.replace(/^0\./, ".").replace(/^-0\./, "-.");
    }
    function grid(name, value, before) {
      const g = value.grid, labels = data.labels;
      const rowsLab = labels && labels.length === g.length ? labels : null;
      const colsLab = labels && labels.length === g[0].length ? labels : null;
      const lab = (c, i) => c === undefined || c === null ? i : (c === " " ? "␣" : esc(c));
      let most = 0;
      g.forEach(r => r.forEach(x => { if (Math.abs(x) > most) most = Math.abs(x); }));
      let html = '<div class="walk-grid-wrap"><table class="walk-grid"><tr><th></th>';
      g[0].forEach((_, k) => { html += `<th>${lab(colsLab && colsLab[k], k)}</th>`; });
      html += "</tr>";
      g.forEach((row, r) => {
        html += `<tr><th>${lab(rowsLab && rowsLab[r], r)}</th>`;
        row.forEach((x, k) => {
          const was = before && before.grid && before.grid[r] ? before.grid[r][k] : x;
          const heat = most ? Math.abs(x) / most : 0;
          const cls = (x !== was ? "now " : "") + (x === 0 ? "zero" : x < 0 ? "neg" : "pos");
          const where = `${name}[${r}, ${k}]` + (rowsLab && colsLab ? `: ${rowsLab[r] === " " ? "space" : rowsLab[r]} → ${colsLab[k] === " " ? "space" : colsLab[k]}` : "");
          html += `<td class="${cls}" style="--heat:${heat.toFixed(2)}" title="${esc(where)} = ${x}">${x === 0 ? "·" : fmt(x)}</td>`;
        });
        html += "</tr>";
      });
      return html + "</table></div>";
    }

    // A dictionary, written the Python way: {key: value, …}. A new or changed pair is highlighted.
    function pairs(value, before) {
      const old = {};
      if (before && before.pairs) before.pairs.forEach(([k, v]) => { old[k] = v; });
      const parts = value.pairs.map(([k, v]) => {
        const text = esc(`${k}: ${typeof v === "object" ? v.text : v}`);
        const fresh = before !== undefined && old[k] !== v;
        return fresh ? `<span class="now">${text}</span>` : text;
      });
      return "{" + parts.join(", ") + "}";
    }

    function table(title, vars, changed, prefix, beforeVars) {
      const names = Object.keys(vars);
      if (!names.length) return "";
      let html = `<div class="walk-vars-title">${title}</div><table>`;
      names.forEach(k => {
        const hot = changed.includes(prefix + k);
        const v = vars[k];
        const isGrid = v && typeof v === "object" && v.grid;
        const isDict = v && typeof v === "object" && v.pairs;
        const cell = isDict ? pairs(v, beforeVars && beforeVars[k]) : esc(isGrid ? v.text + (hot ? "" : "  (click to see it)") : v);
        html += `<tr class="${hot ? "hot" : ""}${isGrid ? " has-grid" : ""}" data-name="${esc(k)}" title="Click to show all"><th>${esc(k)}</th><td>${cell}</td></tr>`;
        if (isGrid) html += `<tr class="grid-row${hot ? " open" : ""}"><td colspan="2">${grid(k, v, beforeVars && beforeVars[k])}</td></tr>`;
      });
      return html + "</table>";
    }

    function go(i) {
      const total = data.steps.length;
      at = Math.max(0, Math.min(total, i));
      lines.forEach(l => l.classList.remove("now"));
      const say = panel.querySelector(".walk-say");
      const varsBox = panel.querySelector(".walk-vars");
      const out = panel.querySelector(".walk-out");
      panel.querySelector(".walk-count").textContent = at === 0 ? `${total} steps` : `Step ${at} of ${total}`;
      panel.querySelector(".walk-back").disabled = at === 0;
      panel.querySelector(".walk-next").disabled = at === total;
      panel.querySelector(".walk-next").textContent = at === 0 ? "Run first line ▶" : at === total ? "Finished" : "Next line ▶";
      if (at === 0) {
        say.innerHTML = "Press <b>Run first line ▶</b>. Each press runs one line, and you see what it changed.";
        varsBox.innerHTML = '<p class="walk-empty">No variables yet.</p>';
        out.textContent = "";
        return;
      }
      const s = data.steps[at - 1];
      for (let k = s.line; k <= s.end; k++) if (lines[k - 1]) lines[k - 1].classList.add("now");
      const first = lines[s.line - 1];
      if (first) {
        // Keep the line in view inside the code box (up and down only)
        const pr = pre.getBoundingClientRect(), r = first.getBoundingClientRect();
        if (r.top < pr.top + 30 || r.bottom > pr.bottom - 40) {
          pre.scrollTo({ top: pre.scrollTop + (r.top - pr.top) - pr.height / 3, behavior: "smooth" });
        }
      }
      const explain = data.explain[s.line] || "";
      if (s.skip !== undefined) {
        say.innerHTML = `🔁 The loop ran <b>${s.skip} more time${s.skip === 1 ? "" : "s"}</b>: the same lines, with new values. Here's where it ended up.`;
      } else if (s.back) {
        say.innerHTML = `↩ Back here: the function gave its answer. ${esc(explain)}`;
      } else {
        say.textContent = explain;
      }
      let html = "";
      if (s.ret) html += `<div class="walk-ret">↩ <b>${esc(s.ret[0])}()</b> gives back <code>${esc(s.ret[1])}</code></div>`;
      const prev = at > 1 ? data.steps[at - 2] : null;
      if (s.scope) html += table(`Inside ${esc(s.scope)}()`, s.locals || {}, s.changed || [], "@", prev && prev.locals);
      html += table(s.scope ? "Outside" : "Variables", s.vars, s.changed || [], "", prev && prev.vars);
      varsBox.innerHTML = html || '<p class="walk-empty">No variables yet.</p>';
      // Long values fit on one line; click a row to see all of it
      varsBox.querySelectorAll(":scope > table > tbody > tr:not(.grid-row), :scope > table > tr:not(.grid-row)").forEach(tr => tr.addEventListener("click", () => {
        tr.classList.toggle("full");
        const g = tr.nextElementSibling;
        if (tr.classList.contains("has-grid") && g) g.classList.toggle("open");
      }));
      // Bring what changed into view inside the panel
      const cell = varsBox.querySelector("tr.grid-row.open td.now");
      const hot = cell || varsBox.querySelector("tr.hot, .walk-ret");
      if (hot) {
        const vr = varsBox.getBoundingClientRect(), hr = hot.getBoundingClientRect();
        if (hr.bottom > vr.bottom - 10 || hr.top < vr.top) varsBox.scrollTop += hr.top - vr.top - (cell ? vr.height / 2 : 40);
      }
      const prevOut = at > 1 ? data.steps[at - 2].out : "";
      const fresh = s.out.startsWith(prevOut) ? s.out.slice(prevOut.length) : "";
      out.innerHTML = esc(s.out.slice(0, s.out.length - fresh.length)) + (fresh ? `<span class="fresh">${esc(fresh)}</span>` : "");
      out.scrollTop = out.scrollHeight;
    }

    async function start() {
      if (!data) {
        startBtn.disabled = true;
        try {
          const res = await fetch(`../assets/traces/lesson${n}.json?v=202610160940`);
          data = await res.json();
        } catch (e) {
          startBtn.disabled = false;
          startBtn.textContent = "Couldn't load. Try again";
          return;
        }
        startBtn.disabled = false;
      }
      splitLines();
      if (!wrap) build();
      wrap.classList.add("walking");
      panel.hidden = false;
      startBtn.textContent = "Stop stepping";
      startBtn.setAttribute("aria-expanded", "true");
      section.classList.add("is-walking");
      document.body.classList.add("walking-code");
      go(0);
      wrap.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    function stop() {
      if (!wrap) return;
      wrap.classList.remove("walking");
      panel.hidden = true;
      lines.forEach(l => l.classList.remove("now"));
      startBtn.textContent = "👣 Step through";
      startBtn.setAttribute("aria-expanded", "false");
      section.classList.remove("is-walking");
      document.body.classList.remove("walking-code");
    }
    startBtn.addEventListener("click", () => (wrap && wrap.classList.contains("walking") ? stop() : start()));

    // While stepping, the arrow keys step through the code instead of changing pages
    window.addEventListener("keydown", (e) => {
      if (!wrap || !wrap.classList.contains("walking") || section.hidden) return;
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault(); e.stopPropagation();
        go(at + (e.key === "ArrowRight" ? 1 : -1));
      }
    }, true);
  }

  function setup() {
    document.body.appendChild(card);
    document.querySelectorAll("main pre > code").forEach(addPythonWords);
    document.querySelectorAll('section.part[data-title="The code"]').forEach(setupStepper);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
