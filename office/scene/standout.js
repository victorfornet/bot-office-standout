// Standout office — 411 Vermont loft theme.
// Applied after GLB/placeholder loads. Cohesive low-poly style.
import * as THREE from 'three';
import { SLAB, OPEN_H } from './office.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function rng(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function box(parent, mat, w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); parent.add(m); return m;
}
function cyl(parent, mat, rt, rb, h, x, y, z, s = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat);
  m.position.set(x, y, z); parent.add(m); return m;
}
function plane(parent, mat, w, h, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
}

// ─── materials ──────────────────────────────────────────────────────────────

const M = {
  disco: new THREE.MeshStandardMaterial({ color: 0xF2F2F2, metalness: 0.94, roughness: 0.04, envMapIntensity: 1.6, name: 'disco' }),
  wire: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, name: 'wire' }),
  canopy: new THREE.MeshStandardMaterial({ color: 0x7A7A7A, roughness: 0.5, metalness: 0.3, name: 'canopy' }),
  canopyEdge: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.35, metalness: 0.4, name: 'canopy_edge' }),
  column: new THREE.MeshStandardMaterial({ color: 0xEAE6DE, roughness: 0.6, name: 'column' }),
  pole: new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.45, metalness: 0.35, name: 'pole' }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0xBEB8B0, roughness: 0.9, name: 'sidewalk' }),
  darkFloor: new THREE.MeshStandardMaterial({ color: 0x3D2E22, roughness: 0.7, transparent: true, opacity: 0.3, depthWrite: false, name: 'dark_floor_overlay' }),
  curtainFabric: new THREE.MeshStandardMaterial({ color: 0x6E7078, roughness: 0.92, side: THREE.DoubleSide, name: 'curtain' }),
};

// ═══════════════════════════════════════════════════════════════════════════
//  INTERIOR
// ═══════════════════════════════════════════════════════════════════════════

// ── disco balls ─────────────────────────────────────────────────────────────

export function addDiscoBallsToFloor(open) {
  if (open.getObjectByName('standout_disco')) return;
  const g = new THREE.Group(); g.name = 'standout_disco';
  const sphere = new THREE.SphereGeometry(1, 28, 18);
  const wGeo = new THREE.CylinderGeometry(0.004, 0.004, 1, 4);
  const balls = [
    [-5.2, 2.42, -2.6, 0.15], [-3.0, 2.52, -1.0, 0.19], [-0.8, 2.36, -3.4, 0.14],
    [ 1.0, 2.48, -2.0, 0.17], [ 3.0, 2.40, -1.6, 0.13], [-4.0, 2.46, 0.8, 0.16],
    [-1.6, 2.44, 1.4, 0.18], [ 1.4, 2.50, 0.2, 0.14], [ 3.4, 2.36, -0.6, 0.17],
    [-5.8, 2.48, -4.2, 0.12], [ 0.4, 2.42, -4.6, 0.15], [-2.6, 2.54, -4.0, 0.13],
  ];
  for (const [x, cy, z, r] of balls) {
    const b = new THREE.Mesh(sphere, M.disco);
    b.position.set(x, cy, z); b.scale.setScalar(r); g.add(b);
    const wH = OPEN_H - cy + r;
    const w = new THREE.Mesh(wGeo, M.wire);
    w.position.set(x, cy + wH / 2, z); w.scale.y = wH; g.add(w);
  }
  open.add(g);
}

// ── neon STANDOUT sign on left wall ─────────────────────────────────────────

export function addNeonSign(open) {
  if (open.getObjectByName('standout_neon')) return;
  const tex = canvasTex(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.save(); g.shadowColor = '#34D399'; g.shadowBlur = 28;
    g.fillStyle = '#34D399';
    g.font = 'bold 60px Inter, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('STANDOUT', w / 2, h / 2);
    g.fillText('STANDOUT', w / 2, h / 2);
    g.restore();
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65).rotateY(Math.PI / 2), mat);
  m.name = 'standout_neon'; m.position.set(-7.97, 2.05, 3.4);
  open.add(m);
}

// ── portrait mural on right wall ────────────────────────────────────────────

