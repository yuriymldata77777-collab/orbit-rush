// Космос: звёзды, астероиды и кристаллы
import * as THREE from 'three';

export function makeStars(scene) {
  const g = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 2500; i++) pts.push((Math.random() - .5) * 200, (Math.random() - .5) * 120, -Math.random() * 300);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xBFD4FF, size: .25 }));
  scene.add(stars);
  return stars;
}

const rockMat = new THREE.MeshStandardMaterial({ color: 0x6B5A7E, roughness: .95, flatShading: true });
export function makeAsteroid() {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = .75 + Math.random() * .5;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, rockMat);
  const s = .8 + Math.random() * 1.6;
  m.scale.setScalar(s);
  m.userData = { r: s * .9, spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(.03) };
  return m;
}

const gemMat = new THREE.MeshStandardMaterial({ color: 0xFFC93C, emissive: 0xFFAA00, emissiveIntensity: 1.5, flatShading: true });
export function makeCrystal() {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(.45), gemMat);
  m.scale.y = 1.6;
  m.userData = { r: .7 };
  return m;
}
