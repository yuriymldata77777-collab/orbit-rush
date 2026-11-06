// 3D-модель корабля из простых фигур Three.js
import * as THREE from 'three';

export function makeShip() {
  const ship = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0xDDE6FF, metalness: .6, roughness: .3, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1B2347, metalness: .4, roughness: .5, flatShading: true });
  const neon = new THREE.MeshStandardMaterial({ color: 0x3DF5FF, emissive: 0x3DF5FF, emissiveIntensity: 2 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xFF4FD8, emissive: 0xFF4FD8, emissiveIntensity: 2.5 });

  // корпус: вытянутый конус носом вперёд (вперёд = -Z)
  const hull = new THREE.Mesh(new THREE.ConeGeometry(.45, 2.4, 6), body);
  hull.rotation.x = -Math.PI / 2;
  ship.add(hull);

  // кабина
  const cabin = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), neon);
  cabin.position.set(0, .22, -.2); cabin.scale.set(1, .7, 1.6);
  ship.add(cabin);

  // крылья
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, .08, .9), dark);
    wing.position.set(side * .9, -.05, .45); wing.rotation.z = side * -.12;
    ship.add(wing);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(.08, .35, .7), pink);
    tip.position.set(side * 1.68, .08, .5);
    ship.add(tip);
  }

  // двигатель и пламя
  const engine = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, .4, 10), dark);
  engine.rotation.x = Math.PI / 2; engine.position.z = 1.25;
  ship.add(engine);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.28, 1, 10), neon);
  flame.rotation.x = Math.PI / 2; flame.position.z = 1.9;
  ship.add(flame);
  ship.userData.flame = flame;

  return ship;
}

// Модель из Claude Design: assets/ship.glb. Если файла нет, остаётся корабль из кода.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export function loadShipModel(ship) {
  new GLTFLoader().load('assets/ship.glb', gltf => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const k = 3.4 / Math.max(size.x, size.y, size.z);   // подгоняем размер под игру
    model.scale.setScalar(k);
    box.setFromObject(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));
    const holder = new THREE.Group();   // обёртка, чтобы повернуть модель носом вперёд
    holder.add(model);
    holder.rotation.y = MODEL_TURN;
    const flame = ship.userData.flame;
    ship.clear();
    ship.add(holder, flame);
  }, undefined, () => console.log('ship.glb не найден, летим на корабле из кода'));
}
const MODEL_TURN = 0.98; // повернуть модель носом вперёд. Летит боком? Поменяй число: 0, 1.57, 3.14
