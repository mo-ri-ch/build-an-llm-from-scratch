// Practice pages: type a number, press Check. Markup: .activity > .pq[data-ans data-tol data-hint data-work] > .pq-q, .pq-in (input + button.pq-check), .pq-fb
(function () {
  const st = document.createElement("style");
  st.textContent = `
  .pq { margin: 0 0 14px; padding-bottom: 12px; border-bottom: 1px dashed var(--rule, #ccc); }
  .pq-q { margin-bottom: 6px; }
  .pq-in { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .pq-in input { font: inherit; font-family: var(--mono); width: 8em; padding: 4px 8px; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper); color: var(--ink); }
  .pq-fb { margin-top: 6px; font-size: 0.92rem; }
  .pq.ok .pq-fb { color: var(--good, #1E8F4E); } .pq.bad .pq-fb { color: var(--redpen); }
  .pq.ok input { border-color: var(--good, #1E8F4E); }
  `;
  document.head.appendChild(st);
})();
// ---------- practice pages: type a number, press Check ----------
(function practice() {
  const num = t => { t = t.trim().replace(/[−–]/g, "-").replace(/,/g, "."); const m = t.match(/^(-?[\d.]+)\s*\/\s*([\d.]+)$/); return m ? Number(m[1]) / Number(m[2]) : Number(t); };
  const ans = q => num(q.dataset.ans);
  document.querySelectorAll(".pq").forEach(q => {
    const inp = q.querySelector("input"), btn = q.querySelector(".pq-check"), fb = q.querySelector(".pq-fb");
    const check = () => {
      const v = num(inp.value);
      if (!isFinite(v) || !inp.value.trim()) return;
      if (Math.abs(v - ans(q)) <= Number(q.dataset.tol)) { q.className = "pq ok"; fb.innerHTML = "✓ " + q.dataset.work; }
      else { q.className = "pq bad"; fb.innerHTML = "Not yet. " + q.dataset.hint + ' <button type="button" class="pq-show">Show working</button>'; fb.querySelector(".pq-show").onclick = () => { fb.innerHTML = q.dataset.work; }; }
    };
    inp.oninput = () => { btn.hidden = !inp.value.trim(); q.className = "pq"; fb.textContent = ""; };
    inp.onkeydown = e => { if (e.key === "Enter") check(); };
    btn.onclick = check;
  });
  const addResets = () => {
    document.querySelectorAll(".pq").forEach((q, i, all) => { if (q === q.closest(".activity").querySelector(".pq")) addReset(q, () => q.closest(".activity").querySelectorAll(".pq").forEach(x => { x.className = "pq"; x.querySelector("input").value = ""; x.querySelector(".pq-check").hidden = true; x.querySelector(".pq-fb").textContent = ""; })); });
  };
  if (typeof addReset === "function") addResets(); else window.addEventListener("load", addResets);
})();
