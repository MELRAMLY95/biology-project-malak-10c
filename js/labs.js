import { markSim } from "./ui.js?v=43";
import {
  $, $$, fit, dist, lerp, drawCell, drawHelix, drawDust, toast, audio, NB, markDone, callout, hideCallout, done
} from "./core.js?v=43";

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
    define: ["Definition", "What is a clone?", "Microscope bench. Copy nuclear DNA by mitosis. Same genes ≠ same phenotype. Then identify the clone."],
    learn: ["Curriculum", "Edexcel 4BI1 cloning", "Read, then try the lab, then answer."],
    quiz: ["Quiz", "Check your understanding", "Choose A–D, then submit."],
    exam: ["Exam pad", "Use mark-scheme language", "Nuclear DNA · mitosis · enucleated egg · surrogate."],
    glossary: ["Glossary", "Terms from the specification", "Select a word for a short definition."],
    scnt: ["SCNT laboratory", "Micromanipulation · 5.19B", "Aspirate somatic nucleus → enucleate egg → transfer → pulse starts the cell cycle → S-phase copies donor DNA → mitosis → blastocyst → surrogate."],
    dolly: ["Roslin 1996", "Repeat Dolly’s protocol", "G0 mammary nucleus from Finn-Dorset. Enucleated Blackface egg. Pulse starts mitosis. Match the barcode."],
    plant: ["Tissue culture", "Micropropagation · 5.17B / 5.18B", "Explant from totipotent meristem → surface sterilise → in vitro medium + hormones → callus → plantlets → acclimatise."],
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
      <p style="color:var(--mute);font-size:11px;line-height:1.4;margin:0">Green ring = aligned. After the pulse: egg cytoplasm reprogrammes the donor nucleus → S-phase copies that DNA → prophase → metaphase → anaphase → telophase → cytokinesis. Repeat to blastocyst. Mitochondria stay with the egg.</p>`;
    bindScntDock();
  } else if (id === "plant") {
    d.innerHTML = `
      <p id="pStep" style="color:var(--mute);font-size:12px;line-height:1.45">Find a totipotent meristem on the parent (shoot apex or axillary bud).</p>
      <label>Temperature °C <input id="pTemp" type="range" min="12" max="38" value="24" /></label>
      <label>Light <input id="pLight" type="range" min="0" max="100" value="60" /></label>
      <label>Nutrients <input id="pNut" type="range" min="0" max="100" value="75" /></label>
      <label>Auxin (roots) <input id="pAux" type="range" min="0" max="100" value="48" /></label>
      <label>Cytokinin (shoots) <input id="pCyto" type="range" min="0" max="100" value="52" /></label>
      <button type="button" id="pXfer">Acclimatise plantlets</button>
      <p style="color:var(--mute);font-size:11px;line-height:1.4;margin:0">Click a glowing meristem. Drag shears to cut. Dunk the explant in sterilant. Drop it on agar. Hormones: cytokinin favours shoots, auxin favours roots — you need both to wean. Drag a plantlet into a greenhouse pot.</p>`;
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
      <p id="defStep" style="color:var(--mute);font-size:12px;line-height:1.45">Find the parent nucleus under the objective. Click it to start S-phase.</p>
      <label>Zoom <input id="defZoom" type="range" min="0.75" max="1.8" step="0.01" value="1.05" /></label>
      <label>Focus <input id="defFocus" type="range" min="0" max="1" step="0.01" value="0.86" /></label>
      <button type="button" id="defRep">Replicate nuclear DNA</button>
      <button type="button" id="defMito" disabled>Run mitosis</button>
      <label>Clone B light <input id="defLight" type="range" min="8" max="100" value="82" disabled /></label>
      <label>Clone B nutrients <input id="defFood" type="range" min="8" max="100" value="78" disabled /></label>
      <button type="button" id="defStill" disabled>Still clones?</button>
      <p style="color:var(--mute);font-size:11px;line-height:1.4;margin:0">Click the nucleus. Drag the sister copy. Do not drop gametes in. After mitosis, drag the lamp or pellet onto Clone B.</p>`;
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
    scnt: "Grab the pipette or click a nucleus. Enucleate the egg, seat the donor, hold activate. Watch S-phase then mitosis — the pulse does not add DNA. Implant at blastocyst.",
    dolly: "Click Finn-Dorset → serum-starve the mammary cell (G0) → Blackface egg → discard egg nucleus → seat donor nucleus → electrodes → pulse (mitosis, not new DNA) → wait for cleavage → implant → match the barcode.",
    plant: "Click a meristem (apex or bud). Drag shears onto it. Dunk the explant fully in sterilant, then onto agar. Balance auxin and cytokinin. Drag plantlets into pots — unsterilised tissue contaminates.",
    bacteria: "Click the cell under the microscope to start fission. Cold or starvation slows it. Drag the temperature above ~48°C and proteins denature — Reset.",
    transgenic: "Click INSULIN (not haemoglobin or keratin). Drag the cassette onto the host. Click the transgenic cell to clone, then collect protein.",
    define: "Click the parent nucleus. Watch S-phase. Drag the sister copy into empty cytoplasm — not a gamete. After mitosis, drag lamp or food onto Clone B, then pick the matching barcode.",
    ethics: "There is no single correct click. Pick a stance, then steal exam language from both columns."
  };
  toast(h[scene] || "Explore the environment.", "");
}

