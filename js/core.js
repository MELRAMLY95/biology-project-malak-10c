export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const store = {
  key: "clone-exhibit-v1",
  load() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; } },
  save(d) {
    const prev = this.load();
    localStorage.setItem(this.key, JSON.stringify(Object.assign({}, prev, d)));
  }
};

export const audio = {
  on: false, ctx: null, hum: null,
  toggle() {
    this.on = !this.on;
    if (this.on) this.startHum();
    else this.stopHum();
    return this.on;
  },
  ctxGet() {
    this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  startHum() {
    const c = this.ctxGet();
    const o = c.createOscillator();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    o.type = "sine"; o.frequency.value = 72;
    f.type = "lowpass"; f.frequency.value = 180;
    g.gain.value = 0.012;
    o.connect(f); f.connect(g); g.connect(c.destination);
    o.start();
    this.hum = { o, g };
  },
  stopHum() {
    try { this.hum?.o.stop(); } catch {}
    this.hum = null;
  },
  tone(f, d = 0.06, v = 0.025) {
    if (!this.on) return;
    const c = this.ctxGet();
    const o = c.createOscillator(), a = c.createGain();
    o.frequency.value = f; o.type = "sine";
    a.gain.value = v;
    o.connect(a); a.connect(c.destination);
    o.start();
    a.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d);
    o.stop(c.currentTime + d);
  },
  ok() { this.tone(520, 0.08, 0.02); },
  bad() { this.tone(140, 0.14, 0.03); },
  click() { this.tone(880, 0.03, 0.015); }
};

export function toast(msg, kind = "") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = kind === "warn" ? "warn" : "";
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 3400);
}

export const NB = {
  lines: {},
  key: "scnt",
  add(k, t) {
    this.lines[k] = this.lines[k] || [];
    this.lines[k].unshift(t);
    this.lines[k] = this.lines[k].slice(0, 18);
    this.render();
  },
  render() {
    const el = $("#nbList");
    if (!el) return;
    const L = this.lines[this.key] || [];
    el.innerHTML = L.length ? L.map((x) => `<li>${x}</li>`).join("") : "<li>No observations yet.</li>";
  }
};

export const done = { scnt: false, plant: false, bac: false, tg: false };
const saved = store.load();
if (saved.done) Object.assign(done, saved.done);

export function markDone(k) {
  done[k] = true;
  store.save({ done });
}

export function dpr() { return Math.min(1.5, devicePixelRatio || 1); }
export function fit(c, w, h) {
  const d = dpr();
  if (c._w === w && c._h === h && c._d === d) return c.getContext("2d");
  c._w = w; c._h = h; c._d = d;
  c.width = Math.max(1, w * d);
  c.height = Math.max(1, h * d);
  const ctx = c.getContext("2d", { alpha: true });
  ctx.setTransform(d, 0, 0, d, 0, 0);
  return ctx;
}

export function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function lerp(a, b, t) { return a + (b - a) * t; }

