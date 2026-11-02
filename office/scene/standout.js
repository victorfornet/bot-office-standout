// Standout office customisations: applied on top of the GLB or placeholder after loading.
// Adds disco balls, a neon wall sign, exterior facade (ivy, canopy, Vermont sign),
// material tints for the Standout palette, and a procedural portrait mural.
import * as THREE from 'three';

const DISCO_MAT = new THREE.MeshStandardMaterial({ color: 0xE8E8E8, metalness: 0.95, roughness: 0.05, name: 'disco_ball', envMapIntensity: 1.5 });
const WIRE_MAT = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.4, name: 'disco_wire' });
const IVY_MAT = new THREE.MeshStandardMaterial({ color: 0x3A7744, roughness: 0.85, name: 'ivy' });
const IVY_DARK = new THREE.MeshStandardMaterial({ color: 0x2A5A30, roughness: 0.9, name: 'ivy_dark' });
const BRICK_MAT = new THREE.MeshBasicMaterial({ color: 0xF2EDE6, name: 'white_brick' });
const CANOPY_MAT = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.3, name: 'canopy' });
const CONCRETE_MAT = new THREE.MeshStandardMaterial({ color: 0xC8C0B8, roughness: 0.85, name: 'sidewalk' });
const COLUMN_MAT = new THREE.MeshStandardMaterial({ color: 0xE8E2DA, roughness: 0.7, name: 'column' });

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Disco balls scattered across the open floor ceiling
export function addDiscoBallsToFloor(openTemplate) {
  const existing = openTemplate.getObjectByName('standout_disco');
  if (existing) return;
  const g = new THREE.Group();
  g.name = 'standout_disco';
  const positions = [
    [-5.5, 2.4, -2.5, 0.20], [-3.5, 2.5, -1.0, 0.24], [-1.5, 2.35, -3.2, 0.18],
    [0.5, 2.48, -2.0, 0.22], [2.5, 2.38, -1.5, 0.16], [-4.5, 2.45, 0.8, 0.19],
    [-2.0, 2.42, 1.5, 0.21], [1.0, 2.5, 0.5, 0.17], [3.5, 2.35, -0.5, 0.23],
    [-6.0, 2.48, -4.0, 0.15], [0.0, 2.4, -4.5, 0.20], [-3.0, 2.52, -4.0, 0.18],
  ];
  const sphere = new THREE.IcosahedronGeometry(1, 2);
  for (const [x, cy, z, r] of positions) {
    const ball = new THREE.Mesh(sphere, DISCO_MAT);
    ball.position.set(x, cy, z);
    ball.scale.setScalar(r);
    g.add(ball);
    const wireH = 2.7 - cy + r;
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, wireH, 4), WIRE_MAT);
    wire.position.set(x, cy + wireH / 2, z);
    g.add(wire);
  }
  openTemplate.add(g);
}

// Neon STANDOUT sign on the left wall of the open floor
export function addNeonSign(openTemplate) {
  const existing = openTemplate.getObjectByName('standout_neon');
  if (existing) return;
  const tex = canvasTex(640, 160, (g, w, h) => {
    g.fillStyle = '#0B1A0F';
    g.fillRect(0, 0, w, h);
    g.save();
    g.shadowColor = '#34D399';
    g.shadowBlur = 30;
    g.fillStyle = '#34D399';
    g.font = 'bold 72px Inter, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('STANDOUT', w / 2, h / 2);
    g.fillText('STANDOUT', w / 2, h / 2);
    g.restore();
    g.strokeStyle = 'rgba(52, 211, 153, 0.3)';
    g.lineWidth = 2;
    g.strokeRect(12, 12, w - 24, h - 24);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, name: 'neon_sign' });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7).rotateY(Math.PI / 2), mat);
  mesh.name = 'standout_neon';
  mesh.position.set(-7.95, 2.05, 3.5);
  openTemplate.add(mesh);
}

