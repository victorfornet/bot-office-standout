// Standout office customisations — applied on top of the loaded GLB or placeholder.
// Design rule: fewer, better elements; match the polished low-poly style of the original scene.
import * as THREE from 'three';

// ─── shared helpers ─────────────────────────────────────────────────────────

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ─── disco balls on the open-floor ceiling ──────────────────────────────────
// Smooth reflective spheres (SphereGeometry, not Icosahedron) with thin wires.

const DISCO_MAT = new THREE.MeshStandardMaterial({
  color: 0xF0F0F0, metalness: 0.92, roughness: 0.06, envMapIntensity: 1.4, name: 'disco_ball',
});
const WIRE_MAT = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, name: 'disco_wire' });

export function addDiscoBallsToFloor(openTemplate) {
  if (openTemplate.getObjectByName('standout_disco')) return;
  const g = new THREE.Group();
  g.name = 'standout_disco';
  const geo = new THREE.SphereGeometry(1, 24, 16);
  const wireGeo = new THREE.CylinderGeometry(0.004, 0.004, 1, 4);
  const balls = [
    [-5.2, 2.42, -2.8, 0.14], [-3.2, 2.52, -1.2, 0.18], [-1.0, 2.38, -3.5, 0.13],
    [0.8, 2.48, -2.2, 0.16], [2.8, 2.42, -1.8, 0.12], [-4.2, 2.46, 0.6, 0.15],
    [-1.8, 2.44, 1.2, 0.17], [1.2, 2.50, 0.3, 0.13], [3.2, 2.38, -0.8, 0.16],
    [-5.8, 2.48, -4.2, 0.11], [0.2, 2.42, -4.8, 0.14], [-2.8, 2.54, -4.2, 0.12],
  ];
  for (const [x, cy, z, r] of balls) {
    const ball = new THREE.Mesh(geo, DISCO_MAT);
    ball.position.set(x, cy, z);
    ball.scale.setScalar(r);
    g.add(ball);
    const h = 2.7 - cy + r;
    const wire = new THREE.Mesh(wireGeo, WIRE_MAT);
    wire.position.set(x, cy + h / 2, z);
    wire.scale.y = h;
    g.add(wire);
  }
  openTemplate.add(g);
}

// ─── neon STANDOUT sign on the left wall ────────────────────────────────────

export function addNeonSign(openTemplate) {
  if (openTemplate.getObjectByName('standout_neon')) return;
  const tex = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = 'rgba(0,0,0,0)';
    g.clearRect(0, 0, w, h);
    g.save();
    g.shadowColor = '#34D399'; g.shadowBlur = 24;
    g.fillStyle = '#34D399';
    g.font = 'bold 58px Inter, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('STANDOUT', w / 2, h / 2);
    g.fillText('STANDOUT', w / 2, h / 2);
    g.restore();
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, name: 'neon_sign' });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6).rotateY(Math.PI / 2), mat);
  mesh.name = 'standout_neon';
  mesh.position.set(-7.96, 2.05, 3.5);
  openTemplate.add(mesh);
}

// ─── portrait mural on the right wall ───────────────────────────────────────