export function procedure() {
  const p = {
    scnt: "1 Somatic nucleus  2 Enucleate egg  3 Transfer  4 Pulse (starts cycle, no new DNA)  5 S-phase → mitosis → blastocyst  6 Surrogate",
    dolly: "Finn-Dorset mammary (G0) → enucleated Blackface egg → pulse / mitosis → Blackface surrogate. Nuclear DNA = donor.",
    plant: "1 Meristem explant  2 Surface sterilise  3 Sterile medium + hormones  4 Callus → shoots + roots  5 Acclimatise in greenhouse",
    bacteria: "DNA replicates → cell elongates → septum → two clones",
    transgenic: "Identify human insulin gene → introduce into host genome → clone the host → insulin from the culture",
    ethics: "Name an advantage, a disadvantage, and who pays the cost. Never claim the pulse creates DNA.",
    define: "1 S-phase copies nuclear DNA  2 Seat sister nucleus  3 Mitosis (prophase → cytokinesis)  4 Change Clone B’s environment  5 Click the matching barcode"
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

function coast(o, damp = 0.86) {
  if (!o || o.held) return;
  o.vx = (o.vx || 0) * damp;
  o.vy = (o.vy || 0) * damp;
  if (Math.abs(o.vx) < 0.05 && Math.abs(o.vy) < 0.05) { o.vx = 0; o.vy = 0; return; }
  o.x += o.vx;
  o.y += o.vy;
}
function snapRing(ctx, x, y, r, ok) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = ok ? "rgba(142,224,184,0.9)" : "rgba(212,180,138,0.25)";
  ctx.lineWidth = ok ? 3 : 1.3;
  ctx.setLineDash(ok ? [] : [6, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ---------- DEFINE ---------- */
const BASES = ["#6ec4a0", "#e0b060", "#8eb4e0", "#c07ab0"];
const PARENT_SEQ = [0, 1, 2, 0, 1, 2, 3, 1];
const SEX_SEQ = [0, 1, 2, 3, 3, 0, 3, 2];
const UNREL_SEQ = [3, 2, 3, 0, 2, 3, 1, 0];

const Define = {
  state: "idle",
  mistakes: 0,
  mito: 0,
  sProg: 0,
  grow: 0,
  light: 82,
  food: 78,
  tweaked: false,
  grab: null,
  order: [0, 1, 2],
  zoom: 1.05,
  focus: 0.86,
  ox: 0, oy: 0,
  _hud: "",
  layout() {
    const w = innerWidth, h = innerHeight;
    return {
      w, h,
      P: { x: w * 0.34 + this.ox, y: h * 0.48 + this.oy, r: 92 },
      C: { x: w * 0.64 + this.ox, y: h * 0.48 + this.oy, r: 92 },
      sperm: { x: w * 0.42, y: h * 0.48 + Math.min(w, h) * 0.22, r: 22 },
      egg: { x: w * 0.56, y: h * 0.48 + Math.min(w, h) * 0.22, r: 28 },
      lamp: { x: w * 0.22, y: h * 0.72 },
      pellet: { x: w * 0.78, y: h * 0.72 }
    };
  },
  reset(log) {
    const L = this.layout();
    Object.assign(this, {
      state: "idle", mistakes: 0, mito: 0, sProg: 0, grow: 0, light: 82, food: 78,
      tweaked: false, grab: null, seated: false, replicated: false, poisoned: false,
      zoom: 1, focus: 0.88, ox: 0, oy: 0, draggingSample: false, _hud: "",
      lamp: { x: L.lamp.x, y: L.lamp.y, vx: 0, vy: 0 },
      pellet: { x: L.pellet.x, y: L.pellet.y, vx: 0, vy: 0 },
      cam: { x: innerWidth / 2, y: innerHeight * 0.48, z: 1, f: 0.88 },
      ptr: null, insertU: 0, morph: 0, dimple: 0, _now: performance.now()
    });
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
    const z = $("#defZoom"); if (z) z.value = this.zoom;
    const fo = $("#defFocus"); if (fo) fo.value = this.focus;
    if (log) NB.add("define", "Optical bench reset.");
  },
  steps() {
    const ph = this.mitoPhase();
    return {
      idle: "Find the parent under the objective. Click its nucleus — S-phase copies DNA. The parent keeps its genome.",
      sphase: "S-phase. Chromatids duplicating inside the parent nucleus. Do not pull the original out.",
      drag: "Sister chromatid set ready. Drag the copy into the empty cytoplasm. Gametes mix genomes — they are not clones.",
      copy: "Copy seated. Membrane sealing — then mitosis will share identical chromatids.",
      insert: "Nucleus entering cytoplasm. Watch the membrane close.",
      mito: "Mitosis · " + ph + " — DNA is copied and shared, not rewritten.",
      env: "Same nuclear barcode. Drag the lamp or pellet onto Clone B. Phenotype can change.",
      who: "Click the organism whose nuclear barcode matches the parent.",
      done: "Clone = same nuclear DNA, copied by mitosis. Same genes ≠ same phenotype."
    };
  },
  mitoPhase() {
    const u = this.mito;
    if (u < 0.18) return "prophase";
    if (u < 0.36) return "metaphase";
    if (u < 0.58) return "anaphase";
    if (u < 0.78) return "telophase";
    return "cytokinesis";
  },
  ease(u) { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); },
  mix(a, b, u) { const e = this.ease(u); return a + (b - a) * e; },
  spd() { return matchMedia("(prefers-reduced-motion: reduce)").matches ? 1.65 : 1; },
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
    this.replicated = true;
    this.state = "sphase";
    this.sProg = 0.02;
    const r = $("#defRep"); if (r) r.disabled = true;
    audio.copy();
    NB.add("define", "S-phase started. Nuclear DNA is being copied inside the parent.");
    toast("Watch the chromatids duplicate. The parent is not emptied.", "");
  },
  finishSphase() {
    const L = this.layout();
    this.sis = { x: L.P.x + 22, y: L.P.y - 8, vx: 2.4, vy: -1.6 };
    this.state = "drag";
    audio.pop();
    toast("Sister nucleus peeled off. Seat it in the empty cell.", "");
  },
  runMito() {
    if (this.state !== "insert" && this.state !== "copy") return;
    this.state = "mito";
    this.mito = 0.001;
    const m = $("#defMito"); if (m) m.disabled = true;
    audio.ok();
    NB.add("define", "Mitosis started. Identical chromatids moving to opposite poles.");
  },
  confirmClones() {
    if (this.state !== "env") return;
    if (!this.tweaked) return this.fail("Change Clone B first — drag the lamp or pellet, or use the sliders.");
    this.state = "who";
    const s = $("#defStill"); if (s) s.disabled = true;
    const li = $("#defLight"); if (li) li.disabled = true;
    const f = $("#defFood"); if (f) f.disabled = true;
    audio.ok();
    NB.add("define", "Still clones: nuclear DNA matched after the environment changed.");
    toast("Phenotype shifted. Nuclear barcode did not. Pick the match.", "");
  },
  tick() {
    const L = this.layout();
    if (!this.nuc) this.reset(false);
    if (!this.cam) this.cam = { x: L.w / 2, y: L.h * 0.48, z: 1.08, f: 0.88 };
    const now = performance.now();
    const dt = Math.min(0.033, Math.max(0.008, (now - (this._now || now - 16)) / 1000));
    this._now = now;
    const k = dt * 60 * this.spd();
    const aim = this.camAim(L);
    this.cam.x = lerp(this.cam.x, aim.x, 0.045 * k);
    this.cam.y = lerp(this.cam.y, aim.y, 0.045 * k);
    this.cam.z = lerp(this.cam.z, aim.z * this.zoom, 0.05 * k);
    this.cam.f = lerp(this.cam.f, aim.f, 0.06 * k);
    this.dimple = lerp(this.dimple || 0, this.grab === "sis" && this.sis && dist(this.sis, L.C) < L.C.r + 16 ? 1 : 0, 0.12 * k);

    if ((this.state === "idle" || this.state === "sphase") && this.grab !== "nuc") {
      this.nuc.x = lerp(this.nuc.x, L.P.x - 6, 0.08 * k);
      this.nuc.y = lerp(this.nuc.y, L.P.y - 5, 0.08 * k);
    }
    if (this.state === "sphase") {
      this.sProg = Math.min(1, this.sProg + 0.0042 * k);
      if (this.sProg >= 1) this.finishSphase();
    }
    if (this.grab === "sis" && this.sis && this.ptr) {
      this.sis.x = lerp(this.sis.x, this.ptr.x, 0.28 * k);
      this.sis.y = lerp(this.sis.y, this.ptr.y, 0.28 * k);
      if (dist(this.sis, L.C) < L.C.r + 48) {
        this.sis.x = lerp(this.sis.x, L.C.x, 0.06 * k);
        this.sis.y = lerp(this.sis.y, L.C.y, 0.06 * k);
      }
    } else if (this.sis && this.state !== "drag") {
      const tx = this.seated ? L.C.x - 4 : L.P.x + 28;
      const ty = this.seated ? L.C.y - 4 : L.P.y - 18;
      this.sis.x = lerp(this.sis.x, tx, 0.1 * k);
      this.sis.y = lerp(this.sis.y, ty, 0.1 * k);
    } else if (this.sis) coast(this.sis, 0.9);
    if (this.grab === "lamp" && this.ptr) {
      this.lamp.x = lerp(this.lamp.x, this.ptr.x, 0.32 * k);
      this.lamp.y = lerp(this.lamp.y, this.ptr.y, 0.32 * k);
    }
    if (this.grab === "pellet" && this.ptr) {
      this.pellet.x = lerp(this.pellet.x, this.ptr.x, 0.32 * k);
      this.pellet.y = lerp(this.pellet.y, this.ptr.y, 0.32 * k);
    }
    if (this.state === "insert") {
      this.insertU = Math.min(1, (this.insertU || 0) + 0.016 * k);
      if (this.insertU >= 1) this.runMito();
    }
    if (this.grab !== "sperm") { this.gamS.x = lerp(this.gamS.x, L.sperm.x, 0.08 * k); this.gamS.y = lerp(this.gamS.y, L.sperm.y, 0.08 * k); }
    if (this.grab !== "egg") { this.gamE.x = lerp(this.gamE.x, L.egg.x, 0.08 * k); this.gamE.y = lerp(this.gamE.y, L.egg.y, 0.08 * k); }
    if (this.state === "env") {
      if (this.grab !== "lamp") {
        this.lamp.x = lerp(this.lamp.x, L.lamp.x, 0.06 * k);
        this.lamp.y = lerp(this.lamp.y, L.lamp.y, 0.06 * k);
      }
      if (this.grab !== "pellet") {
        this.pellet.x = lerp(this.pellet.x, L.pellet.x, 0.06 * k);
        this.pellet.y = lerp(this.pellet.y, L.pellet.y, 0.06 * k);
      }
      this.morph = Math.min(1, (this.morph || 0) + 0.012 * k);
    }
    if (this.state === "mito") {
      this.mito = Math.min(1, this.mito + 0.0028 * k);
      if (this.mito >= 1) {
        this.state = "env";
        this.morph = 0;
        this.grow = 0.08;
        const li = $("#defLight"); if (li) li.disabled = false;
        const f = $("#defFood"); if (f) f.disabled = false;
        const s = $("#defStill"); if (s) s.disabled = false;
        toast("Two nuclei, one barcode. Change Clone B’s world.", "");
        NB.add("define", "Mitosis complete. Both cells carry the parent nuclear DNA.");
      }
    }
    if (this.state === "env" || this.state === "who" || this.state === "done") {
      this.grow = Math.min(1, this.grow + 0.01 * k);
    }
    this.draw();
    const msg = this.steps()[this.state];
    if (this._hud !== msg) {
      this._hud = msg;
      const el = $("#defStep");
      if (el) el.textContent = msg;
    }
    status(msg, acc(this.mistakes));
  },
  camAim(L) {
    const w = L.w, h = L.h;
    if (this.state === "sphase") return { x: L.P.x, y: L.P.y, z: 1.18, f: 0.92 };
    if (this.state === "drag" && this.sis) return { x: (this.sis.x + L.C.x) * 0.5, y: (this.sis.y + L.C.y) * 0.5, z: 1.08, f: 0.9 };
    if (this.state === "insert") return { x: L.C.x, y: L.C.y, z: 1.16, f: 0.92 };
    if (this.state === "mito") return { x: (L.P.x + L.C.x) * 0.5, y: L.P.y, z: 1.1, f: 0.9 };
    if (this.state === "env") return { x: w * 0.5, y: h * 0.48, z: 1, f: 0.9 };
    if (this.state === "who" || this.state === "done") return { x: w * 0.5, y: h * 0.5, z: 1, f: 0.9 };
    return { x: (L.P.x + L.C.x) * 0.5, y: L.P.y, z: 1, f: 0.9 };
  },
  world(p) {
    const cx = innerWidth / 2, cy = innerHeight * 0.48;
    const cam = this.cam || { x: cx, y: cy, z: 1 };
    const z = cam.z || 1;
    return { x: cam.x + (p.x - cx) / z, y: cam.y + (p.y - cy) / z };
  },
  draw() {
    const L = this.layout(), w = L.w, h = L.h;
    const ctx = fit(sim, w, h);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.48, rad = Math.min(w, h) * 0.42;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.clip();
    const bg = ctx.createRadialGradient(cx, cy, 16, cx, cy, rad);
    bg.addColorStop(0, `rgba(14,32,28,${0.35 + (1 - this.focus) * 0.2})`);
    bg.addColorStop(1, `rgba(4,10,12,${0.72 + (1 - this.focus) * 0.2})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    drawDust(ctx, w, h, t, 48);
    const look = this.cam || { x: cx, y: cy, z: this.zoom, f: this.focus };
    ctx.translate(cx, cy);
    ctx.scale(look.z, look.z);
    ctx.translate(-look.x, -look.y);
    const blur = (1 - look.f) * 1.4;
    if (blur > 0.35) ctx.filter = `blur(${blur}px)`;

    this.drawBarcode(ctx, look.x, look.y - rad / look.z + 36, PARENT_SEQ, "parent nuclear barcode");

    const morph = this.morph || 0;
    if (this.state === "who" || this.state === "done") this.drawWho(ctx, L);
    else if (this.state === "env") {
      if (morph < 1) {
        ctx.save(); ctx.globalAlpha = 1 - morph; this.drawCells(ctx, L); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = morph; this.drawGrown(ctx, L); ctx.restore();
    }
    else this.drawCells(ctx, L);

    if (this.state === "idle" || this.state === "sphase" || this.state === "drag" || this.state === "copy" || this.state === "insert") this.drawGametes(ctx, L);
    ctx.filter = "none";
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(24,32,30,0.94)"; ctx.lineWidth = 36; ctx.stroke();
    ctx.strokeStyle = `rgba(140,210,180,${0.16 + Math.sin(t) * 0.05})`; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = "rgba(212,180,138,0.3)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, rad + 18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(200,210,200,0.18)"; ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (rad - 8), cy + Math.sin(a) * (rad - 8));
      ctx.lineTo(cx + Math.cos(a) * (rad + 8), cy + Math.sin(a) * (rad + 8));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(230,236,228,0.75)";
    ctx.fillRect(cx + rad - 90, cy + 6, 44, 2);
    ctx.font = "10px IBM Plex Mono";
    ctx.textAlign = "center";
    ctx.fillText("10 µm", cx + rad - 68, cy + 20);
    const tag = this.state === "mito" ? this.mitoPhase().toUpperCase() : this.state.toUpperCase();
    ctx.fillStyle = "rgba(212,180,138,0.72)";
    ctx.font = "11px IBM Plex Mono";
    ctx.fillText("DEFINITION BENCH  ·  OIL  100×  ·  " + tag, cx, cy + rad + 32);
    ctx.textAlign = "start";
  },
  drawCells(ctx, L) {
    const seatHot = this.state === "drag" && this.sis && dist(this.sis, L.C) < L.C.r;
    this.drawRichCell(ctx, {
      x: L.P.x, y: L.P.y, r: L.P.r, hot: this.state === "idle",
      empty: false, poisoned: false, sphase: this.state === "sphase" ? this.sProg : 0
    });
    this.drawRichCell(ctx, {
      x: L.C.x, y: L.C.y, r: L.C.r, hot: seatHot,
      empty: !this.seated, poisoned: this.poisoned,
      pulse: this.seated ? 0.2 + Math.sin(t * 2.2) * 0.06 : 0,
      dimple: this.dimple || 0, insert: this.insertU || 0
    });
    if (this.state === "drag" && this.sis) snapRing(ctx, L.C.x, L.C.y, L.C.r + 10, seatHot);
    if (this.state === "mito") {
      this.drawMito(ctx, L.P.x, L.P.y, L.P.r);
      if (this.seated) this.drawMito(ctx, L.C.x, L.C.y, L.C.r);
    }
    if (this.state !== "mito") this.drawNuc(ctx, this.nuc.x, this.nuc.y, 18, this.grab === "nuc" || this.state === "idle", this.state === "sphase" ? this.sProg : 0);
    if (this.sis && this.state !== "mito") {
      const sink = this.state === "insert" ? this.ease(this.insertU || 0) : 0;
      this.drawNuc(ctx, this.sis.x, this.sis.y, 17 * (1 - sink * 0.15), this.grab === "sis" || this.state === "drag", 1);
      ctx.globalAlpha = 1 - sink * 0.35;
      ctx.fillStyle = "rgba(142,224,184,0.95)";
      ctx.font = "12px IBM Plex Sans";
      ctx.textAlign = "center";
      ctx.fillText(this.seated ? "mitotic copy seated" : "sister nucleus  ·  drag into empty cytoplasm", this.sis.x, this.sis.y - 30);
      ctx.textAlign = "start";
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "rgba(232,239,230,0.82)";
    ctx.font = "13px IBM Plex Sans";
    ctx.textAlign = "center";
    ctx.fillText("Parent  ·  diploid nucleus remains", L.P.x, L.P.y + L.P.r + 26);
    ctx.fillText(
      this.poisoned ? "Fertilised mix  ·  not a clone" : this.seated ? "Copy  ·  same nuclear DNA" : "Enucleated cytoplasm  ·  waiting",
      L.C.x, L.C.y + L.C.r + 26
    );
    ctx.textAlign = "start";
    if (this.state === "sphase") {
      ctx.fillStyle = "rgba(142,224,184,0.85)";
      ctx.font = "12px IBM Plex Mono";
      ctx.textAlign = "center";
      ctx.fillText("S-phase  " + Math.round(this.sProg * 100) + "%", L.P.x, L.P.y - L.P.r - 16);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(L.P.x - 50, L.P.y - L.P.r - 10, 100, 4);
      ctx.fillStyle = "#8ee0b8";
      ctx.fillRect(L.P.x - 50, L.P.y - L.P.r - 10, 100 * this.sProg, 4);
      ctx.textAlign = "start";
    }
  },
  drawRichCell(ctx, o) {
    const { x, y, r, hot, empty, poisoned, sphase = 0, pulse = 0, dimple = 0, insert = 0 } = o;
    ctx.save();
    ctx.translate(x, y);
    const wob = Math.sin(t * 0.55) * 0.018 + pulse * 0.03;
    const rx = r * (1 + wob);
    const ry = r * 0.88 * (1 + Math.cos(t * 0.42) * 0.018) * (1 - dimple * 0.06 - insert * 0.04);
    ctx.beginPath();
    ctx.ellipse(6, 10, rx * 1.02, ry * 0.95, 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fill();
    const g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, 6, 0, 8, r * 1.1);
    if (poisoned) {
      g.addColorStop(0, "rgba(220,190,230,0.55)");
      g.addColorStop(0.45, "rgba(90,50,90,0.5)");
      g.addColorStop(1, "rgba(18,8,16,0.94)");
    } else if (empty) {
      g.addColorStop(0, "rgba(200,230,210,0.22)");
      g.addColorStop(0.5, "rgba(30,70,55,0.35)");
      g.addColorStop(1, "rgba(6,16,14,0.92)");
    } else {
      g.addColorStop(0, "rgba(220,255,236,0.55)");
      g.addColorStop(0.35, "rgba(48,120,92,0.42)");
      g.addColorStop(1, "rgba(6,20,16,0.94)");
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0.12, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hot ? "rgba(220,240,200,0.9)" : "rgba(150,230,190,0.4)";
    ctx.lineWidth = hot ? 3 : 2;
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (dimple > 0.05) {
      ctx.strokeStyle = `rgba(142,224,184,${0.25 + dimple * 0.45})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-8, -6, 16 + dimple * 10, 10 + dimple * 6, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a = t * 0.35 + i * 0.52;
      const rad = rx * (0.28 + (i % 5) * 0.08);
      ctx.fillStyle = "rgba(210,140,60,0.34)";
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * rad, Math.sin(a * 1.05) * ry * 0.42, 6.5, 3.2, a, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 20; i++) {
      const a = t * 0.22 + i * 0.31;
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rx * 0.58, Math.sin(a) * ry * 0.52, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (empty && !poisoned) {
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = "rgba(180,220,200,0.28)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(-6, -4, r * 0.28, r * 0.24, 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (sphase > 0) {
      ctx.strokeStyle = `rgba(142,224,184,${0.25 + sphase * 0.5})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.2;
        const fork = this.ease(sphase);
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 10, Math.sin(a) * 8, 5 + fork * 4, 2.2, a, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 10 + 7 * fork, Math.sin(a) * 8, 4, 2, a, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  },
  drawMito(ctx, x, y, r) {
    const u = this.state === "insert" ? 0 : this.mito;
    ctx.save();
    ctx.translate(x, y);
    const envA = u < 0.16 ? 1 - this.ease(u / 0.16) : u > 0.7 ? this.ease((u - 0.7) / 0.18) : 0;
    if (envA > 0.04) {
      ctx.globalAlpha = envA;
      ctx.strokeStyle = "rgba(180,230,200,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 18, 0.12, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const n = 6;
    const poleY = this.mix(8, r * 0.52, Math.min(1, u / 0.32));
    if (u > 0.12 && u < 0.72) {
      ctx.strokeStyle = `rgba(200,220,255,${0.12 + (0.5 - Math.abs(u - 0.4))})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const p = this.chrPair(i, n, u);
        ctx.beginPath(); ctx.moveTo(0, -poleY); ctx.lineTo(p.x, p.y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, poleY); ctx.lineTo(p.x, p.y2); ctx.stroke();
      }
    }
    for (let i = 0; i < n; i++) {
      const p = this.chrPair(i, n, u);
      this.drawChromatid(ctx, p.x, p.y1, 0.95, false);
      this.drawChromatid(ctx, p.x, p.y2, 0.95, true);
    }
    if (u > 0.2 && u < 0.5) {
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + (0.36 - Math.abs(u - 0.3)) * 0.8})`;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(-r * 0.62, 0); ctx.lineTo(r * 0.62, 0); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (u > 0.76) {
      const gap = this.ease((u - 0.76) / 0.24);
      ctx.strokeStyle = `rgba(200,230,210,${0.35 + gap * 0.5})`;
      ctx.lineWidth = 1.5 + gap * 5;
      ctx.beginPath(); ctx.moveTo(-r * 0.9, 0); ctx.lineTo(r * 0.9, 0); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, r * (1 - gap * 0.12), r * 0.88 * (1 - gap * 0.52), 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(142,224,184,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  },
  chrPair(i, n, u) {
    const base = (i / n) * Math.PI * 2 - Math.PI / 2;
    const plateX = (i - (n - 1) / 2) * 13;
    const proX = Math.cos(base) * 14, proY = Math.sin(base) * 11;
    const split = this.ease(Math.max(0, (u - 0.36) / 0.28));
    const toPole = this.ease(Math.max(0, (u - 0.55) / 0.22));
    const x = this.mix(this.mix(proX, plateX, Math.min(1, u / 0.34)), plateX * (1 - toPole * 0.3), split);
    const y0 = this.mix(proY, Math.sin(t * 1.4 + i) * 1.5, Math.min(1, u / 0.34));
    const pole = 26 + toPole * 16;
    return { x, y1: y0 - split * pole, y2: y0 + 5 * (1 - split) + split * pole };
  },
  drawChromatid(ctx, x, y, s, twin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = twin ? "rgba(232,188,96,0.95)" : "rgba(126,230,184,0.95)";
    ctx.shadowColor = twin ? "rgba(232,188,96,0.35)" : "rgba(126,230,184,0.3)";
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.quadraticCurveTo(-1, -1, -7, 8);
    ctx.moveTo(7, -8);
    ctx.quadraticCurveTo(1, -1, 7, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawGrown(ctx, L) {
    const aScale = (1.05 + this.grow * 0.08);
    const bScale = (0.58 + this.food / 160) * (0.7 + this.grow * 0.3);
    const aHue = 0.58;
    const bHue = 0.12 + this.light / 150;
    this.drawCritter(ctx, L.P.x, L.P.y + 4, aScale, aHue, "Clone A  ·  matched conditions", PARENT_SEQ, true);
    this.drawCritter(ctx, L.C.x, L.C.y + 4, bScale, bHue, "Clone B  ·  your environment", PARENT_SEQ, true);
    this.drawLamp(ctx, this.lamp.x, this.lamp.y, this.grab === "lamp");
    this.drawPellet(ctx, this.pellet.x, this.pellet.y, this.grab === "pellet");
    snapRing(ctx, L.C.x, L.C.y, 100, (this.grab === "lamp" && dist(this.lamp, L.C) < 110) || (this.grab === "pellet" && dist(this.pellet, L.C) < 110));
    ctx.fillStyle = "rgba(224,180,120,0.88)";
    ctx.font = "13px IBM Plex Sans";
    ctx.textAlign = "center";
    ctx.fillText(this.tweaked ? "Phenotypes differ. Barcodes still match." : "Drag the lamp or food pellet onto Clone B.", L.w * 0.5, L.h * 0.22);
    ctx.textAlign = "start";
  },
  drawLamp(ctx, x, y, hot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = hot ? "rgba(255,220,140,0.28)" : "rgba(255,200,80,0.12)";
    ctx.beginPath(); ctx.arc(0, 8, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e0c49a";
    ctx.fillRect(-4, -22, 8, 18);
    ctx.beginPath(); ctx.moveTo(-16, -4); ctx.lineTo(16, -4); ctx.lineTo(10, 10); ctx.lineTo(-10, 10); ctx.closePath();
    ctx.fillStyle = hot ? "#ffe08a" : "#d4b48a";
    ctx.fill();
    ctx.fillStyle = "rgba(232,239,230,0.75)";
    ctx.font = "11px IBM Plex Mono";
    ctx.textAlign = "center";
    ctx.fillText("lamp  ·  light", 0, 28);
    ctx.textAlign = "start";
    ctx.restore();
  },
  drawPellet(ctx, x, y, hot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = hot ? "rgba(120,80,40,0.95)" : "rgba(90,60,32,0.9)";
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 11, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,220,170,0.35)"; ctx.stroke();
    ctx.fillStyle = "rgba(232,239,230,0.75)";
    ctx.font = "11px IBM Plex Mono";
    ctx.textAlign = "center";
    ctx.fillText("pellet  ·  nutrients", 0, 26);
    ctx.textAlign = "start";
    ctx.restore();
  },
  drawWho(ctx, L) {
    const items = [
      { seq: PARENT_SEQ, label: "same nuclear DNA", clone: true, hue: 0.55 },
      { seq: SEX_SEQ, label: "two gametes mixed", clone: false, hue: 0.5 },
      { seq: UNREL_SEQ, label: "unrelated genome", clone: false, hue: 0.12 }
    ];
    const xs = [L.w * 0.28, L.w * 0.50, L.w * 0.72];
    const y = L.h * 0.50;
    this.whoHits = [];
    this.order.forEach((idx, i) => {
      const it = items[idx];
      const x = xs[i];
      this.whoHits.push({ x, y, r: 88, clone: it.clone, i });
      ctx.fillStyle = this.state === "done" && it.clone ? "rgba(110,196,160,0.16)" : "rgba(8,12,10,0.5)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - 90, y - 124, 180, 248, 16); else ctx.rect(x - 90, y - 124, 180, 248);
      ctx.fill();
      ctx.strokeStyle = it.clone && this.state === "done" ? "rgba(142,224,184,0.85)" : "rgba(212,180,138,0.25)";
      ctx.stroke();
      this.drawCritter(ctx, x, y - 28, 0.78, it.clone ? 0.55 : it.hue, "", it.seq, true);
      ctx.fillStyle = "rgba(232,239,230,0.8)";
      ctx.font = "12px IBM Plex Sans";
      ctx.textAlign = "center";
      ctx.fillText(this.state === "done" ? it.label : "Organism " + String.fromCharCode(80 + i), x, y + 104);
    });
    ctx.fillStyle = "rgba(224,180,120,0.88)";
    ctx.font = "13px IBM Plex Sans";
    ctx.textAlign = "center";
    ctx.fillText(this.state === "done" ? "The clone is the match — appearance was a decoy." : "Read the barcode. Click who matches the parent.", L.w * 0.5, L.h * 0.22);
    ctx.textAlign = "start";
  },
  drawCritter(ctx, x, y, s, hue, label, seq, showBar) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const g = ctx.createRadialGradient(-18, -26, 8, 0, 12, 74);
    g.addColorStop(0, `rgba(${150 + hue * 100},${186 + hue * 40},${100},0.95)`);
    g.addColorStop(0.55, `rgba(${60 + hue * 100},${120 + hue * 30},${64},0.92)`);
    g.addColorStop(1, `rgba(16,36,20,0.96)`);
    ctx.beginPath();
    ctx.ellipse(0, 10, 50, 40, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(230,250,220,0.65)";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(40,70,40,${0.12 + hue * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(-16 + i * 8, 6 + (i % 2) * 6, 5, 3, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(${70 + hue * 100},${130},${80},0.9)`;
    ctx.beginPath(); ctx.ellipse(-18, -30, 11, 17, -0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(18, -30, 11, 17, 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(18,26,20,0.92)";
    ctx.beginPath(); ctx.arc(-12, 0, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 0, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.arc(-10.5, -1, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13.5, -1, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (showBar) this.drawBarcode(ctx, x, y + 62 * s, seq, label);
  },
  drawGametes(ctx, L) {
    ctx.fillStyle = "rgba(180,160,230,0.55)";
    ctx.font = "11px IBM Plex Mono";
    ctx.textAlign = "center";
    ctx.fillText("DECOYS  ·  SEXUAL REPRODUCTION", (L.sperm.x + L.egg.x) / 2, L.sperm.y - 38);
    ctx.beginPath(); ctx.ellipse(this.gamS.x, this.gamS.y, 11, 7.5, t * 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(160,140,230,0.92)"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(this.gamS.x + 10, this.gamS.y);
    ctx.quadraticCurveTo(this.gamS.x + 30, this.gamS.y + Math.sin(t * 9) * 7, this.gamS.x + 44, this.gamS.y);
    ctx.strokeStyle = "rgba(180,170,230,0.85)"; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = "rgba(200,190,230,0.8)";
    ctx.fillText("sperm  ·  haploid", this.gamS.x, this.gamS.y + 28);
    drawCell(ctx, { x: this.gamE.x, y: this.gamE.y, r: 22, t, kind: "egg", showNuc: true, hot: this.grab === "egg" });
    ctx.fillStyle = "rgba(224,180,140,0.82)";
    ctx.fillText("egg  ·  haploid nucleus", this.gamE.x, this.gamE.y + 38);
    ctx.textAlign = "start";
  },
  drawNuc(ctx, x, y, r, hot, copy = 0) {
    const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
    g.addColorStop(0, "rgba(140,230,190,0.96)");
    g.addColorStop(1, "rgba(18,78,58,0.94)");
    ctx.beginPath(); ctx.ellipse(x, y, r * (1 + copy * 0.08), r * 0.86, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = hot ? "rgba(142,224,184,0.95)" : "rgba(255,255,255,0.32)";
    ctx.lineWidth = hot ? 2.4 : 1.1; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 4, y - 2, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,60,48,0.55)"; ctx.fill();
    if (hot) {
      ctx.beginPath(); ctx.arc(x, y, r + 8 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(142,224,184,0.7)"; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 8 + i * 4, y - 7);
      ctx.quadraticCurveTo(x - 2 + i * 2, y + Math.sin(t + i) * 3, x - 6 + i * 4, y + 7);
      ctx.stroke();
    }
  },
  drawBarcode(ctx, x, y, seq, label) {
    const bw = seq.length * 11;
    let px = x - bw / 2;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(px - 6, y - 4, bw + 12, 22);
    for (let i = 0; i < seq.length; i++) {
      ctx.fillStyle = BASES[seq[i]];
      ctx.fillRect(px, y, 9, 14);
      px += 11;
    }
    if (label) {
      ctx.fillStyle = "rgba(200,210,200,0.75)";
      ctx.font = "11px IBM Plex Mono";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 30);
      ctx.textAlign = "start";
    }
  },
  down(p) {
    if (inspect) return this.inspectAt(p);
    p = this.world(p);
    this.ptr = { x: p.x, y: p.y };
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
    if (this.state === "env") {
      if (this.lamp && dist(p, this.lamp) < 36) { this.grab = "lamp"; return; }
      if (this.pellet && dist(p, this.pellet) < 32) { this.grab = "pellet"; return; }
      const L = this.layout();
      if (dist(p, L.C) < 90 || dist(p, L.P) < 90) {
        if (this.tweaked) this.confirmClones();
        else this.fail("Change Clone B’s light or food first, then click a clone.");
      }
      return;
    }
    if (this.state === "idle" && (dist(p, this.nuc) < 28 || dist(p, this.layout().P) < 96)) { this.replicate(); return; }
    if ((this.state === "sphase" || this.state === "drag") && dist(p, this.nuc) < 26) { this.grab = "nuc"; return; }
    if (this.state === "drag" && this.sis && dist(p, this.sis) < 36) { this.grab = "sis"; audio.grab(); return; }
    if (this.state === "idle" || this.state === "sphase" || this.state === "drag") {
      if (dist(p, this.gamS) < 28) { this.grab = "sperm"; return; }
      if (dist(p, this.gamE) < 36) { this.grab = "egg"; return; }
    }
  },
  move(p) {
    p = this.world(p);
    this.ptr = { x: p.x, y: p.y };
    if (this.grab === "sperm") { this.gamS.x = lerp(this.gamS.x, p.x, 0.45); this.gamS.y = lerp(this.gamS.y, p.y, 0.45); }
    else if (this.grab === "egg") { this.gamE.x = lerp(this.gamE.x, p.x, 0.45); this.gamE.y = lerp(this.gamE.y, p.y, 0.45); }
    else if (this.grab === "nuc") { this.nuc.x = lerp(this.nuc.x, p.x, 0.4); this.nuc.y = lerp(this.nuc.y, p.y, 0.4); }
  },
  up(p) {
    p = this.world(p);
    const L = this.layout();
    const g = this.grab;
    this.grab = null;
    this.draggingSample = false;
    if (!g) { this.ptr = null; return; }
    if (g === "sis") {
      if (dist(this.sis, L.C) < L.C.r + 18) {
        if (this.poisoned) { this.ptr = null; return this.fail("This cytoplasm already mixed two genomes. Reset — you cannot clone from a fertilised mix."); }
        this.seated = true;
        this.insertU = 0.02;
        this.state = "insert";
        const m = $("#defMito"); if (m) m.disabled = false;
        audio.place();
        NB.add("define", "Sister nucleus seated. Parent still has its own genome.");
        toast("Ready for mitosis. The parent was not emptied.", "");
      } else if (dist(this.sis, L.P) < L.P.r) {
        this.fail("The parent already has its nucleus. Seat the copy in the empty cell.");
      }
      this.ptr = null;
      return;
    }
    if (g === "sperm" || g === "egg") {
      if (dist(p, L.C) < L.C.r || dist(p, L.P) < L.P.r) {
        this.poisoned = true;
        this.fail("Gametes mixed two genomes. That cell is no longer a clone of the parent. Reset the bench.");
      }
      this.ptr = null;
      return;
    }
    if (g === "nuc") {
      this.fail("Cloning copies nuclear DNA by mitosis. It does not steal the parent’s only nucleus.");
      this.ptr = null;
      return;
    }
    if (g === "lamp" && dist(this.lamp, L.C) < 110) {
      this.light = Math.min(100, this.light + 18);
      this.tweaked = true;
      const el = $("#defLight"); if (el) el.value = this.light;
      audio.place();
      toast("Clone B illuminated. Pigment can change. The barcode does not.", "");
    }
    if (g === "pellet" && dist(this.pellet, L.C) < 110) {
      this.food = Math.min(100, this.food + 16);
      this.tweaked = true;
      const el = $("#defFood"); if (el) el.value = this.food;
      audio.place();
      toast("Clone B fed. Size can change. Nuclear DNA does not.", "");
    }
    this.ptr = null;
  },
  wheel(delta) {
    this.zoom = Math.min(1.8, Math.max(0.75, this.zoom + (delta > 0 ? -0.07 : 0.07)));
    const z = $("#defZoom"); if (z) z.value = this.zoom;
  },
  inspectAt(p) {
    const sx = p.x, sy = p.y;
    p = this.world(p);
    const L = this.layout();
    if (dist(p, L.P) < L.P.r) callout("Parent cell", "Diploid nucleus stays here. S-phase copies chromatids; mitosis shares them. The parent is not emptied.", sx, sy);
    else if (dist(p, L.C) < L.C.r) callout(this.poisoned ? "Fertilised mix" : "Recipient cytoplasm", this.poisoned ? "Two haploid genomes mixed. This is sexual reproduction, not a clone." : "Enucleated cytoplasm waiting for a mitotic copy of the parent nucleus.", sx, sy);
    else if (dist(p, this.gamS) < 28) callout("Sperm", "Haploid gamete. Fusion shuffles alleles — not a clone.", sx, sy);
    else if (dist(p, this.gamE) < 32) callout("Egg", "Haploid nucleus. Needed for fertilisation, not for cloning this parent.", sx, sy);
    else if (this.state === "env" && dist(p, this.lamp) < 30) callout("Lamp", "Environment. Light can change phenotype, not nuclear DNA.", sx, sy);
    else if (this.state === "env" && dist(p, this.pellet) < 28) callout("Nutrients", "Food changes size and condition. The barcode stays the parent’s.", sx, sy);
    else if ((this.whoHits || []).some((h) => dist(p, h) < h.r)) callout("Nuclear barcode", "Read the sequence. The clone matches the parent. Appearance can lie.", sx, sy);
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
  const z = $("#defZoom");
  if (z) z.oninput = (e) => { e.stopPropagation(); Define.zoom = Number(e.target.value); };
  const f = $("#defFocus");
  if (f) f.oninput = (e) => { e.stopPropagation(); Define.focus = Number(e.target.value); };
}

/* ---------- SCNT ---------- */
const SCNT_SEQ = [0, 1, 2, 0, 1, 2, 3, 1];
const SCNT = {
  state: "idle",
  zoom: 1, focus: 0.82, ox: 0, oy: 0, draggingSample: false,
  pip: { x: 420, y: 90, tx: 420, ty: 90, load: null },
  donor: { r: 78 }, egg: { r: 118, enuc: false },
  nucD: { out: false, inEgg: false, anim: 0 },
  nucE: { out: false, anim: 0 },
  mistakes: 0, div: 0, play: 0, pulse: 0, implanted: false, _hud: "",
  reset(log) {
    Object.assign(this, { state: "idle", ox: 0, oy: 0, zoom: 1, focus: 0.82, pip: { x: innerWidth * 0.48, y: 90, tx: innerWidth * 0.48, ty: 90, load: null }, egg: { r: 118, enuc: false }, nucD: { out: false, inEgg: false, anim: 0 }, nucE: { out: false, anim: 0 }, mistakes: 0, div: 0, play: 0, pulse: 0, implanted: false, settle: 0, grab: false, draggingSample: false, hover: null, _hud: "", autoAim: false, pb: null, lastGen: 0, lookZ: 1, _now: performance.now() });
    const z = $("#scntZoom"); if (z) z.value = 1;
    const f = $("#scntFocus"); if (f) f.value = "0.82";
    const p = $("#pulse"); if (p) { p.disabled = true; const i = p.querySelector("i"); if (i) i.style.width = "0"; }
    const i = $("#implant"); if (i) i.disabled = true;
    if (log) NB.add("scnt", "Microscope reset.");
  },
  steps() {
    return {
      idle: "1 / 6  ·  Aim at the somatic nucleus. Green ring, then release.",
      egg: "2 / 6  ·  Enucleate the egg. Two genomes cannot share one oocyte.",
      transfer: "3 / 6  ·  Seat the donor nucleus in the empty cytoplasm.",
      seating: "Donor nucleus travelling through cytoplasm. Mitochondria stay in the egg.",
      activate: "4 / 6  ·  Hold activate. The pulse starts the cell cycle — it does not add DNA.",
      dividing: "5 / 6  ·  Watch mitosis. Implant at blastocyst.",
      compare: "6 / 6  ·  Nuclear DNA = somatic donor. Egg mitochondria. Surrogate is not the nuclear parent."
    };
  },
  hudLine() {
    if (this.state !== "dividing" && this.state !== "compare") return this.steps()[this.state];
    if (this.state === "compare") return this.steps().compare;
    const gen = Math.min(5, Math.floor(this.div));
    const names = ["1-cell oocyte", "2-cell", "4-cell", "8-cell", "morula", "blastocyst"];
    return names[gen] + "  ·  " + this.cleavePhase() + " — donor nuclear DNA is copied, not rewritten.";
  },
  ease(u) { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); },
  mix(a, b, u) { return a + (b - a) * this.ease(Math.max(0, Math.min(1, u))); },
  frac() { return this.div - Math.floor(this.div); },
  cleavePhase() {
    const gen = Math.min(5, Math.floor(this.div));
    const u = this.frac();
    if (gen >= 5) return "blastocyst (inner cell mass + trophectoderm)";
    if (gen === 0) {
      if (u < 0.12) return "reprogramming (egg cytoplasm, donor nucleus)";
      if (u < 0.26) return "S-phase (chromatids duplicating)";
      if (u < 0.40) return "prophase (envelope breaks, chromosomes condense)";
      if (u < 0.54) return "metaphase (equator / spindle)";
      if (u < 0.70) return "anaphase (sister chromatids to poles)";
      if (u < 0.84) return "telophase (nuclei reform)";
      return "cytokinesis (cleavage furrow)";
    }
    if (u < 0.16) return "S-phase in blastomeres";
    if (u < 0.32) return "prophase";
    if (u < 0.48) return "metaphase";
    if (u < 0.66) return "anaphase";
    if (u < 0.82) return "telophase";
    return "cytokinesis";
  },
  mitoU() {
    const gen = Math.floor(this.div);
    const u = this.frac();
    if (gen === 0) {
      if (u < 0.26) return 0;
      return Math.min(1, (u - 0.26) / 0.74);
    }
    if (u < 0.16) return 0;
    return Math.min(1, (u - 0.16) / 0.84);
  },
  sProg() {
    const gen = Math.floor(this.div);
    const u = this.frac();
    if (gen === 0) return u < 0.12 ? 0 : Math.min(1, (u - 0.12) / 0.14);
    return Math.min(1, u / 0.16);
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
    const now = performance.now();
    const dt = Math.min(0.033, Math.max(0.008, (now - (this._now || now - 16)) / 1000));
    this._now = now;
    const k = dt * 60;
    this.pip.x = lerp(this.pip.x, this.pip.tx, 0.18);
    this.pip.y = lerp(this.pip.y, this.pip.ty, 0.18);
    if (this.nucD.anim > 0) this.nucD.anim *= 0.9;
    if (this.nucE.anim > 0) this.nucE.anim *= 0.9;
    if (this.pulse > 0.02) this.pulse *= 0.94; else this.pulse = 0;
    if (this.settle > 0 && this.settle < 1) this.settle = Math.min(1, this.settle + 0.028 * k);
    if (this.settle >= 1 && this.state === "seating") {
      this.nucD.inEgg = true; this.pip.load = null; this.state = "activate";
      const p = $("#pulse"); if (p) p.disabled = false;
      NB.add("scnt", "Nucleus seated. Reconstructed oocyte.");
      toast("Ready to activate. The genome is already the donor’s.", "");
    }
    const aimZ = this.state === "dividing" && this.div < 1 ? 1.52
      : this.state === "dividing" && this.div < 2 ? 1.28
      : this.state === "dividing" ? 1.08
      : this.state === "compare" ? 1 : this.zoom;
    this.lookZ = lerp(this.lookZ || 1, aimZ, 0.07 * k);
    if (this.play && this.state === "dividing") {
      const gen = Math.floor(this.div);
      const perSec = gen === 0 ? 0.055 : gen === 1 ? 0.078 : gen < 4 ? 0.1 : 0.12;
      this.div = Math.min(5.2, this.div + perSec * this.play * dt);
      if (Math.floor(this.div) > this.lastGen && this.lastGen < 5) {
        this.lastGen = Math.floor(this.div);
        audio.pop();
        const names = ["", "2 cells — identical donor nuclei", "4 cells", "8 cells", "morula compacting", "blastocyst"];
        toast(names[this.lastGen] || "Cleavage", "");
        NB.add("scnt", names[this.lastGen] + ". Every nucleus still matches the somatic donor.");
      }
      const imp = $("#implant");
      if (imp) imp.disabled = this.div < 4.2 || this.implanted;
    }
    if (this.autoAim) {
      if (this.state === "idle" && this.aligned("d")) { this.autoAim = false; this.extractD(); }
      else if (this.state === "egg" && this.aligned("e")) { this.autoAim = false; this.extractE(); }
      else if (this.state === "transfer" && this.pip.load === "d" && dist(this.tip(), this.eggPos()) < this.egg.r - 4) { this.autoAim = false; this.insert(); }
    }
    this.draw();
    const msg = this.hudLine();
    if (this._hud !== msg) {
      this._hud = msg;
      const el = $("#scntStep");
      if (el) el.textContent = msg;
    }
    status(msg, acc(this.mistakes));
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
    const lookZ = this.state === "dividing" || this.state === "compare" ? (this.lookZ || 1.2) : this.zoom;
    ctx.translate(cx, cy);
    ctx.scale(lookZ, lookZ);
    ctx.translate(-cx, -cy);
    const blur = (this.state === "dividing" || this.state === "compare") ? 0 : (1 - this.focus) * 2.4;
    if (blur > 0.35) ctx.filter = `blur(${blur}px)`;

    if (this.state === "dividing" || this.state === "compare") this.drawDiv(ctx, w, h);
    else this.drawField(ctx);
    ctx.filter = "none";
    if (this.state !== "dividing" && this.state !== "compare") {
      this.drawHoldPip(ctx);
      this.drawPip(ctx);
    }
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
    ctx.fillStyle = "rgba(230,236,228,0.75)";
    ctx.fillRect(cx + rad - 86, cy + 8, 42, 2);
    ctx.font = "10px IBM Plex Mono";
    ctx.textAlign = "center";
    ctx.fillText("10 µm", cx + rad - 65, cy + 22);
    ctx.fillStyle = "rgba(212,180,138,0.7)";
    ctx.font = "11px IBM Plex Mono";
    ctx.fillText("OPTICAL FIELD  ·  OIL  100×  ·  " + (this.state === "dividing" ? this.cleavePhase().split(" (")[0].toUpperCase() : this.state.toUpperCase()), cx, cy + rad + 32);
    ctx.textAlign = "start";
  },
  drawField(ctx) {
    const d = this.donorPos(), e = this.eggPos();
    const dHot = this.hover === "d" || this.aligned("d");
    const eHot = this.hover === "e" || (this.state === "transfer" && dist(this.tip(), e) < this.egg.r);
    this.drawZona(ctx, e.x, e.y, this.egg.r + 16, 1);
    this.drawEggMito(ctx, e.x, e.y, this.egg.r);
    this.aimRing(ctx, this.nucAt("d"), this.state === "idle" && dHot);
    this.aimRing(ctx, this.nucAt("e"), this.state === "egg" && eHot);
    drawCell(ctx, { x: d.x, y: d.y, r: this.donor.r, t, kind: "soma", showNuc: !this.nucD.out, deform: this.nucD.anim, hot: dHot });
    drawCell(ctx, { x: e.x, y: e.y, r: this.egg.r, t, kind: "egg", showNuc: !this.nucE.out, deform: this.nucE.anim, pulse: this.pulse, hot: eHot });
    if (this.pb) this.drawPolarBody(ctx, this.pb.x, this.pb.y);
    ctx.fillStyle = "rgba(180,220,200,0.55)"; ctx.font = "12px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText("somatic cell  ·  diploid nucleus", d.x, d.y + this.donor.r + 22);
    ctx.fillText(this.egg.enuc ? "enucleated egg  ·  cytoplasm + mitochondria kept" : "unfertilised egg  ·  haploid nucleus + zona", e.x, e.y + this.egg.r + 26);
    ctx.textAlign = "start";
    if (this.nucD.inEgg || this.settle > 0) {
      const tip = this.tip();
      const u = this.settle || 1;
      const nx = lerp(tip.x, e.x - 4, u), ny = lerp(tip.y, e.y - 4, u);
      this.chromatin(ctx, nx, ny, 15 + (this.state === "activate" ? 4 : 0), "donor");
    }
    if (this.state === "activate") {
      ctx.fillStyle = "rgba(224,180,120,0.85)";
      ctx.font = "13px IBM Plex Sans"; ctx.textAlign = "center";
      ctx.fillText("Reconstructed oocyte  ·  donor nuclear DNA in egg cytoplasm", (d.x + e.x) / 2, e.y - this.egg.r - 28);
      ctx.textAlign = "start";
    }
  },
  drawZona(ctx, x, y, r, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,214,168,0.22)"; ctx.lineWidth = 12; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,230,190,0.35)"; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.restore();
  },
  drawEggMito(ctx, x, y, r) {
    for (let i = 0; i < 16; i++) {
      const a = i * 2.15 + t * 0.18;
      const rr = r * (0.28 + (i % 6) * 0.08);
      const mx = x + Math.cos(a) * rr, my = y + Math.sin(a * 1.07) * rr * 0.82;
      ctx.save();
      ctx.translate(mx, my); ctx.rotate(a);
      ctx.fillStyle = "rgba(210,120,70,0.72)";
      ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 3.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,200,140,0.4)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-3.5, 0); ctx.quadraticCurveTo(0, 1.8, 3.5, 0); ctx.stroke();
      ctx.restore();
    }
  },
  drawPolarBody(ctx, x, y) {
    ctx.fillStyle = "rgba(160,140,220,0.55)";
    ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,220,255,0.35)"; ctx.stroke();
    ctx.fillStyle = "rgba(200,190,230,0.7)";
    ctx.font = "10px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("discarded egg nucleus", x, y - 16);
    ctx.textAlign = "start";
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
    const gen = Math.min(5, Math.floor(this.div));
    const u = this.frac();
    const names = ["reconstructed oocyte · 1-cell", "2-cell embryo", "4-cell embryo", "8-cell embryo", "morula", "blastocyst"];
    const cx = w / 2, cy = h / 2 + 18;
    ctx.fillStyle = "#e8c878";
    ctx.font = "18px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText(names[gen], cx, cy - 178);
    ctx.font = "14px IBM Plex Mono";
    ctx.fillStyle = "rgba(180,255,210,0.95)";
    ctx.fillText(this.cleavePhase(), cx, cy - 154);
    ctx.font = "12px IBM Plex Sans";
    ctx.fillStyle = "rgba(224,180,120,0.9)";
    ctx.fillText(this.state === "compare" ? "Nuclear DNA = somatic donor  ·  mitochondria from the egg  ·  not the surrogate" : "Pulse started the cycle. It did not write DNA. Green = donor chromatids. Gold = sisters.", cx, cy - 132);
    ctx.textAlign = "start";

    const zona = gen === 0 ? 118 : 52 + Math.min(88, [0, 2, 4, 8, 16, 24][gen] * 3.4);
    this.drawZona(ctx, cx, cy, zona, 0.95);
    if (gen > 0) this.drawEggMito(ctx, cx, cy, zona * 0.78);

    if (gen === 0) this.drawFirstCleavage(ctx, cx, cy, 88, u);
    else this.drawBlastomeres(ctx, cx, cy, gen, u, zona);

    this.drawSeq(ctx, cx, cy + zona + 28, SCNT_SEQ, "donor nuclear barcode  ·  every blastomere");
    const frac = Math.min(1, this.div / 5.2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(cx - 110, cy + zona + 50, 220, 6);
    ctx.fillStyle = "#8ee0b8";
    ctx.fillRect(cx - 110, cy + zona + 50, 220 * frac, 6);
    ctx.fillStyle = "rgba(200,210,200,0.6)";
    ctx.font = "10px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("reprogramming → S-phase → mitosis → blastocyst", cx, cy + zona + 70);
    ctx.textAlign = "start";
    if (this.state === "compare") this.drawSurrogateNote(ctx, cx, cy + zona + 96);
  },
  drawFirstCleavage(ctx, cx, cy, r, u) {
    const mu = this.mitoU();
    const furrow = u > 0.82 ? this.ease((u - 0.82) / 0.18) : 0;
    const gap = furrow * 46;
    const cells = furrow > 0.12
      ? [{ x: cx - gap, y: cy, r: r * (1 - furrow * 0.18) }, { x: cx + gap, y: cy, r: r * (1 - furrow * 0.18) }]
      : [{ x: cx, y: cy, r: r * (1 + this.pulse * 0.1) }];
    cells.forEach((c) => {
      drawCell(ctx, { x: c.x, y: c.y, r: c.r, t, kind: "egg", showNuc: false, pulse: this.pulse, deform: furrow * 0.6 });
    });
    if (furrow > 0.06 && cells.length === 1) {
      ctx.strokeStyle = `rgba(255,236,200,${0.35 + furrow * 0.55})`;
      ctx.lineWidth = 2 + furrow * 8;
      ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.05); ctx.lineTo(cx, cy + r * 1.05); ctx.stroke();
    }
    if (u < 0.12) {
      this.chromatin(ctx, cx - 4, cy - 4, 22 + this.ease(u / 0.12) * 14, "donor");
    } else if (u < 0.26) {
      this.drawSphase(ctx, cx, cy, this.sProg(), true);
    } else if (cells.length === 1) {
      this.drawSpindle(ctx, cx, cy, r * 0.92, mu, 1.35);
    } else {
      this.chromatin(ctx, cells[0].x - 3, cells[0].y - 3, 16, "donor");
      this.chromatin(ctx, cells[1].x - 3, cells[1].y - 3, 16, "donor");
    }
    if (this.pb) this.drawPolarBody(ctx, cx + r + 36, cy - r * 0.72);
  },
  drawBlastomeres(ctx, cx, cy, gen, u, zona) {
    const n = [1, 2, 4, 8, 16, 22][gen];
    const mu = this.mitoU();
    const sPhase = u < 0.16;
    if (gen >= 5) {
      ctx.beginPath(); ctx.arc(cx + 20, cy - 14, zona * 0.36, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(12,28,26,0.55)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "rgba(232,210,150,0.9)"; ctx.font = "12px IBM Plex Sans"; ctx.textAlign = "center";
      ctx.fillText("blastocoel", cx + 20, cy - 14);
      ctx.fillText("inner cell mass", cx - zona * 0.36, cy + 12);
      ctx.fillText("trophectoderm", cx, cy + zona - 22);
      ctx.textAlign = "start";
    }
    const furrow = !sPhase && u > 0.82 ? this.ease((u - 0.82) / 0.18) : 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const rad = n <= 2 ? (n === 1 ? 0 : 48) : 32 + Math.min(68, n * 2.6);
      const br = n === 1 ? 64 : n === 2 ? 42 : Math.max(14, 34 - n * 0.7);
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      const showSpin = !sPhase && gen < 5 && i < 2 && mu > 0.02 && mu < 0.9;
      drawCell(ctx, {
        x, y, r: br * (1 - furrow * 0.06),
        t, kind: "soma",
        showNuc: (sPhase || mu < 0.1 || mu > 0.8 || gen >= 5) && !showSpin,
        hot: this.state === "compare" || (gen >= 5 && this.div >= 4.2)
      });
      if (sPhase && gen < 5 && i < 2) this.drawSphase(ctx, x, y, this.sProg(), i === 0);
      else if (showSpin) this.drawSpindle(ctx, x, y, br, mu, n === 2 ? 0.95 : 0.7);
    }
  },
  drawSphase(ctx, x, y, prog, label) {
    this.chromatin(ctx, x, y, 20 + prog * 6, "donor");
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = `rgba(232,188,96,${0.5 + prog * 0.45})`;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 5; i++) {
      const a = i * 0.95;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 10, Math.sin(a) * 7, 7 + prog * 4, 2.6, a, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 10 + 8 * prog, Math.sin(a) * 7, 5.5, 2.2, a, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (label) {
      ctx.fillStyle = "rgba(255,220,140,0.95)";
      ctx.font = "12px IBM Plex Mono"; ctx.textAlign = "center";
      ctx.fillText("S-phase  ·  copying donor DNA", 0, 40);
      ctx.textAlign = "start";
    }
    ctx.restore();
  },
  drawSpindle(ctx, x, y, r, u, amp = 1) {
    ctx.save();
    ctx.translate(x, y);
    const envA = u < 0.18 ? 1 - this.ease(u / 0.18) : u > 0.74 ? this.ease((u - 0.74) / 0.16) : 0;
    if (envA > 0.04) {
      ctx.globalAlpha = envA;
      ctx.strokeStyle = "rgba(160,240,200,0.85)";
      ctx.lineWidth = 3 * amp;
      ctx.beginPath(); ctx.ellipse(0, 0, 26 * amp, 20 * amp, 0.08, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const n = 8;
    const poleY = this.mix(10 * amp, r * 0.55, Math.min(1, u / 0.28));
    if (u > 0.08 && u < 0.78) {
      ctx.fillStyle = "rgba(210,230,255,0.9)";
      ctx.beginPath(); ctx.arc(0, -poleY, 4.4 * amp, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, poleY, 4.4 * amp, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(190,220,255,${0.28 + (0.55 - Math.abs(u - 0.42))})`;
      ctx.lineWidth = 1.35 * amp;
      for (let i = 0; i < n; i++) {
        const p = this.chrPair(i, n, u, amp);
        ctx.beginPath(); ctx.moveTo(0, -poleY); ctx.lineTo(p.x, p.y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, poleY); ctx.lineTo(p.x, p.y2); ctx.stroke();
      }
    }
    for (let i = 0; i < n; i++) {
      const p = this.chrPair(i, n, u, amp);
      this.drawChromatid(ctx, p.x, p.y1, 1.05 * amp, false);
      this.drawChromatid(ctx, p.x, p.y2, 1.05 * amp, true);
    }
    if (u > 0.2 && u < 0.52) {
      ctx.strokeStyle = `rgba(255,255,255,${0.22 + (0.4 - Math.abs(u - 0.34))})`;
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-r * 0.62, 0); ctx.lineTo(r * 0.62, 0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `${Math.round(11 * amp)}px IBM Plex Mono`; ctx.textAlign = "center";
      ctx.fillText("metaphase plate", 0, r * 0.62);
      ctx.textAlign = "start";
    }
    ctx.restore();
  },
  chrPair(i, n, u, amp = 1) {
    const base = (i / n) * Math.PI * 2 - Math.PI / 2;
    const plateX = (i - (n - 1) / 2) * 15 * amp;
    const proX = Math.cos(base) * 18 * amp, proY = Math.sin(base) * 13 * amp;
    const align = Math.min(1, u / 0.3);
    const split = this.ease(Math.max(0, (u - 0.34) / 0.24));
    const toPole = this.ease(Math.max(0, (u - 0.52) / 0.24));
    const x = this.mix(this.mix(proX, plateX, align), plateX * (1 - toPole * 0.22), split);
    const y0 = this.mix(proY, 0, align);
    const pole = (32 + toPole * 26) * amp;
    return { x, y1: y0 - split * pole, y2: y0 + 6 * amp * (1 - split) + split * pole };
  },
  drawChromatid(ctx, x, y, s, twin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = twin ? "rgba(255,204,96,1)" : "rgba(110,240,176,1)";
    ctx.shadowColor = twin ? "rgba(255,200,80,0.55)" : "rgba(90,230,160,0.5)";
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.8; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, -10); ctx.quadraticCurveTo(-1, 0, -8, 10);
    ctx.moveTo(8, -10); ctx.quadraticCurveTo(1, 0, 8, 10);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawSeq(ctx, x, y, seq, label) {
    const bw = seq.length * 10;
    let px = x - bw / 2;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(px - 5, y - 3, bw + 10, 18);
    for (let i = 0; i < seq.length; i++) {
      ctx.fillStyle = BASES[seq[i]];
      ctx.fillRect(px, y, 8, 12);
      px += 10;
    }
    ctx.fillStyle = "rgba(200,210,200,0.7)";
    ctx.font = "11px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText(label, x, y + 28);
    ctx.textAlign = "start";
  },
  drawSurrogateNote(ctx, x, y) {
    ctx.fillStyle = "rgba(8,12,10,0.45)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 170, y - 18, 340, 52, 10); else ctx.rect(x - 170, y - 18, 340, 52);
    ctx.fill();
    ctx.fillStyle = "rgba(232,239,230,0.85)";
    ctx.font = "12px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText("Transferred to surrogate uterus", x, y + 4);
    ctx.fillStyle = "rgba(224,180,120,0.8)";
    ctx.font = "11px IBM Plex Mono";
    ctx.fillText("uterus only  ·  no nuclear genes donated", x, y + 22);
    ctx.textAlign = "start";
  },
  down(p) {
    if (inspect) return this.inspectAt(p);
    if ((this.state === "dividing" || this.state === "compare") && this.div >= 4.2 && !this.implanted) {
      this.implant();
      return;
    }
    if (dist(p, this.pip) < 40 || dist(p, this.tip()) < 32) {
      this.grab = true;
      audio.grab();
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
    audio.wet(); NB.add("scnt", "Somatic nucleus aspirated. Membrane deformed.");
    toast("Diploid nucleus collected. Now remove the egg’s nucleus.", "");
  },
  extractE() {
    this.nucE.out = true; this.nucE.anim = 1; this.egg.enuc = true; this.state = "transfer";
    const e = this.eggPos();
    this.pb = { x: e.x + this.egg.r * 0.62, y: e.y - this.egg.r * 0.82 };
    audio.wet(); NB.add("scnt", "Egg enucleated. Cytoplasm and mitochondria retained.");
    toast("Egg enucleated. Seat the donor nucleus next.", "");
  },
  insert() {
    if (!this.egg.enuc) return this.fail("The egg has not been enucleated. Remove its nucleus first.");
    this.settle = 0.02; this.state = "seating";
    audio.place(); NB.add("scnt", "Pipette entered cytoplasm. Nucleus transferring.");
  },
  activate() {
    if (this.state !== "activate") {
      toast("Activation unavailable. Reconstruct the oocyte first.", "warn");
      audio.bad();
      return;
    }
    this.pulse = 1; this.state = "dividing"; this.play = 1; this.div = 0; this.lastGen = 0;
    audio.pulse(); NB.add("scnt", "Pulse applied. Cell cycle starts — DNA was not added.");
    toast("Reprogramming, then S-phase copies the donor nucleus. Use Slow to watch PMAT.", "");
  },
  implant() {
    if (this.div < 4.2) return this.fail("Wait until morula / blastocyst.");
    this.implanted = true; this.state = "compare"; markDone("scnt"); markSim("scnt");
    audio.chime();
    NB.add("scnt", "Embryo in surrogate. Nuclear DNA = somatic donor. Mitochondria usually from the egg.");
    toast("Clone produced. Nuclear DNA matches the body-cell donor, not the surrogate.", "");
  },
  inspectAt(p) {
    const d = this.donorPos(), e = this.eggPos();
    if (this.state === "dividing" || this.state === "compare") {
      const ph = this.cleavePhase();
      if (this.div >= 5) callout("Blastocyst", "Inner cell mass can become the fetus. Trophectoderm helps implant. Every nucleus still matches the somatic donor.", p.x, p.y);
      else if (ph.indexOf("S-phase") >= 0) callout("S-phase", "Existing donor DNA is copied into sister chromatids. The electric pulse did not create this DNA.", p.x, p.y);
      else if (ph.indexOf("prophase") >= 0) callout("Prophase", "Nuclear envelope breaks down. Chromosomes condense. Still the donor genome.", p.x, p.y);
      else if (ph.indexOf("metaphase") >= 0) callout("Metaphase", "Chromosomes line up. Spindle fibres from opposite poles attach.", p.x, p.y);
      else if (ph.indexOf("anaphase") >= 0) callout("Anaphase", "Sister chromatids separate. Each daughter will get the same nuclear DNA.", p.x, p.y);
      else if (ph.indexOf("telo") >= 0 || ph.indexOf("cyto") >= 0) callout("Telophase / cytokinesis", "Two nuclei reform and the cytoplasm cleaves. Both cells are clones of the donor, not of the egg donor.", p.x, p.y);
      else if (ph.indexOf("reprogram") >= 0) callout("Reprogramming", "Egg cytoplasm can reset the somatic nucleus so it can direct an embryo. Nuclear DNA sequence is still the donor’s.", p.x, p.y);
      else callout("Cleavage", "Repeated mitosis. Nuclear DNA = somatic donor. Mitochondria usually remain from the egg.", p.x, p.y);
      return;
    }
    if (this.pb && dist(p, this.pb) < 28) callout("Removed egg nucleus", "Taken out so two genomes do not mix. Chromosome number stays diploid from the donor only.", p.x, p.y);
    else if (dist(p, d) < this.donor.r) callout("Somatic cell", "Differentiated body cell. Its diploid nucleus is the genome you copy.", p.x, p.y);
    else if (dist(p, e) < this.egg.r + 20) callout(this.egg.enuc ? "Enucleated egg" : "Unfertilised egg", this.egg.enuc ? "Zona and cytoplasm kept. Mitochondria stay with the egg. Cytoplasm can reprogramme the donor nucleus." : "Haploid nucleus must be removed or two genomes mix. Zona pellucida surrounds the oocyte.", p.x, p.y);
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
    if (!this.drag) {
      ["soma", "egg", "nucE", "recon", "embryo"].forEach((id) => {
        const o = this[id];
        if (o && !o.gone) coast(o);
      });
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
      if (this.drag?.id === "nucE") snapRing(ctx, L.x.x, L.x.y, 36, this.nucE && dist(this.nucE, L.x) < 40);
      if (this.drag?.id === "soma" && this.egg) snapRing(ctx, this.egg.x, this.egg.y, 44, dist(this.soma, this.egg) < 36);
      if (this.drag?.id === "recon") snapRing(ctx, L.tube.x, L.tube.y, 48, dist(this.recon, L.tube) < 46);
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
  move(p) {
    if (!this.drag) return;
    const o = this[this.drag.id];
    const nx = p.x - this.drag.ox, ny = p.y - this.drag.oy;
    o.vx = nx - o.x; o.vy = ny - o.y;
    o.x = nx; o.y = ny;
  },
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
      if (this.nucE && !this.nucE.gone) {
        this.mixed = true;
        return this.fail("Egg nucleus still inside. Two genomes mixed — this oocyte cannot make Dolly. Discard the haploid nucleus first.");
      }
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
        this.embryo.gone = true; this.born = true; this.state = "birth"; audio.chime();
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
    audio.pulse();
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
  temp: 24, light: 60, nut: 75, aux: 48, cyto: 52,
  day: 0, bio: 0, contam: false, ex: null, grab: null, wean: 0, dunk: 0, dunked: false,
  shoots: 0, roots: 0, pots: [false, false, false, false], acc: 0, _hud: "", splash: 0,
  reset(log) {
    clearInterval(this.timer);
    const L = this.layout();
    Object.assign(this, {
      tissue: false, cutDone: false, sterile: false, plated: false, xfer: false,
      day: 0, bio: 0, contam: false, ex: null, grab: null, wean: 0, dunk: 0, dunked: false,
      shoots: 0, roots: 0, pots: [false, false, false, false], acc: 0, _hud: "", splash: 0,
      timer: null, carry: null, sel: null,
      shears: { x: L.shears.x, y: L.shears.y },
      auxBot: { x: L.aux.x, y: L.aux.y },
      cytoBot: { x: L.cyto.x, y: L.cyto.y },
      _now: performance.now()
    });
    const tEl = $("#pTemp"); if (tEl) tEl.value = 24; this.temp = 24;
    const lEl = $("#pLight"); if (lEl) lEl.value = 60; this.light = 60;
    const nEl = $("#pNut"); if (nEl) nEl.value = 75; this.nut = 75;
    const aEl = $("#pAux"); if (aEl) aEl.value = 48; this.aux = 48;
    const cEl = $("#pCyto"); if (cEl) cEl.value = 52; this.cyto = 52;
    if (log) NB.add("plant", "Laminar bench reset.");
  },
  layout() {
    const w = innerWidth, h = innerHeight;
    const p = { x: w * 0.17, y: h * 0.80 };
    return {
      w, h, parent: p,
      nodes: [
        { id: "tip", x: p.x + 4, y: p.y - 158, r: 26, label: "shoot apex" },
        { id: "ax", x: p.x - 22, y: p.y - 96, r: 22, label: "axillary bud" }
      ],
      dish: { x: w * 0.36, y: h * 0.78, r: 52 },
      flask: { x: w * 0.56, y: h * 0.56 },
      house: { x: w * 0.78, y: h * 0.44, bw: w * 0.26, bh: h * 0.48 },
      shears: { x: w * 0.28, y: h * 0.90 },
      aux: { x: w * 0.44, y: h * 0.20 },
      cyto: { x: w * 0.51, y: h * 0.20 }
    };
  },
  stage() {
    if (this.xfer) return "gh";
    if (this.contam) return "contam";
    if (!this.tissue) return "find";
    if (!this.cutDone) return "cut";
    if (!this.plated && !this.sterile) return "ster";
    if (!this.plated) return "plate";
    if (this.bio < 20) return "explant";
    if (this.bio < 40) return "callus";
    if (this.bio < 62) return "organs";
    return "plantlets";
  },
  steps() {
    return {
      find: "1 / 6  ·  Click a totipotent meristem — shoot apex or axillary bud.",
      cut: "2 / 6  ·  Drag the shears onto the glowing meristem to take an explant.",
      ster: "3 / 6  ·  Dunk the explant in sterilant until the dish rings. Surface microbes must die.",
      plate: "4 / 6  ·  Drop the explant onto sterile agar. Hormones in the medium will steer development.",
      explant: "Explant on agar. Cells dividing by mitosis — the parent genome is copied, not shuffled.",
      callus: "Callus: unspecialised totipotent mass. Cytokinin → shoots. Auxin → roots.",
      organs: "Organs forming. You need shoots and roots before weaning.",
      plantlets: "5 / 6  ·  Plantlets ready. Drag one into a greenhouse pot, or use Acclimatise.",
      contam: "Contamination. Fungi outgrew the explant. Reset — you cannot skip sterilisation.",
      gh: "6 / 6  ·  Acclimatised clones. Same nuclear DNA as the parent. Phenotype can still differ."
    };
  },
  hudLine() { return this.steps()[this.stage()] || this.steps().find; },
  fail(m) {
    audio.bad();
    toast(m, "warn");
    NB.add("plant", "Error: " + m);
    sim.classList.remove("shake");
    void sim.offsetWidth;
    sim.classList.add("shake");
  },
  tickDay() {
    if (!this.plated) return;
    this.day++;
    const ts = 1 - Math.abs(this.temp - 24) / 22;
    const ls = 1 - Math.abs(this.light - 60) / 75;
    const ns = this.nut / 100;
    const cyto = Number(this.cyto) || 52;
    const aux = Number(this.aux) || 48;
    const horm = Math.min(aux, cyto) / 55 * (1 - Math.abs(aux - cyto) / 140);
    if (!this.sterile && this.day >= 2) this.contam = true;
    if (this.contam) {
      this.bio = Math.max(0, this.bio - 8);
      NB.add("plant", `Day ${this.day} · contamination overtaking the flask.`);
      return;
    }
    const g = Math.max(0, ts * ls * ns * (0.35 + horm * 0.9)) * 7.2;
    this.bio = Math.min(100, this.bio + g);
    const organ = this.bio > 22 ? 0.14 : 0.06;
    this.shoots = Math.min(1, this.shoots + 0.05 + (cyto / 100) * organ);
    this.roots = Math.min(1, this.roots + 0.05 + (aux / 100) * organ);
    if (this.light < 18) this.shoots = Math.max(0.05, this.shoots - 0.04);
    NB.add("plant", `Day ${this.day} · ${this.stage()} · biomass ${Math.round(this.bio)}%`);
    if (this.bio >= 78 && this.sterile && this.shoots > 0.45 && this.roots > 0.35) markDone("plant");
  },
  tick() {
    const L = this.layout();
    if (!this.shears) this.reset(false);
    const now = performance.now();
    const dt = Math.min(0.033, Math.max(0.008, (now - (this._now || now - 16)) / 1000));
    this._now = now;
    if (this.wean > 0 && this.wean < 1) this.wean = Math.min(1, this.wean + 0.018);
    if (this.splash > 0) this.splash = Math.max(0, this.splash - dt * 1.8);
    if (this.grab !== "shears") {
      this.shears.x = lerp(this.shears.x, L.shears.x, 0.06);
      this.shears.y = lerp(this.shears.y, L.shears.y, 0.06);
    }
    if (this.grab !== "aux") { this.auxBot.x = lerp(this.auxBot.x, L.aux.x, 0.08); this.auxBot.y = lerp(this.auxBot.y, L.aux.y, 0.08); }
    if (this.grab !== "cyto") { this.cytoBot.x = lerp(this.cytoBot.x, L.cyto.x, 0.08); this.cytoBot.y = lerp(this.cytoBot.y, L.cyto.y, 0.08); }
    if (this.grab === "ex" && this.ex) {
      const dish = L.dish;
      if (dist(this.ex, dish) < dish.r + 10) {
        this.dunk = Math.min(1, this.dunk + dt * 0.7);
        this.splash = 1;
        if (this.dunk >= 1 && !this.sterile) {
          this.sterile = true;
          this.dunked = true;
          audio.wet();
          NB.add("plant", "Surface sterilised in disinfectant.");
          toast("Surface sterile. Plate it before microbes recolonise.", "");
        }
      }
    } else if (this.cutDone && this.ex && !this.plated) coast(this.ex, 0.88);
    if (this.plated && !this.xfer) {
      this.acc += dt;
      if (this.acc > 0.9) { this.acc = 0; this.tickDay(); }
    }
    this.draw();
    const msg = this.hudLine();
    if (this._hud !== msg) {
      this._hud = msg;
      const el = $("#pStep");
      if (el) el.textContent = msg;
    }
    status(msg, acc(this.contam ? 3 : 0));
  },
  draw() {
    const L = this.layout(), w = L.w, h = L.h;
    const ctx = fit(sim, w, h);
    ctx.clearRect(0, 0, w, h);
    drawDust(ctx, w, h, t * 0.55, 22);
    const gnd = ctx.createLinearGradient(0, h * 0.62, 0, h);
    gnd.addColorStop(0, "rgba(10,18,12,0)");
    gnd.addColorStop(1, "rgba(8,18,12,0.55)");
    ctx.fillStyle = gnd;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    ctx.fillStyle = "rgba(28,22,16,0.45)";
    ctx.fillRect(0, h * 0.86, w, 10);
    ctx.fillStyle = "rgba(200,210,200,0.28)";
    ctx.font = "11px IBM Plex Mono";
    ctx.fillText("LAMINAR FLOW  ·  sterile cabinet", 18, 28);

    this.drawParent(ctx, L);
    this.drawDish(ctx, L.dish);
    this.drawFlask(ctx, L.flask.x, L.flask.y);
    this.drawBottle(ctx, this.auxBot.x, this.auxBot.y, "#c47a4a", "auxin", this.grab === "aux");
    this.drawBottle(ctx, this.cytoBot.x, this.cytoBot.y, "#6ec4a0", "cytokinin", this.grab === "cyto");
    this.drawShears(ctx, this.shears.x, this.shears.y, this.grab === "shears");
    if (this.cutDone && this.ex && !this.plated) {
      snapRing(ctx, L.dish.x, L.dish.y, L.dish.r + 8, dist(this.ex, L.dish) < L.dish.r + 12);
      snapRing(ctx, L.flask.x, L.flask.y, 92, dist(this.ex, L.flask) < 120);
      this.drawExplant(ctx, this.ex.x, this.ex.y, 1.05);
    }
    if (this.grab === "plantlet" && this.carry) this.drawExplant(ctx, this.carry.x, this.carry.y, 1.15);
    this.drawGreenhouse(ctx, L);
    this.drawMeters(ctx, L);
  },
  drawParent(ctx, L) {
    const p = L.parent;
    ctx.fillStyle = "rgba(18,36,20,0.55)";
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 64, 12, 0, 0, Math.PI * 2); ctx.fill();
    pot(ctx, p.x, p.y + 8, 1.05);
    shrub(ctx, p.x, p.y, 1.08, t, this.tissue && !this.cutDone, false);
    L.nodes.forEach((n) => {
      const on = this.sel === n.id || (!this.cutDone && this.tissue);
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + Math.sin(t * 5) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = on ? "rgba(142,224,184,0.9)" : "rgba(142,224,184,0.28)";
      ctx.lineWidth = on ? 2.2 : 1;
      ctx.stroke();
      if (!this.cutDone) {
        ctx.fillStyle = "rgba(232,239,230,0.7)";
        ctx.font = "11px IBM Plex Sans"; ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y - 22);
      }
    });
    ctx.fillStyle = "rgba(212,180,138,0.75)";
    ctx.font = "12px IBM Plex Sans"; ctx.textAlign = "center";
    ctx.fillText("Parent  ·  totipotent meristems", p.x, p.y + 40);
    ctx.textAlign = "start";
  },
  drawDish(ctx, d) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.ellipse(d.x, d.y + 8, d.r + 8, 8, 0, 0, Math.PI * 2); ctx.fill();
    const fill = ctx.createRadialGradient(d.x - 8, d.y - 6, 4, d.x, d.y, d.r);
    fill.addColorStop(0, this.sterile ? "rgba(180,220,210,0.45)" : "rgba(160,200,220,0.4)");
    fill.addColorStop(1, "rgba(30,60,80,0.55)");
    ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.38, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = "rgba(210,230,240,0.55)"; ctx.lineWidth = 3; ctx.stroke();
    if (this.splash > 0.05) {
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = `rgba(180,220,230,${0.25 * this.splash})`;
        ctx.beginPath();
        ctx.arc(d.x + Math.sin(t * 8 + i) * 18, d.y - 10 - i * 2 * this.splash, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = "rgba(200,220,230,0.7)";
    ctx.font = "11px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("sterilant  ·  dunk fully", d.x, d.y + d.r * 0.38 + 16);
    if (this.dunk > 0 && !this.plated) {
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(d.x - 40, d.y - 40, 80, 5);
      ctx.fillStyle = "#8ee0b8";
      ctx.fillRect(d.x - 40, d.y - 40, 80 * this.dunk, 5);
    }
    ctx.textAlign = "start";
    ctx.restore();
  },
  drawBottle(ctx, x, y, col, label, hot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = hot ? col : "rgba(20,24,22,0.7)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-14, -28, 28, 48, 6); else ctx.rect(-14, -28, 28, 48);
    ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = hot ? 2.2 : 1.2; ctx.stroke();
    ctx.fillStyle = col;
    ctx.fillRect(-6, -36, 12, 10);
    ctx.fillStyle = "rgba(232,239,230,0.8)";
    ctx.font = "10px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText(label, 0, 32);
    ctx.textAlign = "start";
    ctx.restore();
  },
  drawShears(ctx, x, y, hot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.4);
    ctx.strokeStyle = hot ? "#e8e8e0" : "rgba(200,210,200,0.7)";
    ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-18, 8); ctx.lineTo(22, -10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, -4); ctx.lineTo(22, 6); ctx.stroke();
    ctx.fillStyle = "#8a4a2c";
    ctx.fillRect(-26, -8, 12, 16);
    ctx.restore();
    ctx.fillStyle = "rgba(200,210,200,0.55)";
    ctx.font = "10px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("shears", x, y + 22);
    ctx.textAlign = "start";
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
    ctx.fillStyle = glass; ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dx - 58, dy + 62);
    ctx.quadraticCurveTo(dx - 70, dy + 6, dx - 24, dy - 48);
    ctx.lineTo(dx - 16, dy - 100);
    ctx.lineTo(dx + 16, dy - 100);
    ctx.lineTo(dx + 24, dy - 48);
    ctx.quadraticCurveTo(dx + 70, dy + 6, dx + 58, dy + 62);
    ctx.closePath();
    ctx.clip();
    const cavity = ctx.createRadialGradient(dx - 10, dy - 20, 8, dx, dy + 10, 90);
    cavity.addColorStop(0, "rgba(36,64,48,0.55)");
    cavity.addColorStop(1, "rgba(8,18,14,0.35)");
    ctx.fillStyle = cavity;
    ctx.fillRect(dx - 80, dy - 130, 160, 220);
    ctx.restore();
    ctx.strokeStyle = "rgba(210,230,220,0.45)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dx - 22, dy - 108); ctx.lineTo(dx + 22, dy - 108);
    ctx.lineTo(dx + 26, dy - 122); ctx.lineTo(dx - 26, dy - 122);
    ctx.closePath();
    ctx.fillStyle = this.plated ? "rgba(240,236,220,0.45)" : "rgba(200,220,210,0.2)";
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.contam ? "rgba(110,62,28,0.78)" : "rgba(72,98,36,0.7)";
    ctx.beginPath(); ctx.ellipse(dx, dy + 38, 58, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.contam ? "rgba(150,80,30,0.45)" : "rgba(90,120,40,0.45)";
    ctx.beginPath(); ctx.ellipse(dx, dy + 22, 52, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(dx - 48, dy - 20); ctx.quadraticCurveTo(dx - 40, dy + 20, dx - 36, dy + 58); ctx.stroke();
    if (this.contam) {
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = `rgba(180,70,30,${0.18 + (i % 5) * 0.08})`;
        ctx.beginPath();
        ctx.arc(dx + Math.sin(t * 0.7 + i) * 42, dy + 8 + Math.cos(t * 0.5 + i * 1.3) * 28, 2 + i % 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.plated) this.drawCulture(ctx, dx, dy);
    ctx.fillStyle = "rgba(212,180,138,0.7)";
    ctx.font = "11px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText("in vitro  ·  " + (this.contam ? "contaminated" : this.plated ? this.stage() : "agar + hormones"), dx, dy + 118);
    ctx.textAlign = "start";
    ctx.restore();
  },
  drawCulture(ctx, dx, dy) {
    const g = this.bio / 100;
    const pale = this.light < 22 ? 0.55 : 1;
    const shootV = Math.max(this.shoots, Math.max(0, (g - 0.18) / 0.5));
    const rootV = Math.max(this.roots, Math.max(0, (g - 0.24) / 0.55) * (this.aux / 90));
    if (g < 0.16) {
      this.drawExplant(ctx, dx, dy + 8, 1);
      return;
    }
    ctx.fillStyle = `rgba(210,186,110,${0.7 + g * 0.25})`;
    ctx.beginPath(); ctx.ellipse(dx, dy + 18, 16 + g * 26, 9 + g * 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,236,170,0.45)";
    ctx.beginPath(); ctx.ellipse(dx - 6, dy + 10, 10 + g * 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (rootV > 0.12) {
      ctx.strokeStyle = `rgba(210,160,90,${0.45 + rootV * 0.45})`;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(dx - 12 + i * 5, dy + 26);
        ctx.quadraticCurveTo(dx - 18 + i * 8, dy + 38 + rootV * 12, dx - 10 + i * 5, dy + 50);
        ctx.stroke();
      }
    }
    if (shootV > 0.04) {
      const n = shootV > 0.72 ? 4 : shootV > 0.42 ? 3 : shootV > 0.18 ? 2 : 1;
      const sc = 0.72 + shootV * 0.55 + g * 0.2;
      for (let i = 0; i < n; i++) {
        const ox = (i - (n - 1) / 2) * (18 + shootV * 6);
        this.drawPlantlet(ctx, dx + ox, dy + 14, sc * (0.92 + (i % 3) * 0.06), pale, t + i);
      }
    }
    if (g >= 0.62 || this.stage() === "plantlets") {
      ctx.fillStyle = "rgba(180,255,200,0.9)";
      ctx.font = "11px IBM Plex Sans"; ctx.textAlign = "center";
      ctx.fillText("plantlets", dx, dy - 72);
      ctx.textAlign = "start";
    }
  },
  drawPlantlet(ctx, x, y, s, pale, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = pale;
    const sway = Math.sin(time * 1.4) * 0.08;
    ctx.rotate(sway * 0.15);
    ctx.strokeStyle = "#8ee08a";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(-8 + sway * 6, -28, 2, -58);
    ctx.stroke();
    ctx.strokeStyle = "#6bc46a";
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-16, -32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1, -30); ctx.lineTo(15, -42); ctx.stroke();
    leaf(ctx, -2, -22, -0.85 + sway * 0.2, 22, 9, "#b6ff9a", sway);
    leaf(ctx, 3, -34, 0.7 + sway * 0.15, 20, 8, "#8ee08a", -sway);
    leaf(ctx, 1, -50, -0.2, 16, 7, "#d4ffb8", sway * 0.5);
    ctx.restore();
  },
  drawExplant(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.4);
    ctx.scale(s, s);
    ctx.strokeStyle = this.sterile ? "#7dffb0" : "#4a8a40";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(12, -10); ctx.stroke();
    leaf(ctx, 4, -6, -0.8, 18, 7, this.sterile ? "#7dffb0" : "#5dcc7a", 0);
    leaf(ctx, 8, -2, 0.5, 14, 6, "#4cbf6a", 0);
    ctx.restore();
  },
  drawGreenhouse(ctx, L) {
    const H = L.house, u = this.wean;
    ctx.save();
    ctx.globalAlpha = this.xfer ? 0.4 + 0.6 * u : 0.55;
    ctx.fillStyle = "rgba(14,28,20,0.55)";
    ctx.fillRect(H.x - H.bw * 0.42, H.y, H.bw, H.bh);
    ctx.strokeStyle = "rgba(160,210,180,0.28)"; ctx.lineWidth = 2;
    ctx.strokeRect(H.x - H.bw * 0.42, H.y, H.bw, H.bh);
    ctx.beginPath();
    ctx.moveTo(H.x - H.bw * 0.42, H.y);
    ctx.lineTo(H.x, H.y - 28);
    ctx.lineTo(H.x + H.bw * 0.58, H.y);
    ctx.strokeStyle = "rgba(180,230,200,0.35)"; ctx.stroke();
    ctx.fillStyle = "#d4b48a";
    ctx.font = "11px IBM Plex Mono";
    ctx.fillText("GREENHOUSE  ·  acclimatise", H.x - H.bw * 0.38, H.y + 18);
    for (let i = 0; i < 4; i++) {
      const x = H.x - 28 + (i % 2) * 78;
      const y = H.y + 78 + Math.floor(i / 2) * 86;
      pot(ctx, x, y + 8, 0.82);
      if (this.pots[i]) {
        const sc = (0.38 + 0.14 * u) * (0.94 + (i % 3) * 0.04);
        shrub(ctx, x, y, sc, t + i * 0.4, false, true);
      } else if (this.stage() === "plantlets" || this.xfer) {
        snapRing(ctx, x, y, 36, this.grab === "plantlet" && this.carry && dist(this.carry, { x, y }) < 40);
      }
    }
    ctx.restore();
  },
  drawMeters(ctx, L) {
    const x = L.flask.x, y = L.h * 0.12;
    ctx.fillStyle = "rgba(8,12,10,0.4)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 120, y - 8, 240, 46, 8); else ctx.rect(x - 120, y - 8, 240, 46);
    ctx.fill();
    ctx.fillStyle = "rgba(200,210,200,0.75)";
    ctx.font = "11px IBM Plex Mono"; ctx.textAlign = "center";
    ctx.fillText(`Day ${this.day}  ·  ${Math.round(this.bio)}%  ·  ${this.temp}°C  ·  light ${this.light}`, x, y + 10);
    ctx.fillText(`shoots ${Math.round(this.shoots * 100)}%  ·  roots ${Math.round(this.roots * 100)}%  ·  ${this.sterile ? "sterile" : "not sterilised"}`, x, y + 26);
    ctx.textAlign = "start";
  },
  down(p) {
    if (inspect) return this.inspectAt(p);
    const L = this.layout();
    if (this.shears && dist(p, this.shears) < 36) { this.grab = "shears"; audio.grab(); return; }
    if (this.auxBot && dist(p, this.auxBot) < 30) { this.grab = "aux"; audio.grab(); return; }
    if (this.cytoBot && dist(p, this.cytoBot) < 30) { this.grab = "cyto"; audio.grab(); return; }
    if (this.cutDone && this.ex && !this.plated && dist(p, this.ex) < 32) { this.grab = "ex"; audio.grab(); return; }
    if ((this.stage() === "plantlets" || this.xfer) && dist(p, L.flask) < 90) {
      if (this.contam) return this.fail("Contaminated culture cannot be weaned.");
      if (this.shoots < 0.4 || this.roots < 0.3) return this.fail("Need both shoots (cytokinin) and roots (auxin) before weaning.");
      this.grab = "plantlet";
      this.carry = { x: p.x, y: p.y };
      audio.grab();
      return;
    }
    const node = L.nodes.find((n) => dist(p, n) < n.r + 8);
    if (node && !this.cutDone) {
      this.tissue = true;
      this.sel = node.id;
      audio.ok();
      toast("Meristem selected — totipotent. Cut with the shears.", "");
      NB.add("plant", "Selected " + node.label + " (totipotent).");
    }
  },
  move(p) {
    if (this.grab === "shears") { this.shears.x = p.x; this.shears.y = p.y; }
    else if (this.grab === "aux") { this.auxBot.x = p.x; this.auxBot.y = p.y; }
    else if (this.grab === "cyto") { this.cytoBot.x = p.x; this.cytoBot.y = p.y; }
    else if (this.grab === "ex" && this.ex) { this.ex.x = p.x; this.ex.y = p.y; }
    else if (this.grab === "plantlet") { this.carry = { x: p.x, y: p.y }; }
  },
  up(p) {
    const L = this.layout();
    const g = this.grab;
    this.grab = null;
    if (g === "shears") {
      const node = L.nodes.find((n) => dist(this.shears, n) < n.r + 18);
      if (node) { this.tissue = true; this.sel = node.id; this.takeCut(node); }
      return;
    }
    if (g === "ex" && this.ex) {
      if (dist(p, L.flask) < 110) this.plate();
      return;
    }
    if (g === "aux" && dist(this.auxBot, L.flask) < 110) {
      this.aux = Math.min(100, this.aux + 14);
      const el = $("#pAux"); if (el) el.value = this.aux;
      audio.place(); toast("Auxin up. Favours roots from callus.", "");
    }
    if (g === "cyto" && dist(this.cytoBot, L.flask) < 110) {
      this.cyto = Math.min(100, this.cyto + 14);
      const el = $("#pCyto"); if (el) el.value = this.cyto;
      audio.place(); toast("Cytokinin up. Favours shoots from callus.", "");
    }
    if (g === "plantlet" && this.carry) {
      let hit = -1;
      for (let i = 0; i < 4; i++) {
        const x = L.house.x - 28 + (i % 2) * 78;
        const y = L.house.y + 78 + Math.floor(i / 2) * 86;
        if (dist(this.carry, { x, y }) < 42) hit = i;
      }
      this.carry = null;
      if (hit >= 0) this.plantPot(hit);
      else this.fail("Drop the plantlet into an empty greenhouse pot.");
    }
  },
  takeCut(node) {
    if (!this.tissue) return this.fail("Select a meristem on the parent first.");
    if (this.cutDone) return;
    this.cutDone = true;
    this.sel = node ? node.id : this.sel;
    this.ex = { x: innerWidth * 0.26, y: innerHeight * 0.42, vx: 0, vy: 0 };
    audio.snip();
    NB.add("plant", "Explant cut from totipotent tissue.");
    toast("Explant taken. Dunk it in sterilant — do not skip.", "");
  },
  plate() {
    if (!this.cutDone) return;
    this.plated = true;
    this.bio = 6;
    audio.place();
    NB.add("plant", this.sterile ? "Plated on sterile nutrient medium." : "Plated without sterilisation — contamination likely.");
    toast(this.sterile ? "On agar. Watch callus, then organs. Balance the hormones." : "Unsterilised explant on agar. Microbes will win.", this.sterile ? "" : "warn");
  },
  plantPot(i) {
    if (this.contam) return this.fail("Contaminated culture cannot be weaned.");
    if (this.bio < 55 || this.shoots < 0.4 || this.roots < 0.3) return this.fail("Wait for rooted shoots. Auxin and cytokinin both needed.");
    this.pots[i] = true;
    this.xfer = true;
    this.wean = Math.max(this.wean, 0.04);
    markDone("plant"); markSim("plant");
    audio.ok();
    NB.add("plant", "Plantlet acclimatised. Clone of the parent nuclear genome.");
    toast("Weaned clone. Same genes as the parent meristem. Greenhouse phenotype can still differ.", "");
  },
  xferOut() {
    if (this.contam) return this.fail("Contaminated culture cannot be weaned.");
    if (this.bio < 55 || this.shoots < 0.4 || this.roots < 0.3) return this.fail("Wait for rooted plantlets. Raise the missing hormone if shoots or roots are weak.");
    this.pots = this.pots.map(() => true);
    this.xfer = true;
    this.wean = 0.04;
    markDone("plant"); markSim("plant");
    audio.ok();
    toast("Plantlets weaned. Clones of the parent, now in the greenhouse.", "");
  },
  inspectAt(p) {
    const L = this.layout();
    const node = L.nodes.find((n) => dist(p, n) < n.r + 10);
    if (node) callout(node.label, "Meristem. Many plant cells stay totipotent, so this piece can rebuild a whole plant (5.17B).", p.x, p.y);
    else if (dist(p, L.dish) < L.dish.r + 12) callout("Surface sterilant", "Kills microbes on the explant. Skip this and fungi take the flask.", p.x, p.y);
    else if (dist(p, L.flask) < 90) callout("Nutrient medium", "In vitro agar + hormones. Callus, then shoots and roots. Mitosis copies the parent genome.", p.x, p.y);
    else if (p.x > L.house.x - L.house.bw * 0.45) callout("Greenhouse", "Acclimatise plantlets. They are genetically identical to the parent. Light and humidity still change phenotype.", p.x, p.y);
    else if (dist(p, this.auxBot) < 28) callout("Auxin", "Favours root formation from callus.", p.x, p.y);
    else if (dist(p, this.cytoBot) < 28) callout("Cytokinin", "Favours shoot formation from callus.", p.x, p.y);
    else hideCallout();
  }
};
function bindPlantDock() {
  const sync = () => {
    Plant.temp = Number($("#pTemp").value);
    Plant.light = Number($("#pLight").value);
    Plant.nut = Number($("#pNut").value);
    Plant.aux = Number($("#pAux").value);
    Plant.cyto = Number($("#pCyto").value);
  };
  $("#pTemp").oninput = sync;
  $("#pLight").oninput = sync;
  $("#pNut").oninput = sync;
  $("#pAux").oninput = sync;
  $("#pCyto").oninput = sync;
  $("#pXfer").onclick = (e) => { e.stopPropagation(); Plant.xferOut(); };
}

/* ---------- BACTERIA ---------- */
const Bac = {
  n: 1, phase: 0, nut: 80, temp: 37, run: false, accu: 0, hist: [1], view: "micro", cam: 1, gens: 0, _hud: "",
  reset() {
    Object.assign(this, { n: 1, phase: 0, accu: 0, hist: [1], run: false, cam: 1, gens: 0, view: "micro", _hud: "", dead: false });
  },
  factor() {
    const tf = Math.max(0, 1 - Math.abs(this.temp - 37) / 28);
    if (this.temp >= 48) { this.dead = true; this.run = false; return 0; }
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
        audio.pop();
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
    const msg = this.dead ? "Culture killed. Proteins denatured above ~48°C. Reset and keep near 37°C." :
      !this.run ? "Find the cell in the microscope. Click it to start binary fission." :
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
    if (this.dead) {
      g.addColorStop(0, "rgba(70,62,48,0.9)");
      g.addColorStop(0.5, "rgba(120,110,90,0.5)");
      g.addColorStop(1, "rgba(50,44,36,0.92)");
    } else {
      g.addColorStop(0, "rgba(30,80,55,0.9)");
      g.addColorStop(0.5, "rgba(90,180,130,0.55)");
      g.addColorStop(1, "rgba(20,60,40,0.92)");
    }
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
    if (this.dead) { toast("Proteins denatured. Reset — cloning cannot restart from a killed culture.", "warn"); audio.bad(); return; }
    if (!this.run) { this.run = true; audio.ok(); toast("Founder cell dividing. DNA → elongate → septum → two clones.", ""); return; }
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
    if (this.chip) {
      const H = this.host(w, h);
      snapRing(ctx, H.x, H.y, 96, dist(this.chip, H) < 70);
      this.drawCassette(ctx, this.chip.x, this.chip.y, 1);
    }
    if (this.harvested) this.drawVial(ctx, w, h);
    const map = {
      pick: "Select the human insulin gene. Haemoglobin and keratin are decoys.",
      isolated: "Insulin cassette in the forceps. Drop it onto the bacterial host.",
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
    if (this.inserted && !this.cloned && dist(p, this.host(w, h)) < 90) { this.clone(); return; }
    if (this.cloned && this.yield >= 55 && !this.harvested && dist(p, this.host(w, h)) < 90) { this.harvest(); return; }
    for (const g of this.genes(w, h)) {
      if (dist(p, g) < 22) {
        this.selected = g.id;
        if (!g.ok) this.fail("Wrong locus. Haemoglobin and keratin will not make insulin. Find INSULIN.");
        else { audio.ok(); if (!this.isolated) this.isolate(); }
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
    this.harvested = true; audio.chime();
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
