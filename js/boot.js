(() => {
  const MODULES = [
    { id: "discover", name: "Discover", env: "cellular" },
    { id: "understand", name: "What is cloning", env: "cellular" },
    { id: "dolly", name: "Dolly 1996", env: "lab" },
    { id: "scnt", name: "SCNT lab", env: "lab" },
    { id: "plant", name: "Plant cloning", env: "greenhouse" },
    { id: "animal", name: "Animal protocol", env: "genetics" },
    { id: "bacteria", name: "Bacterial cloning", env: "bacteria" },
    { id: "transgenic", name: "Transgenic cloning", env: "gene" },
    { id: "compare", name: "Compare methods", env: "lab" },
    { id: "variation", name: "Genetic variation", env: "finale" },
    { id: "ethics", name: "Ethics chamber", env: "ethics" },
    { id: "exam", name: "Exam lab", env: "lab" },
    { id: "challenge", name: "Master challenge", env: "finale" }
  ];

  let current = "discover";
  const nav = document.getElementById("missions");
  nav.innerHTML = `<div class="brand">CLONING LAB</div>` + MODULES.map((m, i) =>
    `<button type="button" data-mod="${m.id}"><span>${String(i + 1).padStart(2, "0")}</span>${m.name}</button>`
  ).join("");

  function openMod(id) {
    current = id;
    const meta = MODULES.find((m) => m.id === id);
    CLONING.World.setEnv(meta.env);
    document.getElementById("hudTitle").textContent = meta.name;
    document.getElementById("hudKicker").textContent = "4BI1 · " + meta.env;
    CLONING.$$(".mod").forEach((el) => el.classList.toggle("on", el.dataset.mod === id));
    CLONING.$$(".missions button").forEach((b) => b.classList.toggle("on", b.dataset.mod === id));
    if (id === "scnt") { CLONING.SCNTLab.start(); CLONING.SCNTLab.size(); }
    else CLONING.SCNTLab.running = false;
    if (id === "dolly") { CLONING.DollyLab.start(); CLONING.DollyLab.size(); }
    else CLONING.DollyLab.running = false;
    if (id === "plant") {
      CLONING.PlantLab.start();
      if (CLONING.PlantLab.plated && !CLONING.PlantLab.timer) {
        CLONING.PlantLab.timer = setInterval(() => CLONING.PlantLab.tickDay(), 1100);
      }
    } else {
      CLONING.PlantLab.running = false;
      clearInterval(CLONING.PlantLab.timer);
      CLONING.PlantLab.timer = null;
    }
    if (id === "transgenic") CLONING.TransgenicLab.start();
    else CLONING.TransgenicLab.running = false;
    if (id === "bacteria") CLONING.BacteriaLab.draw();
    else CLONING.BacteriaLab.pause();
    if (id === "understand") requestAnimationFrame(startExplain);
    if (id === "discover") drawHero();
    if (id === "variation") drawVar();
    if (id === "exam") showExam();
    if (id === "ethics") showEth();
    if (id === "challenge") refreshMaster();
    CLONING.NB.key = id === "plant" ? "plant" : id === "bacteria" ? "bac" : id === "transgenic" ? "tg" : id === "dolly" ? "dolly" : "scnt";
    CLONING.NB.render();
  }

  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mod]");
    if (b) openMod(b.dataset.mod);
  });
  document.querySelectorAll(".go[data-mod]").forEach((b) => {
    b.addEventListener("click", (e) => { e.stopPropagation(); openMod(b.dataset.mod); });
  });

  CLONING.World.init();
  CLONING.Log.init();
  CLONING.DollyLab.mount();
  CLONING.SCNTLab.mount();
  CLONING.PlantLab.mount();
  CLONING.BacteriaLab.mount();
  CLONING.TransgenicLab.mount();
  CLONING.AnimalDecisions.mount();

  const saved = CLONING.store.load();
  if (saved.done) Object.assign(CLONING.done, saved.done);

  const pulse = document.getElementById("pulsePad");
  let hold;
  pulse.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (pulse.disabled) return;
    let n = 0;
    hold = setInterval(() => {
      n += 5;
      pulse.querySelector("i").style.width = n + "%";
      if (n >= 100) { clearInterval(hold); CLONING.SCNTLab.activate(); document.getElementById("scntExam").hidden = false; }
    }, 40);
  });
  pulse.addEventListener("pointerup", () => clearInterval(hold));
  document.getElementById("scntReset").onclick = (e) => { e.stopPropagation(); CLONING.SCNTLab.reset(); document.getElementById("scntExam").hidden = true; };
  document.getElementById("divPlay").onclick = (e) => { e.stopPropagation(); if (CLONING.SCNTLab.state === "DIVIDING" || CLONING.SCNTLab.state === "ACTIVATE") { CLONING.SCNTLab.playing = true; } };
  document.getElementById("divPause").onclick = (e) => { e.stopPropagation(); CLONING.SCNTLab.playing = false; };
  document.querySelectorAll("[data-spd]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); CLONING.SCNTLab.speed = Number(b.dataset.spd); });
  document.querySelectorAll("[data-animal]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); CLONING.SCNTLab.pickAnimal(b.dataset.animal); });
  document.getElementById("scntInspect").onchange = (e) => { CLONING.SCNTLab.inspect = e.target.checked; };
  document.getElementById("implantBtn").onclick = (e) => { e.stopPropagation(); CLONING.SCNTLab.implant(); };
  document.getElementById("envA").oninput = (e) => { CLONING.SCNTLab.envA = Number(e.target.value); pheno(); };
  document.getElementById("envB").oninput = (e) => { CLONING.SCNTLab.envB = Number(e.target.value); pheno(); };
  function pheno() {
    const a = CLONING.SCNTLab.envA, b = CLONING.SCNTLab.envB;
    document.getElementById("phenoRead").textContent = a === b
      ? "Same genes, same environment — phenotypes match closely."
      : "Nuclear DNA still matches the donor. Environment B changed the clone’s phenotype.";
  }
  function review(key) {
    const titles = { scnt: "SCNT", plant: "Plant tissue culture", bac: "Bacterial cloning", tg: "Transgenic cloning", dolly: "Dolly 1996" };
    const card = document.getElementById("reviewCard");
    document.getElementById("reviewBody").textContent =
      titles[key] + "\n\nObjective / observations\n" + (CLONING.NB.summary(key) || "No notes.");
    card.hidden = false;
  }
  document.getElementById("scntReview").onclick = (e) => { e.stopPropagation(); review("scnt"); };
  document.getElementById("dollyReview").onclick = (e) => { e.stopPropagation(); review("dolly"); };
  document.getElementById("dollyInspect").onchange = (e) => { CLONING.DollyLab.inspect = e.target.checked; };
  document.getElementById("dollyReset").onclick = (e) => {
    e.stopPropagation();
    CLONING.DollyLab.reset();
    document.getElementById("dollyExam").hidden = true;
  };
  const dPulse = document.getElementById("dollyPulse");
  let dHold;
  dPulse.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (dPulse.disabled) return;
    let n = 0;
    dHold = setInterval(() => {
      n += 5;
      dPulse.querySelector("i").style.width = n + "%";
      if (n >= 100) { clearInterval(dHold); CLONING.DollyLab.activate(); }
    }, 40);
  });
  dPulse.addEventListener("pointerup", () => clearInterval(dHold));
  document.getElementById("plantReview").onclick = (e) => { e.stopPropagation(); review("plant"); };
  document.getElementById("bacReview").onclick = (e) => { e.stopPropagation(); review("bac"); };
  document.getElementById("tgReview").onclick = (e) => { e.stopPropagation(); review("tg"); };
  document.getElementById("reviewClose").onclick = () => { document.getElementById("reviewCard").hidden = true; };

  document.getElementById("plantCut").onclick = (e) => { e.stopPropagation(); CLONING.PlantLab.doCut(); };
  document.getElementById("plantSterile").onclick = (e) => { e.stopPropagation(); CLONING.PlantLab.doSterile(); };
  document.getElementById("plantPlate").onclick = (e) => { e.stopPropagation(); CLONING.PlantLab.doPlate(); };
  document.getElementById("plantXfer").onclick = (e) => { e.stopPropagation(); CLONING.PlantLab.doXfer(); };
  document.getElementById("plantReset").onclick = (e) => { e.stopPropagation(); CLONING.PlantLab.reset(); };
  document.getElementById("plantInspectOn").onchange = (e) => { CLONING.PlantLab.inspect = e.target.checked; };

  document.getElementById("bacStart").onclick = (e) => { e.stopPropagation(); CLONING.BacteriaLab.begin(); };
  document.getElementById("bacPause").onclick = (e) => { e.stopPropagation(); CLONING.BacteriaLab.pause(); };
  document.getElementById("bacReset").onclick = (e) => { e.stopPropagation(); CLONING.BacteriaLab.reset(); };
  document.getElementById("bacInspectOn").onchange = (e) => { CLONING.BacteriaLab.inspect = e.target.checked; };
  document.querySelectorAll("[data-bacview]").forEach((b) => b.onclick = (e) => {
    e.stopPropagation();
    CLONING.BacteriaLab.view = b.dataset.bacview;
    CLONING.BacteriaLab.draw();
  });
  document.getElementById("bacNut").oninput = (e) => { CLONING.BacteriaLab.nut = Number(e.target.value); };
  document.getElementById("bacTemp").oninput = (e) => { CLONING.BacteriaLab.temp = Number(e.target.value); };

  document.getElementById("tgCut").onclick = (e) => { e.stopPropagation(); CLONING.TransgenicLab.isolate(); };
  document.getElementById("tgInsert").onclick = (e) => { e.stopPropagation(); CLONING.TransgenicLab.insert(); };
  document.getElementById("tgClone").onclick = (e) => { e.stopPropagation(); CLONING.TransgenicLab.cloneHost(); };
  document.getElementById("tgReset").onclick = (e) => { e.stopPropagation(); CLONING.TransgenicLab.reset(); };
  document.getElementById("tgInspectOn").onchange = (e) => { CLONING.TransgenicLab.inspect = e.target.checked; };

  document.querySelectorAll("[data-side]").forEach((b) => b.onclick = (e) => {
    e.stopPropagation();
    const nb = b.dataset.side === "nb";
    document.getElementById("log").hidden = nb;
    document.getElementById("notebook").hidden = !nb;
    document.getElementById("sideKicker").textContent = nb ? "Lab notebook" : "Experiment log";
    CLONING.NB.render();
  });

  function cell(canvas, glow, split) {
    const r = canvas.getBoundingClientRect();
    const ctx = CLONING.fit(canvas, r.width, r.height);
    const w = r.width, h = r.height, t = performance.now() / 800;
    ctx.clearRect(0, 0, w, h);
    const drawOne = (x, y, R, lit) => {
      ctx.beginPath(); ctx.ellipse(x, y, R * (1 + Math.sin(t) * 0.02), R * 0.88, 0, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(x - 20, y - 20, 8, x, y, R);
      g.addColorStop(0, "rgba(190,255,220,0.45)");
      g.addColorStop(1, "rgba(10,40,30,0.9)");
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "rgba(140,230,190,0.5)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(x - 8, y - 6, R * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = lit ? "rgba(80,220,170,0.85)" : "rgba(100,80,200,0.75)"; ctx.fill();
    };
    const R = Math.min(w, h) * (split > 0.5 ? 0.22 : 0.32);
    if (split > 0.15) {
      drawOne(w * 0.32, h / 2, R, true);
      drawOne(w * 0.68, h / 2, R, true);
      ctx.fillStyle = "#7ee0b8"; ctx.font = "13px Manrope"; ctx.textAlign = "center";
      ctx.fillText("Mitosis · two cells, one genome", w / 2, h - 18);
      ctx.textAlign = "start";
    } else drawOne(w / 2, h / 2, Math.min(w, h) * 0.32, glow);
  }
  let heroRaf, heroSplit = 0;
  function drawHero() {
    const c = document.getElementById("liveCell");
    let last = 0;
    const loop = (now) => {
      if (current !== "discover") return;
      if (now - last > 40) { last = now; cell(c, true, heroSplit); }
      heroRaf = requestAnimationFrame(loop);
    };
    loop(0);
  }
  document.getElementById("liveCell").addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    heroSplit = heroSplit > 0.5 ? 0 : 1;
    CLONING.Log.push(heroSplit ? "Mitosis: nuclear DNA copied into two cells" : "Single parent cell");
    CLONING.toast(heroSplit ? "You split the cell. Both nuclei match." : "One cell again. Click to divide.", "ok");
  });
  let explainRaf, explainT = 0, explainCopy = 0, explainMode = "dna";
  let explainNuc = { x: 0, y: 0, grab: false, parked: false };
  function startExplain() {
    const c = document.getElementById("explainCanvas");
    if (!c) return;
    if (!c._ex) {
      c._ex = true;
      c.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        const r = c.getBoundingClientRect();
        const p = { x: e.clientX - r.left, y: e.clientY - r.top };
        if (Math.hypot(p.x - explainNuc.x, p.y - explainNuc.y) < 28) {
          explainNuc.grab = true;
          c.setPointerCapture(e.pointerId);
          c.style.cursor = "grabbing";
        }
      });
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        const p = { x: e.clientX - r.left, y: e.clientY - r.top };
        if (explainNuc.grab) { explainNuc.x = p.x; explainNuc.y = p.y; }
        else c.style.cursor = Math.hypot(p.x - explainNuc.x, p.y - explainNuc.y) < 28 ? "grab" : "crosshair";
      });
      c.addEventListener("pointerup", () => {
        if (!explainNuc.grab) return;
        explainNuc.grab = false;
        const r = c.getBoundingClientRect();
        const right = r.width * 0.72, y = r.height * 0.52;
        if (Math.hypot(explainNuc.x - right, explainNuc.y - y) < 50) {
          explainCopy = 1;
          explainNuc.parked = true;
          explainNuc.x = right - 6; explainNuc.y = y - 6;
          document.getElementById("explainCap").textContent = "Nuclear DNA copied. The clone matches the parent genome.";
          CLONING.Log.push("Clone: same nuclear DNA, produced by mitosis");
          CLONING.audio.ok();
        } else {
          explainNuc.x = r.width * 0.28 - 6;
          explainNuc.y = r.height * 0.52 - 6;
          CLONING.toast("Drop the nucleus into the empty cell on the right.", "warn");
        }
      });
    }
    const r = c.getBoundingClientRect();
    if (!explainNuc.parked) { explainNuc.x = r.width * 0.28 - 6; explainNuc.y = r.height * 0.52 - 6; }
    let last = 0;
    const loop = (now) => {
      if (current !== "understand") return;
      if (now - last > 32 || explainNuc.grab) {
        last = now;
        explainT += 0.03;
        drawExplain(c);
      }
      explainRaf = requestAnimationFrame(loop);
    };
    loop(0);
  }
  function drawExplain(canvas) {
    const r = canvas.getBoundingClientRect();
    const ctx = CLONING.fit(canvas, r.width, r.height);
    const w = r.width, h = r.height, t = explainT;
    if (!w) return;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, w * 0.55);
    g.addColorStop(0, "rgba(30,70,60,0.35)");
    g.addColorStop(1, "rgba(4,12,14,0.2)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const left = w * 0.28, right = w * 0.72, y = h * 0.52;
    function organ(x, y, lit, empty) {
      const R = Math.min(w, h) * 0.16;
      ctx.beginPath();
      ctx.ellipse(x, y, R, R * 0.86, 0, 0, Math.PI * 2);
      const rg = ctx.createRadialGradient(x - 18, y - 16, 8, x, y, R);
      rg.addColorStop(0, "rgba(190,255,220,0.5)");
      rg.addColorStop(1, "rgba(10,40,30,0.92)");
      ctx.fillStyle = rg; ctx.fill();
      ctx.strokeStyle = empty ? "rgba(126,224,184,0.85)" : "rgba(140,230,190,0.55)";
      ctx.lineWidth = empty ? 3 : 2; ctx.stroke();
      if (!empty) {
        ctx.beginPath(); ctx.ellipse(x - 6, y - 6, R * 0.28, R * 0.24, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = lit ? "rgba(80,220,170,0.9)" : "rgba(90,70,190,0.8)"; ctx.fill();
      }
    }
    organ(left, y, true, false);
    organ(right, y, explainCopy > 0.9, explainCopy < 0.9);
    ctx.fillStyle = "#9bb5ab"; ctx.font = "12px Manrope"; ctx.textAlign = "center";
    ctx.fillText("PARENT", left, y + Math.min(w, h) * 0.16 + 18);
    ctx.fillText(explainCopy > 0.9 ? "CLONE · same nuclear DNA" : "EMPTY CELL", right, y + Math.min(w, h) * 0.16 + 18);
    ctx.beginPath(); ctx.arc(explainNuc.x, explainNuc.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(80,220,170,0.95)"; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.textAlign = "start";
  }
  document.getElementById("explainPlay").onclick = (e) => {
    e.stopPropagation();
    explainCopy = 0;
    explainNuc.parked = false;
    const c = document.getElementById("explainCanvas");
    const r = c.getBoundingClientRect();
    explainNuc.x = r.width * 0.28 - 6; explainNuc.y = r.height * 0.52 - 6;
    document.getElementById("explainCap").textContent = "Drag the green nucleus into the empty cell on the right";
  };
  document.querySelectorAll("[data-ex]").forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      explainMode = b.dataset.ex;
      document.querySelectorAll("[data-ex]").forEach((x) => x.classList.toggle("on", x === b));
      const cap = {
        dna: "Nuclear DNA is what a clone copies. Drag the green nucleus into the empty cell.",
        mito: "Mitosis: chromosomes duplicate and separate. No fertilisation.",
        pheno: "The clone can still look different if its environment differs.",
        kinds: "Natural or artificial — the genetic idea is the same: mitosis copies the genome."
      };
      document.getElementById("explainCap").textContent = cap[explainMode];
    };
  });

  const cmp = {
    plant: "Plants: explant → sterilise → in vitro medium → callus / plantlets. Many adult cells stay totipotent.",
    animal: "Mammals: somatic diploid nucleus → enucleated egg → activate → embryo → surrogate. Adult cells are not totipotent.",
    bac: "Bacteria: DNA replicates, cell elongates, septum forms, two descendants. A colony is a clone of the founder."
  };
  document.querySelectorAll("[data-c]").forEach((b) => b.onclick = (e) => {
    e.stopPropagation();
    document.getElementById("cmpOut").textContent = cmp[b.dataset.c];
  });

  const orgs = Array.from({ length: 50 }, (_, i) => ({ x: Math.random(), y: Math.random(), t: i % 5 }));
  function drawVar() {
    const c = document.getElementById("varCanvas");
    const ctx = c.getContext("2d");
    const r = c.getBoundingClientRect();
    c.width = r.width * devicePixelRatio; c.height = 220 * devicePixelRatio;
    c.style.height = "220px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    const clone = Number(document.getElementById("varAmt").value) / 100;
    const stress = document.getElementById("varStress").dataset.on === "1";
    ctx.clearRect(0, 0, r.width, 220);
    const cols = ["#7ee0b8", "#8b7cff", "#e8b56a", "#7eb6ff", "#ff6b57"];
    orgs.forEach((o, i) => {
      const cloned = (i / orgs.length) < clone;
      const type = cloned ? 0 : o.t;
      ctx.beginPath(); ctx.arc(20 + o.x * (r.width - 40), 20 + o.y * 180, 7, 0, Math.PI * 2);
      ctx.fillStyle = stress && type !== 2 ? "rgba(80,80,90,.3)" : cols[type];
      ctx.fill();
    });
    document.getElementById("varRead").textContent = stress
      ? "A change hits. Copies of one genome fail together. Residual variants may survive."
      : "Raise cloning: the cloud becomes one colour — less variation.";
  }
  document.getElementById("varAmt").oninput = () => drawVar();
  document.getElementById("varStress").onclick = (e) => {
    e.stopPropagation();
    e.currentTarget.dataset.on = e.currentTarget.dataset.on === "1" ? "0" : "1";
    drawVar();
  };

  const ETH = [
    { q: "An endangered species has 12 individuals left. Use cloning?", yes: "May raise numbers from stored cells. Habitat and diversity still missing.", no: "Clones share one genome; a disease can finish them. Conservation of place matters more.", unsure: "A tool, not a substitute for ecosystems." },
    { q: "Clone a transgenic animal that secretes a human protein?", yes: "Keeps the useful gene; breeding might lose it.", no: "Welfare cost of failed embryos is high.", unsure: "Depends on regulation and suffering versus medical gain." },
    { q: "Reproductively clone a human?", yes: "Some argue autonomy. Safety data do not support it.", no: "Banned widely. Failure rates and identity/consent problems.", unsure: "Therapeutic vs reproductive cloning are not the same question." }
  ];
  let ei = 0;
  function showEth() {
    document.getElementById("ethQ").textContent = ETH[ei % ETH.length].q;
    document.getElementById("ethA").textContent = "Choose. The chamber shows trade-offs, not a verdict.";
  }
  document.querySelectorAll("[data-eth]").forEach((b) => b.onclick = (e) => {
    e.stopPropagation();
    const item = ETH[ei % ETH.length];
    document.getElementById("ethA").textContent = item[b.dataset.eth === "yes" ? "yes" : b.dataset.eth === "no" ? "no" : "unsure"];
  });
  document.getElementById("ethNext").onclick = (e) => { e.stopPropagation(); ei++; showEth(); };

  let qi = 0;
  function showExam() {
    const item = CLONING.EXAM[qi % CLONING.EXAM.length];
    document.getElementById("exQ").textContent = item.q;
    document.getElementById("exMarks").textContent = item.marks + " mark question";
    document.getElementById("exAns").value = "";
    document.getElementById("exScheme").hidden = true;
  }
  document.getElementById("exMark").onclick = (e) => {
    e.stopPropagation();
    const item = CLONING.EXAM[qi % CLONING.EXAM.length];
    const r = CLONING.markExam(item, document.getElementById("exAns").value);
    const s = document.getElementById("exScheme");
    s.hidden = false;
    s.textContent = `${r.awarded}/${item.marks} — ${item.scheme}`;
  };
  document.getElementById("exNext").onclick = (e) => { e.stopPropagation(); qi++; showExam(); };

  const SCENARIOS = [
    { q: "Produce many genetically identical plants that keep a desirable characteristic.", method: "plant", lab: "plant" },
    { q: "Produce a genetically identical animal from a selected adult donor.", method: "scnt", lab: "scnt" },
    { q: "Rapidly reproduce a bacterial population from one cell.", method: "bac", lab: "bacteria" },
    { q: "You need an organism that contains a gene from another species, then copy it.", method: "tg", lab: "transgenic" }
  ];
  let si = 0, methodOk = false, methodMiss = 0, chPicked = null;
  function refreshMaster() {
    const n = Object.values(CLONING.done).filter(Boolean).length;
    document.getElementById("masterLock").hidden = n >= 4;
    document.getElementById("masterPlay").hidden = n < 4;
    document.getElementById("chQ").textContent = SCENARIOS[si % SCENARIOS.length].q;
  }
  document.querySelectorAll("[data-ch]").forEach((b) => b.onclick = (e) => {
    e.stopPropagation();
    const sc = SCENARIOS[si % SCENARIOS.length];
    chPicked = b.dataset.ch;
    if (chPicked !== sc.method) {
      methodOk = false;
      methodMiss += 1;
      document.getElementById("chOut").textContent = "That method does not match this biological problem. Choose again.";
      CLONING.audio.bad();
      return;
    }
    methodOk = true;
    document.getElementById("chOut").textContent = "Method correct. Execute it in the lab, then return here and submit.";
    openMod(sc.lab);
  });
  document.getElementById("chSubmit").onclick = (e) => {
    e.stopPropagation();
    const sc = SCENARIOS[si % SCENARIOS.length];
    if (!methodOk) {
      document.getElementById("chOut").textContent = "Select the correct method first.";
      return;
    }
    const ok =
      (sc.method === "scnt" && CLONING.SCNTLab.state === "COMPARE") ||
      (sc.method === "plant" && CLONING.PlantLab.transferred) ||
      (sc.method === "bac" && CLONING.BacteriaLab.n >= 32) ||
      (sc.method === "tg" && CLONING.TransgenicLab.cloned);
    const mistakes =
      sc.method === "scnt" ? CLONING.SCNTLab.mistakes :
      sc.method === "plant" ? (CLONING.PlantLab.contam ? 2 : 0) : 0;
    const box = document.getElementById("mastery");
    box.hidden = false;
    box.innerHTML = `<p class="kicker">Biotechnology mastery</p>
      <p><b>Method:</b> ${methodOk ? "correct" : "incorrect"} · misses ${methodMiss}</p>
      <p><b>Procedure:</b> ${ok ? "completed" : "incomplete"}</p>
      <p><b>Accuracy:</b> ${Math.max(0, 100 - mistakes * 8 - methodMiss * 12)}%</p>
      <p>${ok ? "The biological outcome matches the scenario." : "Return to the lab and finish the procedure."}</p>`;
    if (ok) {
      si += 1;
      methodOk = false;
      document.getElementById("chQ").textContent = SCENARIOS[si % SCENARIOS.length].q;
      document.getElementById("chOut").textContent = si % 4 === 0
        ? "Four scenarios complete. Review the breakdown, then keep practising."
        : "Next scenario loaded.";
    }
  };

  document.getElementById("expert").onchange = (e) => document.body.classList.toggle("expert", e.target.checked);
  document.getElementById("soundBtn").onclick = () => {
    const on = CLONING.audio.toggle();
    document.getElementById("soundBtn").textContent = on ? "Sound on" : "Sound off";
  };

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    const i = MODULES.findIndex((m) => m.id === current);
    if (e.key === "ArrowRight" && i < MODULES.length - 1) openMod(MODULES[i + 1].id);
    if (e.key === "ArrowLeft" && i > 0) openMod(MODULES[i - 1].id);
  });

  openMod("discover");
  CLONING.Log.push("Laboratory online");
})();