// Procedural portrait mural for the meeting corner wall area
export function addPortraitMural(openTemplate) {
  const existing = openTemplate.getObjectByName('standout_mural');
  if (existing) return;
  const tex = canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#0A0A0A';
    g.fillRect(0, 0, w, h);
    const cx = w * 0.5, cy = h * 0.38;
    // stylised face silhouette (abstract, not copying any real person)
    g.fillStyle = '#E8E8E8';
    g.beginPath();
    g.ellipse(cx, cy, w * 0.28, h * 0.22, 0, 0, Math.PI * 2);
    g.fill();
    // hair sweep
    g.fillStyle = '#1A1A1A';
    g.beginPath();
    g.ellipse(cx - w * 0.02, cy - h * 0.12, w * 0.3, h * 0.13, -0.15, Math.PI, 0);
    g.fill();
    // eyes
    for (const s of [-1, 1]) {
      g.fillStyle = '#0A0A0A';
      g.beginPath();
      g.ellipse(cx + s * w * 0.09, cy - h * 0.02, w * 0.045, h * 0.018, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#2A2A2A';
      g.beginPath();
      g.ellipse(cx + s * w * 0.09, cy - h * 0.02, w * 0.025, h * 0.012, 0, 0, Math.PI * 2);
      g.fill();
    }
    // nose
    g.strokeStyle = '#C0C0C0';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx, cy + h * 0.01);
    g.quadraticCurveTo(cx + w * 0.03, cy + h * 0.06, cx, cy + h * 0.07);
    g.stroke();
    // lips
    g.fillStyle = '#555';
    g.beginPath();
    g.ellipse(cx, cy + h * 0.11, w * 0.06, h * 0.015, 0, 0, Math.PI * 2);
    g.fill();
    // neck/shoulders
    g.fillStyle = '#E8E8E8';
    g.beginPath();
    g.moveTo(cx - w * 0.08, cy + h * 0.2);
    g.quadraticCurveTo(cx, cy + h * 0.25, cx + w * 0.08, cy + h * 0.2);
    g.lineTo(cx + w * 0.35, cy + h * 0.45);
    g.lineTo(cx - w * 0.35, cy + h * 0.45);
    g.fill();
    // vignette
    const vg = g.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = vg;
    g.fillRect(0, 0, w, h);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, name: 'mural' });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.5), mat);
  mesh.name = 'standout_mural';
  mesh.position.set(7.95, 1.5, 2.5);
  mesh.rotation.y = -Math.PI / 2;
  openTemplate.add(mesh);
}

