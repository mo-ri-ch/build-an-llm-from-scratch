// ---------- Pen: write your own notes on the slides ----------
// Press P (or the small ✎ in the left margin) to turn the pen on or off.
// Each slide keeps its own notes, saved in this browser only.
// This file is self-contained: it adds its own styles and doesn't change anything else on the page.
(function () {
  const COLORS = [
    { name: "Blue pen",    color: "#2B4FD8", width: 3,  alpha: 1 },
    { name: "Red pen",     color: "#D2283A", width: 3,  alpha: 1 },
    { name: "Green pen",   color: "#1E8F4E", width: 3,  alpha: 1 },
    { name: "Highlighter", color: "#FFD60A", width: 18, alpha: 0.4 },
  ];
  const KEY = "tiny-llm-notes:" + location.pathname.replace(/index\.html$/, "");

  const css = `
  .pen-layer { position: absolute; left: 0; top: 0; pointer-events: none; z-index: 4; }
  body.pen-on .pen-layer { pointer-events: auto; touch-action: none; cursor: crosshair; }
  body.pen-on.pen-erasing .pen-layer { cursor: cell; }
  .pen-host { position: relative; }
  .pen-tools { position: fixed; left: 8px; top: 50%; transform: translateY(-50%); z-index: 6;
    display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .pen-tools button { width: 34px; height: 34px; padding: 0; border-radius: 50%; display: grid; place-items: center;
    font-size: 1rem; line-height: 1; background: var(--card, #fff); border: 2px solid var(--ink, #1D2238); color: var(--ink, #1D2238); }
  .pen-tools .pen-toggle { opacity: 0.35; border-color: transparent; background: transparent; font-size: 1.15rem; }
  .pen-tools .pen-toggle:hover { opacity: 1; }
  body.pen-on .pen-tools .pen-toggle { opacity: 1; background: var(--ink, #1D2238); color: var(--paper, #fff); border-color: var(--ink, #1D2238); }
  .pen-tools .pen-more { display: none; flex-direction: column; gap: 8px; }
  body.pen-on .pen-tools .pen-more { display: flex; }
  .pen-tools .swatch span { width: 16px; height: 16px; border-radius: 50%; display: block; }
  .pen-tools .on { box-shadow: 0 0 0 3px var(--hl-yellow, #FFE45C); }
  .pen-tools .small { font-size: 0.75rem; }
  @media print { .pen-tools { display: none; } }
  `;

  function setup() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    // One drawing surface per slide (or one for a page without slides)
    let hosts = Array.from(document.querySelectorAll("main[data-paged] section.part"));
    if (!hosts.length) hosts = Array.from(document.querySelectorAll("main")).slice(0, 1);
    if (!hosts.length) return;

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { saved = {}; }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* ignore */ } }

    let tool = COLORS[0], erasing = false;

    const pages = hosts.map((host, i) => {
      host.classList.add("pen-host");
      const canvas = document.createElement("canvas");
      canvas.className = "pen-layer";
      canvas.setAttribute("aria-hidden", "true");
      host.appendChild(canvas);
      const page = { host, canvas, id: String(i), strokes: saved[String(i)] || [], width: 1 };

      // Notes are stored relative to the slide's width, so they stay in place when the size changes
      function size() {
        canvas.style.height = "0px"; // measure the slide without the old drawing surface
        const w = host.offsetWidth, h = host.scrollHeight;
        if (!w || !h) return;
        const dpr = window.devicePixelRatio || 1;
        page.width = w;
        canvas.style.width = w + "px"; canvas.style.height = h + "px";
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        draw(page);
      }
      page.size = size;
      if (window.ResizeObserver) new ResizeObserver(size).observe(host);
      size();

      let current = null;
      function point(e) {
        const r = canvas.getBoundingClientRect();
        const pressure = e.pointerType === "pen" && e.pressure ? e.pressure : 0.5;
        return [(e.clientX - r.left) / page.width, (e.clientY - r.top) / page.width, +pressure.toFixed(2)];
      }
      canvas.addEventListener("pointerdown", (e) => {
        if (!document.body.classList.contains("pen-on")) return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        if (erasing || e.button === 5) { eraseAt(page, point(e)); current = "erase"; return; }
        current = { c: tool.color, w: tool.width, a: tool.alpha, p: [point(e)] };
        page.strokes.push(current);
        draw(page);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!current) return;
        if (current === "erase") { eraseAt(page, point(e)); return; }
        current.p.push(point(e));
        draw(page);
      });
      function end() {
        if (!current) return;
        current = null;
        saved[page.id] = page.strokes; save();
      }
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
      return page;
    });

    function draw(page) {
      const ctx = page.canvas.getContext("2d");
      const k = page.canvas.width; // canvas pixels per one slide width
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, page.canvas.width, page.canvas.height);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      page.strokes.forEach((s) => {
        ctx.globalAlpha = s.a;
        ctx.strokeStyle = s.c;
        const scale = page.canvas.width / 900; // line widths grow and shrink with the slide
        if (s.a < 1) {
          // Highlighter: one even, see-through stroke
          ctx.lineWidth = s.w * scale;
          ctx.beginPath();
          s.p.forEach(([x, y], i) => i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k));
          if (s.p.length === 1) ctx.lineTo(s.p[0][0] * k + 0.1, s.p[0][1] * k);
          ctx.stroke();
        } else {
          // Pen: each piece a little thicker when you press harder
          for (let i = 0; i < s.p.length; i++) {
            const a = s.p[Math.max(0, i - 1)], b = s.p[i];
            ctx.lineWidth = s.w * scale * (0.5 + b[2]);
            ctx.beginPath();
            ctx.moveTo(a[0] * k, a[1] * k);
            ctx.lineTo(b[0] * k + (i ? 0 : 0.1), b[1] * k);
            ctx.stroke();
          }
        }
      });
      ctx.globalAlpha = 1;
    }

    // The eraser removes any line it touches
    function eraseAt(page, [x, y]) {
      const reach = 12 / page.width;
      const before = page.strokes.length;
      page.strokes = page.strokes.filter((s) => !s.p.some(([px, py]) => Math.abs(px - x) < reach && Math.abs(py - y) < reach));
      if (page.strokes.length !== before) { saved[page.id] = page.strokes; save(); draw(page); }
    }

    function visiblePage() { return pages.find((p) => !p.host.hidden && p.host.offsetParent !== null) || pages[0]; }

    // ----- The tools, in the left margin -----
    const box = document.createElement("div");
    box.className = "pen-tools";
    const toggle = document.createElement("button");
    toggle.className = "pen-toggle";
    toggle.type = "button";
    toggle.title = "Pen (P)";
    toggle.setAttribute("aria-label", "Pen: write notes on this slide (P)");
    toggle.setAttribute("aria-pressed", "false");
    toggle.textContent = "✎";
    const more = document.createElement("div");
    more.className = "pen-more";

    const swatches = COLORS.map((t) => {
      const b = document.createElement("button");
      b.className = "swatch"; b.type = "button"; b.title = t.name; b.setAttribute("aria-label", t.name);
      b.innerHTML = `<span style="background:${t.color}"></span>`;
      b.onclick = () => { tool = t; erasing = false; mark(); };
      more.appendChild(b);
      return b;
    });
    const eraser = document.createElement("button");
    eraser.type = "button"; eraser.title = "Eraser: touch a line to remove it"; eraser.setAttribute("aria-label", "Eraser");
    eraser.textContent = "⌫";
    eraser.onclick = () => { erasing = true; mark(); };
    const undo = document.createElement("button");
    undo.type = "button"; undo.className = "small"; undo.title = "Undo (Ctrl+Z)"; undo.setAttribute("aria-label", "Undo");
    undo.textContent = "↶";
    undo.onclick = undoLast;
    const clear = document.createElement("button");
    clear.type = "button"; clear.className = "small"; clear.title = "Clear notes on this slide"; clear.setAttribute("aria-label", "Clear notes on this slide");
    clear.textContent = "✕";
    let clearArmed = null;
    clear.onclick = () => {
      // Press twice to clear, so it can't happen by accident
      if (!clearArmed) {
        clear.textContent = "?"; clear.title = "Press again to clear this slide";
        clearArmed = setTimeout(disarm, 2500);
        return;
      }
      disarm();
      const p = visiblePage(); p.strokes = []; saved[p.id] = []; save(); draw(p);
    };
    function disarm() { clearTimeout(clearArmed); clearArmed = null; clear.textContent = "✕"; clear.title = "Clear notes on this slide"; }
    more.append(eraser, undo, clear);
    box.append(toggle, more);
    document.body.appendChild(box);

    function mark() {
      swatches.forEach((b, i) => b.classList.toggle("on", !erasing && COLORS[i] === tool));
      eraser.classList.toggle("on", erasing);
      document.body.classList.toggle("pen-erasing", erasing);
    }
    function undoLast() {
      const p = visiblePage();
      if (!p.strokes.length) return;
      p.strokes.pop(); saved[p.id] = p.strokes; save(); draw(p);
    }
    function setOn(on) {
      document.body.classList.toggle("pen-on", on);
      toggle.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) pages.forEach((p) => p.size());
    }
    toggle.onclick = () => setOn(!document.body.classList.contains("pen-on"));
    mark();

    document.addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey && !e.altKey) setOn(!document.body.classList.contains("pen-on"));
      else if (e.key === "Escape" && document.body.classList.contains("pen-on")) setOn(false);
      else if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && document.body.classList.contains("pen-on")) { e.preventDefault(); undoLast(); }
    });

    // When a slide appears (or the page changes size), fit its notes to it
    if (window.MutationObserver) {
      const mo = new MutationObserver(() => { const p = visiblePage(); if (p) p.size(); });
      pages.forEach((p) => mo.observe(p.host, { attributes: true, attributeFilter: ["hidden"] }));
    }
    window.addEventListener("resize", () => pages.forEach((p) => p.size()));
    window.addEventListener("load", () => pages.forEach((p) => p.size()));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
