import { $, $$, audio, toast, NB } from "./core.js?v=40";
import { initWorld, skipIntro, setWorld } from "./world3d.js?v=40";
import { setScene, startLoop, hint, procedure, resetActive, setInspect, pointer } from "./labs.js?v=40";
import {
  bindLearnUi, showLearn, showQuiz, showExam, showGlossary, renderProgress, learnDelta, showEthics, ethDelta
} from "./ui.js?v=40";

const gl = document.getElementById("gl");
const sim = document.getElementById("sim");

try {
  initWorld(gl);
} catch {
  $("#enter").hidden = false;
  $("#introHint").textContent = "WebGL unavailable — enter the laboratory to continue.";
}
setTimeout(() => { $("#enter").hidden = false; }, 11000);

let scene = "intro";
document.body.dataset.scene = "intro";
const TEXT = new Set(["learn", "quiz", "exam", "glossary", "ethics"]);

window.addEventListener("intro-complete", () => {
  $("#enter").hidden = false;
  $("#introHint").textContent = "You are inside the cell. Nuclear DNA is what cloning copies.";
});

$("#enter").addEventListener("click", (e) => { e.stopPropagation(); audio.click(); enter("learn"); });

$$("#rail button").forEach((b) => {
  b.addEventListener("click", (e) => { e.stopPropagation(); audio.click(); enter(b.dataset.go); });
});

$("#hud").addEventListener("pointerdown", (e) => e.stopPropagation());
$("#rail").addEventListener("pointerdown", (e) => e.stopPropagation());
["learnPad", "quizPad", "examPad", "glossPad", "ethicsPad", "notebook", "toast", "progPad"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("pointerdown", (e) => e.stopPropagation());
});

function enter(id) {
  scene = id;
  document.body.dataset.scene = id;
  $("#titlecard").hidden = id !== "intro";
  $("#hud").hidden = id === "intro";
  $("#rail").hidden = false;
  $$("#rail button").forEach((b) => b.classList.toggle("on", b.dataset.go === id));
  const pal = { define: "intro", learn: "intro", scnt: "lab", dolly: "lab", plant: "greenhouse", bacteria: "bacteria", transgenic: "gene", ethics: "lab", exam: "lab", quiz: "lab", glossary: "intro", master: "lab" };
  setWorld(pal[id] || "lab");
  setScene(id);
  startLoop();
  $("#learnPad").hidden = id !== "learn";
  $("#quizPad").hidden = id !== "quiz";
  $("#examPad").hidden = id !== "exam";
  $("#glossPad").hidden = id !== "glossary";
  $("#ethicsPad").hidden = id !== "ethics";
  $("#progPad").hidden = true;
  if (id === "learn") showLearn();
  if (id === "quiz") showQuiz();
  if (id === "exam") showExam();
  if (id === "glossary") showGlossary();
  if (id === "ethics") showEthics();
  renderProgress();
}

window.addEventListener("goto", (e) => enter(e.detail));

sim.addEventListener("pointerdown", (e) => {
  if (TEXT.has(scene) || scene === "intro") return;
  e.preventDefault();
  e.stopPropagation();
  pointer("down", e);
  try { sim.setPointerCapture(e.pointerId); } catch {}
});
sim.addEventListener("pointermove", (e) => {
  if (TEXT.has(scene)) return;
  pointer("move", e);
});
sim.addEventListener("pointerup", (e) => {
  if (TEXT.has(scene)) return;
  e.stopPropagation();
  pointer("up", e);
});
sim.addEventListener("wheel", (e) => {
  if (TEXT.has(scene) || scene === "intro") return;
  e.preventDefault();
  pointer("wheel", { clientX: e.clientX, clientY: e.clientY, delta: e.deltaY });
}, { passive: false });

$("#btnInspect").onclick = (e) => { e.stopPropagation(); audio.click(); setInspect($("#btnInspect").classList.toggle("on")); };
$("#btnHint").onclick = (e) => { e.stopPropagation(); audio.click(); hint(); };
$("#btnProc").onclick = (e) => { e.stopPropagation(); audio.click(); procedure(); };
$("#btnNote").onclick = (e) => { e.stopPropagation(); audio.click(); $("#notebook").hidden = !$("#notebook").hidden; NB.render(); };
$("#btnProg").onclick = (e) => { e.stopPropagation(); audio.click(); $("#progPad").hidden = !$("#progPad").hidden; renderProgress(); };
$("#btnSound").onclick = (e) => {
  e.stopPropagation();
  const on = audio.toggle();
  $("#btnSound").textContent = on ? "Sound on" : "Sound";
  $("#btnSound").classList.toggle("on", on);
};
$("#btnReset").onclick = (e) => { e.stopPropagation(); audio.click(); resetActive(); };

bindLearnUi();

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "TEXTAREA") return;
  if (e.key === "Escape" && scene === "intro") { skipIntro(); $("#enter").hidden = false; }
  if (scene === "learn" && (e.key === "ArrowRight" || e.key === "ArrowDown")) { e.preventDefault(); learnDelta(1); }
  if (scene === "learn" && (e.key === "ArrowLeft" || e.key === "ArrowUp")) { e.preventDefault(); learnDelta(-1); }
  if (scene === "ethics" && (e.key === "ArrowRight" || e.key === "ArrowDown")) { e.preventDefault(); ethDelta(1); }
  if (scene === "ethics" && (e.key === "ArrowLeft" || e.key === "ArrowUp")) { e.preventDefault(); ethDelta(-1); }
});

if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  skipIntro();
  $("#enter").hidden = false;
  $("#introHint").textContent = "Motion reduced. Enter when ready.";
}
