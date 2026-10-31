// Code lines inside the lesson text: <div class="cl"><pre><code>…</code></pre><div class="cl-meta">…</div></div>
// A "Code" switch in the lesson header shows or hides all of them (the choice is remembered).
(function () {
  const st = document.createElement("style");
  st.textContent = `
  .cl { margin: 4px 0 16px; }
  .cl pre { margin: 0; }
  .cl-meta { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: baseline; margin-top: 6px; font-size: 0.9rem; color: var(--pencil); }
  .cl-out { font-family: var(--mono); font-size: 0.85rem; color: var(--good, #1E8F4E); }
  .cl-setup { margin: 0 0 6px; font-size: 0.9rem; color: var(--pencil); }
  .cl-setup summary { cursor: pointer; }
  .cl-setup pre { margin-top: 6px; }
  body.no-code .cl { display: none; }
  .code-toggle { font: inherit; font-size: 0.85rem; padding: 2px 10px; margin: 0 0 0 12px; border: 2px solid var(--ink); border-radius: var(--radius, 8px); background: var(--paper); color: var(--ink); cursor: pointer; }
  `;
  document.head.appendChild(st);
  const KEY = "tiny-llm-showcode";
  const on = () => { try { return localStorage.getItem(KEY) !== "0"; } catch (e) { return true; } };
  function setup() {
    if (!document.querySelector(".cl")) return;
    const head = document.querySelector(".topbar");
    if (!head) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "code-toggle";
    const apply = () => { const v = on(); document.body.classList.toggle("no-code", !v); b.textContent = v ? "💻 Code: shown" : "💻 Code: hidden"; b.setAttribute("aria-pressed", v ? "true" : "false"); };
    b.onclick = () => { try { localStorage.setItem(KEY, on() ? "0" : "1"); } catch (e) { /* ignore */ } apply(); };
    head.appendChild(b); apply();
  }
  if (document.readyState === "complete") setup(); else window.addEventListener("load", setup);
})();
