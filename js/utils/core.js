window.CLONING = window.CLONING || {};

CLONING.$ = (sel, root = document) => root.querySelector(sel);
CLONING.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];

CLONING.store = {
  key: "clone-lab-v2",
  load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; }
    catch { return {}; }
  },
  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }
};

CLONING.audio = {
  on: false,
  ctx: null,
  toggle() {
    this.on = !this.on;
    if (this.on) this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
    return this.on;
  },
  beep(freq = 520, dur = 0.08, type = "sine", gain = 0.04) {
    if (!this.on) return;
    const ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.stop(ctx.currentTime + dur);
  },
  ok() { this.beep(660, 0.09); },
  bad() { this.beep(180, 0.12, "triangle"); }
};

CLONING.toast = function (msg, kind = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast " + kind;
  el.hidden = false;
  clearTimeout(CLONING.toast._t);
  CLONING.toast._t = setTimeout(() => { el.hidden = true; }, 2600);
};

CLONING.Drag = class {
  constructor() {
    this.active = null;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  bind(el, opts) {
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", (e) => {
      if (opts.enabled && !opts.enabled()) return;
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      const r = el.getBoundingClientRect();
      this.active = { el, opts, origin: { left: el.style.left, top: el.style.top, parent: el.parentElement } };
      this.offsetX = e.clientX - r.left;
      this.offsetY = e.clientY - r.top;
      el.classList.add("dragging");
      el.style.position = "fixed";
      el.style.zIndex = "90";
      el.style.left = r.left + "px";
      el.style.top = r.top + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
      if (opts.onStart) opts.onStart();
    });
    el.addEventListener("pointermove", (e) => {
      if (!this.active || this.active.el !== el) return;
      e.stopPropagation();
      el.style.left = e.clientX - this.offsetX + "px";
      el.style.top = e.clientY - this.offsetY + "px";
      if (opts.onMove) opts.onMove(e);
      this._highlight(opts.zones, e);
    });
    el.addEventListener("pointerup", (e) => {
      if (!this.active || this.active.el !== el) return;
      e.stopPropagation();
      try { el.releasePointerCapture(e.pointerId); } catch {}
      el.classList.remove("dragging");
      const hit = this._hit(opts.zones, e);
      this._clear(opts.zones);
      const ok = hit && (!opts.validate || opts.validate(hit, e));
      if (ok) {
        opts.onDrop && opts.onDrop(hit, e);
      } else {
        this.reset(el, this.active.origin);
        if (opts.onMiss) opts.onMiss();
      }
      this.active = null;
    });
  }
  reset(el, origin) {
    el.style.position = "";
    el.style.zIndex = "";
    el.style.left = origin.left || "";
    el.style.top = origin.top || "";
    el.style.right = "";
    el.style.bottom = "";
    if (origin.parent && el.parentElement !== origin.parent) origin.parent.appendChild(el);
  }
  _hit(zones, e) {
    if (!zones) return null;
    for (const z of zones()) {
      if (!z) continue;
      const r = z.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return z;
    }
    return null;
  }
  _highlight(zones, e) {
    if (!zones) return;
    zones().forEach((z) => {
      if (!z) return;
      const r = z.getBoundingClientRect();
      const hit = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      z.classList.toggle("drop-ok", hit);
    });
  }
  _clear(zones) {
    if (!zones) return;
    zones().forEach((z) => z && z.classList.remove("drop-ok"));
  }
};

CLONING.drag = new CLONING.Drag();
