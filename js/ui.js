import { $, $$, toast, audio, store, NB } from "./core.js?v=44";
import { LESSONS, GLOSSARY, ETHICS, DEPTH } from "./content.js?v=44";

const PKEY = "progress";
export function progress() {
  const p = store.load()[PKEY] || { concepts: {}, quiz: 0, exam: 0, sims: {} };
  if (!p.concepts) p.concepts = {};
  return p;
}
function saveP(p) { store.save({ [PKEY]: p }); }

export function markConcept(id) {
  const p = progress();
  p.concepts[id] = true;
  saveP(p);
  renderProgress();
}
export function markQuiz() {
  const p = progress(); p.quiz = (p.quiz || 0) + 1; saveP(p); renderProgress();
}
export function markExam() {
  const p = progress(); p.exam = (p.exam || 0) + 1; saveP(p); renderProgress();
}
export function markSim(k) {
  const p = progress(); p.sims = p.sims || {}; p.sims[k] = true; saveP(p); renderProgress();
}

export function renderProgress() {
  const el = $("#progBody");
  if (!el) return;
  const p = progress();
  const nC = Object.keys(p.concepts).length;
  el.innerHTML = `
    <p>Concepts ${nC} / ${LESSONS.length}</p>
    <div class="bar"><i style="width:${(nC / LESSONS.length) * 100}%"></i></div>
    <p>Quiz answers ${p.quiz || 0} · Exam scripts ${p.exam || 0}</p>
    <p>Labs ${["scnt","plant","bac","tg"].filter((k) => p.sims?.[k]).length} / 4</p>`;
}

