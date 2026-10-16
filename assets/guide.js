// ---------- Guide me: a soft glow on the one thing to look at now ----------
// Like the guide in a game: → moves the glow to the next thing, ← goes back.
// After the last thing on a page, → goes to the next page. Shift + → / ← jumps a whole page.
// The guide only points: you can still scroll and click anywhere. Activities wait for you.
// On or off is remembered across pages. Self-contained: adds its own styles.
(function () {
  const KEY = "tiny-llm-guide";
  const JOIN_PREV = ["our-text", "muted-note", "loss-strip", "loss-avg"];   // small lines that belong to the thing before them
  const JOIN_NEXT = ["step-label"];               // labels that belong to the thing after them

  const css = `
  .topbar:has(.guide-toggle) { justify-content: flex-start; }
  .topbar:has(.guide-toggle) .where { margin-left: auto; }
  .guide-toggle { margin-left: 14px; white-space: nowrap; background: none; border: 0; box-shadow: none; padding: 4px 6px;
    font-family: var(--head); font-weight: 400; font-size: 1.05rem; color: var(--pencil); cursor: pointer; }
  .guide-toggle:hover { color: var(--ink); background: none; }
  body.guiding .guide-toggle { color: var(--ink); text-decoration: underline; text-decoration-color: var(--hl-yellow); text-decoration-thickness: 3px; text-underline-offset: 4px; }
  body.guiding section.part:not([hidden]) > *:not(h2) { transition: opacity 0.25s; }
  body.guiding section.part:not([hidden]) > *:not(h2):not(.guide-now) { opacity: 0.35; }
  body.guiding .pagebar .next-side:not(.guide-now) { opacity: 0.35; }
  .guide-now { opacity: 1 !important; }
  .guide-glow { position: absolute; z-index: 1; pointer-events: none; border-radius: 10px; display: none;
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--hl-yellow) 35%, transparent), 0 0 26px 6px color-mix(in srgb, var(--hl-yellow) 55%, transparent);
    transition: left 0.25s, top 0.25s, width 0.25s, height 0.25s; }
  body.guiding .guide-glow.on { display: block; }
  .guide-now .do { animation: guide-pulse 1.6s ease-in-out 2; }
  @keyframes guide-pulse { 50% { background: color-mix(in srgb, var(--hl-yellow) 45%, transparent); } }
  .guide-bar { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 9990;
    display: none; align-items: center; gap: 8px; padding: 8px 10px; background: var(--card, #fff);
    border: 2px solid var(--ink); border-radius: 12px; box-shadow: 3px 3px 0 var(--ink); }
  body.guiding .guide-bar { display: flex; }
  body.guiding { padding-bottom: 80px; }
  .guide-bar button { padding: 6px 12px; font-size: 0.95rem; white-space: nowrap; }
  .guide-bar .guide-count { color: var(--pencil); font-size: 0.85rem; min-width: 3.2em; text-align: center; font-family: var(--mono); }
  .guide-bar .guide-keys { color: var(--pencil); font-size: 0.8rem; }
  .guide-bar .guide-stop { border: 0; background: none; box-shadow: none; color: var(--pencil); padding: 6px; }
  @media (max-width: 700px) { .guide-bar .guide-keys { display: none; } }
  @media (prefers-reduced-motion: reduce) { .guide-now .do { animation: none; } }
  `;

  let on = false, step = 0, steps = [], section = null;
  const startHash = location.hash;   // read now: the page list rewrites it once the page is set up

  function load() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function save() { try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { /* private mode */ } }

  function hasClass(el, list) { return list.some(c => el.classList.contains(c)); }

  // The things on the page, in reading order, grouped into steps
  function buildSteps() {
    section = document.querySelector("main[data-paged] section.part:not([hidden])");
    steps = [];
    if (!section) return;
    let carry = [];
    Array.from(section.children).forEach(el => {
      if (el.tagName === "H2" || el.tagName === "SCRIPT" || el.classList.contains("hook")) return;
      if (el.hidden || getComputedStyle(el).display === "none") return;
      if (hasClass(el, JOIN_NEXT)) { carry.push(el); return; }
      if (hasClass(el, JOIN_PREV) && steps.length && !carry.length) { steps[steps.length - 1].push(el); return; }
      steps.push(carry.concat([el]));
      carry = [];
    });
    if (carry.length) steps.push(carry);
    // Last step: the closing line and the Next link
    const nextSide = document.querySelector(".pagebar .next-side");
    const nextBtn = nextSide && nextSide.querySelector("[data-page-next]");
    if (nextSide && nextBtn && !nextBtn.hidden) steps.push([nextSide]);
  }

  function clear() {
    document.querySelectorAll(".guide-now").forEach(el => el.classList.remove("guide-now"));
    glow.classList.remove("on");
  }
  // One glow around the whole step (a step can be a few elements)
  function placeGlow() {
    if (!on || !steps[step]) return;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    steps[step].forEach(el => {
      const box = el.getBoundingClientRect();
      if (!box.width && !box.height) return;
      l = Math.min(l, box.left); t = Math.min(t, box.top); r = Math.max(r, box.right); b = Math.max(b, box.bottom);
    });
    if (l === Infinity) return;
    const pad = 4;
    Object.assign(glow.style, { left: (l + scrollX - pad) + "px", top: (t + scrollY - pad) + "px", width: (r - l + pad * 2) + "px", height: (b - t + pad * 2) + "px" });
    glow.classList.add("on");
  }

  function show(scroll) {
    clear();
    if (!on) return;
    buildSteps();
    if (!steps.length) return;
    step = Math.max(0, Math.min(steps.length - 1, step));
    steps[step].forEach(el => el.classList.add("guide-now"));
    count.textContent = `${step + 1} / ${steps.length}`;
    placeGlow();
    if (scroll) {
      const first = steps[step][0], last = steps[step][steps[step].length - 1];
      const top = first.getBoundingClientRect().top, bottom = last.getBoundingClientRect().bottom;
      const room = window.innerHeight - 100;
      if (top < 70 || bottom > room) {
        const y = window.scrollY + top - (bottom - top < room - 70 ? (room - (bottom - top)) / 2 : 80);
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }
  }

  function move(delta) {
    buildSteps();
    const target = step + delta;
    if (target >= steps.length) { pageGo(1, 0); return; }
    if (target < 0) { pageGo(-1, "last"); return; }
    step = target;
    show(true);
  }

  let wantLast = false;
  function pageGo(delta, where) {
    if (typeof pagedGo !== "function") return;
    wantLast = where === "last";
    step = 0;
    pagedGo(delta);
  }

  function setOn(value) {
    on = value;
    document.body.classList.toggle("guiding", on);
    toggle.setAttribute("aria-pressed", on ? "true" : "false");
    toggle.textContent = on ? "🧭 Guiding" : "🧭 Guide me";
    save();
    if (on) { step = 0; show(true); } else clear();
  }

  // ----- the controls -----
  const glow = document.createElement("div");
  glow.className = "guide-glow";
  glow.setAttribute("aria-hidden", "true");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "guide-toggle";
  toggle.title = "Guide me: a glow shows what to look at. Use → and ←.";

  const bar = document.createElement("div");
  bar.className = "guide-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Guide");
  const backBtn = document.createElement("button"); backBtn.type = "button"; backBtn.textContent = "←"; backBtn.setAttribute("aria-label", "Back");
  const count = document.createElement("span"); count.className = "guide-count";
  const nextBtn = document.createElement("button"); nextBtn.type = "button"; nextBtn.className = "primary"; nextBtn.textContent = "Next →";
  const keys = document.createElement("span"); keys.className = "guide-keys"; keys.textContent = "or press →";
  const stopBtn = document.createElement("button"); stopBtn.type = "button"; stopBtn.className = "guide-stop"; stopBtn.textContent = "✕"; stopBtn.setAttribute("aria-label", "Stop guiding");
  bar.append(backBtn, count, nextBtn, keys, stopBtn);

  function setup() {
    if (!document.querySelector("main[data-paged]")) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    const top = document.querySelector(".topbar");
    if (top) top.appendChild(toggle);
    document.body.appendChild(bar);
    document.body.appendChild(glow);
    window.addEventListener("resize", placeGlow);
    if (window.ResizeObserver) new ResizeObserver(placeGlow).observe(document.querySelector("main[data-paged]"));
    document.addEventListener("transitionend", placeGlow);

    toggle.addEventListener("click", () => { setOn(!on); toggle.blur(); });
    stopBtn.addEventListener("click", () => setOn(false));
    nextBtn.addEventListener("click", () => { move(1); nextBtn.blur(); });
    backBtn.addEventListener("click", () => { move(-1); backBtn.blur(); });

    // Keys. Step through (on the code page) handles its own arrows first.
    document.addEventListener("keydown", (e) => {
      if (!on || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const d = e.key === "ArrowRight" ? 1 : -1;
      if (e.shiftKey) pageGo(d, 0); else move(d);
    }, true);

    // Clicking something on the page moves the glow there
    document.addEventListener("click", (e) => {
      if (!on || !section || !section.contains(e.target)) return;
      buildSteps();
      const k = steps.findIndex(group => group.some(el => el.contains(e.target)));
      if (k >= 0 && k !== step) { step = k; show(false); }
    });

    // A new page (Next link, page list, arrows): start at its first thing (or last, when going back)
    const main = document.querySelector("main[data-paged]");
    new MutationObserver(() => {
      const now = document.querySelector("main[data-paged] section.part:not([hidden])");
      if (now === section) return;
      if (wantLast) { buildSteps(); step = steps.length - 1; wantLast = false; } else step = 0;
      requestAnimationFrame(() => show(true));
    }).observe(main, { attributes: true, subtree: true, attributeFilter: ["hidden"] });

    on = load();
    document.body.classList.toggle("guiding", on);
    toggle.textContent = on ? "🧭 Guiding" : "🧭 Guide me";
    toggle.setAttribute("aria-pressed", on ? "true" : "false");
    if (on) {
      if (startHash === "#last") step = 1e9;
      requestAnimationFrame(() => show(false));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
