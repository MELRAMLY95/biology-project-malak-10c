import { markSim } from "./ui.js";
import {
  $, $$, fit, dist, lerp, drawCell, drawHelix, drawDust, toast, audio, NB, markDone, callout, hideCallout, done
} from "./core.js";

const sim = $("#sim");
let scene = "intro";
let inspect = false;
let raf = 0;
let running = false;
let t = 0;
let active = null;

export function setScene(id) {
  scene = id;
  inspect = false;
  $("#btnInspect")?.classList.remove("on");
  hideCallout();
  NB.key = id === "plant" ? "plant" : id === "bacteria" ? "bac" : id === "transgenic" ? "tg" : id === "dolly" ? "dolly" : id === "ethics" ? "ethics" : id === "define" ? "define" : "scnt";
  NB.render();
  if (id === "define") Define.reset(false);
  if (id === "scnt") SCNT.reset(false);
  if (id === "dolly") Dolly.reset(false);
  if (id === "plant") Plant.reset(false);
  if (id === "bacteria") Bac.reset(false);
  if (id === "transgenic") Tg.reset(false);
  hudFor(id);
  dockFor(id);
}

export function startLoop() {
  if (running) return;
  running = true;
  const loop = () => {
    if (!running) return;
    t += 0.016;
    if (scene === "scnt") SCNT.tick();
    else if (scene === "dolly") Dolly.tick();
    else if (scene === "plant") Plant.tick();
    else if (scene === "bacteria") Bac.tick();
    else if (scene === "transgenic") Tg.tick();
    else if (scene === "define") Define.tick();
    else clearSim();
    raf = requestAnimationFrame(loop);
  };
  loop();
}

export function stopLoop() { running = false; }

function clearSim() {
  const ctx = fit(sim, innerWidth, innerHeight);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
}

function hudFor(id) {
  const map = {
    define: ["Definition", "What is a clone?", "Copy nuclear DNA by mitosis. Same genes ≠ same phenotype. Then identify the clone."],
    learn: ["Curriculum", "Edexcel 4BI1 cloning", "Read, then try the lab, then answer."],
    quiz: ["Quiz", "Check your understanding", "Choose A–D, then submit."],
    exam: ["Exam pad", "Use mark-scheme language", "Nuclear DNA · mitosis · enucleated egg · surrogate."],
    glossary: ["Glossary", "Terms from the specification", "Select a word for a short definition."],
    scnt: ["SCNT laboratory", "Micromanipulation · 5.19B", "Aspirate somatic nucleus → enucleate egg → transfer → pulse (mitosis, not new DNA) → implant."],
    dolly: ["Roslin 1996", "Repeat Dolly’s protocol", "G0 mammary nucleus from Finn-Dorset. Enucleated Blackface egg. Pulse starts mitosis. Match the barcode."],
    plant: ["Tissue culture", "Produce identical plants", "Explant → sterilise → culture → plantlets → greenhouse."],
    bacteria: ["Bacterial world", "A clonal population from one cell", "Binary fission: replicate DNA → elongate → septum → two clones. Temperature and nutrients set the rate."],
    transgenic: ["Genetic engineering", "Human insulin in a host", "Select insulin (not a decoy gene). Insert. Clone. Collect the protein."],
    ethics: ["Ethics chamber", "No single mark-scheme ‘yes’", "Take a stance. Harvest both sides. Write like 4BI1."],
    exam: ["Exam bench", "Use 4BI1 language", "Nuclear DNA. Mitosis. Enucleated egg. Surrogate."],
    master: ["Master laboratory", "No procedure sheet", "Read the brief. Choose a method. Execute it."]
  };
  const m = map[id] || map.scnt;
  $("#hudMark").textContent = m[0];
  $("#hudTitle").textContent = m[1];
  $("#hudObj").textContent = m[2];
}

function dockFor(id) {
  const d = $("#dock");
  d.onpointerdown = (e) => e.stopPropagation();
  d.onpointerup = (e) => e.stopPropagation();
  if (id === "scnt") {
    d.innerHTML = `
      <p id="scntStep" style="color:var(--mute);font-size:12px;line-height:1.45">Step 1 · aspirate the somatic nucleus</p>
      <label>Zoom <input id="scntZoom" type="range" min="0.7" max="2.4" step="0.01" value="1" /></label>
      <div class="row" style="display:flex;gap:6px">
        <button type="button" id="zOut">Zoom −</button>
        <button type="button" id="zIn">Zoom +</button>
        <button type="button" id="viewReset">Reset view</button>
      </div>
      <label>Focus <input id="scntFocus" type="range" min="0" max="1" step="0.01" value="0.82" /></label>
      <button type="button" class="pulse" id="pulse" disabled><i></i>Hold to activate</button>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button type="button" data-spd="0.4">Slow</button>
        <button type="button" data-spd="1">Play</button>
        <button type="button" data-spd="0">Pause</button>
        <button type="button" data-spd="3">Fast</button>
      </div>
      <button type="button" id="implant" disabled>Transfer to surrogate</button>
      <p style="color:var(--mute);font-size:11px;line-height:1.4;margin:0">Grab the glass pipette, or click a nucleus to aim. Alignment ring turns green when you may release.</p>`;
    bindScntDock();
  } else if (id === "plant") {
    d.innerHTML = `
      <button type="button" id="pCut">Cut explant</button>
      <button type="button" id="pSter">Sterilise</button>
      <button type="button" id="pPlate">Place in medium</button>
      <label>Temperature °C <input id="pTemp" type="range" min="12" max="38" value="24" /></label>
      <label>Light <input id="pLight" type="range" min="0" max="100" value="55" /></label>
      <label>Nutrients <input id="pNut" type="range" min="0" max="100" value="70" /></label>
      <button type="button" id="pXfer">Acclimatise plantlets</button>`;
    bindPlantDock();
  } else if (id === "bacteria") {
    d.innerHTML = `
      <p id="bStep" style="color:var(--mute);font-size:12px;line-height:1.4">One cell. Culture to watch binary fission.</p>
      <label>Nutrients <input id="bNut" type="range" min="5" max="100" value="80" /></label>
      <label>Temperature °C <input id="bTemp" type="range" min="10" max="48" value="37" /></label>
      <button type="button" id="bRun">Culture</button>
      <button type="button" id="bPause">Pause</button>
      <button type="button" id="bView">Microscope / colony</button>
      <p style="color:var(--mute);font-size:11px;line-height:1.4;margin:0">Optimum ~37°C. Click the field to flip views. Descendants are clones until mutation.</p>`;
    bindBacDock();
  } else if (id === "transgenic") {
    d.innerHTML = `
      <p style="color:var(--mute);font-size:12px;line-height:1.4">Concept model of 5.20B — not a restriction-enzyme practical.</p>
      <button type="button" id="tgCut">Isolate insulin gene</button>
      <button type="button" id="tgInsert">Introduce into host</button>
      <button type="button" id="tgClone">Clone the transgenic host</button>
      <button type="button" id="tgHarvest" disabled>Collect insulin</button>`;
    bindTgDock();
  } else if (id === "dolly") {
    d.innerHTML = `
      <p id="dStep" style="color:var(--mute);font-size:12px;line-height:1.45">1 / 9  ·  Click the cream-faced Finn-Dorset for a mammary cell.</p>
      <button type="button" class="pulse" id="dStarve" disabled><i></i>Hold serum-starve (G0)</button>
      <button type="button" class="pulse" id="dPulse" disabled><i></i>Hold electric pulse</button>`;
    bindDollyDock();
  } else if (id === "define") {
    d.innerHTML = `
      <p id="defStep" style="color:var(--mute);font-size:12px;line-height:1.45">1 / 5  ·  Replicate the parent’s nuclear DNA. Do not empty the parent.</p>
      <button type="button" id="defRep">Replicate nuclear DNA</button>
      <button type="button" id="defMito" disabled>Run mitosis</button>
      <label>Clone B light <input id="defLight" type="range" min="8" max="100" value="82" disabled /></label>
      <label>Clone B nutrients <input id="defFood" type="range" min="8" max="100" value="78" disabled /></label>
      <button type="button" id="defStill" disabled>Still clones?</button>
      <p style="color:var(--mute);font-size:11px;line-height:1.4;margin:0">A clone matches nuclear DNA. Mixing sperm and egg is sexual reproduction — not cloning.</p>`;
    bindDefDock();
  } else if (id === "ethics" || id === "exam" || id === "quiz" || id === "learn" || id === "glossary") {
    d.innerHTML = "";
  } else if (id === "master") {
    d.innerHTML = `
      <button type="button" data-ch="plant">Tissue culture</button>
      <button type="button" data-ch="scnt">SCNT</button>
      <button type="button" data-ch="bac">Binary fission</button>
      <button type="button" data-ch="tg">Transgenic</button>
      <button type="button" id="chGo">Submit</button>`;
    bindMaster();
  } else d.innerHTML = "";
}

export function hint() {
  const h = {
    scnt: "Grab the glass pipette or click a nucleus to aim. Green ring = aligned — release to aspirate. Enucleate the egg before you seat the donor. Hold activate. Implant at blastocyst.",
    dolly: "Click Finn-Dorset → serum-starve the mammary cell (G0) → Blackface egg → discard egg nucleus → seat donor nucleus → electrodes → pulse (mitosis, not new DNA) → wait for cleavage → implant → match the barcode.",
    plant: "Click the shoot, cut, sterilise, drag the explant into the vessel.",
    bacteria: "Press Culture. DNA copies, the cell elongates, a septum splits it. Cold or starvation slows fission. Click to switch microscope and colony.",
    transgenic: "Click the gold insulin gene — not haemoglobin or keratin. Carry it into the bacterium, then clone the host.",
    define: "Replicate, then seat the sister nucleus. Mitosis copies DNA — gametes mix it. Change Clone B’s environment, then pick who matches the parent barcode.",
    ethics: "There is no single correct click. Pick a stance, then steal exam language from both columns."
  };
  toast(h[scene] || "Explore the environment.", "");
}

export function procedure() {
  const p = {
    scnt: "1 Somatic nucleus  2 Enucleate egg  3 Transfer  4 Activate  5 Implant in surrogate",
    dolly: "Finn-Dorset mammary (G0) → enucleated Blackface egg → pulse / mitosis → Blackface surrogate. Nuclear DNA = donor.",
    plant: "Explant → surface sterilise → nutrient medium → plantlets → acclimatise",
    bacteria: "DNA replicates → cell elongates → septum → two clones",
    transgenic: "Identify human insulin gene → introduce into host genome → clone the host → insulin from the culture",
    ethics: "Name an advantage, a disadvantage, and who pays the cost. Never claim the pulse creates DNA.",
    define: "1 Replicate nuclear DNA  2 Seat the sister nucleus  3 Mitosis  4 Change environment  5 Click the matching barcode"
  };
  toast(p[scene] || "No procedure sheet on this bench.", "");
}

export function resetActive() {
  if (scene === "define") Define.reset(true);
  if (scene === "scnt") SCNT.reset(true);
  if (scene === "dolly") Dolly.reset(true);
  if (scene === "plant") Plant.reset(true);
  if (scene === "bacteria") Bac.reset(true);
  if (scene === "transgenic") Tg.reset(true);
}

export function setInspect(on) { inspect = on; }

function status(s, acc) {
  $("#statusLine").textContent = s;
  if (acc != null) $("#accLine").textContent = "Accuracy " + acc + "%";
}

function acc(m) { return Math.max(0, 100 - m * 8); }

/* ---------- DEFINE ---------- */
const BASES = ["#6ec4a0", "#e0b060", "#8eb4e0", "#c07ab0"];
const PARENT_SEQ = [0, 1, 2, 0, 1, 2, 3, 1];
const SEX_SEQ = [0, 1, 2, 3, 3, 0, 3, 2];
const UNREL_SEQ = [3, 2, 3, 0, 2, 3, 1, 0];

