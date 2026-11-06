// ORBIT RUSH: главный файл игры
import * as THREE from 'three';
import { makeShip, loadShipModel } from './ship.js';
import { makeStars, makeAsteroid, makeCrystal } from './world.js';

// ===== НАСТРОЙКИ =====
const START_SPEED = 0.38;   // скорость полёта в начале (медленнее, чтобы новичок успел привыкнуть)
const SPEED_UP = 0.08;      // на сколько растёт скорость в новом секторе
const SECTOR_TIME = 25;     // секунд до нового сектора
const LIVES = 3;
const FIELD = { x: 7, y: 4 }; // насколько далеко корабль летает в стороны
// =====================

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x070B1A, 40, 140);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, .1, 400);
camera.position.set(0, 2.5, 9);

scene.add(new THREE.HemisphereLight(0x8CB8FF, 0x1A0B2E, 1.2));
const sun = new THREE.DirectionalLight(0xFFFFFF, 2.2);
sun.position.set(5, 8, 6);
scene.add(sun);

const stars = makeStars(scene);
const ship = makeShip();
scene.add(ship);
loadShipModel(ship);

const rocks = [], gems = [];
const keys = {};
let speed, score, lives, sector, timer, state = 'menu', hurt = 0;
let best = +(localStorage.getItem('orbit_best') || 0);
const ui = id => document.getElementById(id);
ui('best').textContent = best;

function reset() {
  [...rocks, ...gems].forEach(o => scene.remove(o));
  rocks.length = gems.length = 0;
  speed = START_SPEED; score = 0; lives = LIVES; sector = 1; timer = 0; hurt = 0;
  ship.position.set(0, 0, 0);
  updateHud();
}
function updateHud() {
  ui('score').textContent = score;
  ui('lives').textContent = '♥'.repeat(lives) + '♡'.repeat(LIVES - lives);
  ui('level').textContent = sector;
  ui('best').textContent = best;
}
function spawn() {
  if (Math.random() < .09 + sector * .015) {
    const r = makeAsteroid();
    r.position.set((Math.random() - .5) * FIELD.x * 2.4, (Math.random() - .5) * FIELD.y * 2.4, -130);
    scene.add(r); rocks.push(r);
  }
  if (Math.random() < .03) {
    const g = makeCrystal();
    g.position.set((Math.random() - .5) * FIELD.x * 2, (Math.random() - .5) * FIELD.y * 2, -130);
    scene.add(g); gems.push(g);
  }
}
function hit(a, b) { return a.position.distanceTo(b.position) < (b.userData.r + .9); }

function gameOver() {
  state = 'over';
  if (score > best) { best = score; localStorage.setItem('orbit_best', best); }
  updateHud();
  ui('screen').classList.remove('hidden');
  ui('screen').querySelector('h1').innerHTML = 'КОНЕЦ<span>' + score + '</span>';
  ui('screen').querySelector('p').textContent = 'Сектор ' + sector + '. Рекорд: ' + best + '. Ещё раз?';
  ui('start').textContent = 'ЕЩЁ РАЗ';
}

// управление: клавиатура
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyP' && (state === 'play' || state === 'pause')) state = state === 'play' ? 'pause' : 'play';
});
addEventListener('keyup', e => keys[e.code] = false);
// управление: палец или мышь
let pointer = null;
addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') pointer = { x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight * 2 - 1) }; });
addEventListener('pointerup', () => pointer = null);

ui('start').onclick = () => { reset(); state = 'play'; ui('screen').classList.add('hidden'); };

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;

  if (state === 'play') {
    // движение корабля
    const ax = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    const ay = (keys.ArrowUp || keys.KeyW ? 1 : 0) - (keys.ArrowDown || keys.KeyS ? 1 : 0);
    let tx = ship.position.x + ax * .35, ty = ship.position.y + ay * .3;
    if (pointer) { tx = pointer.x * FIELD.x; ty = pointer.y * FIELD.y; }
    ship.position.x += (THREE.MathUtils.clamp(tx, -FIELD.x, FIELD.x) - ship.position.x) * .25;
    ship.position.y += (THREE.MathUtils.clamp(ty, -FIELD.y, FIELD.y) - ship.position.y) * .25;
    ship.rotation.z = -(tx - ship.position.x) * .25;
    ship.rotation.x = (ty - ship.position.y) * .15;

    // сектора
    timer += dt;
    if (timer > SECTOR_TIME) { timer = 0; sector++; speed += SPEED_UP; updateHud(); }

    spawn();
    for (const r of [...rocks]) {
      r.position.z += speed * 60 * dt;
      r.rotation.x += r.userData.spin.x; r.rotation.y += r.userData.spin.y;
      if (hurt <= 0 && hit(ship, r)) { lives--; hurt = 1.5; updateHud(); if (lives <= 0) gameOver(); }
      if (r.position.z > 12) { scene.remove(r); rocks.splice(rocks.indexOf(r), 1); }
    }
    for (const g of [...gems]) {
      g.position.z += speed * 60 * dt; g.rotation.y += .05;
      if (hit(ship, g)) { score += 10; updateHud(); scene.remove(g); gems.splice(gems.indexOf(g), 1); continue; }
      if (g.position.z > 12) { scene.remove(g); gems.splice(gems.indexOf(g), 1); }
    }
    if (hurt > 0) { hurt -= dt; ship.visible = Math.floor(hurt * 10) % 2 === 0; } else ship.visible = true;
  } else {
    ship.rotation.y = Math.sin(t * .6) * .4; // в меню корабль покачивается
  }

  // звёзды летят навстречу
  const sp = stars.geometry.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    let z = sp.getZ(i) + (state === 'play' ? speed : .1) * 2;
    if (z > -3) z = -300;
    sp.setZ(i, z);
  }
  sp.needsUpdate = true;
  ship.userData.flame.scale.y = 1 + Math.sin(t * 30) * .25;

  camera.position.x += (ship.position.x * .5 - camera.position.x) * .05;
  camera.position.y += (2.5 + ship.position.y * .4 - camera.position.y) * .05;
  camera.lookAt(ship.position.x * .3, ship.position.y * .3, -10);
  renderer.render(scene, camera);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
loop();