// Exterior facade: ivy, canopy, columns, signs — added to the roof template
export function addExteriorFacade(roofTemplate, scene) {
  const existing = scene.getObjectByName('standout_facade');
  if (existing) return;
  const facade = new THREE.Group();
  facade.name = 'standout_facade';

  const roofY = roofTemplate.position ? roofTemplate.position.y : 0;

  // White brick walls visible from outside (behind the glass curtain wall and sides)
  const brickTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#F0EBE3';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.06)';
    g.lineWidth = 1;
    const bh = 8, bw = 18;
    for (let y = 0; y < h; y += bh) {
      const off = (Math.floor(y / bh) % 2) * (bw / 2);
      for (let x = -bw; x < w + bw; x += bw) {
        g.strokeRect(x + off, y, bw, bh);
      }
    }
  });
  brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
  brickTex.repeat.set(4, 2);
  const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9, name: 'ext_brick' });

  // Back wall (behind the glass)
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 6), brickMat);
  backWall.position.set(0, 3, -6.3);
  facade.add(backWall);

  // Side walls with ivy
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 6), brickMat);
    wall.position.set(side * 8.3, 3, 0);
    wall.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    facade.add(wall);

    // Ivy patches: clusters of small green boxes
    const ivyGroup = new THREE.Group();
    const rng = mulberry32(side * 77);
    for (let i = 0; i < 120; i++) {
      const iy = rng() * 5.5 + 0.3;
      const iz = (rng() - 0.5) * 11;
      const iw = 0.3 + rng() * 0.6;
      const ih = 0.2 + rng() * 0.4;
      const mat = rng() > 0.5 ? IVY_MAT : IVY_DARK;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.08, ih, iw), mat);
      leaf.position.set(side * 8.22, iy, iz);
      ivyGroup.add(leaf);
    }
    facade.add(ivyGroup);
  }

  // Canopy over entrance (front, z = +6 side)
  const canopyW = 4.0, canopyD = 2.5, canopyH = 0.15;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(canopyW, canopyH, canopyD), CANOPY_MAT);
  canopy.position.set(0, 3.2, 6 + canopyD / 2 - 0.2);
  facade.add(canopy);

  // "411" text on canopy
  const numTex = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = 'rgba(0,0,0,0)';
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#AAAAAA';
    g.font = 'bold 42px Inter, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('411', w / 2, h / 2);
  });
  const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true, name: 'addr_411' });
  const numPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), numMat);
  numPlane.position.set(0, 3.2 + canopyH / 2 + 0.01, 6 + canopyD / 2 - 0.2);
  numPlane.rotation.x = -Math.PI / 2;
  facade.add(numPlane);

  // Front face "411" numbers
  const frontNumPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.35), numMat);
  frontNumPlane.position.set(0, 3.5, 6 + canopyD - 0.15);
  facade.add(frontNumPlane);

  // Columns flanking entrance
  const colGeo = new THREE.CylinderGeometry(0.15, 0.18, 3.2, 16);
  for (const s of [-1, 1]) {
    const col = new THREE.Mesh(colGeo, COLUMN_MAT);
    col.position.set(s * 1.6, 1.6, 6.3);
    facade.add(col);
  }

  // VERMONT corner sign
  const signTex = canvasTex(320, 80, (g, w, h) => {
    g.fillStyle = '#264A36';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFFFFF';
    g.font = 'bold 36px Inter, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('VERMONT', w / 2, h / 2);
  });
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, name: 'vermont_sign' });
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), signMat);
  signMesh.position.set(-8.35, 4.5, 6);
  signMesh.rotation.y = Math.PI / 4;
  facade.add(signMesh);

  // Standout orb logo on the facade (big, lit)
  const logoTex = canvasTex(400, 400, (g, w, h) => {
    g.fillStyle = '#264A36';
    g.fillRect(0, 0, w, h);
    // gradient orb
    const grad = g.createLinearGradient(w * 0.2, h * 0.1, w * 0.8, h * 0.9);
    grad.addColorStop(0, '#F05A5A');
    grad.addColorStop(0.36, '#9F6CEB');
    grad.addColorStop(0.75, '#6CF62C');
    grad.addColorStop(1, '#EAFE86');
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.35, 0, Math.PI * 2);
    g.fillStyle = grad;
    g.fill();
    // white highlight circle
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.arc(w * 0.6, h * 0.38, w * 0.16, 0, Math.PI * 2);
    g.fill();
  });
  const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, toneMapped: false, name: 'facade_logo' });
  const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), logoMat);
  logoMesh.position.set(0, 5.0, 6 + canopyD - 0.1);
  facade.add(logoMesh);

  // Sidewalk
  const sidewalk = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 4).rotateX(-Math.PI / 2),
    CONCRETE_MAT
  );
  sidewalk.position.set(0, -0.01, 6 + canopyD + 0.5);
  facade.add(sidewalk);

  scene.add(facade);
}

// Tint GLB materials to Standout colors (sofa → blue, armchairs → mustard/salmon, floor → dark)
export function tintGlbMaterials(openTemplate) {
  const matOverrides = {
    sofa: { color: 0x1B3A8C },
    armchair_1: { color: 0xD4A017 },
    armchair_2: { color: 0xE88B7A },
    coffee_table: { color: 0xF0ECE5 },
  };
  for (const [meshName, props] of Object.entries(matOverrides)) {
    const mesh = openTemplate.getObjectByName(meshName);
    if (!mesh) continue;
    mesh.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.userData?.bakedName || m.userData?.accent) continue;
        if (!m.map) m.color.set(props.color);
      }
    });
  }
}

// Apply all Standout customisations to loaded assets
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

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