const Define = {
  state: "idle",
  mistakes: 0,
  mito: 0,
  grow: 0,
  light: 82,
  food: 78,
  tweaked: false,
  grab: null,
  order: [0, 1, 2],
  _hud: "",
  layout() {
    const w = innerWidth, h = innerHeight;
    return {
      w, h,
      P: { x: w * 0.30, y: h * 0.46, r: 86 },
      C: { x: w * 0.62, y: h * 0.46, r: 86 },
      sperm: { x: w * 0.42, y: h * 0.72, r: 22 },
      egg: { x: w * 0.54, y: h * 0.72, r: 28 }
    };
  },
  reset(log) {
    const L = this.layout();
    this.state = "idle";
    this.mistakes = 0;
    this.mito = 0;
    this.grow = 0;
    this.light = 82;
    this.food = 78;
    this.tweaked = false;
    this.grab = null;
    this.seated = false;
    this.replicated = false;
    this._hud = "";
    this.nuc = { x: L.P.x - 6, y: L.P.y - 5 };
    this.sis = null;
    this.gamS = { x: L.sperm.x, y: L.sperm.y, kind: "sperm" };
    this.gamE = { x: L.egg.x, y: L.egg.y, kind: "egg" };
    this.order = [0, 1, 2];
    for (let i = this.order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.order[i], this.order[j]] = [this.order[j], this.order[i]];
    }
    const r = $("#defRep"); if (r) r.disabled = false;
    const m = $("#defMito"); if (m) m.disabled = true;
    const s = $("#defStill"); if (s) s.disabled = true;
    const li = $("#defLight"); if (li) { li.disabled = true; li.value = 82; }
    const f = $("#defFood"); if (f) { f.disabled = true; f.value = 78; }
    if (log) NB.add("define", "Definition bench reset.");
  },
  steps() {
    return {
      idle: "1 / 5  ·  Replicate the parent’s nuclear DNA. Cloning does not empty the parent.",
      drag: "2 / 5  ·  Drag the sister nucleus into the empty cell — not a gamete.",
      copy: "3 / 5  ·  Run mitosis. Every nucleus must match the parent barcode.",
      mito: "Mitosis in progress — DNA is copied, not rewritten.",
      env: "4 / 5  ·  Starve or shade Clone B. Phenotype can change. Nuclear DNA does not.",
      who: "5 / 5  ·  Click the organism whose nuclear barcode matches the parent.",
      done: "Clone = same nuclear DNA, copied by mitosis. Same genes ≠ same phenotype."
    };
  },
  fail(m) {
    this.mistakes++;
    audio.bad();
    toast(m, "warn");
    NB.add("define", "Error: " + m);
    sim.classList.remove("shake");
    void sim.offsetWidth;
    sim.classList.add("shake");
  },
  replicate() {
    if (this.state !== "idle") return;
    const L = this.layout();
    this.replicated = true;
    this.sis = { x: L.P.x + 58, y: L.P.y - 42 };
    this.state = "drag";
    const r = $("#defRep"); if (r) r.disabled = true;
    audio.ok();
    NB.add("define", "Nuclear DNA replicated. Parent nucleus remains.");
    toast("Sister chromatid set ready. Seat it in the empty cell.", "");
  },
  runMito() {
    if (this.state !== "copy") return;
    this.state = "mito";
    const m = $("#defMito"); if (m) m.disabled = true;
    audio.ok();
    NB.add("define", "Mitosis started. Nuclear DNA is being copied.");
  },
  confirmClones() {
    if (this.state !== "env") return;
    if (!this.tweaked) return this.fail("Move Clone B’s light or nutrients first — watch phenotype change.");
    this.state = "who";
    const s = $("#defStill"); if (s) s.disabled = true;
    const li = $("#defLight"); if (li) li.disabled = true;
    const f = $("#defFood"); if (f) f.disabled = true;
    audio.ok();
    NB.add("define", "Still clones: nuclear DNA matched after the environment changed.");
    toast("Correct idea. Now click who matches the parent barcode.", "");
  },
  tick() {
    const L = this.layout();
    if (!this.nuc) this.reset(false);
    if (this.state === "idle") {
      this.nuc.x = lerp(this.nuc.x, L.P.x - 6, 0.12);
      this.nuc.y = lerp(this.nuc.y, L.P.y - 5, 0.12);
    }
    if (this.sis && this.state !== "drag" && this.grab !== "sis") {
      const tx = this.seated ? L.C.x - 6 : L.P.x + 28;
      const ty = this.seated ? L.C.y - 5 : L.P.y - 18;
      this.sis.x = lerp(this.sis.x, tx, 0.16);
      this.sis.y = lerp(this.sis.y, ty, 0.16);
    }
    if (this.grab !== "sperm") { this.gamS.x = lerp(this.gamS.x, L.sperm.x, 0.12); this.gamS.y = lerp(this.gamS.y, L.sperm.y, 0.12); }
    if (this.grab !== "egg") { this.gamE.x = lerp(this.gamE.x, L.egg.x, 0.12); this.gamE.y = lerp(this.gamE.y, L.egg.y, 0.12); }
    if (this.state === "mito") {
      const fast = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.mito = Math.min(1, this.mito + (fast ? 1 : 0.011));
      if (this.mito >= 1) {
        this.state = "env";
        this.grow = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.16;
        const li = $("#defLight"); if (li) li.disabled = false;
        const f = $("#defFood"); if (f) f.disabled = false;
        const s = $("#defStill"); if (s) s.disabled = false;
        toast("Two nuclei, one barcode. Change Clone B’s world.", "");
        NB.add("define", "Mitosis complete. Both cells carry the parent nuclear DNA.");
      }
    }
    if (this.state === "env" || this.state === "who" || this.state === "done") {
      this.grow = Math.min(1, this.grow + 0.018);
    }
    this.draw();
    if (this._hud !== this.state) {
      this._hud = this.state;
      const el = $("#defStep");
      if (el) el.textContent = this.steps()[this.state];
    }
    status(this.steps()[this.state], acc(this.mistakes));
  },
  draw() {
    const L = this.layout(), w = L.w, h = L.h;
    const ctx = fit(sim, w, h);
    ctx.clearRect(0, 0, w, h);
    drawDust(ctx, w, h, t, 40);
    ctx.fillStyle = "rgba(16,22,20,0.45)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(w * 0.12, h * 0.16, w * 0.72, h * 0.70, 18);
    else ctx.rect(w * 0.12, h * 0.16, w * 0.72, h * 0.70);
    ctx.fill();
    ctx.strokeStyle = "rgba(212,180,138,0.22)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = "rgba(212,180,138,0.62)";
    ctx.font = "11px IBM Plex Mono";
    ctx.textAlign = "center";
    ctx.fillText("GENOME COMPARISON  ·  4BI1  ·  NUCLEAR DNA", w * 0.48, h * 0.20);
    ctx.textAlign = "start";

    this.drawBarcode(ctx, w * 0.48, h * 0.235, PARENT_SEQ, "parent nuclear barcode");

    if (this.state === "env") this.drawGrown(ctx, L);
    else if (this.state === "who" || this.state === "done") this.drawWho(ctx, L);
    else this.drawCells(ctx, L);

    if (this.state === "idle" || this.state === "drag" || this.state === "copy") this.drawGametes(ctx, L);
  },
  drawCells(ctx, L) {
    const seatHot = this.state === "drag" && this.sis && dist(this.sis, L.C) < L.C.r;
    drawCell(ctx, { x: L.P.x, y: L.P.y, r: L.P.r, t, kind: "soma", showNuc: false, hot: this.state === "idle" });
    drawCell(ctx, {
      x: L.C.x, y: L.C.y, r: L.C.r, t, kind: "soma", showNuc: false,
      hot: seatHot, pulse: this.seated ? 0.35 + Math.sin(t * 3) * 0.12 : 0
    });
    if (this.state === "mito") this.drawMito(ctx, L.P.x, L.P.y, L.P.r);
    if (this.state === "mito" && this.seated) this.drawMito(ctx, L.C.x, L.C.y, L.C.r);
    this.drawNuc(ctx, this.nuc.x, this.nuc.y, 17, this.grab === "nuc");
    if (this.sis && this.state !== "mito") {
      this.drawNuc(ctx, this.sis.x, this.sis.y, 17, this.grab === "sis" || this.state === "drag");
      ctx.fillStyle = "rgba(142,224,184,0.95)";
      ctx.font = "12px IBM Plex Sans";
      ctx.textAlign = "center";
      ctx.fillText(this.seated ? "mitotic copy seated" : "sister nucleus  ·  drag into empty cell", this.sis.x, this.sis.y - 28);
      ctx.textAlign = "start";
    }
    ctx.fillStyle = "rgba(232,239,230,0.78)";
    ctx.font = "14px IBM Plex Sans";
    ctx.textAlign = "center";
    ctx.fillText("Parent  ·  diploid nucleus stays", L.P.x, L.P.y + L.P.r + 28);
    ctx.fillText(this.seated ? "Copy  ·  same nuclear DNA" : "Empty cell  ·  waiting for a mitotic copy", L.C.x, L.C.y + L.C.r + 28);
    ctx.textAlign = "start";
    if (this.replicated && this.state === "drag") {
      ctx.strokeStyle = "rgba(142,224,184,0.35)";
      ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(this.sis.x, this.sis.y); ctx.lineTo(L.C.x, L.C.y); ctx.stroke();
      ctx.setLineDash([]);
    }
  },
  drawMito(ctx, x, y, r) {
    const u = this.mito;
    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const spread = u < 0.45 ? 22 : 22 + (u - 0.45) * 70;
      const side = i % 2 === 0 ? 1 : -1;
      const cx = Math.cos(ang) * (u < 0.45 ? 18 : spread * 0.35);
      const cy = Math.sin(ang) * (u < 0.45 ? 14 : spread * 0.28) + (u > 0.45 ? side * (u - 0.45) * 40 : 0);
      ctx.strokeStyle = "rgba(120,220,180,0.85)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 3);
      ctx.quadraticCurveTo(cx, cy + (u < 0.35 ? 8 : 2), cx + 7, cy - 3);
      ctx.stroke();
      if (u > 0.22) {
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy + 3);
        ctx.quadraticCurveTo(cx, cy - (u < 0.35 ? 8 : 2), cx + 7, cy + 3);
        ctx.stroke();
      }
    }
    if (u > 0.72) {
      ctx.strokeStyle = `rgba(200,230,210,${(u - 0.72) * 3})`;
      ctx.beginPath(); ctx.moveTo(-r * 0.9, 0); ctx.lineTo(r * 0.9, 0); ctx.stroke();
    }
    ctx.restore();
    drawHelix(ctx, x - 70, y + r + 46, 140, t + u * 4, true);
  },
  drawGrown(ctx, L) {
    const aScale = 1.08 * this.grow;
    const bScale = (0.62 + this.food / 180) * this.grow;
    const aHue = 0.55;
    const bHue = 0.18 + this.light / 180;
    this.drawCritter(ctx, L.P.x, L.P.y + 10, aScale, aHue, "Clone A  ·  matched conditions", PARENT_SEQ, true);
    this.drawCritter(ctx, L.C.x, L.C.y + 10, bScale, bHue, "Clone B  ·  your environment", PARENT_SEQ, true);
    ctx.fillStyle = "rgba(224,180,120,0.85)";
    ctx.font = "13px IBM Plex Sans";
    ctx.textAlign = "center";
    ctx.fillText(this.tweaked ? "Phenotypes differ. Barcodes still match." : "Pull Clone B’s sliders — watch size and pigment, not the barcode.", L.w * 0.48, L.h * 0.78);
    ctx.textAlign = "start";
  },
  drawWho(ctx, L) {
    const items = [
      { seq: PARENT_SEQ, label: "same nuclear DNA", clone: true },
      { seq: SEX_SEQ, label: "two gametes mixed", clone: false },
      { seq: UNREL_SEQ, label: "unrelated genome", clone: false }
    ];
    const xs = [L.w * 0.22, L.w * 0.42, L.w * 0.62];
    const y = L.h * 0.50;
    this.whoHits = [];
    this.order.forEach((idx, i) => {
      const it = items[idx];
      const x = xs[i];
      this.whoHits.push({ x, y, r: 88, clone: it.clone, i });
      ctx.fillStyle = this.state === "done" && it.clone ? "rgba(110,196,160,0.16)" : "rgba(8,12,10,0.55)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - 86, y - 118, 172, 230, 14); else ctx.rect(x - 86, y - 118, 172, 230);
      ctx.fill();
      ctx.strokeStyle = it.clone && this.state === "done" ? "rgba(142,224,184,0.85)" : "rgba(212,180,138,0.28)";
      ctx.stroke();
      this.drawCritter(ctx, x, y - 24, 0.7, it.clone ? 0.55 : (idx === 1 ? 0.52 : 0.12), "", it.seq, true);
      ctx.fillStyle = "rgba(232,239,230,0.8)";
      ctx.font = "12px IBM Plex Sans";
      ctx.textAlign = "center";
      ctx.fillText(this.state === "done" ? it.label : "Organism " + String.fromCharCode(80 + i), x, y + 96);
    });
    ctx.fillStyle = "rgba(224,180,120,0.85)";
    ctx.font = "13px IBM Plex Sans";
    ctx.textAlign = "center";
    ctx.fillText(this.state === "done" ? "The clone is the match — appearance was a decoy." : "Click whose nuclear barcode matches the parent.", L.w * 0.42, L.h * 0.78);
    ctx.textAlign = "start";
  },
  drawCritter(ctx, x, y, s, hue, label, seq, showBar) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const g = ctx.createRadialGradient(-20, -30, 8, 0, 10, 70);
    g.addColorStop(0, `rgba(${140 + hue * 110},${190 + hue * 30},${110},0.95)`);
    g.addColorStop(0.55, `rgba(${70 + hue * 90},${130 + hue * 20},${70},0.92)`);
    g.addColorStop(1, `rgba(18,40,22,0.96)`);
    ctx.beginPath();
    ctx.ellipse(0, 8, 48, 38, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(230,250,220,0.7)";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-18, -28, 10, 16, -0.3, 0, Math.PI * 2);
    ctx.beginPath(); ctx.ellipse(18, -28, 10, 16, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${70 + hue * 100},${130},${80},0.9)`;
    ctx.beginPath(); ctx.ellipse(-18, -28, 10, 16, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(18, -28, 10, 16, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(20,28,22,0.9)";
    ctx.beginPath(); ctx.arc(-12, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (showBar) this.drawBarcode(ctx, x, y + 58 * s, seq, label);
  },
  drawGametes(ctx, L) {
    ctx.fillStyle = "rgba(180,160,230,0.55)";
    ctx.font = "11px IBM Plex Mono";
    ctx.textAlign = "center";
    ctx.fillText("DECOYS  ·  SEXUAL REPRODUCTION", (L.sperm.x + L.egg.x) / 2, L.sperm.y - 36);
    ctx.beginPath(); ctx.ellipse(this.gamS.x, this.gamS.y, 10, 7, t, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(160,140,230,0.9)"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(this.gamS.x + 10, this.gamS.y);
    ctx.quadraticCurveTo(this.gamS.x + 28, this.gamS.y + Math.sin(t * 8) * 6, this.gamS.x + 40, this.gamS.y);
    ctx.strokeStyle = "rgba(180,170,230,0.8)"; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillText("sperm  ·  haploid", this.gamS.x, this.gamS.y + 28);
    drawCell(ctx, { x: this.gamE.x, y: this.gamE.y, r: 20, t, kind: "egg", showNuc: true, hot: this.grab === "egg" });
    ctx.fillStyle = "rgba(224,180,140,0.8)";
    ctx.fillText("egg  ·  haploid nucleus", this.gamE.x, this.gamE.y + 36);
    ctx.textAlign = "start";
  },
  drawNuc(ctx, x, y, r, hot) {
    const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
    g.addColorStop(0, "rgba(120,220,180,0.95)");
    g.addColorStop(1, "rgba(20,80,60,0.92)");
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.86, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = hot ? "rgba(142,224,184,0.95)" : "rgba(255,255,255,0.32)";
    ctx.lineWidth = hot ? 2.4 : 1.1; ctx.stroke();
    if (hot) {
      ctx.beginPath(); ctx.arc(x, y, r + 8 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(142,224,184,0.7)"; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 8 + i * 4, y - 7);
      ctx.quadraticCurveTo(x - 2 + i * 2, y + Math.sin(t + i) * 3, x - 6 + i * 4, y + 7);
      ctx.stroke();
    }
  },
  drawBarcode(ctx, x, y, seq, label) {
    const w = seq.length * 11;
    let px = x - w / 2;
    for (let i = 0; i < seq.length; i++) {
      ctx.fillStyle = BASES[seq[i]];
      ctx.fillRect(px, y, 9, 14);
      px += 11;
    }
    if (label) {
      ctx.fillStyle = "rgba(200,210,200,0.7)";
      ctx.font = "11px IBM Plex Mono";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 28);
      ctx.textAlign = "start";
    }
  },
  down(p) {
    if (inspect) return this.inspectAt(p);
    if (this.state === "who") {
      const hit = (this.whoHits || []).find((h) => dist(p, h) < h.r);
      if (!hit) return;
      if (hit.clone) {
        this.state = "done";
        audio.ok();
        markSim("define");
        NB.add("define", "Identified the clone by matching nuclear DNA, not appearance.");
        toast("Clone = same nuclear DNA, copied by mitosis.", "");
      } else this.fail("Look at the barcode. The clone matches the parent nuclear DNA — not a sexual mix.");
      return;
    }
    if (this.state === "idle" && dist(p, this.nuc) < 22) { this.replicate(); return; }
    if (this.state === "drag" && this.sis && dist(p, this.sis) < 24) { this.grab = "sis"; return; }
    if (this.state === "idle" || this.state === "drag") {
      if (dist(p, this.gamS) < 24) { this.grab = "sperm"; return; }
      if (dist(p, this.gamE) < 30) { this.grab = "egg"; return; }
    }
    if (this.state === "idle" && dist(p, this.layout().P) < 90) this.replicate();
  },
  move(p) {
    if (this.grab === "sis" && this.sis) { this.sis.x = p.x; this.sis.y = p.y; }
    if (this.grab === "sperm") { this.gamS.x = p.x; this.gamS.y = p.y; }
    if (this.grab === "egg") { this.gamE.x = p.x; this.gamE.y = p.y; }
    if (this.state === "idle" && this.grab === "nuc") { this.nuc.x = p.x; this.nuc.y = p.y; }
  },
  up(p) {
    const L = this.layout();
    const g = this.grab;
    this.grab = null;
    if (!g) return;
    if (g === "sis") {
      if (dist(this.sis, L.C) < L.C.r - 8) {
        this.seated = true;
        this.sis.x = L.C.x - 6; this.sis.y = L.C.y - 5;
        this.state = "copy";
        const m = $("#defMito"); if (m) m.disabled = false;
        audio.ok();
        NB.add("define", "Sister nucleus seated. Parent still has its own genome.");
        toast("Ready for mitosis. The parent was not emptied.", "");
      } else if (dist(this.sis, L.P) < L.P.r) {
        this.fail("The parent already has its nucleus. Seat the copy in the empty cell.");
      }
      return;
    }
    if (g === "sperm" || g === "egg") {
      if (dist(p, L.C) < L.C.r || dist(p, L.P) < L.P.r) {
        this.fail("Gametes mix two genomes. That is sexual reproduction — the offspring is not a clone.");
      }
    }
    if (g === "nuc") {
      this.fail("Cloning copies nuclear DNA by mitosis. It does not steal the parent’s only nucleus.");
    }
  },
  inspectAt(p) {
    const L = this.layout();
    if (dist(p, L.P) < L.P.r) callout("Parent cell", "Diploid nucleus stays here. Cloning copies it by mitosis; the parent is not emptied.", p.x, p.y);
    else if (dist(p, L.C) < L.C.r) callout("Recipient cell", "Receives a mitotic copy of nuclear DNA. Same genes as the parent.", p.x, p.y);
    else if (dist(p, this.gamS) < 28) callout("Sperm", "Haploid gamete. Fusion with an egg shuffles alleles — not a clone.", p.x, p.y);
    else if (dist(p, this.gamE) < 32) callout("Egg", "Haploid nucleus. Needed for fertilisation, not for making a clone of this parent.", p.x, p.y);
    else if ((this.whoHits || []).some((h) => dist(p, h) < h.r)) callout("Nuclear barcode", "Read the sequence. The clone matches the parent. Appearance can lie.", p.x, p.y);
    else hideCallout();
  }
};
function bindDefDock() {
  $("#defRep").onclick = (e) => { e.stopPropagation(); Define.replicate(); };
  $("#defMito").onclick = (e) => { e.stopPropagation(); Define.runMito(); };
  $("#defStill").onclick = (e) => { e.stopPropagation(); Define.confirmClones(); };
  const sync = () => {
    Define.light = Number($("#defLight").value);
    Define.food = Number($("#defFood").value);
    if (Define.state === "env") Define.tweaked = true;
  };
  $("#defLight").oninput = sync;
  $("#defFood").oninput = sync;
}

/* ---------- SCNT ---------- */
const SCNT = {
  state: "idle",
  zoom: 1, focus: 0.82, ox: 0, oy: 0, draggingSample: false,
  pip: { x: 420, y: 90, tx: 420, ty: 90, load: null },
  donor: { r: 78 }, egg: { r: 118, enuc: false },
  nucD: { out: false, inEgg: false, anim: 0 },
  nucE: { out: false, anim: 0 },
  mistakes: 0, div: 0, play: 0, pulse: 0, implanted: false, _hud: "",
  reset(log) {
    Object.assign(this, { state: "idle", ox: 0, oy: 0, zoom: 1, focus: 0.82, pip: { x: innerWidth * 0.48, y: 90, tx: innerWidth * 0.48, ty: 90, load: null }, egg: { r: 118, enuc: false }, nucD: { out: false, inEgg: false, anim: 0 }, nucE: { out: false, anim: 0 }, mistakes: 0, div: 0, play: 0, pulse: 0, implanted: false, settle: 0, grab: false, draggingSample: false, hover: null, _hud: "", autoAim: false });
    const z = $("#scntZoom"); if (z) z.value = 1;
    const f = $("#scntFocus"); if (f) f.value = "0.82";
    const p = $("#pulse"); if (p) { p.disabled = true; const i = p.querySelector("i"); if (i) i.style.width = "0"; }
    const i = $("#implant"); if (i) i.disabled = true;
    if (log) NB.add("scnt", "Microscope reset.");
  },
  steps() {
    return {
      idle: "1 / 5  ·  Aim at the somatic nucleus. Green ring, then release.",
      egg: "2 / 5  ·  Enucleate the egg. Two genomes cannot share one oocyte.",
      transfer: "3 / 5  ·  Seat the donor nucleus in the empty cytoplasm.",
      seating: "Donor nucleus travelling through cytoplasm…",
      activate: "4 / 5  ·  Hold activate. Pulse starts mitosis — it does not add DNA.",
      dividing: "5 / 5  ·  Mitosis. Implant at morula / blastocyst.",
      compare: "Nuclear DNA = somatic donor. Surrogate is not the nuclear parent."
    };
  },
  donorPos() { return { x: innerWidth * 0.34 + this.ox, y: innerHeight * 0.52 + this.oy }; },
  eggPos() { return { x: innerWidth * 0.66 + this.ox, y: innerHeight * 0.52 + this.oy }; },
  tip() { return { x: this.pip.x, y: this.pip.y + 86 }; },
  fail(m) {
    this.mistakes++;
    audio.bad();
    toast(m, "warn");
    NB.add("scnt", "Error: " + m);
    sim.classList.remove("shake");
    void sim.offsetWidth;
    sim.classList.add("shake");
  },
  tick() {
    this.pip.x = lerp(this.pip.x, this.pip.tx, 0.2);
    this.pip.y = lerp(this.pip.y, this.pip.ty, 0.2);
    if (this.nucD.anim > 0) this.nucD.anim *= 0.9;
    if (this.nucE.anim > 0) this.nucE.anim *= 0.9;
    if (this.pulse > 0.02) this.pulse *= 0.94; else this.pulse = 0;
    if (this.settle > 0 && this.settle < 1) this.settle = Math.min(1, this.settle + 0.035);
    if (this.settle >= 1 && this.state === "seating") {
      this.nucD.inEgg = true; this.pip.load = null; this.state = "activate";
      const p = $("#pulse"); if (p) p.disabled = false;
      NB.add("scnt", "Nucleus seated. Reconstructed oocyte.");
      toast("Ready to activate. The genome is already the donor’s.", "");
    }
    if (this.play && this.state === "dividing") {
      this.div = Math.min(5.2, this.div + 0.0032 * this.play);
      const imp = $("#implant");
      if (imp) imp.disabled = this.div < 4.2 || this.implanted;
    }
    if (this.autoAim) {
      if (this.state === "idle" && this.aligned("d")) { this.autoAim = false; this.extractD(); }
      else if (this.state === "egg" && this.aligned("e")) { this.autoAim = false; this.extractE(); }
      else if (this.state === "transfer" && this.pip.load === "d" && dist(this.tip(), this.eggPos()) < this.egg.r - 4) { this.autoAim = false; this.insert(); }
    }
    this.draw();
    if (this._hud !== this.state) {
      this._hud = this.state;
      const el = $("#scntStep");
      if (el) el.textContent = this.steps()[this.state];
    }
    status(this.steps()[this.state] || this.state, acc(this.mistakes));
  },
  draw() {
    const w = innerWidth, h = innerHeight;
    const ctx = fit(sim, w, h);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, rad = Math.min(w, h) * 0.44;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.clip();
    const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, rad);
    bg.addColorStop(0, `rgba(18,36,40,${0.2 + (1 - this.focus) * 0.25})`);
    bg.addColorStop(1, `rgba(4,10,12,${0.55 + (1 - this.focus) * 0.3})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    drawDust(ctx, w, h, t, 56);
    ctx.translate(cx, cy);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-cx, -cy);
    ctx.filter = `blur(${(1 - this.focus) * 2.4}px)`;

    if (this.state === "dividing" || this.state === "compare") this.drawDiv(ctx, w, h);
    else this.drawField(ctx);
    ctx.filter = "none";
    this.drawHoldPip(ctx);
    this.drawPip(ctx);
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(28,34,32,0.92)"; ctx.lineWidth = 34; ctx.stroke();
    ctx.strokeStyle = `rgba(140,210,180,${0.14 + Math.sin(t) * 0.05})`; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = "rgba(212,180,138,0.28)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, rad + 18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(200,210,200,0.18)"; ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (rad - 8), cy + Math.sin(a) * (rad - 8));
      ctx.lineTo(cx + Math.cos(a) * (rad + 8), cy + Math.sin(a) * (rad + 8));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(212,180,138,0.7)";
    ctx.font = "11px IBM Plex Mono";
    ctx.textAlign = "center";
    ctx.fillText("OPTICAL FIELD  ·  OIL  100×  ·  " + this.state.toUpperCase(), cx, cy + rad + 32);
    ctx.textAlign = "start";
  },
  drawField(ctx) {
    const d = this.donorPos(), e = this.eggPos();
    const dHot = this.hover === "d" || this.aligned("d");
    const eHot = this.hover === "e" || (this.state === "transfer" && dist(this.tip(), e) < this.egg.r);
    this.aimRing(ctx, this.nucAt("d"), this.state === "idle" && dHot);
    this.aimRing(ctx, this.nucAt("e"), this.state === "egg" && eHot);
    drawCell(ctx, { x: d.x, y: d.y, r: this.donor.r, t, kind: "soma", showNuc: !this.nucD.out, deform: this.nucD.anim, hot: dHot });
    drawCell(ctx, { x: e.x, y: e.y, r: this.egg.r, t, kind: "egg", showNuc: !this.nucE.out, deform: this.nucE.anim, pulse: this.pulse, hot: eHot });
    ctx.fillStyle = "rgba(180,220,200,0.55)"; ctx.font = "12px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText("somatic cell  ·  diploid nucleus", d.x, d.y + this.donor.r + 22);
    ctx.fillText(this.egg.enuc ? "enucleated egg  ·  cytoplasm kept" : "unfertilised egg  ·  haploid nucleus", e.x, e.y + this.egg.r + 22);
    ctx.textAlign = "start";
    if (this.nucD.inEgg || this.settle > 0) {
      const tip = this.tip();
      const u = this.settle || 1;
      const nx = lerp(tip.x, e.x - 4, u), ny = lerp(tip.y, e.y - 4, u);
      this.chromatin(ctx, nx, ny, 15, "donor");
    }
  },
  aimRing(ctx, n, on) {
    if (!on) return;
    ctx.beginPath(); ctx.arc(n.x, n.y, 22 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(142,224,184,0.9)"; ctx.lineWidth = 2; ctx.stroke();
  },
  chromatin(ctx, x, y, r, kind) {
    const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
    g.addColorStop(0, kind === "egg" ? "rgba(180,160,230,0.95)" : "rgba(90,210,160,0.95)");
    g.addColorStop(1, kind === "egg" ? "rgba(60,40,120,0.9)" : "rgba(20,90,70,0.92)");
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 8 + i * 4, y - 7);
      ctx.quadraticCurveTo(x - 2 + i * 3, y, x - 6 + i * 4, y + 7);
      ctx.stroke();
    }
  },
  drawHoldPip(ctx) {
    const e = this.eggPos();
    ctx.save();
    ctx.translate(e.x + this.egg.r + 36, e.y);
    ctx.fillStyle = "rgba(190,205,215,0.55)";
    ctx.beginPath();
    ctx.moveTo(40, -10); ctx.lineTo(8, -5); ctx.lineTo(8, 5); ctx.lineTo(40, 10); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.stroke();
    ctx.restore();
  },
  drawPip(ctx) {
    const p = this.pip, tip = this.tip();
    const aim = (this.state === "idle" && this.aligned("d")) || (this.state === "egg" && this.aligned("e")) ||
      (this.state === "transfer" && dist(tip, this.eggPos()) < this.egg.r - 6);
    ctx.save();
    ctx.translate(p.x, p.y);
    const glass = ctx.createLinearGradient(-12, 0, 12, 0);
    glass.addColorStop(0, "rgba(180,200,210,0.35)");
    glass.addColorStop(0.45, "rgba(230,240,245,0.95)");
    glass.addColorStop(1, "rgba(160,180,190,0.5)");
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(-9, -8); ctx.lineTo(9, -8); ctx.lineTo(5, 70); ctx.lineTo(10, 90); ctx.lineTo(-10, 90); ctx.lineTo(-5, 70);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = aim ? "#8ee0b8" : "rgba(255,255,255,0.28)";
    ctx.lineWidth = aim ? 2.4 : 1.2; ctx.stroke();
    if (p.load) this.chromatin(ctx, 0, 82, 8, "donor");
    ctx.restore();
  },
  aligned(which) {
    return dist(this.tip(), this.nucAt(which)) < 28;
  },
  nucAt(which) {
    const c = which === "d" ? this.donorPos() : this.eggPos();
    return { x: c.x - 8, y: c.y - 6 };
  },
  snapTo(n) {
    this.pip.tx = n.x;
    this.pip.ty = n.y - 86;
    this.autoAim = true;
  },
  drawDiv(ctx, w, h) {
    const stage = Math.min(5, Math.floor(this.div));
    const n = [1, 2, 4, 8, 16, 24][stage];
    const names = ["1 cell", "2 cells", "4 cells", "8 cells", "morula", "blastocyst"];
    const cx = w / 2, cy = h / 2 + 10;
    ctx.fillStyle = "#d4b48a"; ctx.font = "17px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText(names[stage] + "  —  mitosis copies donor nuclear DNA", cx, cy - 118);
    ctx.font = "12px IBM Plex Mono";
    ctx.fillText(this.state === "compare" ? "Clone nuclear DNA = somatic donor  ·  not the surrogate" : "Wait for blastocyst before implant", cx, cy - 96);
    ctx.textAlign = "start";
    const zona = 42 + Math.min(82, n * 3.4);
    ctx.beginPath(); ctx.arc(cx, cy, zona, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,220,170,0.28)"; ctx.lineWidth = 10; ctx.stroke();
    if (stage >= 5) {
      ctx.beginPath(); ctx.arc(cx + 18, cy - 8, zona * 0.38, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2; ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.05;
      const rad = n === 1 ? 0 : 26 + Math.min(72, n * 3);
      drawCell(ctx, {
        x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad,
        r: n === 1 ? 62 : Math.max(10, 32 - n * 0.65),
        t, kind: "soma", showNuc: true, hot: this.state === "compare"
      });
    }
    const frac = Math.min(1, this.div / 5.2);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(cx - 90, cy + zona + 22, 180, 5);
    ctx.fillStyle = "#d4b48a";
    ctx.fillRect(cx - 90, cy + zona + 22, 180 * frac, 5);
  },
  down(p) {
    if (inspect) return this.inspectAt(p);
    if (dist(p, this.pip) < 40 || dist(p, this.tip()) < 32) {
      this.grab = true;
      return;
    }
    if (this.state === "idle" && dist(p, this.nucAt("d")) < 36) { this.snapTo(this.nucAt("d")); return; }
    if (this.state === "egg" && dist(p, this.nucAt("e")) < 36) { this.snapTo(this.nucAt("e")); return; }
    if (this.state === "transfer" && dist(p, this.eggPos()) < this.egg.r) {
      const e = this.eggPos();
      this.snapTo({ x: e.x, y: e.y - 10 });
      return;
    }
    this.draggingSample = true;
    this.goff = { x: p.x - this.ox, y: p.y - this.oy };
  },
  move(p) {
    if (this.grab) {
      this.pip.tx = p.x;
      this.pip.ty = p.y - 44;
    } else if (this.draggingSample) {
      this.ox = p.x - this.goff.x;
      this.oy = p.y - this.goff.y;
    } else {
      const d = this.donorPos(), e = this.eggPos();
      this.hover = dist(p, d) < this.donor.r ? "d" : dist(p, e) < this.egg.r ? "e" : null;
    }
  },
  up() {
    if (this.grab) {
      this.grab = false;
      if (this.state === "idle") {
        if (this.aligned("d")) this.extractD();
        else this.fail("The pipette is not aligned with the somatic nucleus.");
      } else if (this.state === "egg") {
        if (this.aligned("e")) this.extractE();
        else this.fail("Aim at the egg nucleus. Leaving it mixes two genomes.");
      } else if (this.state === "transfer") {
        if (this.pip.load === "d" && dist(this.tip(), this.eggPos()) < this.egg.r - 4) this.insert();
        else this.fail("The loaded pipette must enter the enucleated egg.");
      }
    } else if (this.state === "idle" && this.aligned("d")) this.extractD();
    else if (this.state === "egg" && this.aligned("e")) this.extractE();
    else if (this.state === "transfer" && this.pip.load === "d" && dist(this.tip(), this.eggPos()) < this.egg.r - 4) this.insert();
    this.draggingSample = false;
  },
  extractD() {
    this.nucD.out = true; this.nucD.anim = 1; this.pip.load = "d"; this.state = "egg";
    audio.ok(); NB.add("scnt", "Somatic nucleus aspirated. Membrane deformed.");
    toast("Diploid nucleus collected. Now remove the egg’s nucleus.", "");
  },
  extractE() {
    this.nucE.out = true; this.nucE.anim = 1; this.egg.enuc = true; this.state = "transfer";
    audio.ok(); NB.add("scnt", "Egg enucleated. Cytoplasm retained.");
    toast("Egg enucleated. Seat the donor nucleus next.", "");
  },
  insert() {
    if (!this.egg.enuc) return this.fail("The egg has not been enucleated. Remove its nucleus first.");
    this.settle = 0.02; this.state = "seating";
    audio.ok(); NB.add("scnt", "Pipette entered cytoplasm. Nucleus transferring.");
  },
  activate() {
    if (this.state !== "activate") {
      toast("Activation unavailable. Reconstruct the oocyte first.", "warn");
      audio.bad();
      return;
    }
    this.pulse = 1; this.state = "dividing"; this.play = 1; this.div = 0;
    audio.ok(); NB.add("scnt", "Pulse applied. Mitosis begins — DNA was not added.");
    toast("Mitosis started. Use Play / Fast, then implant at blastocyst.", "");
  },
  implant() {
    if (this.div < 4.2) return this.fail("Wait until morula / blastocyst.");
    this.implanted = true; this.state = "compare"; markDone("scnt"); markSim("scnt");
    NB.add("scnt", "Embryo in surrogate. Nuclear DNA = somatic donor.");
    toast("Clone produced. Nuclear DNA matches the body-cell donor.", "");
  },
  inspectAt(p) {
    const d = this.donorPos(), e = this.eggPos();
    if (this.state === "dividing" || this.state === "compare") {
      const stage = Math.min(5, Math.floor(this.div));
      const names = ["1 cell", "2 cells", "4 cells", "8 cells", "morula", "blastocyst"];
      callout(names[stage], "Every nucleus matches the somatic donor. Mitosis copies nuclear DNA. The pulse did not write genes.", p.x, p.y);
      return;
    }
    if (dist(p, d) < this.donor.r) callout("Somatic cell", "Differentiated body cell. Its diploid nucleus is the genome you copy.", p.x, p.y);
    else if (dist(p, e) < this.egg.r) callout(this.egg.enuc ? "Enucleated egg" : "Unfertilised egg", this.egg.enuc ? "Cytoplasm can reprogramme the donor nucleus. Mitochondria remain from the egg." : "Haploid nucleus must be removed or two genomes mix.", p.x, p.y);
    else if (dist(p, this.pip) < 40 || dist(p, this.tip()) < 28) callout("Micropipette", "Drag to aim. Green ring means alignment. Release to aspirate or inject.", p.x, p.y);
    else hideCallout();
  },
  wheel(delta) {
    this.zoom = Math.min(2.4, Math.max(0.7, this.zoom + (delta > 0 ? -0.08 : 0.08)));
    const z = $("#scntZoom"); if (z) z.value = this.zoom;
  }
};