export function addPortraitMural(openTemplate) {
  if (openTemplate.getObjectByName('standout_mural')) return;
  const tex = canvasTex(400, 500, (g, w, h) => {
    g.fillStyle = '#0C0C0C'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.38;
    g.fillStyle = '#E0E0E0';
    g.beginPath(); g.ellipse(cx, cy, w * 0.26, h * 0.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111';
    g.beginPath(); g.ellipse(cx, cy - h * 0.12, w * 0.28, h * 0.11, -0.12, Math.PI, 0); g.fill();
    for (const s of [-1, 1]) { g.fillStyle = '#111'; g.beginPath(); g.ellipse(cx + s * w * 0.09, cy - h * 0.01, w * 0.035, h * 0.014, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#E0E0E0'; g.beginPath();
    g.moveTo(cx - w * 0.07, cy + h * 0.18); g.quadraticCurveTo(cx, cy + h * 0.23, cx + w * 0.07, cy + h * 0.18);
    g.lineTo(cx + w * 0.32, cy + h * 0.42); g.lineTo(cx - w * 0.32, cy + h * 0.42); g.fill();
    const vg = g.createRadialGradient(cx, cy, w * 0.18, cx, cy, w * 0.58);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, name: 'mural' });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), mat);
  mesh.name = 'standout_mural';
  mesh.position.set(7.96, 1.4, 2.2);
  mesh.rotation.y = -Math.PI / 2;
  openTemplate.add(mesh);
}

// ─── exterior facade ────────────────────────────────────────────────────────
// Integrated with the building walls. Ivy is a canvas texture painted onto the
// existing side-wall planes rather than separate cube confetti. The canopy is
// a slim slab attached to the front. No giant logo panel; just a small sign.

export function addExteriorFacade(roofTemplate, scene) {
  if (scene.getObjectByName('standout_facade')) return;
  const facade = new THREE.Group();
  facade.name = 'standout_facade';

  // ── ivy on the existing side walls: a textured plane flush with each wall ──
  // Painted with organic blotches in 2–3 greens, partial coverage, like the photos.
  const ivyTex = makeIvyTexture();
  const ivyMat = new THREE.MeshStandardMaterial({
    map: ivyTex, transparent: true, alphaTest: 0.3, roughness: 0.82,
    side: THREE.FrontSide, name: 'ivy_cover', depthWrite: true,
  });

  for (const side of [-1, 1]) {
    const ivy = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.8), ivyMat);
    ivy.position.set(side * 8.25, 2.6, 0);
    ivy.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    facade.add(ivy);
  }

  // ── canopy: slim grey slab jutting from the front wall ──
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.55, metalness: 0.25, name: 'canopy' });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 1.8), canopyMat);
  canopy.position.set(0, 2.85, 6.9);
  canopy.castShadow = true;
  facade.add(canopy);

  // dark edge strip under canopy
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.4, name: 'canopy_edge' });
  const edge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.035, 1.82), edgeMat);
  edge.position.set(0, 2.85 - 0.05 - 0.017, 6.9);
  facade.add(edge);

  // "411" on the face of the canopy front
  const numTex = canvasTex(192, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#A0A0A0';
    g.font = '500 38px Inter, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('411', w / 2, h / 2);
  });
  const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true, name: 'addr_411' });
  const numMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), numMat);
  numMesh.position.set(0, 2.85 + 0.06, 6.9 + 0.91);
  facade.add(numMesh);

  // ── two slim white columns under canopy ──
  const colMat = new THREE.MeshStandardMaterial({ color: 0xE8E4DC, roughness: 0.65, name: 'column' });
  const colGeo = new THREE.CylinderGeometry(0.1, 0.12, 2.85, 14);
  for (const s of [-1, 1]) {
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(s * 1.4, 2.85 / 2, 6.9);
    facade.add(col);
  }

  // ── small Standout logo sign near entrance (tasteful, not giant) ──
  const logoTex = canvasTex(200, 200, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grad = g.createLinearGradient(w * 0.2, h * 0.1, w * 0.8, h * 0.9);
    grad.addColorStop(0, '#F05A5A'); grad.addColorStop(0.36, '#9F6CEB');
    grad.addColorStop(0.75, '#6CF62C'); grad.addColorStop(1, '#EAFE86');
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
    g.fillStyle = grad; g.fill();
    g.fillStyle = '#FFF'; g.beginPath(); g.arc(w * 0.62, h * 0.36, w * 0.18, 0, Math.PI * 2); g.fill();
  });
  const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false, name: 'entrance_logo' });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), logoMat);
  logo.position.set(1.8, 2.4, 6.92);
  facade.add(logo);

  // ── VERMONT street sign on a pole at the corner ──
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.3, name: 'sign_pole' });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.6, 8), poleMat);
  pole.position.set(-8.6, 1.8, 6.4);
  facade.add(pole);

  const stTex = canvasTex(256, 56, (g, w, h) => {
    g.fillStyle = '#1C5632'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#F0F0F0'; g.lineWidth = 2; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#F0F0F0'; g.font = 'bold 28px Inter, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('VERMONT', w / 2, h / 2);
  });
  const stMat = new THREE.MeshBasicMaterial({ map: stTex, name: 'vermont_sign' });
  const st = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.24), stMat);
  st.position.set(-8.6, 3.5, 6.4);
  st.rotation.y = Math.PI / 4;
  facade.add(st);

  // ── sidewalk: thin strip, matched to building width ──
  const swMat = new THREE.MeshStandardMaterial({ color: 0xC0BAB2, roughness: 0.88, name: 'sidewalk' });
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(17, 2).rotateX(-Math.PI / 2), swMat);
  sw.position.set(0, -0.005, 7.8);
  facade.add(sw);

  scene.add(facade);
}