let li = 0;
const HOLD = {
  l01: "Clone = genetically identical / same nuclear DNA. Copied by mitosis.",
  l02: "Same genes ≠ same phenotype. Mitochondria can still come from the egg.",
  l03: "Natural clones form by mitosis: runners, bulbs, cuttings, fission, identical twins.",
  l04: "Identical twins match each other / that zygote — not a chosen adult.",
  l05: "Artificial cloning still copies nuclear DNA by mitosis.",
  l06: "Plant cells are often totipotent, so an explant can rebuild a whole plant.",
  l07: "Explant → sterilise → medium → plantlets → acclimatise.",
  l08: "Advantage: many plants with a desired characteristic, quickly.",
  l09: "Disadvantage: low variation, so disease can hit the whole crop.",
  l10: "Adult mammal cells are not totipotent — animals need SCNT.",
  l11: "Diploid somatic nucleus into an enucleated egg. Pulse starts mitosis — it does not add DNA.",
  l12: "The donor is a body cell. Its nucleus still holds a full diploid genome.",
  l13: "Unfertilised egg: cytoplasm reprogrammes; haploid nucleus must be removed.",
  l14: "Enucleate so genomes do not mix / chromosome number stays diploid from the donor.",
  l15: "Reconstructed oocyte = donor nuclear DNA in egg cytoplasm.",
  l16: "The electric pulse activates division. It does not create DNA.",
  l17: "Mitosis: 1 → 2 → 4 → 8 → morula → blastocyst. Every nucleus matches the donor.",
  l18: "Surrogate = uterus, not nuclear parent.",
  l19: "Nuclear DNA = somatic donor, copied by mitosis.",
  l20: "Phenotype = genotype + environment.",
  l21: "Embryo splitting copies that embryo’s genome, not necessarily a chosen adult.",
  l22: "SCNT copies a known adult. Splitting copies whatever the embryo already was.",
  l23: "Binary fission produces a clonal population until mutation.",
  l24: "Uses: crops, research, conservation cells, transgenic proteins, insulin.",
  l25: "Advantage: copy a proven / transgenic genotype quickly.",
  l26: "Disadvantage: low success, welfare, cost, reduced variation, ethics.",
  l27: "Cloning reduces the number of different alleles in the population.",
  l28: "Shared genotype → shared vulnerability to disease or change.",
  l29: "Discuss both sides. Human reproductive cloning is widely banned.",
  l30: "Transgenic = contains a gene from another species.",
  l31: "Clone the transgenic host so meiosis does not shuffle the gene away.",
  l32: "Insert human insulin gene → clone the host → protein from the culture.",
  l33: "Write: genetically identical, nuclear DNA, enucleated, surrogate, mitosis.",
  l34: "Read the problem, choose the method, then perform it."
};
const SPEC = {
  define: "Specification idea · genetically identical",
  plant: "5.17B / 5.18B · tissue culture",
  scnt: "5.19B · somatic-cell nuclear transfer",
  dolly: "Classic example · nuclear donor vs surrogate",
  bacteria: "Asexual reproduction · binary fission",
  transgenic: "5.16 / 5.20B · transgenic cloning",
  ethics: "Discussion · advantages and disadvantages",
  exam: "Exam technique · mark-scheme language",
  master: "Apply the method · no procedure sheet"
};
export function showLearn() {
  const L = LESSONS[li];
  const D = DEPTH[L.id] || {};
  markConcept(L.id);
  $("#learnNo").textContent = String(li + 1).padStart(2, "0") + " / " + LESSONS.length;
  $("#learnSpec").textContent = D.spec || SPEC[L.try] || "Edexcel International GCSE Biology 4BI1";
  $("#learnBar i").style.width = ((li + 1) / LESSONS.length * 100) + "%";
  $("#learnTitle").textContent = L.title;
  const bits = L.body.split(/(?<=\.)\s+/).filter(Boolean);
  const lead = bits[0] || L.body;
  const rest = bits.slice(1);
  const cards = [];
  if (D.why) cards.push(`<article class="learnCard why"><p class="mark">Why this happens</p><p>${D.why}</p></article>`);
  if (D.myth) cards.push(`<article class="learnCard myth"><p class="mark">Watch this trap</p><p>${D.myth}</p></article>`);
  if (D.app) cards.push(`<article class="learnCard app"><p class="mark">In the world</p><p>${D.app}</p></article>`);
  const board = [];
  if (D.diagram) board.push(`<figure class="learnDiag">${D.diagram}</figure>`);
  if (cards.length) board.push(`<div class="learnCards">${cards.join("")}</div>`);
  if (D.table) {
    board.push(`<div class="learnTableWrap"><table class="learnTable">${D.table.map((row, i) => `<tr>${row.map((c) => i ? `<td>${c}</td>` : `<th>${c}</th>`).join("")}</tr>`).join("")}</table></div>`);
  }
  if (D.exam) board.push(`<blockquote class="learnExamQ"><p class="mark">Write this</p><p>${D.exam}</p></blockquote>`);
  $("#learnBody").innerHTML =
    `<p class="learnLede">${lead}</p>` +
    (rest.length ? `<div class="learnRest">${rest.map((s) => `<p>${s}</p>`).join("")}</div>` : "") +
    (board.length ? `<div class="learnBoard">${board.join("")}</div>` : "");
  const hold = HOLD[L.id];
  $("#learnRemember").hidden = !hold;
  $("#learnHold").textContent = hold || "";
  const chips = {
    define: ["nuclear DNA", "mitosis", "phenotype ≠ genotype"],
    plant: ["5.17B / 5.18B", "explant", "sterilise", "totipotent"],
    scnt: ["5.19B", "diploid nucleus", "enucleated egg", "surrogate"],
    dolly: ["Finn-Dorset", "nuclear donor", "not the surrogate"],
    bacteria: ["binary fission", "clonal colony"],
    transgenic: ["5.16 / 5.20B", "insulin gene", "clone the host"],
    ethics: ["variation", "welfare", "conservation"],
    exam: ["mark-scheme language"],
    master: ["choose the method"]
  };
  const list = chips[L.try] || ["Edexcel 4BI1", "genetically identical"];
  $("#learnChips").innerHTML = list.map((c, i) => `<span style="animation-delay:${0.2 + i * 0.05}s">${c}</span>`).join("");
  $("#learnTry").hidden = !L.try;
  $("#learnTry").dataset.go = L.try || "";
  $("#learnQuiz").hidden = L.quiz == null;
  $("#learnExam").hidden = L.exam == null;
  const rail = $("#learnRail");
  if (rail && rail.childElementCount !== LESSONS.length) {
    rail.innerHTML = LESSONS.map((x, i) =>
      `<button type="button" data-li="${i}"><span>${String(i + 1).padStart(2, "0")}</span>${x.title}</button>`
    ).join("");
    $$("#learnRail button").forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); audio.click(); li = Number(b.dataset.li); showLearn(); };
    });
  }
  $$("#learnRail button").forEach((b, i) => b.classList.toggle("on", i === li));
  const on = rail?.querySelector(".on");
  if (on) on.scrollIntoView({ block: "nearest" });
  const stage = $("#learnStage");
  if (stage) {
    stage.classList.remove("in");
    void stage.offsetWidth;
    stage.classList.add("in");
  }
}