function bindScntDock() {
  $("#scntZoom").oninput = (e) => { e.stopPropagation(); SCNT.zoom = Number(e.target.value); };
  $("#scntFocus").oninput = (e) => { e.stopPropagation(); SCNT.focus = Number(e.target.value); };
  $("#zIn").onclick = (e) => { e.stopPropagation(); SCNT.zoom = Math.min(2.4, SCNT.zoom + 0.15); $("#scntZoom").value = SCNT.zoom; };
  $("#zOut").onclick = (e) => { e.stopPropagation(); SCNT.zoom = Math.max(0.7, SCNT.zoom - 0.15); $("#scntZoom").value = SCNT.zoom; };
  $("#viewReset").onclick = (e) => { e.stopPropagation(); SCNT.zoom = 1; SCNT.focus = 0.82; SCNT.ox = 0; SCNT.oy = 0; $("#scntZoom").value = 1; $("#scntFocus").value = 0.82; };
  const pulse = $("#pulse");
  let hold;
  pulse.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (pulse.disabled) return;
    let n = 0;
    hold = setInterval(() => {
      n += 5;
      pulse.querySelector("i").style.width = n + "%";
      if (n >= 100) { clearInterval(hold); SCNT.activate(); }
    }, 36);
  });
  pulse.addEventListener("pointerup", () => clearInterval(hold));
  pulse.addEventListener("pointerleave", () => clearInterval(hold));
  $$("[data-spd]").forEach((b) => b.onclick = (e) => {
    e.stopPropagation();
    const v = Number(b.dataset.spd);
    SCNT.play = v;
    if (v && SCNT.state === "activate") SCNT.activate();
  });
  $("#implant").onclick = (e) => { e.stopPropagation(); SCNT.implant(); };
}

