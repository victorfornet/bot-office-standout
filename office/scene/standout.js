// Standout 411 Vermont loft theme.
// Interior additions go on the floor_open template (cloned per instance).
// Exterior additions go on BOTH floor_open AND floor_closed (each floor shows its own slice of the facade).
// The facade group in the scene holds only ground-level elements (canopy, columns, sidewalk, signs).
import * as THREE from 'three';
import { SLAB, OPEN_H, FLOOR_STEP } from './office.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function rng(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function box(p, mat, w, h, d, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); p.add(m); return m; }
function cyl(p, mat, rt, rb, h, x, y, z, s = 16) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat); m.position.set(x, y, z); p.add(m); return m; }

// ─── shared materials ───────────────────────────────────────────────────────

const M = {
  disco: new THREE.MeshStandardMaterial({ color: 0xF2F2F2, metalness: 0.94, roughness: 0.04, envMapIntensity: 1.5, name: 'disco' }),
  wire: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, name: 'wire' }),
  canopy: new THREE.MeshStandardMaterial({ color: 0x7A7A7A, roughness: 0.5, metalness: 0.3, name: 'canopy' }),
  canopyEdge: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.35, metalness: 0.4, name: 'canopy_edge' }),
  column: new THREE.MeshStandardMaterial({ color: 0xEAE6DE, roughness: 0.6, name: 'column' }),
  pole: new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.45, metalness: 0.35, name: 'pole' }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0xBEB8B0, roughness: 0.9, name: 'sidewalk' }),
  darkFloor: new THREE.MeshStandardMaterial({ color: 0x3A2C20, roughness: 0.7, transparent: true, opacity: 0.35, depthWrite: false, name: 'dark_floor' }),
  curtain: new THREE.MeshStandardMaterial({ color: 0x6E7078, roughness: 0.92, side: THREE.DoubleSide, name: 'curtain' }),
};

// Shared textures (built once, used on every floor clone)
let _wallTex = null, _ivyTex = null, _brickTex = null;
function getWallTex() { return _wallTex || (_wallTex = makeBrickWindowTexture()); }
function getIvyTex() { return _ivyTex || (_ivyTex = makeIvyTexture()); }
function getBrickTex() { return _brickTex || (_brickTex = makeBrickTexture()); }

// ═══════════════════════════════════════════════════════════════════════════
//  PER-FLOOR EXTERIOR WALL PANELS
// ═══════════════════════════════════════════════════════════════════════════
// Added to each floor template so the side of every stacked slab shows
// brick+windows+ivy instead of blank white. Panels sit just outside the slab
// faces (x = ±8.21, z = ±6.21) and span the full floor height.

function addWallPanelsToFloor(template, floorH) {
  if (template.getObjectByName('standout_walls')) return;
  const g = new THREE.Group(); g.name = 'standout_walls';

  const wallMat = new THREE.MeshStandardMaterial({ map: getWallTex(), roughness: 0.82, name: 'ext_wall' });
  const ivyMat = new THREE.MeshStandardMaterial({
    map: getIvyTex(), transparent: true, alphaTest: 0.12, roughness: 0.8,
    side: THREE.FrontSide, depthWrite: true, name: 'ivy',
  });

  const panelH = floorH + SLAB;
  const yCenter = (floorH - SLAB) / 2;

  // Side walls (x = ±8.21): brick+windows on the outside face, ivy on top
  for (const side of [-1, 1]) {
    const brick = new THREE.Mesh(new THREE.PlaneGeometry(12.4, panelH), wallMat);
    brick.position.set(side * 8.21, yCenter, 0);
    brick.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(brick);

    const ivy = new THREE.Mesh(new THREE.PlaneGeometry(12.4, panelH), ivyMat);
    ivy.position.set(side * 8.215, yCenter, 0);
    ivy.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(ivy);
  }

  // Back wall (z = -6.21): plain white brick
  const backMat = new THREE.MeshStandardMaterial({ map: getBrickTex(), roughness: 0.88, name: 'back_brick' });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16.4, panelH), backMat);
  back.position.set(0, yCenter, -6.21);
  g.add(back);

  // Front wall (z = +6.21): same brick+windows
  const front = new THREE.Mesh(new THREE.PlaneGeometry(16.4, panelH), wallMat);
  front.position.set(0, yCenter, 6.21);
  front.rotation.y = Math.PI;
  g.add(front);

  const ivyFront = new THREE.Mesh(new THREE.PlaneGeometry(16.4, panelH), ivyMat);
  ivyFront.position.set(0, yCenter, 6.215);
  ivyFront.rotation.y = Math.PI;
  g.add(ivyFront);

  template.add(g);
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTERIOR — on the floor_open template
// ═══════════════════════════════════════════════════════════════════════════