export function learnDelta(d) {
  li = (li + d + LESSONS.length) % LESSONS.length;
  showLearn();
}

export function learnGotoTry() {
  const L = LESSONS[li];
  if (L.try) window.dispatchEvent(new CustomEvent("goto", { detail: L.try }));
}
export function learnGotoQuiz() {
  const L = LESSONS[li];
  if (L.quiz != null) { qi = L.quiz; showQuiz(); window.dispatchEvent(new CustomEvent("goto", { detail: "quiz" })); }
}
export function learnGotoExam() {
  const L = LESSONS[li];
  if (L.exam != null) { ei = L.exam; showExam(); window.dispatchEvent(new CustomEvent("goto", { detail: "exam" })); }
}

let qi = 0, picked = null, qScore = 0, qCorrect = 0, qLocked = false;
function shuffleIndex(n) {
  const a = [...Array(n).keys()];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function showQuiz() {
  const data = window.CLONING?.CHECKS;
  const box = $("#quizPad");
  if (!box) return;
  if (!data?.length) {
    $("#quizQ").textContent = "Quiz data failed to load. Check js/data/exam.js.";
    $("#quizOpts").innerHTML = "";
    return;
  }
  const item = data[qi % data.length];
  picked = null;
  qLocked = false;
  const order = shuffleIndex(item.opts.length);
  qCorrect = order.indexOf(item.a);
  $("#quizProg").textContent = `Question ${qi % data.length + 1} / ${data.length}`;
  $("#quizScore").textContent = "Score " + qScore;
  $("#quizBar i").style.width = ((qi % data.length + 1) / data.length * 100) + "%";
  $("#quizQ").textContent = item.q;
  $("#quizFb").hidden = true;
  $("#quizOpts").innerHTML = order.map((src, i) =>
    `<button type="button" class="opt" data-i="${i}"><span>${"ABCD"[i]}</span><em>${item.opts[src]}</em></button>`
  ).join("");
  $$("#quizOpts .opt").forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      if (qLocked) return;
      picked = Number(b.dataset.i);
      audio.click();
      $$("#quizOpts .opt").forEach((x) => x.classList.toggle("on", x === b));
    };
  });
}

export function submitQuiz() {
  const data = window.CLONING?.CHECKS;
  if (!data?.length) return toast("No quiz data.", "warn");
  if (picked == null) return toast("Select A, B, C or D.", "warn");
  if (qLocked) return toast("Already marked. Next question.", "");
  const item = data[qi % data.length];
  const ok = picked === qCorrect;
  qLocked = true;
  if (ok) { qScore++; audio.ok(); markQuiz(); }
  else audio.bad();
  $("#quizScore").textContent = "Score " + qScore;
  const fb = $("#quizFb");
  fb.hidden = false;
  fb.innerHTML = `<p class="mark">${ok ? "Correct" : "Not quite"} · ${"ABCD"[qCorrect]} was the mark-scheme choice</p><p>${item.why}</p>`;
  $$("#quizOpts .opt").forEach((b) => {
    const i = Number(b.dataset.i);
    if (i === qCorrect) b.classList.add("good");
    if (i === picked && !ok) b.classList.add("bad");
  });
}