/* ---------- DOLLY ---------- */
const FINN_DNA = [0, 1, 2, 0, 1, 2, 3, 1];
const BF_DNA = [3, 2, 3, 0, 2, 3, 1, 0];

const Dolly = {
  state: "soma", soma: null, egg: null, nucE: null, recon: null, embryo: null,
  born: false, mistakes: 0, spark: 0, cleave: 0, starved: false, starveT: 0, _hud: "",
  mito: [], holdingStarve: false,
  layout() {
    const w = innerWidth, h = innerHeight, ph = this.phase();
    const cy = h * 0.46;
    if (ph === "donor") return {
      w, h,
      finn: { x: w * 0.34, y: cy },
      eggE: { x: w * 0.78, y: h * 0.28 },
      surr: { x: w * 0.78, y: h * 0.72 },
      x: { x: w * 0.58, y: h * 0.60 },
      tube: { x: w * 0.72, y: h * 0.60 },
      dolly: { x: w * 0.34, y: h * 0.78 }
    };
    if (ph === "pair") return {
      w, h,
      finn: { x: w * 0.26, y: cy },
      eggE: { x: w * 0.58, y: cy },
      surr: { x: w * 0.82, y: h * 0.72 },
      x: { x: w * 0.42, y: h * 0.68 },
      tube: { x: w * 0.62, y: h * 0.68 },
      dolly: { x: w * 0.26, y: h * 0.78 }
    };
    if (ph === "womb") return {
      w, h,
      finn: { x: w * 0.18, y: h * 0.22 },
      eggE: { x: w * 0.36, y: h * 0.22 },
      surr: { x: w * 0.64, y: cy },
      x: { x: w * 0.30, y: h * 0.58 },
      tube: { x: w * 0.30, y: h * 0.58 },
      dolly: { x: w * 0.40, y: cy }
    };
    if (ph === "compare") return {
      w, h,
      finn: { x: w * 0.22, y: h * 0.36 },
      eggE: { x: w * 0.50, y: h * 0.36 },
      surr: { x: w * 0.78, y: h * 0.36 },
      x: { x: w * 0.40, y: h * 0.72 },
      tube: { x: w * 0.62, y: h * 0.72 },
      dolly: { x: w * 0.22, y: h * 0.78 }
    };
    return {
      w, h,
      finn: { x: w * 0.18, y: h * 0.22 },
      eggE: { x: w * 0.36, y: h * 0.22 },
      surr: { x: w * 0.82, y: h * 0.22 },
      x: { x: w * 0.38, y: h * 0.56 },
      tube: { x: w * 0.62, y: h * 0.56 },
      dolly: { x: w * 0.18, y: h * 0.78 }
    };
  },
  phase() {
    const s = this.state;
    if (s === "soma" || s === "starve") return "donor";
    if (s === "egg") return "pair";
    if (s === "implant" || s === "birth") return "womb";
    if (s === "who" || s === "done") return "compare";
    return "bench";
  },
  reset(log) {
    Object.assign(this, { state: "soma", soma: null, egg: null, nucE: null, recon: null, embryo: null, born: false, mistakes: 0, spark: 0, cleave: 0, starved: false, starveT: 0, drag: null, _hud: "", mito: [], holdingStarve: false });
    const b = $("#dPulse"); if (b) { b.disabled = true; const i = b.querySelector("i"); if (i) i.style.width = "0"; }
    const s = $("#dStarve"); if (s) { s.disabled = true; const i = s.querySelector("i"); if (i) i.style.width = "0"; }
    if (log) NB.add("dolly", "Roslin bench reset.");
  },
  barcode(ctx, x, y, seq) {
    let px = x - seq.length * 5.5;
    for (let i = 0; i < seq.length; i++) {
      ctx.fillStyle = BASES[seq[i]];
      ctx.fillRect(px, y, 9, 11);
      px += 11;
    }
  },
  pen(ctx, x, y, hot) {
    ctx.save();
    ctx.translate(x, y + 50);
    ctx.fillStyle = hot ? "rgba(212,180,138,0.10)" : "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.ellipse(0, 8, 62, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  plate(ctx, x, y, title, sub, on) {
    ctx.fillStyle = on ? "rgba(142,224,184,0.14)" : "rgba(8,12,14,0.5)";
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - 70, y, 140, 36, 8); ctx.fill(); }
    else ctx.fillRect(x - 70, y, 140, 36);
    ctx.strokeStyle = on ? "rgba(142,224,184,0.55)" : "rgba(180,200,210,0.18)";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = on ? "#d6f3e4" : "#c5d0c8";
    ctx.font = "600 11px IBM Plex Sans";
    ctx.fillText(title, x, y + 15);
    ctx.fillStyle = "rgba(180,200,210,0.7)";
    ctx.font = "10px IBM Plex Mono";
    ctx.fillText(sub, x, y + 28);
    ctx.textAlign = "start";
  },
  drawPips(ctx, w) {
    const keys = ["soma", "starve", "egg", "enuc", "transfer", "tube", "pulse", "implant", "who"];
    const i = Math.max(0, keys.indexOf(this.state === "birth" ? "who" : this.state === "done" ? "who" : this.state));
    const x0 = w * 0.5 - 72;
    for (let n = 0; n < 9; n++) {
      ctx.beginPath(); ctx.arc(x0 + n * 18, 92, n === i ? 4.2 : 3, 0, Math.PI * 2);
      ctx.fillStyle = n < i ? "rgba(142,224,184,0.85)" : n === i ? "rgba(232,210,160,0.95)" : "rgba(180,200,210,0.22)";
      ctx.fill();
    }
  },
  drawCycle(ctx, x, y) {
    const R = 54;
    ctx.save();
    ctx.strokeStyle = "rgba(180,210,200,0.22)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(x, y, R, 0.15, Math.PI * 1.72); ctx.stroke();
    const g0 = this.starveT;
    ctx.strokeStyle = `rgba(232,196,120,${0.35 + g0 * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, R, Math.PI * 1.72, Math.PI * 2.12); ctx.stroke();
    ctx.fillStyle = "rgba(200,214,208,0.55)"; ctx.font = "10px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("G1", x, y - R - 8);
    ctx.fillText("S", x + R + 14, y + 4);
    ctx.fillText("G2", x, y + R + 16);
    ctx.fillText("M", x - R - 14, y + 4);
    ctx.fillStyle = g0 > 0.55 ? "#e8c878" : "rgba(232,200,120,0.7)";
    ctx.fillText("G0", x - R - 4, y + R + 4);
    ctx.beginPath(); ctx.arc(x + Math.cos(Math.PI * 1.92) * R, y + Math.sin(Math.PI * 1.92) * R, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.textAlign = "start";
  },
  drawMito(ctx, x, y, r) {
    for (let i = 0; i < this.mito.length; i++) {
      const m = this.mito[i];
      const a = m.a + t * 0.35;
      const mx = x + Math.cos(a) * (r * 0.55 + m.d);
      const my = y + Math.sin(a * 1.1) * (r * 0.42 + m.d * 0.6);
      ctx.save();
      ctx.translate(mx, my); ctx.rotate(a);
      ctx.fillStyle = "rgba(210,120,70,0.8)";
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,200,140,0.45)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(0, 2.2, 4, 0); ctx.stroke();
      ctx.restore();
    }
  },
  drawPipette(ctx, tipx, tipy) {
    const bx = tipx + 86, by = tipy - 110;
    ctx.strokeStyle = "rgba(210,230,240,0.7)"; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tipx + 8, tipy - 4); ctx.stroke();
    ctx.strokeStyle = "rgba(160,200,220,0.95)"; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tipx + 8, tipy - 4); ctx.stroke();
    ctx.fillStyle = "rgba(200,220,230,0.85)";
    ctx.beginPath(); ctx.moveTo(tipx + 14, tipy - 10); ctx.lineTo(tipx - 2, tipy); ctx.lineTo(tipx + 12, tipy + 8); ctx.fill();
  },
  drawScope(ctx, L, w, h) {
    const cx = (L.x.x + L.tube.x) / 2, cy = L.x.y;
    const R = Math.min(228, Math.min(w, h) * 0.28);
    ctx.fillStyle = "rgba(2,6,10,0.52)";
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.arc(cx, cy, R, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.strokeStyle = "rgba(160,210,230,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(160,210,230,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 18, cy); ctx.lineTo(cx + 18, cy);
    ctx.moveTo(cx, cy - 18); ctx.lineTo(cx, cy + 18); ctx.stroke();
    ctx.fillStyle = "rgba(180,210,230,0.55)"; ctx.font = "11px IBM Plex Mono";
    ctx.fillText("micromanipulation  ·  ×40", cx - 78, cy - R - 12);
  },
  sheep(ctx, x, y, kind, label, glow, seq, young) {
    ctx.save();
    ctx.translate(x, y);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const breath = reduce ? 0 : Math.sin(t * 1.55 + x * 0.01) * 0.016;
    const nod = reduce ? 0 : Math.sin(t * 0.8 + y * 0.01) * 0.035;
    const s = young ? 0.72 : (this.phase() === "compare" ? 0.84 : this.phase() === "donor" || this.phase() === "pair" ? 1.12 : 0.95);
    ctx.scale(s, s);
    if (glow) { ctx.shadowColor = "rgba(232,210,160,0.35)"; ctx.shadowBlur = 16; }

    const dark = kind === "black";
    const fleeceHi = dark ? "#f4ece0" : "#fff8ee";
    const fleece = dark ? "#e6d8c2" : "#f3e4cc";
    const fleeceLo = dark ? "#c4b08e" : "#d2bc96";
    const skin = dark ? "#1a100c" : "#f0d2b4";
    const skinMid = dark ? "#2a1812" : "#e8c4a0";
    const muzzle = dark ? "#120c0a" : "#f3c8b0";
    const leg = dark ? "#1c120e" : "#eed6b8";
    const legLo = dark ? "#100a08" : "#c8a888";
    const hoof = dark ? "#090604" : "#4a3220";
    const iris = dark ? "#3d2814" : "#5a3a1c";

    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.beginPath(); ctx.ellipse(6, 60, 62, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    const wool = (px, py, rx, ry, rot) => {
      const g = ctx.createRadialGradient(px - rx * 0.28, py - ry * 0.4, 1.5, px, py, Math.max(rx, ry));
      g.addColorStop(0, fleeceHi);
      g.addColorStop(0.5, fleece);
      g.addColorStop(1, fleeceLo);
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, rot || 0, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    };
    const cloven = (hx, hy) => {
      ctx.fillStyle = hoof;
      ctx.beginPath(); ctx.ellipse(hx - 2.6, hy, 3.0, 2.4, -0.18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + 2.6, hy, 3.0, 2.4, 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(hx - 0.6, hy - 1.2, 1.2, 2.6);
    };
    const limb = (hx, hy, fx, far) => {
      ctx.fillStyle = far ? legLo : leg;
      ctx.beginPath();
      ctx.moveTo(hx - 6.5, hy);
      ctx.quadraticCurveTo(hx + (far ? -4 : 2), hy + 16, fx - 4.2, 48);
      ctx.lineTo(fx + 4.2, 48);
      ctx.quadraticCurveTo(hx + 7, hy + 14, hx + 6.5, hy);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark ? (far ? "#0c0806" : "#16100c") : (far ? "#b08a6a" : "#e2c4a4");
      ctx.beginPath();
      ctx.moveTo(fx - 4.4, 40);
      ctx.lineTo(fx + 4.4, 40);
      ctx.lineTo(fx + 3.6, 50);
      ctx.lineTo(fx - 3.6, 50);
      ctx.closePath(); ctx.fill();
      cloven(fx, 53);
    };

    limb(-22, 16, -24, true);
    limb(20, 14, 18, true);
    limb(-8, 20, -6, false);
    limb(34, 18, 36, false);

    ctx.save();
    ctx.translate(0, 6 + breath * 9);
    ctx.scale(1 + breath, 1 - breath * 0.32);
    wool(-8, 6, 40, 24, -0.12);
    wool(16, 8, 32, 22, 0.16);
    wool(-26, 10, 22, 16, -0.28);
    wool(4, -10, 28, 16, -0.04);
    [
      [-34, 4, 14, 11, 0.45], [-26, -10, 15, 12, 0.2], [-10, -18, 16, 13, 0.02],
      [8, -20, 17, 13, -0.08], [24, -14, 14, 12, -0.22], [36, -2, 13, 11, -0.4],
      [34, 16, 14, 11, -0.15], [18, 24, 16, 11, 0.08], [0, 26, 17, 11, 0],
      [-18, 22, 15, 10, 0.2], [-30, 14, 13, 10, 0.32], [-6, 2, 18, 14, 0.04],
      [12, 2, 17, 13, -0.1], [22, 10, 14, 11, -0.18], [-14, -4, 14, 12, 0.12]
    ].forEach(p => wool(...p));
    wool(-42, 12, 9, 7, 0.55);
    ctx.restore();

    ctx.save();
    ctx.translate(30, -6);
    ctx.rotate(nod);

    wool(-16, 8, 16, 12, 0.4);
    wool(-6, 2, 14, 11, 0.15);

    if (dark && !young) {
      ctx.strokeStyle = "#6a4e32"; ctx.lineWidth = 5.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-10, -16); ctx.quadraticCurveTo(-28, -30, -26, -6); ctx.stroke();
      ctx.strokeStyle = "#c4a070"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, -16); ctx.quadraticCurveTo(-26, -28, -24, -8); ctx.stroke();
    }

    ctx.fillStyle = dark ? "#241610" : fleeceHi;
    ctx.beginPath(); ctx.ellipse(-18, -8, 6.5, 13, 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark ? "#c48870" : "#e8b49a";
    ctx.beginPath(); ctx.ellipse(-18, -7, 3.2, 8, 0.85, 0, Math.PI * 2); ctx.fill();

    const face = ctx.createLinearGradient(-12, -18, 16, 22);
    face.addColorStop(0, dark ? "#2c1a14" : "#f7e4cc");
    face.addColorStop(0.45, skin);
    face.addColorStop(1, skinMid);
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.ellipse(2, 2, young ? 20 : 19, young ? 17 : 16, 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = muzzle;
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.quadraticCurveTo(6, 6, 16, 12);
    ctx.quadraticCurveTo(18, 22, 6, 24);
    ctx.quadraticCurveTo(-8, 22, -10, 14);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = dark ? "#241610" : fleeceHi;
    ctx.beginPath(); ctx.ellipse(12, -12, 7, 13, -0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark ? "#c48870" : "#e8b49a";
    ctx.beginPath(); ctx.ellipse(12, -11, 3.4, 8, -0.45, 0, Math.PI * 2); ctx.fill();

    if (dark && !young) {
      ctx.strokeStyle = "#8a6844"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(8, -16); ctx.quadraticCurveTo(26, -32, 30, -8); ctx.stroke();
      ctx.strokeStyle = "#d4b078"; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(8, -16); ctx.quadraticCurveTo(24, -30, 28, -10); ctx.stroke();
    }

    const eye = (ex, ey, rx, ry) => {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath(); ctx.ellipse(ex + 0.6, ey + 1.2, rx, ry * 0.7, 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f4efe6";
      ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = iris;
      ctx.beginPath(); ctx.ellipse(ex + 0.35, ey + 0.2, rx * 0.62, ry * 0.7, 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0b0705";
      ctx.beginPath(); ctx.ellipse(ex + 0.45, ey + 0.25, rx * 0.28, ry * 0.55, 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(ex + rx * 0.28, ey - ry * 0.28, Math.max(0.7, rx * 0.18), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = dark ? "rgba(10,6,4,0.55)" : "rgba(70,40,28,0.4)";
      ctx.lineWidth = 1.15;
      ctx.beginPath(); ctx.ellipse(ex, ey - ry * 0.15, rx * 1.05, ry * 0.55, 0.1, Math.PI, Math.PI * 2); ctx.stroke();
    };
    eye(-7, -1, young ? 4.1 : 3.6, young ? 4.4 : 3.9);
    eye(9, 0.5, young ? 4.8 : 4.4, young ? 5.1 : 4.8);

    ctx.fillStyle = dark ? "#080504" : "#c47868";
    ctx.beginPath(); ctx.ellipse(8, 18, 2.6, 1.8, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.2, 19, 2.4, 1.7, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = dark ? "rgba(80,40,30,0.75)" : "rgba(160,90,80,0.6)";
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(5, 20.5, 5, 0.15, Math.PI - 0.2); ctx.stroke();
    if (!dark) {
      ctx.fillStyle = "rgba(232,140,150,0.32)";
      ctx.beginPath(); ctx.ellipse(-2, 10, 6, 4, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, 11, 5, 3.4, -0.15, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
    ctx.restore();
    ctx.fillStyle = glow ? "#f0e0b8" : "#c5d0c8";
    ctx.font = "12px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText(label, x, y + 74);
    if (seq && this.phase() === "compare") this.barcode(ctx, x, y + 84, seq);
    ctx.textAlign = "start";
  },
  hit(p, s) { return Math.abs(p.x - s.x) < 110 && Math.abs(p.y - s.y) < 78; },
  fail(m) {
    this.mistakes++;
    audio.bad();
    toast(m, "warn");
    NB.add("dolly", "Error: " + m);
    sim.classList.remove("shake");
    void sim.offsetWidth;
    sim.classList.add("shake");
  },
  steps() {
    return {
      soma: "1 / 9  ·  Click the cream-faced Finn-Dorset for a mammary cell.",
      starve: "2 / 9  ·  Hold serum-starve. Watch the cell leave the cycle and arrest in G0.",
      egg: "3 / 9  ·  Click the dark-faced Blackface for an unfertilised egg.",
      enuc: "4 / 9  ·  Pipette the violet egg nucleus onto discard. Mitochondria stay.",
      transfer: "5 / 9  ·  Seat the G0 mammary nucleus in the empty cytoplasm.",
      tube: "6 / 9  ·  Move the reconstructed oocyte between the electrodes.",
      pulse: "7 / 9  ·  Hold the pulse. It starts mitosis — it does not write DNA.",
      implant: "8 / 9  ·  Wait for 4–8 cells, then drag the embryo onto the surrogate.",
      birth: "Lamb born. Face like Finn-Dorset. Click her to read nuclear barcodes.",
      who: "9 / 9  ·  Click the ewe whose nuclear barcode Dolly copied.",
      done: "Nuclear DNA = Finn-Dorset. Cytoplasm and uterus = Blackface."
    };
  },
  tick() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (this.spark > 0) this.spark *= reduce ? 0.7 : 0.92;
    if (this.state === "starve" && (this.holdingStarve || this.starveT > 0) && this.starveT < 1) {
      this.starveT = Math.min(1, this.starveT + (reduce ? 0.08 : 0.018));
    }
    if (this.state === "implant" && this.embryo && !this.embryo.gone) {
      this.cleave = Math.min(3.2, this.cleave + (reduce ? 0.05 : 0.01));
    }
    const w = innerWidth, h = innerHeight, ctx = fit(sim, w, h), L = this.layout();
    const ph = this.phase();
    ctx.clearRect(0, 0, w, h);
    drawDust(ctx, w, h, t, 10);
    const wash = ctx.createRadialGradient(w * 0.48, h * 0.48, 40, w * 0.48, h * 0.48, h * 0.62);
    wash.addColorStop(0, "rgba(18,28,32,0.18)");
    wash.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);

    const who = ph === "compare";
    if (ph === "donor" || ph === "pair" || ph === "compare") {
      this.pen(ctx, L.finn.x, L.finn.y, this.state === "soma" || who);
      this.sheep(ctx, L.finn.x, L.finn.y, "white", "Finn-Dorset", this.state === "soma" || (who && this.state === "done"), FINN_DNA);
    }
    if (ph === "pair" || ph === "compare") {
      this.pen(ctx, L.eggE.x, L.eggE.y, this.state === "egg");
      this.sheep(ctx, L.eggE.x, L.eggE.y, "black", "Egg donor", this.state === "egg", BF_DNA);
    }
    if (ph === "womb" || ph === "compare") {
      this.pen(ctx, L.surr.x, L.surr.y, this.state === "implant" || this.state === "birth");
      this.sheep(ctx, L.surr.x, L.surr.y, "black", "Surrogate", this.state === "implant" || this.state === "birth", BF_DNA);
    }
    if (this.born && (ph === "compare" || this.state === "birth")) {
      this.sheep(ctx, L.dolly.x, L.dolly.y, "white", "Dolly", true, FINN_DNA, true);
    }
    if (who) this.drawMatch(ctx, L);
    if (ph === "bench") {
      this.drawBench(ctx, L, ph);
      this.drawBits(ctx);
      this.drawScope(ctx, L, w, h);
    } else if (ph === "womb") {
      this.drawBench(ctx, L, ph);
      this.drawBits(ctx);
    } else {
      this.drawBits(ctx);
    }
    this.drawPips(ctx, w);
    if (this._hud !== this.state) {
      this._hud = this.state;
      const el = $("#dStep");
      if (el) el.textContent = this.steps()[this.state];
    }
    status(this.steps()[this.state], acc(this.mistakes));
  },
  drawBench(ctx, L, ph) {
    if (ph === "womb") {
      if (this.state === "birth") {
        ctx.fillStyle = "rgba(142,224,184,0.8)"; ctx.font = "13px IBM Plex Sans"; ctx.textAlign = "center";
        ctx.fillText("white face · click Dolly to read barcodes", (L.surr.x + L.dolly.x) / 2, L.surr.y - 86);
        ctx.textAlign = "start";
      } else {
        ctx.fillStyle = "rgba(180,210,230,0.5)"; ctx.font = "11px IBM Plex Mono";
        ctx.fillText(this.cleave >= 2 ? "drag embryo → uterus" : "cleavage in progress", L.surr.x - 150, L.surr.y - 86);
      }
      return;
    }
    ctx.fillStyle = "rgba(16,22,28,0.28)";
    const bx = Math.min(L.x.x, L.tube.x) - 78, by = L.x.y - 64;
    const bw = Math.abs(L.tube.x - L.x.x) + 168, bh = 140;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill(); }
    else ctx.fillRect(bx, by, bw, bh);

    ctx.fillStyle = "rgba(180,70,60,0.16)";
    ctx.beginPath(); ctx.arc(L.x.x, L.x.y, 24, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#c45a4a"; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(L.x.x - 9, L.x.y - 9); ctx.lineTo(L.x.x + 9, L.x.y + 9);
    ctx.moveTo(L.x.x + 9, L.x.y - 9); ctx.lineTo(L.x.x - 9, L.x.y + 9); ctx.stroke();
    ctx.fillStyle = "rgba(196,90,74,0.8)"; ctx.font = "11px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("haploid nucleus out", L.x.x, L.x.y + 40);

    ctx.fillStyle = "rgba(8,14,20,0.7)";
    ctx.fillRect(L.tube.x - 30, L.tube.y - 44, 60, 88);
    ctx.strokeStyle = "rgba(160,210,240,0.6)"; ctx.lineWidth = 2;
    ctx.strokeRect(L.tube.x - 30, L.tube.y - 44, 60, 88);
    const pulseOn = this.state === "pulse" || this.spark > 0.05;
    ctx.fillStyle = pulseOn ? "rgba(140,210,255,0.95)" : "rgba(90,110,130,0.85)";
    ctx.fillRect(L.tube.x - 44, L.tube.y - 30, 12, 60);
    ctx.fillRect(L.tube.x + 32, L.tube.y - 30, 12, 60);
    ctx.fillStyle = "rgba(180,210,230,0.75)";
    ctx.fillText("electrofusion", L.tube.x, L.tube.y + 58);
    ctx.textAlign = "start";
    if (pulseOn) {
      const a = 0.3 + this.spark * 0.65 + (this.state === "pulse" ? Math.sin(t * 16) * 0.2 : 0);
      ctx.strokeStyle = `rgba(160,220,255,${a})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(L.tube.x, L.tube.y, 38 + (t % 1) * 8, 0, Math.PI * 2); ctx.stroke();
    }
  },
  drawMatch(ctx, L) {
    const ok = this.state === "done";
    this.plate(ctx, L.finn.x, L.finn.y + 92, "nuclear DNA", "somatic donor", ok);
    this.plate(ctx, L.eggE.x, L.eggE.y + 92, "cytoplasm", "mitochondria stay", false);
    this.plate(ctx, L.surr.x, L.surr.y + 92, "uterus", "not the genome", false);
    this.plate(ctx, L.dolly.x, L.dolly.y + 86, "clone", "mitotic copy", ok);
    ctx.strokeStyle = ok ? "rgba(142,224,184,0.7)" : "rgba(232,210,160,0.4)";
    ctx.setLineDash(ok ? [] : [6, 5]); ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(L.finn.x, L.finn.y + 88);
    ctx.lineTo(L.dolly.x, L.dolly.y - 48);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ok ? "rgba(142,224,184,0.92)" : "rgba(232,210,160,0.9)";
    ctx.font = "13px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText(ok ? "Same nuclear barcode. Different cytoplasm and uterus." : "Whose nuclear barcode did mitosis copy?", L.w * 0.5, L.h * 0.18);
    ctx.textAlign = "start";
  },
  drawBits(ctx) {
    if (this.soma && !this.soma.gone) {
      if (this.state === "starve") this.drawCycle(ctx, this.soma.x, this.soma.y);
      drawCell(ctx, {
        x: this.soma.x, y: this.soma.y, r: 24 - this.starveT * 5, t, kind: "soma",
        showNuc: true, hot: this.state === "transfer" || this.state === "starve",
        pulse: this.state === "starve" ? this.starveT * 0.45 : 0
      });
      this.barcode(ctx, this.soma.x, this.soma.y - 58, FINN_DNA);
      ctx.fillStyle = "rgba(232,180,200,0.95)"; ctx.font = "11px IBM Plex Sans"; ctx.textAlign = "center";
      ctx.fillText(this.starved ? "G0 diploid nucleus" : "mammary · leaving cycle", this.soma.x, this.soma.y - 72);
      ctx.textAlign = "start";
    }
    if ((this.state === "enuc" || this.drag?.id === "nucE") && this.nucE && !this.nucE.gone) {
      this.drawPipette(ctx, this.nucE.x, this.nucE.y);
    }
    if (this.state === "transfer" && this.soma && !this.soma.gone) {
      this.drawPipette(ctx, this.soma.x, this.soma.y);
    }
    if (this.egg && !this.egg.gone) {
      drawCell(ctx, { x: this.egg.x, y: this.egg.y, r: 36, t, kind: "egg", showNuc: !(this.nucE && this.nucE.gone), hot: this.state === "enuc" || this.state === "transfer" });
      this.drawMito(ctx, this.egg.x, this.egg.y, 36);
      ctx.fillStyle = "rgba(210,140,90,0.85)"; ctx.font = "10px IBM Plex Mono"; ctx.textAlign = "center";
      ctx.fillText("Blackface cytoplasm", this.egg.x, this.egg.y + 52);
      ctx.textAlign = "start";
    }
    if (this.nucE && !this.nucE.gone) {
      ctx.beginPath(); ctx.arc(this.nucE.x, this.nucE.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(120,90,210,0.95)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.stroke();
      this.barcode(ctx, this.nucE.x, this.nucE.y - 26, BF_DNA);
      ctx.fillStyle = "rgba(180,160,230,0.95)"; ctx.font = "11px IBM Plex Sans";
      ctx.fillText("egg nucleus", this.nucE.x + 16, this.nucE.y - 8);
    }
    if (this.recon && !this.recon.gone) {
      drawCell(ctx, { x: this.recon.x, y: this.recon.y, r: 36, t, kind: "egg", showNuc: true, pulse: this.spark, hot: this.state === "tube" || this.state === "pulse" });
      this.drawMito(ctx, this.recon.x, this.recon.y, 36);
      this.barcode(ctx, this.recon.x, this.recon.y - 62, FINN_DNA);
      ctx.fillStyle = "rgba(224,180,120,0.95)"; ctx.font = "11px IBM Plex Sans"; ctx.textAlign = "center";
      ctx.fillText("Finn nucleus in Blackface egg", this.recon.x, this.recon.y - 76);
      if (this.state === "pulse") {
        ctx.fillStyle = "rgba(160,220,255,0.9)";
        ctx.fillText("pulse → mitosis, not new genes", this.recon.x, this.recon.y + 58);
        drawHelix(ctx, this.recon.x - 48, this.recon.y + 72, 96, t, true);
      }
      ctx.textAlign = "start";
    }
    if (this.embryo && !this.embryo.gone) {
      const n = Math.max(1, Math.min(8, 1 << Math.floor(this.cleave)));
      ctx.strokeStyle = "rgba(240,210,170,0.35)"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(this.embryo.x, this.embryo.y, 22 + n, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.2;
        const rad = n === 1 ? 0 : 8 + n;
        drawCell(ctx, { x: this.embryo.x + Math.cos(a) * rad, y: this.embryo.y + Math.sin(a) * rad, r: n > 4 ? 8 : 12, t, kind: "soma", showNuc: true });
      }
      this.barcode(ctx, this.embryo.x, this.embryo.y - 52, FINN_DNA);
      ctx.fillStyle = "rgba(230,200,140,0.95)"; ctx.font = "11px IBM Plex Sans"; ctx.textAlign = "center";
      ctx.fillText(n + "-cell  ·  mitotic copies", this.embryo.x, this.embryo.y - 66);
      if (this.cleave < 2) {
        ctx.fillStyle = "rgba(224,180,120,0.9)";
        ctx.fillText("wait for 4–8 cells", this.embryo.x, this.embryo.y + 44);
      } else {
        ctx.fillStyle = "rgba(142,224,184,0.9)";
        ctx.fillText("ready to implant", this.embryo.x, this.embryo.y + 44);
      }
      ctx.textAlign = "start";
    }
  },
  down(p) {
    const L = this.layout();
    if (inspect) {
      if (this.hit(p, L.finn) && (this.phase() === "donor" || this.phase() === "pair" || this.phase() === "compare")) callout("Finn-Dorset", "Mammary / nuclear donor. Dolly’s nuclear DNA is a mitotic copy of this ewe — not the Blackface.", p.x, p.y);
      else if (this.hit(p, L.eggE) && (this.phase() === "pair" || this.phase() === "compare")) callout("Blackface egg donor", "Unfertilised egg. Cytoplasm and mitochondria remain after the haploid nucleus is discarded.", p.x, p.y);
      else if (this.hit(p, L.surr) && (this.phase() === "womb" || this.phase() === "compare")) callout("Surrogate", "Blackface uterus. She is not the nuclear parent. Her barcode stays Blackface.", p.x, p.y);
      else if (this.born && this.hit(p, L.dolly)) callout("Dolly", "White-faced like the Finn-Dorset. Nuclear DNA from the G0 mammary cell, copied by mitosis. Pulse did not write genes.", p.x, p.y);
      else if (this.egg && !this.egg.gone && dist(p, this.egg) < 48) callout("Cytoplasm", "Mitochondria are in the egg cytoplasm. They do not decide the nuclear barcode.", p.x, p.y);
      else hideCallout();
      return;
    }
    if (this.state === "birth" && (this.hit(p, L.dolly) || this.hit(p, L.surr))) {
      this.state = "who"; audio.ok();
      NB.add("dolly", "Barcode lineup. Nuclear DNA is the test, not who gave birth.");
      return;
    }
    if (this.state === "soma" && this.hit(p, L.finn)) {
      this.soma = { x: L.finn.x + 140, y: L.finn.y, r: 16 }; this.state = "starve"; audio.ok();
      const s = $("#dStarve"); if (s) s.disabled = false;
      NB.add("dolly", "Mammary cell taken from Finn-Dorset. Serum-starve to G0."); return;
    }
    if (this.state === "egg" && this.hit(p, L.eggE)) {
      this.state = "enuc";
      const B = this.layout();
      this.egg = { x: B.x.x + 90, y: B.x.y, r: 22 };
      this.nucE = { x: this.egg.x - 4, y: this.egg.y - 4, r: 8 };
      this.mito = Array.from({ length: 8 }, (_, i) => ({ a: (i / 8) * Math.PI * 2, d: 2 + (i % 3) * 3 }));
      if (this.soma && !this.soma.gone) { this.soma.x = B.x.x - 90; this.soma.y = B.x.y; }
      audio.ok();
      NB.add("dolly", "Unfertilised Blackface egg collected."); return;
    }
    if (this.state === "who") {
      if (this.hit(p, L.finn)) {
        this.state = "done"; markDone("scnt"); markSim("scnt"); audio.ok();
        NB.add("dolly", "Dolly matches the Finn-Dorset nuclear donor, not the surrogate.");
        toast("Correct. Nuclear DNA = mammary donor. Surrogate provided the uterus.", "");
        return;
      }
      if (this.born && this.hit(p, L.dolly)) return this.fail("Dolly is the clone. Click the ewe whose nucleus she copied — the Finn-Dorset.");
      if (this.hit(p, L.eggE) || this.hit(p, L.surr)) return this.fail("Blackface barcode is cytoplasm / uterus. Nuclear DNA matches the somatic donor.");
      return this.fail("Nuclear DNA matches the somatic donor, not the egg donor or surrogate.");
    }
    const items = ["embryo", "recon", "soma", "egg", "nucE"];
    for (const id of items) {
      const o = this[id];
      if (o && !o.gone && dist(p, o) < (o.r || 16) + 14) { this.drag = { id, ox: p.x - o.x, oy: p.y - o.y }; return; }
    }
  },
  move(p) { if (!this.drag) return; this[this.drag.id].x = p.x - this.drag.ox; this[this.drag.id].y = p.y - this.drag.oy; },
  up() {
    if (!this.drag) return;
    const id = this.drag.id; this.drag = null;
    const L = this.layout();
    if (id === "nucE" && this.state === "enuc") {
      if (dist(this.nucE, L.x) < 40) {
        this.nucE.gone = true; this.state = "transfer"; audio.ok();
        NB.add("dolly", "Egg enucleated. Cytoplasm retained.");
      } else this.fail("Discard the egg nucleus on the red X so genomes do not mix.");
    } else if (id === "soma" && this.state === "transfer") {
      if (!this.starved) return this.fail("Serum-starve the mammary cell first. Dolly’s donor was in G0.");
      if (this.egg && dist(this.soma, this.egg) < 36) {
        this.recon = { x: this.egg.x, y: this.egg.y, r: 22 };
        this.soma.gone = true; this.egg.gone = true; this.state = "tube"; audio.ok();
        NB.add("dolly", "Finn-Dorset nucleus seated in enucleated egg.");
      } else this.fail("Place the mammary nucleus in the empty egg.");
    } else if (id === "recon" && this.state === "tube") {
      if (dist(this.recon, L.tube) < 46) {
        this.recon.x = L.tube.x; this.recon.y = L.tube.y;
        this.state = "pulse";
        const b = $("#dPulse"); if (b) b.disabled = false;
        audio.ok(); NB.add("dolly", "Reconstructed oocyte between fusion electrodes.");
      } else this.fail("The reconstructed egg must sit between the electrodes.");
    } else if (id === "embryo" && this.state === "implant") {
      if (this.cleave < 2) return this.fail("Wait. Mitosis must copy the donor nucleus to 4–8 cells before implant.");
      if (this.hit(this.embryo, L.surr)) {
        this.embryo.gone = true; this.born = true; this.state = "birth"; audio.ok();
        NB.add("dolly", "Embryo implanted in Blackface surrogate. Lamb born.");
        toast("White face like the nuclear donor. Next: match the barcode, not the ewe who carried her.", "");
      } else this.fail("Implant the embryo in the Blackface surrogate.");
    }
  },
  activate() {
    if (this.state !== "pulse") return;
    this.spark = 1;
    this.cleave = 0;
    if (this.recon) this.recon.gone = true;
    this.state = "implant";
    const W = this.layout();
    this.embryo = { x: W.surr.x - 150, y: W.surr.y, r: 16 };
    audio.ok();
    NB.add("dolly", "Pulse applied. Mitosis copies donor nuclear DNA.");
    toast("Mitosis copies the donor nucleus. No genes were added by the current.", "");
  },
  starve() {
    if (this.state !== "starve") return;
    this.starved = true;
    this.starveT = 1;
    this.state = "egg";
    const s = $("#dStarve"); if (s) s.disabled = true;
    audio.ok();
    NB.add("dolly", "Mammary cell quiescent (G0). Ready for nuclear transfer.");
    toast("G0. Now collect the Blackface egg.", "");
  }
};
function bindDollyDock() {
  const hold = (sel, fn) => {
    const b = document.querySelector(sel); if (!b) return;
    let h;
    b.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); if (b.disabled) return;
      if (sel === "#dStarve") Dolly.holdingStarve = true;
      let n = 0;
      h = setInterval(() => {
        n += 5;
        const i = b.querySelector("i"); if (i) i.style.width = n + "%";
        if (sel === "#dStarve") Dolly.starveT = Math.min(1, n / 100);
        if (n >= 100) { clearInterval(h); Dolly.holdingStarve = false; fn(); }
      }, 36);
    });
    b.addEventListener("pointerup", () => { clearInterval(h); Dolly.holdingStarve = false; });
    b.addEventListener("pointerleave", () => { clearInterval(h); Dolly.holdingStarve = false; });
  };
  hold("#dPulse", () => Dolly.activate());
  hold("#dStarve", () => Dolly.starve());
}