export function addPortraitMural(open) {
  if (open.getObjectByName('standout_mural')) return;
  const tex = canvasTex(480, 600, (g, w, h) => {
    g.fillStyle = '#080808'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.36;
    // face
    g.fillStyle = '#E2E2E2';
    g.beginPath(); g.ellipse(cx, cy, w * 0.27, h * 0.21, 0, 0, Math.PI * 2); g.fill();
    // hair
    g.fillStyle = '#0E0E0E';
    g.beginPath(); g.ellipse(cx - 2, cy - h * 0.13, w * 0.29, h * 0.12, -0.12, Math.PI, 0); g.fill();
    // eyes
    for (const s of [-1, 1]) {
      g.fillStyle = '#080808'; g.beginPath();
      g.ellipse(cx + s * w * 0.085, cy - h * 0.01, w * 0.04, h * 0.016, s * 0.1, 0, Math.PI * 2); g.fill();
    }
    // brows
    g.strokeStyle = '#0E0E0E'; g.lineWidth = 3;
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(cx + s * w * 0.04, cy - h * 0.045);
      g.quadraticCurveTo(cx + s * w * 0.09, cy - h * 0.06, cx + s * w * 0.13, cy - h * 0.04);
      g.stroke();
    }
    // nose
    g.strokeStyle = '#AAA'; g.lineWidth = 1.5; g.beginPath();
    g.moveTo(cx, cy + h * 0.015); g.quadraticCurveTo(cx + 8, cy + h * 0.06, cx, cy + h * 0.07); g.stroke();
    // lips
    g.fillStyle = '#444'; g.beginPath();
    g.ellipse(cx, cy + h * 0.1, w * 0.055, h * 0.012, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#333'; g.beginPath();
    g.ellipse(cx, cy + h * 0.1, w * 0.045, h * 0.008, 0, Math.PI, 0); g.fill();
    // neck + shoulders
    g.fillStyle = '#E2E2E2'; g.beginPath();
    g.moveTo(cx - w * 0.06, cy + h * 0.19);
    g.quadraticCurveTo(cx, cy + h * 0.23, cx + w * 0.06, cy + h * 0.19);
    g.lineTo(cx + w * 0.4, cy + h * 0.48); g.lineTo(cx - w * 0.4, cy + h * 0.48); g.fill();
    // dramatic vignette
    const vg = g.createRadialGradient(cx, cy + h * 0.05, w * 0.15, cx, cy + h * 0.05, w * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.7, 'rgba(0,0,0,0.4)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), mat);
  m.name = 'standout_mural'; m.position.set(7.97, 1.45, 2.2); m.rotation.y = -Math.PI / 2;
  open.add(m);
}

// ── dark wood floor overlay (darkens the baked floor toward walnut) ─────────

export function addFloorOverlay(open) {
  if (open.getObjectByName('standout_floor')) return;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(15.8, 11.8).rotateX(-Math.PI / 2), M.darkFloor);
  m.name = 'standout_floor'; m.position.y = 0.003; m.renderOrder = -2;
  open.add(m);
}

// ── long curtains at the glass wall (z = -6) ───────────────────────────────

export function addCurtains(open) {
  if (open.getObjectByName('standout_curtains')) return;
  const g = new THREE.Group(); g.name = 'standout_curtains';
  const cH = 2.55;
  // thin fabric panels flanking each 2m window bay, slight folds via width variation
  for (let wx = -7; wx <= 7; wx += 2) {
    for (const dx of [-0.88, 0.88]) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.7, cH), M.curtainFabric);
      panel.position.set(wx + dx, cH / 2 + 0.08, -5.94);
      g.add(panel);
    }
  }
  open.add(g);
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXTERIOR FACADE
// ═══════════════════════════════════════════════════════════════════════════