export function nextQuiz() { qi++; showQuiz(); }
export function prevQuiz() { qi = Math.max(0, qi - 1); showQuiz(); }

let ei = 0;
export function showExam() {
  const data = window.CLONING?.EXAM;
  if (!data?.length) {
    $("#examQ").textContent = "Exam data failed to load. Check js/data/exam.js.";
    return;
  }
  const item = data[ei % data.length];
  $("#examMeta").textContent = `Question ${ei % data.length + 1} / ${data.length}  ·  ${item.marks} mark`;
  $("#examQ").textContent = item.q;
  const saved = sessionStorage.getItem("exam-" + item.id);
  $("#examWrite").value = saved || "";
  countWords();
  $("#examMarkbox").hidden = true;
}

export function countWords() {
  const t = $("#examWrite")?.value || "";
  const w = t.trim() ? t.trim().split(/\s+/).length : 0;
  $("#examCount").textContent = w + " words · " + t.length + " characters";
  const item = window.CLONING?.EXAM?.[ei % (window.CLONING.EXAM.length || 1)];
  if (item) sessionStorage.setItem("exam-" + item.id, t);
}

export function submitExam() {
  const data = window.CLONING?.EXAM;
  if (!data?.length) return toast("No exam data.", "warn");
  const item = data[ei % data.length];
  const text = $("#examWrite").value;
  if (!window.CLONING.markExam) return toast("Marker missing.", "warn");
  const r = window.CLONING.markExam(item, text);
  markExam();
  const fb = $("#examMarkbox");
  fb.hidden = false;
  const got = r.hits ? "You used some mark-scheme language." : "Few or no mark-scheme terms detected.";
  const miss = r.awarded < item.marks ? "Add missing points from the scheme below." : "You covered the required points.";
  fb.innerHTML = `
    <p class="mark">Mark ${r.awarded} / ${item.marks}</p>
    <p><b>What you got right.</b> ${got}</p>
    <p><b>What is missing.</b> ${miss}</p>
    <p><b>Mark scheme.</b> ${item.scheme}</p>
    <p><b>Model answer.</b> ${item.scheme}</p>`;
}

export function nextExam() { ei++; showExam(); }
export function prevExam() { ei = Math.max(0, ei - 1); showExam(); }
export function resetExamWrite() { $("#examWrite").value = ""; countWords(); $("#examMarkbox").hidden = true; }

export function showGlossary() {
  $("#glossList").innerHTML = GLOSSARY.map(([k, v]) =>
    `<button type="button" class="gterm" data-k="${k}"><b>${k}</b></button>`
  ).join("");
  $("#glossDef").textContent = "Select a term.";
  $$("#glossList .gterm").forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      const row = GLOSSARY.find((x) => x[0] === b.dataset.k);
      $("#glossDef").innerHTML = `<p class="mark">${row[0]}</p><p>${row[1]}</p>`;
    };
  });
}

let ethi = 0, ethPick = null, ethSlide = 50;
export function showEthics() {
  const C = ETHICS[ethi % ETHICS.length];
  ethPick = null;
  $("#ethProg").textContent = `Case ${String(ethi + 1).padStart(2, "0")} / ${String(ETHICS.length).padStart(2, "0")}`;
  $("#ethBar i").style.width = ((ethi + 1) / ETHICS.length * 100) + "%";
  $("#ethSpec").textContent = C.tag + "  ·  " + C.spec;
  $("#ethTitle").textContent = C.title;
  $("#ethBody").textContent = C.scene;
  $("#ethNav").innerHTML = ETHICS.map((c, i) =>
    `<button type="button" class="${i === ethi ? "on" : ""}" data-ei="${i}">${c.tag}</button>`
  ).join("");
  $$("#ethNav button").forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); ethi = Number(b.dataset.ei); showEthics(); };
  });
  const st = [
    ["yes", C.yes],
    ["mid", C.mid],
    ["no", C.no]
  ];
  $("#ethStances").innerHTML = st.map(([id, s]) =>
    `<button type="button" class="stance" data-st="${id}"><b>${s.k}</b><span>${s.t}</span></button>`
  ).join("");
  $$("#ethStances .stance").forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      ethPick = b.dataset.st;
      $$("#ethStances .stance").forEach((x) => x.classList.toggle("on", x === b));
      ethSlide = ethPick === "yes" ? 18 : ethPick === "no" ? 82 : 50;
      $("#ethSlide").value = ethSlide;
      revealEthics(C);
      audio.ok();
    };
  });
  $("#ethVerdict").hidden = true;
}

