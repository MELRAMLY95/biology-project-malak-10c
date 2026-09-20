window.CLONING = window.CLONING || {};
CLONING.$ = (s, r = document) => r.querySelector(s);
CLONING.$$ = (s, r = document) => [...r.querySelectorAll(s)];

CLONING.store = {
  key: "clone-lab-v3",
  load() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; } },
  save(d) { localStorage.setItem(this.key, JSON.stringify(d)); }
};

CLONING.audio = {
  on: false, ctx: null,
  toggle() { this.on = !this.on; if (this.on) this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); return this.on; },
  tone(f, d = 0.07, g = 0.03) {
    if (!this.on) return;
    const c = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = c;
    const o = c.createOscillator(), a = c.createGain();
    o.frequency.value = f; a.gain.value = g; o.connect(a); a.connect(c.destination);
    o.start(); a.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d); o.stop(c.currentTime + d);
  },
  ok() { this.tone(640); },
  bad() { this.tone(170, 0.12); }
};

CLONING.ENVS = {
  cellular: { a: [8, 28, 36], b: [20, 70, 55], c: [180, 120, 50] },
  lab: { a: [10, 16, 28], b: [30, 50, 80], c: [80, 160, 170] },
  greenhouse: { a: [8, 22, 12], b: [40, 90, 40], c: [160, 140, 40] },
  genetics: { a: [12, 10, 28], b: [50, 40, 90], c: [90, 70, 160] },
  bacteria: { a: [6, 14, 18], b: [30, 80, 70], c: [200, 160, 70] },
  gene: { a: [14, 8, 22], b: [70, 30, 90], c: [40, 160, 180] },
  ethics: { a: [8, 8, 14], b: [40, 30, 50], c: [160, 90, 40] },
  finale: { a: [6, 12, 22], b: [40, 80, 90], c: [120, 180, 160] }
};

CLONING.World = {
  c: null, ctx: null, t: 0, running: false, env: "cellular",
  mx: 0.5, my: 0.4, bits: [], cells: [], reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  init() {
    this.c = document.getElementById("world");
    this.ctx = this.c.getContext("2d", { alpha: true });
    this.resize();
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => this.resize(), 120); });
    addEventListener("pointermove", (e) => { this.mx = e.clientX / innerWidth; this.my = e.clientY / innerHeight; }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.running = false;
      else this.start();
    });
    const n = this.reduced ? 10 : 22;
    this.bits = Array.from({ length: n }, () => this.bit());
    this.cells = Array.from({ length: this.reduced ? 2 : 4 }, () => this.cell());
    this.start();
  },
  setEnv(name) {
    this.env = name;
    document.body.dataset.env = name;
  },
  bit() {
    return { x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + 0.4, vx: (Math.random() - 0.5) * 0.00025, vy: (Math.random() - 0.5) * 0.00025, k: Math.random() };
  },
  cell() {
    return { x: Math.random(), y: Math.random(), r: 18 + Math.random() * 34, vx: (Math.random() - 0.5) * 0.00008, vy: (Math.random() - 0.5) * 0.00008, p: Math.random() * 6 };
  },
  resize() {
    this.ctx = CLONING.fit(this.c, innerWidth, innerHeight);
    this.c.style.width = innerWidth + "px";
    this.c.style.height = innerHeight + "px";
  },
  start() {
    if (this.running || document.hidden) return;
    this.running = true;
    let last = 0;
    const loop = (now) => {
      if (!this.running) return;
      if (now - last > 48) { last = now; this.t += 0.05; this.draw(); }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },
  draw() {
    const ctx = this.ctx, w = innerWidth, h = innerHeight, e = CLONING.ENVS[this.env];
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(this.mx * w, this.my * h, 40, w * 0.5, h * 0.45, Math.max(w, h) * 0.7);
    g.addColorStop(0, `rgba(${e.b[0]},${e.b[1]},${e.b[2]},0.16)`);
    g.addColorStop(1, `rgba(${e.a[0]},${e.a[1]},${e.a[2]},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    this.cells.forEach((cl) => {
      cl.x += cl.vx; cl.y += cl.vy;
      if (cl.x < -0.1) cl.x = 1.1; if (cl.x > 1.1) cl.x = -0.1;
      if (cl.y < -0.1) cl.y = 1.1; if (cl.y > 1.1) cl.y = -0.1;
      const x = cl.x * w, y = cl.y * h;
      ctx.beginPath(); ctx.ellipse(x, y, cl.r, cl.r * 0.82, cl.p, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${e.b[0]},${e.b[1]},${e.b[2]},0.06)`;
      ctx.fill();
    });

    ctx.fillStyle = `rgba(${e.c[0]},${e.c[1]},${e.c[2]},0.22)`;
    this.bits.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2); ctx.fill();
    });
  }
};

CLONING.Log = {
  el: null,
  lines: [],
  init() { this.el = document.getElementById("log"); },
  push(msg) {
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    this.lines.unshift(`${t} — ${msg}`);
    this.lines = this.lines.slice(0, 12);
    if (this.el) this.el.innerHTML = this.lines.map((l) => `<li>${l}</li>`).join("");
  },
  clear() { this.lines = []; if (this.el) this.el.innerHTML = ""; }
};

CLONING.toast = (msg, kind = "") => {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast " + kind;
  el.hidden = false;
  clearTimeout(CLONING.toast._t);
  CLONING.toast._t = setTimeout(() => { el.hidden = true; }, 3200);
};

CLONING.dpr = () => Math.min(1.25, devicePixelRatio || 1);
CLONING.fit = (canvas, w, h) => {
  const d = CLONING.dpr();
  if (canvas._fw === w && canvas._fh === h && canvas._fd === d) return canvas.getContext("2d");
  canvas._fw = w; canvas._fh = h; canvas._fd = d;
  canvas.width = Math.max(1, w * d);
  canvas.height = Math.max(1, h * d);
  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.setTransform(d, 0, 0, d, 0, 0);
  return ctx;
};
CLONING.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