/** Irregular living cell — not a sticker circle. */
export function drawCell(ctx, o) {
  const { x, y, r, t = 0, kind = "soma", showNuc = true, deform = 0, pulse = 0, hot = false } = o;
  const lobes = 8;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(o.rot || 0);
  ctx.beginPath();
  blob(ctx, 8, 12, r * 1.04, r * 0.86, t, lobes);
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fill();
  ctx.translate(-8, -12);

  const rx = r * (1 + Math.sin(t * 0.7) * 0.018) + deform * 10;
  const ry = r * 0.88 * (1 + Math.cos(t * 0.55) * 0.018) - deform * 5;

  const g = ctx.createRadialGradient(-rx * 0.38, -ry * 0.42, r * 0.06, 4, 6, r * 1.05);
  if (kind === "egg") {
    g.addColorStop(0, "rgba(255,242,220,0.82)");
    g.addColorStop(0.28, "rgba(210,140,80,0.5)");
    g.addColorStop(0.62, "rgba(110,42,32,0.55)");
    g.addColorStop(1, "rgba(18,6,8,0.94)");
  } else if (kind === "bac") {
    g.addColorStop(0, "rgba(190,240,200,0.5)");
    g.addColorStop(0.55, "rgba(40,100,70,0.45)");
    g.addColorStop(1, "rgba(8,28,20,0.92)");
  } else {
    g.addColorStop(0, "rgba(220,255,236,0.58)");
    g.addColorStop(0.35, "rgba(48,120,92,0.42)");
    g.addColorStop(1, "rgba(6,20,16,0.94)");
  }
  ctx.beginPath();
  blob(ctx, 0, 0, rx, ry, t, lobes);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.strokeStyle = hot ? "rgba(220,240,200,0.85)" : (kind === "egg" ? "rgba(255,214,168,0.5)" : "rgba(150,230,190,0.45)");
  ctx.lineWidth = hot ? 3.2 : 2.1;
  ctx.stroke();
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (kind === "egg") {
    ctx.beginPath();
    blob(ctx, 0, 0, rx + 11, ry + 10, t * 0.35, 10);
    ctx.strokeStyle = "rgba(240,200,150,0.2)";
    ctx.lineWidth = 9;
    ctx.stroke();
  }

  for (let i = 0; i < 12; i++) {
    const a = t * 0.28 + i * 0.72;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * rx * 0.4, Math.sin(a * 1.15) * ry * 0.34, 2.4 + (i % 3), 1.6, a, 0, Math.PI * 2);
    ctx.fill();
  }

  if (kind !== "egg" && kind !== "bac") {
    for (let i = 0; i < 5; i++) {
      const a = t * 0.22 + i * 1.1;
      ctx.fillStyle = "rgba(210,140,60,0.38)";
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * rx * 0.42, Math.sin(a) * ry * 0.33, 8, 4.2, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (showNuc) {
    const nx = -6, ny = -5;
    const ng = ctx.createRadialGradient(nx - 4, ny - 4, 2, nx, ny, r * 0.3);
    ng.addColorStop(0, kind === "egg" ? "rgba(160,140,230,0.95)" : "rgba(120,220,180,0.95)");
    ng.addColorStop(1, kind === "egg" ? "rgba(50,30,110,0.92)" : "rgba(20,80,60,0.92)");
    ctx.beginPath();
    ctx.ellipse(nx, ny, r * 0.29, r * 0.25, 0.18, 0, Math.PI * 2);
    ctx.fillStyle = ng;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(nx - 10 + i * 4, ny - 9);
      ctx.quadraticCurveTo(nx - 2 + i * 2, ny + Math.sin(t + i) * 3, nx - 7 + i * 4, ny + 9);
      ctx.stroke();
    }
  }

  if (pulse > 0) {
    ctx.strokeStyle = `rgba(255,230,160,${0.5 * pulse})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    blob(ctx, 0, 0, rx + 10 * pulse, ry + 10 * pulse, t, lobes);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawHelix(ctx, x0, y0, w, t, highlight) {
  for (let i = 0; i < 28; i++) {
    const u = i / 27;
    const x = x0 + u * w;
    const y1 = y0 + Math.sin(u * Math.PI * 6 + t) * 22;
    const y2 = y0 - Math.sin(u * Math.PI * 6 + t) * 22;
    const hi = highlight && u > 0.36 && u < 0.55;
    ctx.strokeStyle = hi ? "rgba(224,160,80,0.95)" : "rgba(160,140,220,0.5)";
    ctx.lineWidth = hi ? 2.4 : 1.4;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    ctx.fillStyle = hi ? "#e0a050" : (i % 2 ? "rgba(126,196,160,0.55)" : "rgba(180,140,210,0.45)");
    ctx.beginPath(); ctx.arc(x, y1, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y2, 2.2, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawDust(ctx, w, h, t, n = 40) {
  for (let i = 0; i < n; i++) {
    const x = ((i * 97 + t * 12) % w);
    const y = ((i * 53 + Math.sin(t * 0.3 + i) * 30) % h);
    ctx.fillStyle = `rgba(200,220,210,${0.04 + (i % 5) * 0.02})`;
    ctx.beginPath(); ctx.arc(x, y, 0.8 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
  }
}

function blob(ctx, x, y, rx, ry, t, n) {
  ctx.moveTo(x + rx, y);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wiggle = 1 + Math.sin(a * 3 + t) * 0.045 + Math.cos(a * 5 - t * 0.6) * 0.025;
    const px = x + Math.cos(a) * rx * wiggle;
    const py = y + Math.sin(a) * ry * wiggle;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function callout(title, body, x, y) {
  const el = $("#callout");
  $("#callK").textContent = title;
  $("#callB").textContent = body;
  el.hidden = false;
  el.style.left = Math.min(innerWidth - 300, Math.max(20, x + 16)) + "px";
  el.style.top = Math.min(innerHeight - 120, Math.max(80, y - 20)) + "px";
}

export function hideCallout() { $("#callout").hidden = true; }