function addDiscoBalls(open) {
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
    const b = new THREE.Mesh(sphere, M.disco); b.position.set(x, cy, z); b.scale.setScalar(r); g.add(b);
    const wH = OPEN_H - cy + r;
    const w = new THREE.Mesh(wGeo, M.wire); w.position.set(x, cy + wH / 2, z); w.scale.y = wH; g.add(w);
  }
  open.add(g);
}

function addNeonSign(open) {
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

function addPortraitMural(open) {
  if (open.getObjectByName('standout_mural')) return;
  const tex = canvasTex(480, 600, (g, w, h) => {
    g.fillStyle = '#080808'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.36;
    g.fillStyle = '#E2E2E2';
    g.beginPath(); g.ellipse(cx, cy, w * 0.27, h * 0.21, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0E0E0E';
    g.beginPath(); g.ellipse(cx - 2, cy - h * 0.13, w * 0.29, h * 0.12, -0.12, Math.PI, 0); g.fill();
    for (const s of [-1, 1]) { g.fillStyle = '#080808'; g.beginPath(); g.ellipse(cx + s * w * 0.085, cy - h * 0.01, w * 0.04, h * 0.016, s * 0.1, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#AAA'; g.lineWidth = 1.5; g.beginPath();
    g.moveTo(cx, cy + h * 0.015); g.quadraticCurveTo(cx + 8, cy + h * 0.06, cx, cy + h * 0.07); g.stroke();
    g.fillStyle = '#E2E2E2'; g.beginPath();
    g.moveTo(cx - w * 0.06, cy + h * 0.19); g.quadraticCurveTo(cx, cy + h * 0.23, cx + w * 0.06, cy + h * 0.19);
    g.lineTo(cx + w * 0.35, cy + h * 0.45); g.lineTo(cx - w * 0.35, cy + h * 0.45); g.fill();
    const vg = g.createRadialGradient(cx, cy + h * 0.05, w * 0.15, cx, cy + h * 0.05, w * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.7, 'rgba(0,0,0,0.4)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), mat);
  m.name = 'standout_mural'; m.position.set(7.97, 1.45, 2.2); m.rotation.y = -Math.PI / 2;
  open.add(m);
}

function addFloorOverlay(open) {
  if (open.getObjectByName('standout_floor')) return;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(15.8, 11.8).rotateX(-Math.PI / 2), M.darkFloor);
  m.name = 'standout_floor'; m.position.y = 0.004; m.renderOrder = -2;
  open.add(m);
}

function addCurtains(open) {
  if (open.getObjectByName('standout_curtains')) return;
  const g = new THREE.Group(); g.name = 'standout_curtains';
  for (let wx = -7; wx <= 7; wx += 2) {
    for (const dx of [-0.88, 0.88]) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.55), M.curtain);
      panel.position.set(wx + dx, 2.55 / 2 + 0.08, -5.94);
      g.add(panel);
    }
  }
  open.add(g);
}

function tintGlbMaterials(open) {
  const tints = { sofa: 0x1B3A8C, armchair_1: 0xD4A017, armchair_2: 0xE88B7A, coffee_table: 0xF0ECE5 };
  for (const [name, color] of Object.entries(tints)) {
    const mesh = open.getObjectByName(name);
    if (!mesh) continue;
    mesh.traverse(o => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) {
        if (m.userData?.bakedName || m.userData?.accent) continue;
        if (!m.map) m.color.set(color);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GROUND-LEVEL SCENE ELEMENTS (canopy, columns, signs, sidewalk)
// ═══════════════════════════════════════════════════════════════════════════

function addGroundElements(scene) {
  if (scene.getObjectByName('standout_facade')) return;
  const g = new THREE.Group(); g.name = 'standout_facade';

  // Canopy
  box(g, M.canopy, 3.6, 0.12, 1.6, 0, 2.9, 7.0);
  box(g, M.canopyEdge, 3.62, 0.04, 1.62, 0, 2.82, 7.0);

  // "411"
  const numTex = canvasTex(160, 48, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#B0B0B0'; ctx.font = '500 34px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('411', w / 2, h / 2);
  });
  const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.26), numMat);
  num.position.set(0, 2.97, 7.81); g.add(num);

  // Columns
  for (const s of [-1, 1]) cyl(g, M.column, 0.1, 0.13, 2.9, s * 1.5, 2.9 / 2, 7.0, 14);

  // Standout orb sign
  const logoTex = canvasTex(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(w * 0.18, h * 0.1, w * 0.82, h * 0.92);
    grad.addColorStop(0, '#F05A5A'); grad.addColorStop(0.36, '#9F6CEB');
    grad.addColorStop(0.75, '#6CF62C'); grad.addColorStop(1, '#EAFE86');
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.44, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(w * 0.63, h * 0.35, w * 0.19, 0, Math.PI * 2); ctx.fill();
  });
  const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), logoMat);
  logo.position.set(1.9, 2.5, 7.02); g.add(logo);

  // VERMONT sign on pole
  cyl(g, M.pole, 0.03, 0.03, 3.8, -8.7, 1.9, 6.5, 8);
  const stTex = canvasTex(220, 48, (ctx, w, h) => {
    ctx.fillStyle = '#1C5632'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#E8E8E8'; ctx.lineWidth = 1.5; ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = '#E8E8E8'; ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VERMONT', w / 2, h / 2);
  });
  const stMat = new THREE.MeshBasicMaterial({ map: stTex });
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.21), stMat);
  st.position.set(-8.7, 3.7, 6.5); st.rotation.y = Math.PI / 4; g.add(st);

  // Sidewalk
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 1.8).rotateX(-Math.PI / 2), M.sidewalk);
  sw.position.set(0, -0.005, 7.9); g.add(sw);

  scene.add(g);
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEXTURES
// ═══════════════════════════════════════════════════════════════════════════

