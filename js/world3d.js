import * as THREE from "three";

let renderer, scene, camera, clock;
let cells, points, dna, filaments;
let running = false, introT = 0, introPlaying = true;
let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const look = new THREE.Vector3();
const camPos = new THREE.Vector3(0, 0.2, 16);
const palettes = {
  intro: { fog: 0x04070a, cell: 0x3d8f72, dna: 0xe0c49a },
  lab: { fog: 0x060b12, cell: 0x4a8498, dna: 0x9ec0d0 },
  greenhouse: { fog: 0x051208, cell: 0x3d8a48, dna: 0xd2bc6a },
  bacteria: { fog: 0x05140f, cell: 0x4ab888, dna: 0xe0c87a },
  gene: { fog: 0x0c0816, cell: 0x7a58a0, dna: 0xe0b060 }
};
let pal = palettes.intro;

export function initWorld(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x04070a, 1);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070a, 0.05);
  camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 80);
  camera.position.copy(camPos);
  clock = new THREE.Clock();

  scene.add(new THREE.AmbientLight(0x182820, 1.05));
  const key = new THREE.DirectionalLight(0xf0dcb8, 1.25);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0x5ee0b8, 1.7, 28);
  rim.position.set(-3, -1, 4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xe0c49a, 0.7, 22);
  fill.position.set(5, -2, -3);
  scene.add(fill);

  buildCells();
  buildDust();
  buildDna();
  buildFilaments();

  addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) running = false;
    else start();
  });
  if (reduced) introPlaying = false;
  start();
}

function matCell() {
  return new THREE.MeshPhysicalMaterial({
    color: pal.cell,
    roughness: 0.38,
    metalness: 0.02,
    transmission: 0.55,
    thickness: 1.2,
    transparent: true,
    opacity: 0.82,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35
  });
}

function buildCells() {
  const geo = new THREE.SphereGeometry(1, 32, 24);
  cells = [];
  const n = reduced ? 6 : 14;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, matCell());
    const s = i === 0 ? 1.15 : 0.18 + Math.random() * 0.55;
    m.scale.set(s, s * (0.82 + Math.random() * 0.12), s);
    if (i === 0) m.position.set(0, 0, 0);
    else m.position.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 16);
    if (i > 0) {
      m.material = new THREE.MeshStandardMaterial({
        color: pal.cell, roughness: 0.45, transparent: true, opacity: 0.55
      });
    }
    m.userData = {
      v: new THREE.Vector3((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.008, (Math.random() - 0.5) * 0.01),
      hero: i === 0
    };
    const nuc = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a6a58, roughness: 0.6, emissive: 0x0a2a20, emissiveIntensity: 0.2 })
    );
    nuc.position.set(-0.12, 0.08, 0.2);
    m.add(nuc);
    scene.add(m);
    cells.push(m);
  }
}

function buildDust() {
  const n = reduced ? 80 : 220;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  points = new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.035, color: 0xcfe8d8, transparent: true, opacity: 0.35, depthWrite: false
  }));
  scene.add(points);
}

function helixPts(turns, r, h, phase) {
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    const a = u * Math.PI * 2 * turns + phase;
    pts.push(new THREE.Vector3(Math.cos(a) * r, (u - 0.5) * h, Math.sin(a) * r));
  }
  return pts;
}

function buildDna() {
  const g1 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts(4, 0.22, 1.6, 0)), 80, 0.018, 6, false);
  const g2 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts(4, 0.22, 1.6, Math.PI)), 80, 0.018, 6, false);
  const mat = new THREE.MeshStandardMaterial({ color: pal.dna, roughness: 0.35, metalness: 0.15 });
  const a = new THREE.Mesh(g1, mat);
  const b = new THREE.Mesh(g2, mat);
  dna = new THREE.Group();
  dna.add(a, b);
  dna.position.set(0.15, 0.05, 0.15);
  dna.scale.setScalar(0.55);
  dna.visible = false;
  scene.add(dna);
}

function buildFilaments() {
  filaments = [];
  for (let i = 0; i < 5; i++) {
    const pts = [];
    for (let k = 0; k < 8; k++) {
      pts.push(new THREE.Vector3((k - 4) * 1.4, Math.sin(k + i) * 0.8, -6 - i * 1.2));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x2a4a40, transparent: true, opacity: 0.22 })
    );
    scene.add(line);
    filaments.push(line);
  }
}

function onResize() {
  if (!renderer) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
}

export function setWorld(name) {
  pal = palettes[name] || palettes.lab;
  scene.fog.color.setHex(pal.fog);
  renderer.setClearColor(pal.fog, 1);
  cells.forEach((c) => { if (c.material) c.material.color.setHex(pal.cell); });
}

export function playIntro() {
  introT = 0;
  introPlaying = !reduced;
  dna.visible = false;
  camera.position.set(0, 0.25, 16);
}

export function skipIntro() {
  introPlaying = false;
  camera.position.set(0, 0.2, 9);
}

export function start() {
  if (running) return;
  running = true;
  loop();
}

export function stop() { running = false; }

function loop() {
  if (!running) return;
  const dt = Math.min(0.033, clock.getDelta());
  introT += dt;
  cells.forEach((c) => {
    if (!c.userData.hero) {
      c.position.addScaledVector(c.userData.v, 1);
      if (Math.abs(c.position.x) > 10) c.userData.v.x *= -1;
      if (Math.abs(c.position.y) > 6) c.userData.v.y *= -1;
    } else {
      c.rotation.y += dt * 0.08;
      c.position.y = Math.sin(introT * 0.35) * 0.08;
    }
  });
  points.rotation.y += dt * 0.012;
  dna.rotation.y += dt * 0.25;

  if (introPlaying) {
    if (introT < 3.2) {
      camPos.set(0, 0.2, 16 - introT * 2.4);
      look.set(0, 0, 0);
    } else if (introT < 6.2) {
      const u = (introT - 3.2) / 3;
      camPos.set(lerp(0, 0.35, u), lerp(0.2, 0.05, u), lerp(8.3, 2.1, u));
      look.set(0, 0, 0);
      dna.visible = introT > 5.2;
    } else if (introT < 9) {
      camPos.set(0.32, 0.04, 1.35);
      look.set(0.15, 0.05, 0.1);
      dna.visible = true;
    } else {
      introPlaying = false;
      window.dispatchEvent(new CustomEvent("intro-complete"));
    }
    camera.position.lerp(camPos, 0.045);
    camera.lookAt(look);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function lerp(a, b, t) { return a + (b - a) * t; }