// ── procedural ivy texture: organic blotches, partial coverage ──────────────
function makeIvyTexture() {
  return canvasTex(512, 384, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const rng = mulberry32(42);
    const greens = ['#3A7744', '#2E6338', '#4A8A52', '#365F3A', '#508E58'];

    // paint ~30 organic blotches of varying size, concentrated bottom-up
    for (let i = 0; i < 34; i++) {
      const cx = rng() * w;
      const cy = h * 0.2 + rng() * h * 0.78; // mostly lower 80%
      const rx = 30 + rng() * 80;
      const ry = 20 + rng() * 60;
      const color = greens[Math.floor(rng() * greens.length)];

      g.save();
      g.translate(cx, cy);
      g.rotate((rng() - 0.5) * 0.6);
      g.fillStyle = color;
      g.globalAlpha = 0.7 + rng() * 0.3;
      g.beginPath();
      // organic blob via multiple overlapping arcs
      for (let j = 0; j < 5; j++) {
        const ox = (rng() - 0.5) * rx * 0.6;
        const oy = (rng() - 0.5) * ry * 0.6;
        const sr = 12 + rng() * Math.min(rx, ry) * 0.7;
        g.moveTo(ox + sr, oy);
        g.arc(ox, oy, sr, 0, Math.PI * 2);
      }
      g.fill();
      g.restore();
    }
    // smaller leaf details
    g.globalAlpha = 0.8;
    for (let i = 0; i < 60; i++) {
      const lx = rng() * w, ly = h * 0.3 + rng() * h * 0.7;
      const lr = 4 + rng() * 12;
      g.fillStyle = greens[Math.floor(rng() * greens.length)];
      g.beginPath(); g.arc(lx, ly, lr, 0, Math.PI * 2); g.fill();
    }
    // top edge: fade to transparent (ivy thins out at the top)
    const topFade = g.createLinearGradient(0, 0, 0, h * 0.35);
    topFade.addColorStop(0, 'rgba(0,0,0,1)');
    topFade.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 1;
    g.fillStyle = topFade;
    g.fillRect(0, 0, w, h * 0.35);
    g.globalCompositeOperation = 'source-over';
  });
}

// ─── GLB material tints ─────────────────────────────────────────────────────

export function tintGlbMaterials(openTemplate) {
  const overrides = {
    sofa: 0x1B3A8C,
    armchair_1: 0xD4A017,
    armchair_2: 0xE88B7A,
    coffee_table: 0xF0ECE5,
  };
  for (const [name, color] of Object.entries(overrides)) {
    const mesh = openTemplate.getObjectByName(name);
    if (!mesh) continue;
    mesh.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) {
        if (m.userData?.bakedName || m.userData?.accent) continue;
        if (!m.map) m.color.set(color);
      }
    });
  }
}

// ─── public API ─────────────────────────────────────────────────────────────

export function applyStandoutTheme(assets, scene) {
  const open = assets.templates.floor_open;
  addDiscoBallsToFloor(open);
  addNeonSign(open);
  addPortraitMural(open);
  tintGlbMaterials(open);
}

export function addFacadeToScene(assets, scene) {
  addExteriorFacade(assets.templates.roof, scene);
}
