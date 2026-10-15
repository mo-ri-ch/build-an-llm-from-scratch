// finalmodel.js — the model students build by the end of the course (Lessons 6–9):
// a small character-level transformer trained on Shakespeare, running in the browser.
// Weights come from PyTorch (assets/neo-final.json). Same math as the Python model.

class FinalModel {
  static async load(url) {
    const data = await (await fetch(url)).json();
    return new FinalModel(data);
  }

  constructor(data) {
    this.chars = data.chars;
    this.stoi = {};
    this.chars.forEach((c, i) => { this.stoi[c] = i; });
    Object.assign(this, data.cfg);           // C, H, L, T, V
    this.w = {};
    for (const [name, t] of Object.entries(data.tensors)) this.w[name] = FinalModel.unpack(t);
    this.reset();
  }

  // int8 rows + one scale per row  ->  Float32Array
  static unpack(t) {
    if (t.f) return Float32Array.from(t.f);
    const bytes = Uint8Array.from(atob(t.q), ch => ch.charCodeAt(0));
    const q = new Int8Array(bytes.buffer);
    const [rows, cols] = t.shape;
    const out = new Float32Array(rows * cols);
    for (let r = 0; r < rows; r++) {
      const s = t.scale[r];
      for (let c = 0; c < cols; c++) out[r * cols + c] = q[r * cols + c] * s;
    }
    out.cols = cols;
    return out;
  }

  reset() { this.cache = []; this.pos = 0; }

  // y = W x + b, where W has shape [out, in]
  linear(x, name) {
    const W = this.w[name + ".weight"], b = this.w[name + ".bias"];
    const n = W.cols, m = W.length / n, y = new Float32Array(m);
    for (let i = 0; i < m; i++) {
      let s = b ? b[i] : 0;
      const off = i * n;
      for (let j = 0; j < n; j++) s += W[off + j] * x[j];
      y[i] = s;
    }
    return y;
  }

  layerNorm(x, name) {
    const g = this.w[name + ".weight"], b = this.w[name + ".bias"], n = x.length;
    let mean = 0; for (let i = 0; i < n; i++) mean += x[i]; mean /= n;
    let v = 0; for (let i = 0; i < n; i++) v += (x[i] - mean) ** 2; v /= n;
    const inv = 1 / Math.sqrt(v + 1e-5), y = new Float32Array(n);
    for (let i = 0; i < n; i++) y[i] = (x[i] - mean) * inv * g[i] + b[i];
    return y;
  }

  static gelu(x) {
    // exact GELU (like PyTorch): x * 0.5 * (1 + erf(x / sqrt 2))
    const z = x / Math.SQRT2, t = 1 / (1 + 0.3275911 * Math.abs(z));
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return 0.5 * x * (1 + (z >= 0 ? erf : -erf));
  }

  // Feed one character; returns the chances for the next one
  step(id) {
    const { C, H, L } = this;
    const d = C / H;
    const tok = this.w["tok.weight"], pos = this.w["pos.weight"];
    let x = new Float32Array(C);
    for (let i = 0; i < C; i++) x[i] = tok[id * C + i] + pos[this.pos * C + i];

    for (let l = 0; l < L; l++) {
      const p = `blocks.${l}.`;
      if (!this.cache[l]) this.cache[l] = { k: [], v: [] };
      const qkv = this.linear(this.layerNorm(x, p + "ln1"), p + "qkv");
      const q = qkv.subarray(0, C), k = qkv.slice(C, 2 * C), v = qkv.slice(2 * C);
      this.cache[l].k.push(k); this.cache[l].v.push(v);
      const K = this.cache[l].k, Vv = this.cache[l].v, y = new Float32Array(C);
      for (let h = 0; h < H; h++) {
        const o = h * d, scores = new Float32Array(K.length);
        let max = -Infinity;
        for (let t = 0; t < K.length; t++) {
          let s = 0; for (let j = 0; j < d; j++) s += q[o + j] * K[t][o + j];
          scores[t] = s / Math.sqrt(d); if (scores[t] > max) max = scores[t];
        }
        let sum = 0; for (let t = 0; t < K.length; t++) { scores[t] = Math.exp(scores[t] - max); sum += scores[t]; }
        for (let t = 0; t < K.length; t++) {
          const a = scores[t] / sum;
          for (let j = 0; j < d; j++) y[o + j] += a * Vv[t][o + j];
        }
      }
      const att = this.linear(y, p + "proj");
      for (let i = 0; i < C; i++) x[i] += att[i];
      const f = this.linear(this.layerNorm(x, p + "ln2"), p + "fc1");
      for (let i = 0; i < f.length; i++) f[i] = FinalModel.gelu(f[i]);
      const m = this.linear(f, p + "fc2");
      for (let i = 0; i < C; i++) x[i] += m[i];
    }
    this.pos++;
    const logits = this.linear(this.layerNorm(x, "ln"), "head");
    return softmax(Array.from(logits));
  }

  // Read a whole text (keeps only the last T characters the model can see)
  read(text) {
    this.reset();
    const ids = Array.from(text).map(c => this.stoi[c]).filter(i => i !== undefined).slice(-this.T);
    let chances = null;
    for (const id of ids) chances = this.step(id);
    return chances;
  }

  // Add one character to what has been read. When the window is full, start again
  // from the last half of it (so it slides now and then, not on every letter).
  next(text) {
    if (this.pos >= this.T) return this.read(text.slice(-Math.floor(this.T / 2)));
    const id = this.stoi[text[text.length - 1]];
    return this.step(id);
  }
}