function makeBrickWindowTexture() {
  return canvasTex(768, 512, (g, w, h) => {
    g.fillStyle = '#EDE8E0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.05)'; g.lineWidth = 0.8;
    const bh = 6, bw = 14;
    for (let y = 0; y < h; y += bh) {
      const off = (Math.floor(y / bh) % 2) * (bw / 2);
      for (let x = -bw; x < w + bw; x += bw) g.strokeRect(x + off, y, bw, bh);
    }
    const winY = h * 0.12, winH = h * 0.72, winW = w * 0.18;
    const baySpacing = w / 4;
    for (let b = 1; b <= 3; b++) {
      const bx = baySpacing * b - winW;
      g.fillStyle = '#2A3038'; g.fillRect(bx - 3, winY - 3, winW * 2 + 6, winH + 6);
      g.fillStyle = '#C8D4E0'; g.fillRect(bx, winY, winW * 2, winH);
      const refl = g.createLinearGradient(bx, winY, bx + winW * 2, winY + winH);
      refl.addColorStop(0, 'rgba(255,255,255,0.18)'); refl.addColorStop(0.5, 'rgba(255,255,255,0)'); refl.addColorStop(1, 'rgba(255,255,255,0.1)');
      g.fillStyle = refl; g.fillRect(bx, winY, winW * 2, winH);
      g.fillStyle = '#2A3038';
      g.fillRect(bx + winW - 1.5, winY, 3, winH);
      for (let r = 1; r < 3; r++) g.fillRect(bx, winY + (winH / 3) * r - 1, winW * 2, 2.5);
    }
  });
}

function makeBrickTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#EDE8E0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.05)'; g.lineWidth = 0.7;
    for (let y = 0; y < h; y += 6) {
      const off = (Math.floor(y / 6) % 2) * 7;
      for (let x = -14; x < w + 14; x += 14) g.strokeRect(x + off, y, 14, 6);
    }
  });
}

function makeIvyTexture() {
  return canvasTex(768, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const r = rng(42);
    const greens = ['#2D5E34', '#3A7744', '#4A8A52', '#2A5030', '#508E58', '#336B3C', '#3F7F48', '#245228'];
    // Dense blobs
    for (let i = 0; i < 80; i++) {
      const cx = r() * w, cy = h * 0.22 + r() * h * 0.78;
      g.save(); g.translate(cx, cy); g.rotate((r() - 0.5) * 0.8);
      g.fillStyle = greens[Math.floor(r() * greens.length)];
      g.globalAlpha = 0.75 + r() * 0.25;
      g.beginPath();
      for (let j = 0; j < 5 + Math.floor(r() * 4); j++) {
        const ox = (r() - 0.5) * 70, oy = (r() - 0.5) * 50, sr = 18 + r() * 48;
        g.moveTo(ox + sr, oy); g.arc(ox, oy, sr, 0, Math.PI * 2);
      }
      g.fill(); g.restore();
    }
    g.globalAlpha = 0.85;
    for (let i = 0; i < 180; i++) {
      g.fillStyle = greens[Math.floor(r() * greens.length)];
      g.beginPath(); g.arc(r() * w, h * 0.2 + r() * h * 0.8, 5 + r() * 16, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 0.7;
    for (let i = 0; i < 350; i++) {
      g.fillStyle = greens[Math.floor(r() * greens.length)];
      g.beginPath(); g.arc(r() * w, h * 0.3 + r() * h * 0.7, 2 + r() * 6, 0, Math.PI * 2); g.fill();
    }
    // Highlights
    g.globalAlpha = 0.25;
    for (let i = 0; i < 45; i++) { g.fillStyle = '#7ACA88'; g.beginPath(); g.arc(r() * w, h * 0.35 + r() * h * 0.6, 6 + r() * 22, 0, Math.PI * 2); g.fill(); }
    // Shadows
    g.globalAlpha = 0.3;
    for (let i = 0; i < 35; i++) { g.fillStyle = '#1A3A1E'; g.beginPath(); g.arc(r() * w, h * 0.4 + r() * h * 0.6, 8 + r() * 25, 0, Math.PI * 2); g.fill(); }
    // Fade at top
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1;
    const fade = g.createLinearGradient(0, 0, 0, h * 0.42);
    fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(0.55, 'rgba(0,0,0,0.5)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fade; g.fillRect(0, 0, w, h * 0.42);
    // Clear around windows
    for (let b = 1; b <= 3; b++) {
      const wx = (w / 4) * b, ww = w * 0.14, wy = h * 0.1, wh = h * 0.5;
      const eg = g.createRadialGradient(wx, wy + wh / 2, Math.min(ww, wh) * 0.6, wx, wy + wh / 2, Math.max(ww, wh) * 1.1);
      eg.addColorStop(0, 'rgba(0,0,0,0.6)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = eg; g.fillRect(wx - ww * 1.5, wy - wh * 0.2, ww * 3, wh * 1.4);
    }
    g.globalCompositeOperation = 'source-over';
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export function applyStandoutTheme(assets, scene) {
  const open = assets.templates.floor_open;
  const closed = assets.templates.floor_closed;

  // Exterior wall panels on every floor template
  addWallPanelsToFloor(open, OPEN_H);
  addWallPanelsToFloor(closed, FLOOR_STEP);

  // Interior decorations (open floor only)
  addDiscoBalls(open);
  addNeonSign(open);
  addPortraitMural(open);
  addFloorOverlay(open);
  addCurtains(open);
  tintGlbMaterials(open);

  console.log('[standout] theme applied to templates');
}

export function addFacadeToScene(assets, scene) {
  addGroundElements(scene);
  console.log('[standout] ground facade elements added');
}
