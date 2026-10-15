// ---------- Pen: write your own notes anywhere on the screen ----------
// Press P (or the small ✎ in the left margin) to turn the pen on or off.
// Notes belong to the slide you wrote them on: they scroll with it and come back with it.
// Saved in this browser only.
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
  .pen-layer { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9998; }
  body.pen-on .pen-layer { pointer-events: auto; touch-action: none; cursor: crosshair; }
  body.pen-on.pen-erasing .pen-layer { cursor: cell; }
  .pen-tools { position: fixed; left: 8px; top: 50%; transform: translateY(-50%); z-index: 9999;
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
  .pen-tools .pen-ask { position: absolute; left: 46px; bottom: 0; width: 230px; padding: 14px 16px; text-align: left;
    background: var(--card, #fff); border: 2px solid var(--ink, #1D2238); border-radius: 10px; box-shadow: 3px 3px 0 var(--ink, #1D2238);
    font-size: 0.95rem; color: var(--ink, #1D2238); }
  .pen-tools .pen-ask[hidden] { display: none; }
  .pen-tools .pen-ask p { margin: 0 0 4px; }
  .pen-tools .pen-ask .pen-ask-small { color: var(--pencil, #626A7E); font-size: 0.8rem; margin-bottom: 12px; }
  .pen-tools .pen-ask-row { display: flex; gap: 8px; }
  .pen-tools .pen-ask-row button { width: auto; height: auto; border-radius: 8px; padding: 6px 12px; font-size: 0.85rem; display: inline-block; }
  .pen-tools .pen-ask .pen-yes { background: var(--redpen, #D2283A); border-color: var(--redpen, #D2283A); color: #fff; }
  .pen-tools .all { font-size: 0.62rem; font-weight: 700; color: var(--redpen, #D2283A); border-color: var(--redpen, #D2283A); }
  @media print { .pen-tools, .pen-layer { display: none; } }
  `;

  function setup() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    // Notes are pinned to a slide (or to the page when it has no slides)
    let hosts = Array.from(document.querySelectorAll("main[data-paged] section.part"));
    if (!hosts.length) hosts = Array.from(document.querySelectorAll("main")).slice(0, 1);
    if (!hosts.length) return;

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { saved = {}; }
    // Always pick up the latest notes when you come back to a page (Back button, another tab, "All" cleared)
    function reload() {
      try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { saved = {}; }
      requestRedraw();
    }
    window.addEventListener("pageshow", reload);
    window.addEventListener("focus", reload);
    window.addEventListener("storage", (e) => { if (e.key === null || e.key === KEY) reload(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) reload(); });
    function save() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* ignore */ } }
    function strokesOf(i) { return saved[i] || (saved[i] = []); }

    function currentIndex() {
      const i = hosts.findIndex((h) => !h.hidden && h.offsetParent !== null);
      return i < 0 ? 0 : i;
    }

    // One see-through sheet over the whole screen
    const canvas = document.createElement("canvas");
    canvas.className = "pen-layer";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    let dpr = 1;

    function fitCanvas() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      redraw();
    }

    // Points are saved relative to the slide: x and y in "slide widths" from its top-left corner.
    // So notes follow the slide when it scrolls, and grow or shrink with it. They can be outside it too.
    function frame() {
      const r = hosts[currentIndex()].getBoundingClientRect();
      return { left: r.left, top: r.top, w: r.width || 1 };
    }
    function toScreen(f, p) { return [(f.left + p[0] * f.w) * dpr, (f.top + p[1] * f.w) * dpr]; }

    function drawStroke(s, f) {
      const pts = s.p.map((p) => toScreen(f, p));
      const scale = (f.w * dpr) / 900; // line widths grow and shrink with the slide
      ctx.globalAlpha = s.a;
      ctx.strokeStyle = s.c;
      ctx.fillStyle = s.c;
      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0][0], pts[0][1], (s.w * scale * (s.a < 1 ? 1 : 0.5 + s.p[0][2])) / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (s.a < 1) {
        // Highlighter: one even, see-through stroke, smoothed with curves
        ctx.lineWidth = s.w * scale;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
          ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last[0], last[1]);
        ctx.stroke();
        return;
      }
      // Pen: smooth curves through the midpoints, a little thicker where you press harder
      let prevMid = pts[0];
      for (let i = 1; i < pts.length; i++) {
        const mid = i < pts.length - 1 ? [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2] : pts[i];
        ctx.lineWidth = s.w * scale * (0.5 + s.p[i][2]);
        ctx.beginPath();
        ctx.moveTo(prevMid[0], prevMid[1]);
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mid[0], mid[1]);
        ctx.stroke();
        prevMid = mid;
      }
    }

    function redraw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const f = frame();
      strokesOf(currentIndex()).forEach((s) => drawStroke(s, f));
      ctx.globalAlpha = 1;
    }
    // At most one redraw per screen refresh, so writing stays smooth
    let queued = false;
    function requestRedraw() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; redraw(); });
    }

    let tool = COLORS[0], erasing = false, current = null, tap = null;

    function toSlide(e, f) {
      const pressure = e.pointerType === "pen" && e.pressure ? e.pressure : 0.5;
      return [+((e.clientX - f.left) / f.w).toFixed(5), +((e.clientY - f.top) / f.w).toFixed(5), +pressure.toFixed(2)];
    }

    canvas.addEventListener("pointerdown", (e) => {
      if (!document.body.classList.contains("pen-on")) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const f = frame();
      if (erasing || e.button === 5) { current = "erase"; eraseAt(toSlide(e, f), f); return; }
      current = { c: tool.color, w: tool.width, a: tool.alpha, p: [toSlide(e, f)] };
      strokesOf(currentIndex()).push(current);
      tap = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false };
      requestRedraw();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!current) return;
      const f = frame();
      // Use every point the pen reported, not only one per frame: smoother lines
      const all = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      const events = all.length ? all : [e];
      if (current === "erase") { events.forEach((ev) => eraseAt(toSlide(ev, f), f)); return; }
      if (tap && Math.abs(e.clientX - tap.x) + Math.abs(e.clientY - tap.y) > 6) tap.moved = true;
      events.forEach((ev) => {
        const p = toSlide(ev, f), last = current.p[current.p.length - 1];
        if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) > 0.5 / f.w) current.p.push(p);
      });
      requestRedraw();
    });
    function end(e) {
      if (!current) return;
      const stroke = current;
      current = null;
      // A quick tap (no drawing) clicks whatever is under the pen, so you can use the slide without turning the pen off
      if (stroke !== "erase" && tap && !tap.moved && Date.now() - tap.t < 300 && e.type === "pointerup") {
        const list = strokesOf(currentIndex());
        list.splice(list.indexOf(stroke), 1);
        requestRedraw();
        clickUnder(e.clientX, e.clientY);
      }
      tap = null;
      save();
    }
    function clickUnder(x, y) {
      canvas.style.pointerEvents = "none";
      const el = document.elementFromPoint(x, y);
      canvas.style.pointerEvents = "";
      if (!el) return;
      const field = el.closest("input, select, textarea");
      if (field && !/checkbox|radio|button|submit|reset/.test(field.type)) {
        field.focus();
        if (field.tagName === "SELECT" && field.showPicker) { try { field.showPicker(); } catch (err) { /* ignore */ } }
        return;
      }
      el.click();
    }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);

    // The eraser removes any line it touches
    function eraseAt([x, y], f) {
      const reach = 12 / f.w;
      const i = currentIndex();
      const list = strokesOf(i);
      const kept = list.filter((s) => !s.p.some(([px, py]) => Math.abs(px - x) < reach && Math.abs(py - y) < reach));
      if (kept.length !== list.length) { saved[i] = kept; save(); requestRedraw(); }
    }

    // ----- The tools, in the left margin -----
    const box = document.createElement("div");
    box.className = "pen-tools";
    const toggle = document.createElement("button");
    toggle.className = "pen-toggle";
    toggle.type = "button";
    toggle.title = "Pen (P)";
    toggle.setAttribute("aria-label", "Pen: write notes on the screen (P)");
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
      saved[currentIndex()] = []; save(); requestRedraw();
    };
    function disarm() { clearTimeout(clearArmed); clearArmed = null; clear.textContent = "✕"; clear.title = "Clear notes on this slide"; }
    // Clear every note on every page, after a confirmation message
    const clearAll = document.createElement("button");
    clearAll.type = "button"; clearAll.className = "small all";
    clearAll.title = "Clear all notes on every page"; clearAll.setAttribute("aria-label", "Clear all notes on every page");
    clearAll.textContent = "All";
    const ask = document.createElement("div");
    ask.className = "pen-ask"; ask.hidden = true;
    ask.setAttribute("role", "alertdialog"); ask.setAttribute("aria-label", "Clear all notes?");
    ask.innerHTML = '<p>Clear all your notes on every page?</p><p class="pen-ask-small">This can\'t be undone.</p>' +
      '<div class="pen-ask-row"><button type="button" class="pen-yes">Clear all</button><button type="button" class="pen-no">Cancel</button></div>';
    const yes = ask.querySelector(".pen-yes"), no = ask.querySelector(".pen-no");
    function closeAsk() { ask.hidden = true; }
    clearAll.onclick = () => { ask.hidden = !ask.hidden; if (!ask.hidden) no.focus(); };
    no.onclick = closeAsk;
    yes.onclick = () => {
      closeAsk();
      try {
        Object.keys(localStorage).filter((k) => k.indexOf("tiny-llm-notes:") === 0).forEach((k) => localStorage.removeItem(k));
      } catch (e) { /* ignore */ }
      saved = {}; requestRedraw();
    };
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !ask.hidden) { e.stopImmediatePropagation(); closeAsk(); } }, true);
    box.appendChild(ask);
    more.append(eraser, undo, clear, clearAll);
    box.append(toggle, more);
    document.body.appendChild(box);

    function mark() {
      swatches.forEach((b, i) => b.classList.toggle("on", !erasing && COLORS[i] === tool));
      eraser.classList.toggle("on", erasing);
      document.body.classList.toggle("pen-erasing", erasing);
      setCursor();
      remember();
    }
    // The pointer is a dot: the same size and colour as the line it will draw
    function setCursor() {
      const f = frame();
      let svg, r;
      if (erasing) {
        r = 12; // the eraser's reach
        svg = `<circle cx="${r + 1}" cy="${r + 1}" r="${r}" fill="rgba(255,255,255,0.5)" stroke="#1D2238" stroke-width="1.5"/>`;
      } else {
        const d = Math.max(4, tool.width * (f.w / 900)); // same width as a mouse line
        r = d / 2;
        svg = `<circle cx="${r + 1}" cy="${r + 1}" r="${r}" fill="${tool.color}" fill-opacity="${tool.alpha < 1 ? 0.6 : 1}"/>`;
      }
      const size = Math.ceil(r * 2 + 2), c = Math.round(r + 1);
      const url = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${svg}</svg>`);
      canvas.style.cursor = `url("${url}") ${c} ${c}, crosshair`;
    }
    // The pen setting (on/off, colour, eraser) follows you to every page
    const SETTINGS = "tiny-llm-pen";
    function remember() {
      try {
        localStorage.setItem(SETTINGS, JSON.stringify({
          on: document.body.classList.contains("pen-on"), tool: COLORS.indexOf(tool), erasing,
        }));
      } catch (e) { /* ignore */ }
    }
    function undoLast() {
      const list = strokesOf(currentIndex());
      if (!list.length) return;
      list.pop(); save(); requestRedraw();
    }
    function setOn(on) {
      document.body.classList.toggle("pen-on", on);
      toggle.setAttribute("aria-pressed", on ? "true" : "false");
      requestRedraw();
      remember();
    }
    toggle.onclick = () => setOn(!document.body.classList.contains("pen-on"));
    let last = {};
    try { last = JSON.parse(localStorage.getItem(SETTINGS) || "{}") || {}; } catch (e) { last = {}; }
    if (COLORS[last.tool]) tool = COLORS[last.tool];
    erasing = !!last.erasing;
    setOn(!!last.on);
    mark();

    document.addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      const on = document.body.classList.contains("pen-on");
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey && !e.altKey) setOn(!on);
      else if (e.key === "Escape" && on) setOn(false);
      else if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && on) { e.preventDefault(); undoLast(); }
    });

    // While the pen is on, the mouse wheel still scrolls the slide underneath.
    // We move the page and redraw the notes in the same frame, with a gentle glide, so both move together smoothly.
    let pendingX = 0, pendingY = 0, gliding = false;
    function scroller() {
      const area = document.querySelector("body.has-thumbs .wrap");
      return area && getComputedStyle(area).position === "fixed" ? area : document.scrollingElement || document.documentElement;
    }
    function glide() {
      const el = scroller();
      const stepX = Math.abs(pendingX) < 1 ? pendingX : pendingX * 0.3;
      const stepY = Math.abs(pendingY) < 1 ? pendingY : pendingY * 0.3;
      el.scrollTo({ left: el.scrollLeft + stepX, top: el.scrollTop + stepY, behavior: "instant" }); // the page's own smooth scrolling would fight our glide
      pendingX -= stepX; pendingY -= stepY;
      // Stop if we reached the top or bottom
      if (Math.abs(pendingY) >= 0.5 && ((pendingY < 0 && el.scrollTop <= 0) || (pendingY > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 1))) pendingY = 0;
      redraw();
      if (Math.abs(pendingX) >= 0.5 || Math.abs(pendingY) >= 0.5) requestAnimationFrame(glide);
      else { pendingX = pendingY = 0; gliding = false; }
    }
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      pendingX += e.deltaX * unit; pendingY += e.deltaY * unit;
      if (!gliding) { gliding = true; requestAnimationFrame(glide); }
    }, { passive: false });

    // Redraw when the slide changes, scrolls or changes size
    if (window.MutationObserver) {
      const mo = new MutationObserver(requestRedraw);
      hosts.forEach((h) => mo.observe(h, { attributes: true, attributeFilter: ["hidden"] }));
    }
    if (window.ResizeObserver) { const ro = new ResizeObserver(requestRedraw); hosts.forEach((h) => ro.observe(h)); }
    document.addEventListener("scroll", requestRedraw, true);
    window.addEventListener("resize", () => { fitCanvas(); setCursor(); });
    window.addEventListener("load", requestRedraw);
    fitCanvas();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