export function addExteriorFacade(roofTemplate, scene) {
  if (scene.getObjectByName('standout_facade')) return;
  const facade = new THREE.Group(); facade.name = 'standout_facade';

  // ── white brick side walls with dark-framed industrial windows ────────────
  const wallTex = makeBrickWindowTexture();
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.82, name: 'ext_wall', emissive: 0x181818, emissiveIntensity: 0.15 });

  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 5.4), wallMat);
    w.position.set(side * 8.28, 2.7, 0);
    w.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    facade.add(w);
  }

  // ── lush ivy covering lower ~60% of each side wall ────────────────────────
  const ivyTex = makeIvyTexture();
  const ivyMat = new THREE.MeshStandardMaterial({
    map: ivyTex, transparent: true, alphaTest: 0.15, roughness: 0.8,
    side: THREE.FrontSide, depthWrite: true, name: 'ivy',
  });
  for (const side of [-1, 1]) {
    const ivy = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 5.4), ivyMat);
    ivy.position.set(side * 8.26, 2.7, 0);
    ivy.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    facade.add(ivy);
  }

  // ── back wall (behind glass) ──────────────────────────────────────────────
  const backBrickTex = makeBrickTexture();
  const backMat = new THREE.MeshStandardMaterial({ map: backBrickTex, roughness: 0.88, name: 'back_brick' });
  plane(facade, backMat, 16.4, 5.4, 0, 2.7, -6.35);

  // ── canopy: grey slab with dark fascia, attached to front ─────────────────
  box(facade, M.canopy, 3.6, 0.12, 1.6, 0, 2.9, 7.0);
  box(facade, M.canopyEdge, 3.62, 0.04, 1.62, 0, 2.9 - 0.08, 7.0);

  // "411" on canopy fascia (facing viewer)
  const numTex = canvasTex(160, 48, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#B0B0B0';
    g.font = '500 34px Inter, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('411', w / 2, h / 2);
  });
  const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
  plane(facade, numMat, 0.85, 0.26, 0, 2.9 + 0.07, 7.81);

  // ── columns under canopy ──────────────────────────────────────────────────
  for (const s of [-1, 1])
    cyl(facade, M.column, 0.1, 0.13, 2.9, s * 1.5, 2.9 / 2, 7.0, 14);

  // ── Standout orb sign near entrance ───────────────────────────────────────
  const logoTex = canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grad = g.createLinearGradient(w * 0.18, h * 0.1, w * 0.82, h * 0.92);
    grad.addColorStop(0, '#F05A5A'); grad.addColorStop(0.36, '#9F6CEB');
    grad.addColorStop(0.75, '#6CF62C'); grad.addColorStop(1, '#EAFE86');
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.44, 0, Math.PI * 2);
    g.fillStyle = grad; g.fill();
    g.fillStyle = '#FFF'; g.beginPath(); g.arc(w * 0.63, h * 0.35, w * 0.19, 0, Math.PI * 2); g.fill();
  });
  const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false });
  plane(facade, logoMat, 0.5, 0.5, 1.9, 2.5, 7.02);

  // ── VERMONT sign on a pole ────────────────────────────────────────────────
  cyl(facade, M.pole, 0.03, 0.03, 3.8, -8.7, 1.9, 6.5, 8);

  const stTex = canvasTex(220, 48, (g, w, h) => {
    g.fillStyle = '#1C5632'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#E8E8E8'; g.lineWidth = 1.5; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#E8E8E8'; g.font = 'bold 24px Inter, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('VERMONT', w / 2, h / 2);
  });
  const stMat = new THREE.MeshBasicMaterial({ map: stTex });
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.21), stMat);
  st.position.set(-8.7, 3.7, 6.5); st.rotation.y = Math.PI / 4; facade.add(st);

  // ── sidewalk ──────────────────────────────────────────────────────────────
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 1.8).rotateX(-Math.PI / 2), M.sidewalk);
  sw.position.set(0, -0.005, 7.9); facade.add(sw);

  scene.add(facade);
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEXTURES
// ═══════════════════════════════════════════════════════════════════════════

// White brick wall with tall dark-framed multi-pane industrial windows
function makeBrickWindowTexture() {
  return canvasTex(768, 512, (g, w, h) => {
    // white painted brick
    g.fillStyle = '#EDE8E0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.05)'; g.lineWidth = 0.8;
    const bh = 6, bw = 14;
    for (let y = 0; y < h; y += bh) {
      const off = (Math.floor(y / bh) % 2) * (bw / 2);
      for (let x = -bw; x < w + bw; x += bw) g.strokeRect(x + off, y, bw, bh);
    }
    // tall windows — 3 bays across the wall, each 2 panes wide × 3 high
    const winY = h * 0.12, winH = h * 0.72, winW = w * 0.18;
    const baySpacing = w / 4;
    const frameC = '#2A3038', glassC = '#C8D4E0', mullion = '#2A3038';
    for (let b = 1; b <= 3; b++) {
      const bx = baySpacing * b - winW;
      // frame
      g.fillStyle = frameC;
      g.fillRect(bx - 3, winY - 3, winW * 2 + 6, winH + 6);
      // glass
      g.fillStyle = glassC;
      g.fillRect(bx, winY, winW * 2, winH);
      // reflection hint
      const refl = g.createLinearGradient(bx, winY, bx + winW * 2, winY + winH);
      refl.addColorStop(0, 'rgba(255,255,255,0.15)'); refl.addColorStop(0.5, 'rgba(255,255,255,0)');
      refl.addColorStop(1, 'rgba(255,255,255,0.08)');
      g.fillStyle = refl; g.fillRect(bx, winY, winW * 2, winH);
      // mullions (dark frames)
      g.fillStyle = mullion;
      g.fillRect(bx + winW - 1.5, winY, 3, winH); // vertical centre
      for (let r = 1; r < 3; r++) g.fillRect(bx, winY + (winH / 3) * r - 1, winW * 2, 2.5); // horizontals
    }
  });
}

// Plain white brick (for back wall)
function makeBrickTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#EDE8E0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.05)'; g.lineWidth = 0.7;
    const bh = 6, bw = 14;
    for (let y = 0; y < h; y += bh) {
      const off = (Math.floor(y / bh) % 2) * (bw / 2);
      for (let x = -bw; x < w + bw; x += bw) g.strokeRect(x + off, y, bw, bh);
    }
  });
}