function revealEthics(C) {
  $("#ethVerdict").hidden = false;
  $("#ethFor").innerHTML = C.for.map((x) => `<button type="button" class="ethPoint" data-side="for">${x}</button>`).join("");
  $("#ethAgainst").innerHTML = C.against.map((x) => `<button type="button" class="ethPoint" data-side="against">${x}</button>`).join("");
  $("#ethExam").textContent = C.exam;
  setNeedle(ethSlide);
  $$(".ethPoint").forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      b.classList.toggle("on");
      NB.add("ethics", b.textContent);
      toast("Pinned to the lab notebook.", "");
    };
  });
}

function setNeedle(v) {
  const n = $("#ethNeedle");
  if (n) n.style.left = v + "%";
  const lab = $("#ethSlideL");
  if (!lab) return;
  lab.textContent = v < 34 ? "Lean support" : v > 66 ? "Lean oppose" : "Conditional / discuss both";
}

export function ethDelta(d) {
  ethi = (ethi + d + ETHICS.length) % ETHICS.length;
  showEthics();
}

export function ethPin() {
  const C = ETHICS[ethi % ETHICS.length];
  if (!ethPick) return toast("Take a stance first.", "warn");
  const name = C[ethPick].k;
  NB.add("ethics", `${C.title} → ${name}`);
  toast("Stance saved in the notebook.", "");
}

export function bindLearnUi(enter) {
  $("#learnPrev").onclick = (e) => { e.stopPropagation(); learnDelta(-1); };
  $("#learnNext").onclick = (e) => { e.stopPropagation(); learnDelta(1); };
  $("#learnTry").onclick = (e) => { e.stopPropagation(); learnGotoTry(); };
  $("#learnQuiz").onclick = (e) => { e.stopPropagation(); learnGotoQuiz(); };
  $("#learnExam").onclick = (e) => { e.stopPropagation(); learnGotoExam(); };
  $("#quizSubmit").onclick = (e) => { e.stopPropagation(); submitQuiz(); };
  $("#quizNext").onclick = (e) => { e.stopPropagation(); nextQuiz(); };
  $("#quizPrev").onclick = (e) => { e.stopPropagation(); prevQuiz(); };
  $("#examSubmit").onclick = (e) => { e.stopPropagation(); submitExam(); };
  $("#examNext").onclick = (e) => { e.stopPropagation(); nextExam(); };
  $("#examPrev").onclick = (e) => { e.stopPropagation(); prevExam(); };
  $("#examClear").onclick = (e) => { e.stopPropagation(); resetExamWrite(); };
  $("#examWrite").addEventListener("input", countWords);
  $("#examWrite").addEventListener("pointerdown", (e) => e.stopPropagation());
  $("#ethPrev").onclick = (e) => { e.stopPropagation(); ethDelta(-1); };
  $("#ethNextC").onclick = (e) => { e.stopPropagation(); ethDelta(1); };
  $("#ethPin").onclick = (e) => { e.stopPropagation(); ethPin(); };
  $("#ethSlide").addEventListener("input", (e) => {
    ethSlide = Number(e.target.value);
    setNeedle(ethSlide);
  });
  $("#ethSlide").addEventListener("pointerdown", (e) => e.stopPropagation());
}