/* ---------- PLANT ---------- */
function leaf(ctx, x, y, ang, len, tw, col, sway) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang + sway);
  const g = ctx.createLinearGradient(0, 0, tw * 0.4, len);
  g.addColorStop(0, col);
  g.addColorStop(1, "rgba(12,36,18,0.95)");
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(tw, len * 0.38, 0, len);
  ctx.quadraticCurveTo(-tw * 0.85, len * 0.34, 0, 0);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(230,255,230,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.quadraticCurveTo(tw * 0.08, len * 0.45, 0, len * 0.88);
  ctx.strokeStyle = "rgba(20,50,24,0.35)";
  ctx.stroke();
  ctx.restore();
}

function pot(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath(); ctx.ellipse(0, 18, 28, 6, 0, 0, Math.PI * 2); ctx.fill();
  const clay = ctx.createLinearGradient(-22, -8, 22, 22);
  clay.addColorStop(0, "#c47a4a");
  clay.addColorStop(0.45, "#8a4a2c");
  clay.addColorStop(1, "#4a2416");
  ctx.beginPath();
  ctx.moveTo(-22, -6); ctx.lineTo(-16, 18); ctx.lineTo(16, 18); ctx.lineTo(22, -6);
  ctx.closePath();
  ctx.fillStyle = clay;
  ctx.fill();
  ctx.fillStyle = "#6b3a22";
  ctx.fillRect(-24, -10, 48, 8);
  ctx.fillStyle = "#3a2818";
  ctx.beginPath(); ctx.ellipse(0, -8, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function shrub(ctx, x, y, s, time, hot, young) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const h = young ? 92 : 148;
  ctx.strokeStyle = young ? "#4a8a48" : "#3d6a38";
  ctx.lineWidth = young ? 5 : 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(-10 + Math.sin(time * 0.4) * 4, -h * 0.45, 2, -h);
  ctx.stroke();
  const n = young ? 7 : 11;
  for (let i = 0; i < n; i++) {
    const u = 0.22 + i / n * 0.72;
    const side = i % 2 ? 1 : -1;
    const bx = side * (6 + i * 1.1);
    const by = -h * u;
    const len = (young ? 28 : 38) - i * 1.4;
    const hue = hot && i > n - 4 ? "#9dffc0" : `hsl(${118 + (i % 4) * 5}, ${46 + (hot ? 12 : 0)}%, ${28 + i * 1.6}%)`;
    leaf(ctx, bx, by, side * (0.7 + i * 0.04), len, 11 + (i % 3), hue, Math.sin(time + i) * 0.05);
  }
  leaf(ctx, 2, -h - 4, -0.15, young ? 22 : 30, 9, hot ? "#b8ffd4" : "#4c9a58", Math.sin(time) * 0.04);
  leaf(ctx, -2, -h, 0.2, young ? 20 : 26, 8, hot ? "#b8ffd4" : "#3d8a48", Math.cos(time) * 0.04);
  ctx.restore();
}

const Plant = {
  tissue: false, cutDone: false, sterile: false, plated: false, xfer: false,
  temp: 24, light: 55, nut: 70, day: 0, bio: 0, contam: false, ex: null, drag: false, timer: null, wean: 0,
  reset() {
    clearInterval(this.timer);
    Object.assign(this, { tissue: false, cutDone: false, sterile: false, plated: false, xfer: false, day: 0, bio: 0, contam: false, ex: null, drag: false, timer: null, wean: 0 });
  },
  tickDay() {
    if (!this.plated) return;
    this.day++;
    const ts = 1 - Math.abs(this.temp - 24) / 22;
    const ls = 1 - Math.abs(this.light - 55) / 70;
    if (!this.sterile && this.day >= 2) this.contam = true;
    const g = this.contam ? -1.1 : Math.max(0, ts * ls * (this.nut / 100)) * 6.5;
    this.bio = Math.max(0, Math.min(100, this.bio + g));
    NB.add("plant", `Day ${this.day} · biomass ${Math.round(this.bio)}%${this.contam ? " · contamination" : ""}`);
    if (this.bio >= 78 && this.sterile) markDone("plant");
  },
  tick() {
    if (this.wean > 0 && this.wean < 1) this.wean = Math.min(1, this.wean + 0.016);
    const w = innerWidth, h = innerHeight, ctx = fit(sim, w, h);
    ctx.clearRect(0, 0, w, h);
    drawDust(ctx, w, h, t * 0.6, 18);
    const gnd = ctx.createLinearGradient(0, h * 0.7, 0, h);
    gnd.addColorStop(0, "rgba(10,18,12,0)");
    gnd.addColorStop(1, "rgba(8,16,10,0.45)");
    ctx.fillStyle = gnd;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);

    const px = w * 0.2, py = h * 0.78;
    ctx.fillStyle = "rgba(18,36,20,0.55)";
    ctx.beginPath(); ctx.ellipse(px, py + 10, 64, 12, 0, 0, Math.PI * 2); ctx.fill();
    shrub(ctx, px, py, 1.05, t, this.tissue && !this.cutDone, false);
    ctx.fillStyle = "rgba(212,180,138,0.7)";
    ctx.font = "12px IBM Plex Sans";
    ctx.textAlign = "center";
    ctx.fillText("Parent  ·  totipotent shoot", px, py + 36);

    const dx = w * 0.52, dy = h * 0.58;
    this.drawFlask(ctx, dx, dy);
    if (this.cutDone && this.ex && !this.plated) this.drawExplant(ctx, this.ex.x, this.ex.y, 1);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(212,180,138,0.7)";
    ctx.font = "12px IBM Plex Mono";
    ctx.fillText(`Day ${this.day}  ·  biomass ${Math.round(this.bio)}%  ·  ${this.temp}°C`, dx, dy + 118);
    ctx.textAlign = "start";

    if (this.xfer) this.drawGreenhouse(ctx, w, h);

    status(this.contam ? "Contamination. The explant was not sterilised." : this.xfer ? "Acclimatised clones — same nuclear genes as the parent." : !this.tissue ? "Select shoot tissue on the parent." : !this.cutDone ? "Cut an explant — button at the right, or click the plant again." : !this.plated ? "Drag the explant into the vessel." : `Day ${this.day} · growth responding to climate.`, acc(this.contam ? 3 : 0));
  },
  drawFlask(ctx, dx, dy) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(dx, dy + 86, 78, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(dx - 62, dy + 70);
    ctx.quadraticCurveTo(dx - 78, dy + 10, dx - 28, dy - 52);
    ctx.lineTo(dx - 18, dy - 108);
    ctx.lineTo(dx + 18, dy - 108);
    ctx.lineTo(dx + 28, dy - 52);
    ctx.quadraticCurveTo(dx + 78, dy + 10, dx + 62, dy + 70);
    ctx.closePath();
    const glass = ctx.createLinearGradient(dx - 70, dy - 80, dx + 70, dy + 80);
    glass.addColorStop(0, "rgba(190,220,210,0.16)");
    glass.addColorStop(0.45, "rgba(40,70,55,0.28)");
    glass.addColorStop(1, "rgba(12,24,18,0.5)");
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = "rgba(210,230,220,0.45)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dx - 22, dy - 108); ctx.lineTo(dx + 22, dy - 108);
    ctx.lineTo(dx + 26, dy - 118); ctx.lineTo(dx - 26, dy - 118);
    ctx.closePath();
    ctx.fillStyle = "rgba(200,220,210,0.2)";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.contam ? "rgba(110,62,28,0.78)" : "rgba(72,98,36,0.7)";
    ctx.beginPath();
    ctx.ellipse(dx, dy + 38, 58, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.contam ? "rgba(150,80,30,0.45)" : "rgba(90,120,40,0.45)";
    ctx.beginPath();
    ctx.ellipse(dx, dy + 22, 52, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(dx - 48, dy - 20);
    ctx.quadraticCurveTo(dx - 40, dy + 20, dx - 36, dy + 58);
    ctx.stroke();
    if (this.contam) {
      for (let i = 0; i < 22; i++) {
        ctx.fillStyle = `rgba(180,70,30,${0.18 + (i % 5) * 0.08})`;
        ctx.beginPath();
        ctx.arc(dx + Math.sin(t * 0.7 + i) * 42, dy + 8 + Math.cos(t * 0.5 + i * 1.3) * 28, 2 + i % 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.plated) {
      const g = this.bio / 100;
      if (g < 0.22) {
        ctx.fillStyle = "#c4b070";
        ctx.beginPath(); ctx.ellipse(dx, dy + 18, 14 + g * 20, 8 + g * 10, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        const n = g < 0.4 ? 2 : g < 0.65 ? 3 : 5;
        for (let i = 0; i < n; i++) {
          const ox = (i - (n - 1) / 2) * 16;
          shrub(ctx, dx + ox, dy + 22, 0.28 + g * 0.28, t + i, false, true);
        }
      }
    } else if (this.cutDone && this.ex) {
      /* empty sterile medium waiting */
    }
    ctx.restore();
  },
  drawExplant(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.4);
    ctx.scale(s, s);
    ctx.strokeStyle = "#4a8a40";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(12, -10); ctx.stroke();
    leaf(ctx, 4, -6, -0.8, 18, 7, this.sterile ? "#7dffb0" : "#5dcc7a", 0);
    leaf(ctx, 8, -2, 0.5, 14, 6, "#4cbf6a", 0);
    ctx.restore();
  },
  drawGreenhouse(ctx, w, h) {
    const u = this.wean;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * u;
    ctx.fillStyle = "rgba(12,22,16,0.55)";
    ctx.fillRect(w * 0.68, h * 0.42, w * 0.3, h * 0.46);
    ctx.strokeStyle = "rgba(160,200,170,0.25)";
    ctx.strokeRect(w * 0.68, h * 0.42, w * 0.3, h * 0.46);
    ctx.fillStyle = "rgba(90,70,40,0.55)";
    ctx.fillRect(w * 0.69, h * 0.78, w * 0.28, 10);
    ctx.fillStyle = "#d4b48a";
    ctx.font = "11px IBM Plex Mono";
    ctx.fillText("GREENHOUSE  ·  clones of the parent", w * 0.7, h * 0.46);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const x = w * 0.73 + (i % 2) * w * 0.12;
      const y = h * 0.62 + Math.floor(i / 2) * h * 0.16;
      const sc = (0.42 + 0.12 * u) * (0.92 + (i % 3) * 0.03);
      pot(ctx, x, y + 8, 0.85);
      shrub(ctx, x, y, sc, t + i * 0.4, false, true);
    }
    ctx.restore();
  },
  down(p) {
    if (inspect) {
      if (this.xfer && p.x > innerWidth * 0.68) callout("Acclimatised clones", "Weaned from in vitro culture. Same nuclear DNA as the parent shoot. Phenotype can still differ with greenhouse conditions.", p.x, p.y);
      else if (p.x < innerWidth * 0.34) callout("Parent shoot", "Totipotent tissue. An explant from here can rebuild a whole plant.", p.x, p.y);
      else callout("Culture vessel", "Sterile nutrient medium. Callus, then plantlets, then acclimatise.", p.x, p.y);
      return;
    }
    if (p.x < innerWidth * 0.42 && p.y > innerHeight * 0.18 && p.y < innerHeight * 0.88) {
      if (!this.tissue) { this.tissue = true; audio.ok(); toast("Shoot selected. Now click Cut explant, or click the plant again.", ""); return; }
      if (!this.cutDone) { this.takeCut(); return; }
    }
    if (this.ex && dist(p, this.ex) < 28) this.drag = true;
  },
  move(p) { if (this.drag && this.ex) { this.ex.x = p.x; this.ex.y = p.y; } },
  up(p) {
    if (!this.drag) return;
    this.drag = false;
    const dx = innerWidth * 0.52, dy = innerHeight * 0.58;
    if (dist(p, { x: dx, y: dy }) < 120) this.plate();
  },
  takeCut() {
    if (!this.tissue) return toast("Click the parent plant on the left first, then cut.", "warn");
    if (this.cutDone) return;
    this.cutDone = true;
    this.ex = { x: innerWidth * 0.28, y: innerHeight * 0.38 };
    audio.ok();
    toast("Explant cut. Sterilise, then drag it into the flask.", "");
  },
  ster() { if (!this.cutDone) return toast("Cut first.", "warn"); this.sterile = true; audio.ok(); NB.add("plant", "Surface sterilised."); },
  plate() {
    if (!this.cutDone) return;
    this.plated = true;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tickDay(), 1100);
    NB.add("plant", this.sterile ? "Plated on sterile medium." : "Plated without sterilisation.");
  },
  xferOut() {
    if (this.contam) return toast("Contaminated culture cannot be weaned.", "warn");
    if (this.bio < 55) return toast("Wait for plantlets.", "warn");
    this.xfer = true;
    this.wean = 0.04;
    markDone("plant"); markSim("plant"); audio.ok();
    toast("Plantlets weaned. Clones of the parent, now in the greenhouse.", "");
  }
};
function bindPlantDock() {
  $("#pCut").onclick = (e) => { e.stopPropagation(); Plant.takeCut(); };
  $("#pSter").onclick = (e) => { e.stopPropagation(); Plant.ster(); };
  $("#pPlate").onclick = (e) => { e.stopPropagation(); Plant.plate(); };
  $("#pTemp").oninput = (e) => { Plant.temp = Number(e.target.value); };
  $("#pLight").oninput = (e) => { Plant.light = Number(e.target.value); };
  $("#pNut").oninput = (e) => { Plant.nut = Number(e.target.value); };
  $("#pXfer").onclick = (e) => { e.stopPropagation(); Plant.xferOut(); };
}

/* ---------- BACTERIA ---------- */
const Bac = {
  n: 1, phase: 0, nut: 80, temp: 37, run: false, accu: 0, hist: [1], view: "micro", cam: 1, gens: 0, _hud: "",
  reset() {
    Object.assign(this, { n: 1, phase: 0, accu: 0, hist: [1], run: false, cam: 1, gens: 0, view: "micro", _hud: "" });
  },
  factor() {
    const tf = Math.max(0, 1 - Math.abs(this.temp - 37) / 28);
    return (this.nut / 100) * tf;
  },
  tick() {
    const f = this.factor();
    if (this.run) {
      this.phase = (this.phase + 0.01 * (0.25 + f)) % 1;
      this.accu += 0.22 + f * 1.15;
      if (this.accu > 90 && this.n < 256) {
        this.accu = 0; this.n *= 2; this.gens++; this.hist.push(this.n);
        NB.add("bac", "Generation " + this.gens + " · n = " + this.n);
        if (this.n >= 32) { markDone("bac"); markSim("bac"); }
        audio.ok();
      }
    }
    this.cam = lerp(this.cam, this.view === "colony" ? 0.42 : 1, 0.07);
    const w = innerWidth, h = innerHeight, ctx = fit(sim, w, h);
    ctx.clearRect(0, 0, w, h);
    drawDust(ctx, w, h, t, 20);
    if (this.view === "colony") this.drawDish(ctx, w, h);
    else this.drawMicro(ctx, w, h);
    this.graph(ctx, w, h);
    const fizz = this.phase < 0.28 ? "DNA replicating" : this.phase < 0.52 ? "cell elongating" : this.phase < 0.78 ? "septum forming" : "splitting into two clones";
    const msg = !this.run ? "One cell. Press Culture to start binary fission." :
      f < 0.2 ? "Growth stalled. Bring temperature near 37°C and raise nutrients." :
      "n = " + this.n + "  ·  gen " + this.gens + "  ·  " + fizz + "  ·  " + this.temp + "°C";
    if (this._hud !== msg) {
      this._hud = msg;
      const el = $("#bStep"); if (el) el.textContent = msg;
    }
    status(msg, 100);
  },
  drawRod(ctx, x, y, len, thick, rot, phase, split) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const L = len * (1 + (split ? 0 : phase * 0.45));
    const g = ctx.createLinearGradient(-L, 0, L, 0);
    g.addColorStop(0, "rgba(30,80,55,0.9)");
    g.addColorStop(0.5, "rgba(90,180,130,0.55)");
    g.addColorStop(1, "rgba(20,60,40,0.92)");
    ctx.beginPath();
    ctx.roundRect?.(-L, -thick, L * 2, thick * 2, thick);
    if (!ctx.roundRect) { ctx.ellipse(0, 0, L, thick, 0, 0, Math.PI * 2); }
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(180,230,200,0.35)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = "rgba(180,160,230,0.85)"; ctx.lineWidth = 2;
    const copy = phase > 0.12;
    ctx.beginPath(); ctx.ellipse(-L * 0.28, 0, 10, 5, 0.2, 0, Math.PI * 2); ctx.stroke();
    if (copy) { ctx.beginPath(); ctx.ellipse(L * 0.28, 0, 9, 4.5, -0.15, 0, Math.PI * 2); ctx.stroke(); }
    if (phase > 0.5) {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath(); ctx.moveTo(0, -thick + 2); ctx.lineTo(0, thick - 2); ctx.stroke();
    }
    ctx.restore();
  },
  drawMicro(ctx, w, h) {
    const cx = w / 2, cy = h * 0.46;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.32, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "rgba(8,20,16,0.45)"; ctx.fillRect(0, 0, w, h);
    const split = this.phase > 0.78;
    if (this.n === 1 && this.view === "micro") {
      if (split) {
        this.drawRod(ctx, cx - 48, cy, 46, 18, 0.05, 0.2, true);
        this.drawRod(ctx, cx + 48, cy, 46, 18, -0.05, 0.2, true);
      } else this.drawRod(ctx, cx, cy, 52, 20, 0.08, this.phase, false);
    } else {
      const show = Math.min(this.n, 48);
      for (let i = 0; i < show; i++) {
        const a = i * 2.399;
        const rad = 20 + (i * 11) % 140;
        this.drawRod(ctx, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.72, 18, 7, a, (this.phase + i * 0.07) % 1, false);
      }
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.32, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(20,28,24,0.85)"; ctx.lineWidth = 22; ctx.stroke();
    ctx.strokeStyle = "rgba(126,196,160,0.25)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "rgba(212,180,138,0.65)"; ctx.font = "11px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("MICROSCOPE  ·  binary fission", cx, cy + Math.min(w, h) * 0.32 + 28);
    ctx.textAlign = "start";
    const labels = ["1 DNA replicates", "2 cell elongates", "3 septum", "4 two clones"];
    const step = this.phase < 0.28 ? 0 : this.phase < 0.52 ? 1 : this.phase < 0.78 ? 2 : 3;
    labels.forEach((lb, i) => {
      ctx.fillStyle = i === step ? "#8ee0b8" : "rgba(180,200,190,0.4)";
      ctx.font = "12px IBM Plex Sans";
      ctx.fillText(lb, 130, h * 0.22 + i * 22);
    });
  },
  drawDish(ctx, w, h) {
    const cx = w / 2, cy = h * 0.46, R = Math.min(w, h) * 0.3;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.08, R * 1.05, R * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    const agar = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, R);
    agar.addColorStop(0, "rgba(70,90,40,0.45)");
    agar.addColorStop(1, "rgba(28,40,18,0.7)");
    ctx.fillStyle = agar; ctx.fill();
    ctx.strokeStyle = "rgba(210,220,200,0.4)"; ctx.lineWidth = 10; ctx.stroke();
    const cr = 12 + Math.log2(this.n + 1) * 14;
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(R - 18, cr), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(90,160,110,0.55)"; ctx.fill();
    ctx.strokeStyle = "rgba(160,220,180,0.35)"; ctx.stroke();
    const show = Math.min(this.n, 80);
    for (let i = 0; i < show; i++) {
      const a = i * 2.4;
      const rad = 6 + (i * 5) % Math.max(8, cr - 6);
      ctx.fillStyle = "rgba(120,190,140,0.7)";
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.85, 4, 2, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(212,180,138,0.7)"; ctx.font = "12px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("PETRI DISH  ·  colony of clones  ·  n = " + this.n, cx, cy + R + 28);
    ctx.textAlign = "start";
  },
  graph(ctx, w, h) {
    const gx = 40, gy = h - 40, gw = Math.min(340, w * 0.34), gh = 118;
    ctx.fillStyle = "rgba(6,10,9,0.55)";
    ctx.fillRect(gx - 14, gy - gh - 22, gw + 32, gh + 40);
    ctx.strokeStyle = "rgba(212,180,138,0.28)"; ctx.strokeRect(gx - 14, gy - gh - 22, gw + 32, gh + 40);
    ctx.strokeStyle = "rgba(200,210,200,0.18)";
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - gh); ctx.stroke();
    ctx.strokeStyle = "#d4b48a"; ctx.lineWidth = 2; ctx.beginPath();
    this.hist.forEach((v, i) => {
      const x = gx + (i / Math.max(1, this.hist.length - 1)) * gw;
      const y = gy - (Math.log2(v + 1) / 8) * gh;
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "rgba(212,180,138,0.75)"; ctx.font = "11px IBM Plex Mono";
    ctx.fillText("log₂(n)  ·  each step doubles  ·  clones of one genome", gx, gy - gh - 6);
  },
  down(p) {
    if (inspect) {
      callout("Binary fission", "DNA replicates, the cell elongates, a septum forms, two genetically identical cells. A colony is a clone of the founder until mutation.", p.x, p.y);
      return;
    }
    this.view = this.view === "micro" ? "colony" : "micro";
    toast(this.view === "micro" ? "Microscope — watch one fission cycle." : "Colony — all these cells share one genome.", "");
  },
  move() {}, up() {}
};
function bindBacDock() {
  $("#bNut").oninput = (e) => { Bac.nut = Number(e.target.value); };
  $("#bTemp").oninput = (e) => { Bac.temp = Number(e.target.value); };
  $("#bRun").onclick = (e) => { e.stopPropagation(); Bac.run = true; toast("Culture running. Watch DNA → septum → two cells.", ""); };
  $("#bPause").onclick = (e) => { e.stopPropagation(); Bac.run = false; };
  $("#bView").onclick = (e) => { e.stopPropagation(); Bac.view = Bac.view === "micro" ? "colony" : "micro"; };
}

/* ---------- TRANSGENIC ---------- */
const Tg = {
  selected: null, isolated: false, inserted: false, cloned: false, harvested: false,
  chip: null, settle: 0, n: 1, yield: 0, mistakes: 0,
  reset() {
    Object.assign(this, { selected: null, isolated: false, inserted: false, cloned: false, harvested: false, chip: null, settle: 0, n: 1, yield: 0, mistakes: 0 });
    const hv = $("#tgHarvest"); if (hv) hv.disabled = true;
  },
  fail(m) { this.mistakes++; audio.bad(); toast(m, "warn"); NB.add("tg", "Error: " + m); },
  genes(w, h) {
    return [
      { id: "hbb", label: "haemoglobin", x: w * 0.16, y: h * 0.42, ok: false },
      { id: "ins", label: "INSULIN", x: w * 0.30, y: h * 0.42, ok: true },
      { id: "ker", label: "keratin", x: w * 0.44, y: h * 0.42, ok: false }
    ];
  },
  host(w, h) { return { x: w * 0.74, y: h * 0.48 }; },
  tick() {
    if (this.settle > 0 && this.settle < 1) {
      this.settle = Math.min(1, this.settle + 0.045);
      const H = this.host(innerWidth, innerHeight);
      if (this.chip) {
        this.chip.x = lerp(this.chip.x, H.x, 0.18);
        this.chip.y = lerp(this.chip.y, H.y, 0.18);
      }
      if (this.settle >= 1) {
        this.inserted = true; this.chip = null;
        NB.add("tg", "Human insulin gene introduced into host genetic material.");
      }
    }
    if (this.cloned && this.n < 24) {
      this.n = Math.min(24, this.n + 0.045);
      this.yield = Math.min(100, this.yield + 0.35);
      const hv = $("#tgHarvest");
      if (hv) hv.disabled = this.yield < 55 || this.harvested;
    }
    const w = innerWidth, h = innerHeight, ctx = fit(sim, w, h);
    ctx.clearRect(0, 0, w, h);
    drawDust(ctx, w, h, t, 26);
    this.drawHuman(ctx, w, h);
    this.drawHost(ctx, w, h);
    if (this.chip) this.drawCassette(ctx, this.chip.x, this.chip.y, 1);
    if (this.harvested) this.drawVial(ctx, w, h);
    const map = {
      pick: "Select the human insulin gene. Haemoglobin and keratin are decoys.",
      isolated: "Drag the cassette onto the bacterial host, or press Introduce.",
      insert: "Gene seating in the host genome…",
      ready: "The host is transgenic. Clone it so the gene is not lost.",
      culture: "Binary fission copies the inserted gene. Insulin yield " + Math.round(this.yield) + "%.",
      done: "Clonal culture producing human insulin. Same inserted gene in every cell."
    };
    const key = this.harvested || (this.cloned && this.yield >= 55) ? "done" : this.cloned ? "culture" : this.inserted ? "ready" : this.settle > 0 ? "insert" : this.isolated ? "isolated" : "pick";
    status(map[key], acc(this.mistakes));
  },
  drawHuman(ctx, w, h) {
    ctx.fillStyle = "rgba(8,10,18,0.28)";
    ctx.fillRect(w * 0.06, h * 0.16, w * 0.5, h * 0.62);
    ctx.strokeStyle = "rgba(180,160,220,0.2)"; ctx.strokeRect(w * 0.06, h * 0.16, w * 0.5, h * 0.62);
    ctx.fillStyle = "#c4b5fd"; ctx.font = "12px IBM Plex Mono";
    ctx.fillText("HUMAN DNA  ·  concept map", w * 0.08, h * 0.21);
    drawHelix(ctx, w * 0.10, h * 0.42, w * 0.40, t, !this.isolated);
    this.genes(w, h).forEach((g) => {
      const on = this.selected === g.id || (g.ok && this.isolated);
      ctx.beginPath(); ctx.arc(g.x, g.y, on ? 16 : 12, 0, Math.PI * 2);
      ctx.fillStyle = g.ok ? (on ? "#e0a050" : "rgba(224,160,80,0.75)") : "rgba(140,150,180,0.45)";
      ctx.fill();
      if (on) { ctx.strokeStyle = "rgba(255,240,200,0.85)"; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = g.ok ? "#e0a050" : "rgba(200,210,220,0.55)";
      ctx.font = "12px IBM Plex Sans";
      ctx.textAlign = "center";
      ctx.fillText(g.label, g.x, g.y + 32);
      ctx.textAlign = "start";
    });
    ctx.fillStyle = "rgba(200,210,200,0.45)"; ctx.font = "13px IBM Plex Sans";
    ctx.fillText(this.isolated ? "Insulin cassette isolated." : "Click INSULIN, then isolate.", w * 0.08, h * 0.72);
  },
  drawHost(ctx, w, h) {
    const H = this.host(w, h);
    ctx.fillStyle = "rgba(6,16,12,0.35)";
    ctx.beginPath(); ctx.ellipse(H.x, H.y + 8, 110, 88, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(126,196,160,0.7)"; ctx.font = "12px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("BACTERIAL HOST", H.x, H.y - 78);
    ctx.textAlign = "start";
    const show = this.cloned ? Math.min(18, Math.floor(this.n)) : 1;
    for (let i = 0; i < show; i++) {
      const a = i * 2.3 + t * 0.15;
      const rad = show === 1 ? 0 : 18 + (i % 7) * 10;
      const x = H.x + Math.cos(a) * rad, y = H.y + Math.sin(a) * rad * 0.72;
      drawCell(ctx, { x, y, r: show === 1 ? 36 : 14, t, kind: "bac", showNuc: false, hot: this.inserted, rot: a });
      this.drawPlasmid(ctx, x, y, this.inserted, show === 1 ? 1 : 0.45);
      if (this.cloned && this.yield > 20) {
        ctx.fillStyle = `rgba(224,160,80,${0.25 + (i % 3) * 0.1})`;
        ctx.beginPath();
        ctx.arc(x + Math.sin(t + i) * 10, y - 16 - (t * 12 + i * 9) % 28, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  drawPlasmid(ctx, x, y, ins, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = ins ? "rgba(224,160,80,0.9)" : "rgba(160,140,220,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(6, 2, 14, 9, t * 0.2, 0, Math.PI * 2); ctx.stroke();
    if (ins) {
      ctx.fillStyle = "#e0a050";
      ctx.beginPath(); ctx.arc(16, 2, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },
  drawCassette(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(224,160,80,0.95)";
    ctx.fillRect(-28, -10, 56, 20);
    ctx.strokeStyle = "rgba(255,240,200,0.7)"; ctx.strokeRect(-28, -10, 56, 20);
    ctx.fillStyle = "#1a1208"; ctx.font = "11px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("INS", 0, 4);
    ctx.textAlign = "start";
    ctx.restore();
  },
  drawVial(ctx, w, h) {
    const x = w * 0.74, y = h * 0.82;
    ctx.fillStyle = "rgba(224,160,80,0.35)";
    ctx.fillRect(x - 18, y - 40, 36, 48);
    ctx.strokeStyle = "rgba(230,220,200,0.7)"; ctx.strokeRect(x - 18, y - 40, 36, 48);
    ctx.fillStyle = "#e0a050"; ctx.font = "12px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText("human insulin", x, y + 24);
    ctx.textAlign = "start";
  },
  down(p) {
    const w = innerWidth, h = innerHeight;
    if (inspect) return this.inspectAt(p);
    if (this.chip && dist(p, this.chip) < 30) { this.chip.grab = true; return; }
    for (const g of this.genes(w, h)) {
      if (dist(p, g) < 22) {
        this.selected = g.id;
        if (!g.ok) this.fail("That is not the insulin gene. Select the gold INSULIN locus.");
        else audio.ok();
        return;
      }
    }
  },
  move(p) { if (this.chip?.grab) { this.chip.x = p.x; this.chip.y = p.y; } },
  up(p) {
    if (!this.chip?.grab) return;
    this.chip.grab = false;
    if (dist(p, this.host(innerWidth, innerHeight)) < 70) this.insert();
    else toast("Drop the cassette onto the bacterial host.", "warn");
  },
  isolate() {
    if (this.selected !== "ins") return this.fail("Select the insulin gene on the human DNA first.");
    this.isolated = true;
    const g = this.genes(innerWidth, innerHeight).find((x) => x.id === "ins");
    this.chip = { x: g.x, y: g.y - 36, grab: false };
    audio.ok(); NB.add("tg", "Insulin gene isolated from human DNA.");
    toast("Cassette ready. Drag it onto the host.", "");
  },
  insert() {
    if (!this.isolated) return this.fail("Isolate the insulin gene first.");
    if (this.inserted || this.settle > 0) return;
    this.settle = 0.04;
    audio.ok();
  },
  clone() {
    if (!this.inserted) return this.fail("Introduce the gene into the host first.");
    this.cloned = true; this.n = 1; this.yield = 8;
    markDone("tg"); markSim("tg"); audio.ok();
    NB.add("tg", "Transgenic host cloned. Inserted gene copied by binary fission.");
    toast("Culture growing. Every descendant keeps the human gene.", "");
  },
  harvest() {
    if (this.yield < 55) return toast("Wait until the culture produces enough insulin.", "warn");
    this.harvested = true; audio.ok();
    NB.add("tg", "Human insulin collected from clonal transgenic culture.");
    toast("Product collected. The hosts remain genetically identical.", "");
  },
  inspectAt(p) {
    const w = innerWidth, h = innerHeight, H = this.host(w, h);
    const g = this.genes(w, h).find((x) => dist(p, x) < 26);
    if (g) callout(g.label, g.ok ? "Codes for human insulin. This is the gene you transfer, then clone." : "Wrong locus. 5.20B is the insulin gene in a microorganism.", p.x, p.y);
    else if (dist(p, H) < 90) callout(this.inserted ? "Transgenic host" : "Bacterial host", this.inserted ? "Contains a gene from another species. Cloning copies that genome." : "Circular DNA can accept the cassette in this concept model.", p.x, p.y);
    else if (this.harvested) callout("Insulin", "Protein made by the cloned transgenic culture — not by the human patient.", p.x, p.y);
    else hideCallout();
  }
};
function bindTgDock() {
  $("#tgCut").onclick = (e) => { e.stopPropagation(); Tg.isolate(); };
  $("#tgInsert").onclick = (e) => { e.stopPropagation(); Tg.insert(); };
  $("#tgClone").onclick = (e) => { e.stopPropagation(); Tg.clone(); };
  $("#tgHarvest").onclick = (e) => { e.stopPropagation(); Tg.harvest(); };
}

/* exam / master */
let ei = 0, qi = 0, masterPick = null, masterOk = false;
function bindExam() {
  const item = () => (window.CLONING.EXAM || [])[qi % (window.CLONING.EXAM?.length || 1)];
  $("#hudObj").textContent = item()?.q || "Load exam data.";
  $("#exMark").onclick = (e) => {
    e.stopPropagation();
    const it = item();
    if (!it) return;
    const r = window.CLONING.markExam(it, $("#exAns").value);
    toast(`${r.awarded}/${it.marks} — ${it.scheme}`, "");
  };
  $("#exNext").onclick = (e) => { e.stopPropagation(); qi++; $("#exAns").value = ""; $("#hudObj").textContent = item().q; };
}
function bindMaster() {
  const briefs = [
    { q: "Produce many genetically identical plants with a desirable characteristic.", m: "plant", lab: "plant" },
    { q: "Produce a genetically identical animal from a selected adult.", m: "scnt", lab: "scnt" },
    { q: "Rapidly reproduce a bacterial population from one cell.", m: "bac", lab: "bacteria" },
    { q: "You need an organism containing a gene from another species.", m: "tg", lab: "transgenic" }
  ];
  let si = 0;
  $("#hudObj").textContent = Object.values(done).every(Boolean) ? briefs[0].q : "Complete the four flagship laboratories first.";
  $$("[data-ch]").forEach((b) => b.onclick = (e) => {
    e.stopPropagation();
    if (!Object.values(done).every(Boolean)) return toast("The master lab is locked until all four experiments are complete.", "warn");
    const sc = briefs[si % 4];
    if (b.dataset.ch !== sc.m) { audio.bad(); toast("That method does not match this problem.", "warn"); return; }
    masterOk = true; masterPick = sc;
    toast("Method correct. Execute it, then submit.", "");
    window.dispatchEvent(new CustomEvent("goto", { detail: sc.lab }));
  });
  $("#chGo").onclick = (e) => {
    e.stopPropagation();
    if (!masterOk) return toast("Choose the method first.", "warn");
    const sc = masterPick;
    const ok = (sc.m === "scnt" && SCNT.state === "compare") || (sc.m === "plant" && Plant.xfer) || (sc.m === "bac" && Bac.n >= 32) || (sc.m === "tg" && Tg.cloned);
    toast(ok ? "Biotechnology mastery — procedure complete." : "The procedure is incomplete.", ok ? "" : "warn");
    if (ok) { si++; masterOk = false; }
  };
}

export function pointer(type, e) {
  const r = sim.getBoundingClientRect();
  const p = { x: e.clientX - r.left, y: e.clientY - r.top, delta: e.delta };
  const lab = { define: Define, scnt: SCNT, dolly: Dolly, plant: Plant, bacteria: Bac, transgenic: Tg }[scene];
  if (!lab) return;
  if (type === "down") lab.down?.(p);
  if (type === "move") lab.move?.(p);
  if (type === "up") lab.up?.(p);
  if (type === "wheel") lab.wheel?.(p.delta);
}

export { SCNT, Plant, Bac, Tg, Dolly };