// Lush organic ivy — dense green coverage fading to nothing at the top,
// with leaf-like shapes and variation in 3+ greens.
function makeIvyTexture() {
  return canvasTex(768, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const r = rng(42);
    const greens = [
      '#2D5E34', '#3A7744', '#4A8A52', '#2A5030', '#508E58',
      '#336B3C', '#3F7F48', '#245228',
    ];

    // base coverage: large overlapping blobs (bottom 80%)
    for (let i = 0; i < 70; i++) {
      const cx = r() * w;
      const cy = h * 0.25 + r() * h * 0.75;
      g.save();
      g.translate(cx, cy);
      g.rotate((r() - 0.5) * 0.8);
      g.fillStyle = greens[Math.floor(r() * greens.length)];
      g.globalAlpha = 0.75 + r() * 0.25;
      g.beginPath();
      const arms = 4 + Math.floor(r() * 4);
      for (let j = 0; j < arms; j++) {
        const ox = (r() - 0.5) * 70;
        const oy = (r() - 0.5) * 50;
        const sr = 18 + r() * 45;
        g.moveTo(ox + sr, oy); g.arc(ox, oy, sr, 0, Math.PI * 2);
      }
      g.fill();
      g.restore();
    }

    // medium detail: leaf clusters
    g.globalAlpha = 0.85;
    for (let i = 0; i < 160; i++) {
      const lx = r() * w, ly = h * 0.2 + r() * h * 0.8;
      const lr = 5 + r() * 16;
      g.fillStyle = greens[Math.floor(r() * greens.length)];
      g.beginPath(); g.arc(lx, ly, lr, 0, Math.PI * 2); g.fill();
    }

    // fine detail: tiny leaves for texture
    g.globalAlpha = 0.7;
    for (let i = 0; i < 300; i++) {
      const lx = r() * w, ly = h * 0.3 + r() * h * 0.7;
      const lr = 2 + r() * 6;
      g.fillStyle = greens[Math.floor(r() * greens.length)];
      g.beginPath(); g.arc(lx, ly, lr, 0, Math.PI * 2); g.fill();
    }

    // highlights and depth: lighter spots
    g.globalAlpha = 0.25;
    for (let i = 0; i < 40; i++) {
      const lx = r() * w, ly = h * 0.35 + r() * h * 0.6;
      g.fillStyle = '#7ACA88';
      g.beginPath(); g.arc(lx, ly, 6 + r() * 20, 0, Math.PI * 2); g.fill();
    }

    // shadow depth: darker spots
    g.globalAlpha = 0.3;
    for (let i = 0; i < 30; i++) {
      const lx = r() * w, ly = h * 0.4 + r() * h * 0.6;
      g.fillStyle = '#1A3A1E';
      g.beginPath(); g.arc(lx, ly, 8 + r() * 25, 0, Math.PI * 2); g.fill();
    }

    // fade to transparent at top (ivy thins out)
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 1;
    const fade = g.createLinearGradient(0, 0, 0, h * 0.45);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(0.6, 'rgba(0,0,0,0.5)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fade; g.fillRect(0, 0, w, h * 0.45);

    // clear around window areas (ivy wraps around windows, not over them)
    // 3 window bays at 25%, 50%, 75% of width, each ~36% wide, in upper portion
    for (let b = 1; b <= 3; b++) {
      const wx = (w / 4) * b, ww = w * 0.14, wy = h * 0.1, wh = h * 0.5;
      const eraseGrad = g.createRadialGradient(wx, wy + wh / 2, Math.min(ww, wh) * 0.6, wx, wy + wh / 2, Math.max(ww, wh) * 1.1);
      eraseGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
      eraseGrad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = eraseGrad; g.fillRect(wx - ww * 1.5, wy - wh * 0.2, ww * 3, wh * 1.4);
    }
    g.globalCompositeOperation = 'source-over';
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  GLB MATERIAL TINTS
// ═══════════════════════════════════════════════════════════════════════════

export function tintGlbMaterials(open) {
  const tints = { sofa: 0x1B3A8C, armchair_1: 0xD4A017, armchair_2: 0xE88B7A, coffee_table: 0xF0ECE5 };
  for (const [name, color] of Object.entries(tints)) {
    const mesh = open.getObjectByName(name);
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

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export function applyStandoutTheme(assets, scene) {
  const open = assets.templates.floor_open;
  addDiscoBallsToFloor(open);
  addNeonSign(open);
  addPortraitMural(open);
  addFloorOverlay(open);
  addCurtains(open);
  tintGlbMaterials(open);
}

export function addFacadeToScene(assets, scene) {
  addExteriorFacade(assets.templates.roof, scene);
}
