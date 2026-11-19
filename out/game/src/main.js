// Solmar Nights — the game loop: states, wanted heat, police spawns,
// shooting, pickups, saving, and the per-frame update of every system.
import { CFG, clamp, dist, mulberry32 } from './config.js';
import { buildCity } from './world.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import {
  makeCar, makePlayer, spawnTraffic, spawnPeds,
  updateTrafficCar, updatePed, updatePolice, driveCar, moveCar, walkPlayer,
} from './entities.js';
import { startMission, updateMission } from './missions.js';
import { drawCity, drawCar, drawPed, drawPlayer, drawBeacon, drawMinimap, drawHud, drawTitle, drawPause, drawEnd } from './render.js';
import { applyShot } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CFG.viewWidth;
    canvas.height = CFG.viewHeight;
    this.city = buildCity();
    this.rand = mulberry32(CFG.seed + 7);
    this.input = new Input();
    this.sounds = new SoundBank();
    this.state = 'title'; // title | play | pause | won | over
    this.cam = { x: 0, y: 0 };
    this.bullets = [];
    this.police = [];
    this.policeTimer = 0;
    this.sirenTimer = 0;
    this.wantedTimer = 0;
    this.toast = '';
    this.toastUntil = 0;
    this.time = 0;
    this.stats = { missionsDone: 0, earned: 0, carsStolen: 0, shots: 0 };
    this.saveData = this.load();
    this.player = makePlayer(this.city.spots.safehouse.x, this.city.spots.safehouse.y);
    if (this.saveData) {
      this.player.cash = this.saveData.cash;
      this.stats.missionsDone = this.saveData.missionsDone;
    }
    this.traffic = spawnTraffic(this.city, CFG.trafficCars, this.rand);
    this.peds = spawnPeds(this.city, CFG.pedestrians, this.rand);
    this.mission = null;
    this.shotMode = new URLSearchParams(window.location.search).get('shot');
    if (this.shotMode) applyShot(this, this.shotMode);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  load() {
    try {
      const raw = window.localStorage.getItem('solmar-nights-save');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  save() {
    try {
      window.localStorage.setItem('solmar-nights-save', JSON.stringify({
        cash: this.player.cash,
        missionsDone: this.stats.missionsDone,
        earned: this.stats.earned,
      }));
    } catch { /* private mode: play on without saving */ }
  }

  showToast(text, ms) {
    this.toast = text;
    this.toastUntil = performance.now() + (ms || 3200);
  }

  start() {
    this.state = 'play';
    this.sounds.ensure();
    this.sounds.startPad();
    if (!this.mission) startMission(this, this.stats.missionsDone);
    this.showToast('Welcome to Solmar. Rico is waiting — check the gold marker.', 4200);
  }

  loop(t) {
    const dt = Math.min(0.05, (t - (this.lastT || t)) / 1000 || 0.016);
    this.lastT = t;
    this.time = t;
    if (this.state === 'title' && this.input.wasPressed('enter')) this.start();
    else if ((this.state === 'won' || this.state === 'over') && this.input.wasPressed('r')) window.location.reload();
    else if (this.state === 'pause' && this.input.wasPressed('p')) this.state = 'play';
    else if (this.state === 'play') this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    const p = this.player;
    if (this.shotMode) {
    const keys = this.input.read();
    if (this.cruise && p.inCar) keys.up = true;
    this._driveUpdate(keys, dt);
  } else {
    this._driveUpdate(this.input.read(), dt);
  }
  return;
  }
  _driveUpdate(keys, dt) {
    const p = this.player;
    if (this.input.wasPressed('p')) { this.state = 'pause'; return; }
    if (this.input.wasPressed('m')) {
      this.sounds.ensure();
      this.showToast(this.sounds.toggleMute() ? 'Sound off' : 'Sound on');
    }

    // Enter / exit a car.
    if (this.input.wasPressed('e')) this.tryEnterExitCar();

    if (p.inCar) {
      driveCar(p.inCar, keys, dt);
      moveCar(p.inCar, this.city, dt);
      p.x = p.inCar.x; p.y = p.inCar.y; p.angle = p.inCar.angle;
      if (Math.abs(p.inCar.speed) > 300) this.sounds.blip(60 + Math.abs(p.inCar.speed) * 0.15, 0.05, 'sawtooth', 0.015);
    } else {
      walkPlayer(p, keys, this.city, dt);
      if (keys.shoot && p.ammo > 0 && performance.now() > p.fireAt) {
        p.fireAt = performance.now() + CFG.fireCooldownMs;
        p.ammo -= 1;
        this.stats.shots += 1;
        this.bullets.push({
          x: p.x + Math.cos(p.angle) * 18, y: p.y + Math.sin(p.angle) * 18,
          vx: Math.cos(p.angle) * CFG.bulletSpeed, vy: Math.sin(p.angle) * CFG.bulletSpeed, life: 0.9,
        });
        this.sounds.shoot();
        if (p.wanted < 2) this.raiseWanted(1);
      }
    }

    // Bullets fly and hit police cars.
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const cop of this.police) {
        if (dist(b.x, b.y, cop.x, cop.y) < 26) {
          cop.hp -= CFG.bulletDamage; b.life = 0;
          this.sounds.crash();
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
    this.police = this.police.filter((cop) => {
      if (cop.hp <= 0) { this.showToast('Cop car disabled!'); return false; }
      return true;
    });

    // Traffic and pedestrians keep the city alive.
    for (const car of this.traffic) updateTrafficCar(car, this.city, this.traffic, dt);
    for (const ped of this.peds) updatePed(ped, this.city, p, dt);

    // Pickups: cash on the street, health in the parks.
    for (const pk of this.city.pickups) {
      if (!pk.taken && dist(p.x, p.y, pk.x, pk.y) < 26) {
        pk.taken = true;
        p.cash += pk.amount;
        this.showToast(`Found $${pk.amount} on the street!`);
        this.sounds.cash();
      }
    }

    // Wanted: police spawn while wanted, heat fades when hidden.
    if (p.wanted > 0) {
      this.wantedTimer += dt;
      this.policeTimer -= dt;
      this.sirenTimer -= dt;
      const want = Math.min(CFG.maxPolice, p.wanted + 1);
      if (this.police.length < want && this.policeTimer <= 0) {
        this.policeTimer = CFG.policeSpawnMs / 1000;
        const a = Math.random() * Math.PI * 2;
        const cop = makeCar(p.x + Math.cos(a) * 520, p.y + Math.sin(a) * 520, a, 'police');
        cop.hp = 100;
        this.police.push(cop);
      }
      if (this.sirenTimer <= 0) { this.sirenTimer = 1.1; this.sounds.siren(); }
      if (this.wantedTimer > CFG.wantedDecayMs / 1000 && this.police.length === 0) {
        p.wanted = Math.max(0, p.wanted - 1);
        this.wantedTimer = 0;
      }
    }
    for (const cop of this.police) updatePolice(cop, p, this.city, dt);

    // Mission progress.
    updateMission(this, dt);

    // Health and death.
    if (p.health <= 0) {
      p.alive = false;
      this.state = 'over';
      this.sounds.fail();
      this.save();
    }

    // Camera follows the player, clamped to the city.
    this.cam.x = clamp(p.x - CFG.viewWidth / 2, -40, CFG.worldSize - CFG.viewWidth + 40);
    this.cam.y = clamp(p.y - CFG.viewHeight / 2, -40, CFG.worldSize - CFG.viewHeight + 40);
    if (this.shotMode) this.cam.x = clamp(p.x - CFG.viewWidth / 2, -40, CFG.worldSize - CFG.viewWidth + 40);
  }

  raiseWanted(level) {
    const p = this.player;
    if (level > p.wanted) {
      p.wanted = Math.min(5, level);
      p.lastCrimeAt = performance.now();
      this.wantedTimer = 0;
    }
  }

  tryEnterExitCar() {
    const p = this.player;
    if (p.inCar) {
      const car = p.inCar;
      p.inCar = null;
      p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 30;
      p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 30;
      p.speed = 0;
      return;
    }
    let best = null;
    let bestD = 60;
    for (const car of [...this.traffic, ...this.police]) {
      const d = dist(p.x, p.y, car.x, car.y);
      if (d < bestD) { bestD = d; best = car; }
    }
    if (!best) return;
    const wasTraffic = this.traffic.includes(best);
    if (wasTraffic) {
      this.traffic = this.traffic.filter((c) => c !== best);
      this.stats.carsStolen += 1;
      this.raiseWanted(1);
      this.showToast('Car stolen! The owner called it in — 1 star.');
      this.sounds.crash();
    }
    p.inCar = best;
    best.speed = 0;
    p.x = best.x; p.y = best.y;
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    if (this.state === 'title') {
      drawTitle(ctx, this);
      ctx.restore();
      return;
    }
    ctx.translate(-this.cam.x, -this.cam.y);
    drawCity(ctx, this.city, this.cam, CFG.viewWidth, CFG.viewHeight);
    // Cash pickups.
    for (const pk of this.city.pickups) {
      if (pk.taken) continue;
      ctx.fillStyle = '#7ee787';
      ctx.beginPath(); ctx.arc(pk.x, pk.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#14532d';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', pk.x, pk.y + 4);
      ctx.textAlign = 'left';
    }
    if (this.mission && this.mission.target) drawBeacon(ctx, this.mission.target, this.time);
    for (const car of this.traffic) drawCar(ctx, car);
    for (const cop of this.police) drawCar(ctx, cop);
    for (const ped of this.peds) drawPed(ctx, ped);
    // Bullets.
    ctx.fillStyle = '#ffe066';
    for (const b of this.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); }
    if (this.player.inCar) drawCar(ctx, this.player.inCar);
    else drawPlayer(ctx, this.player);
    ctx.restore();
    drawHud(ctx, this);
    drawMinimap(ctx, this);
    if (this.state === 'pause') drawPause(ctx);
    if (this.state === 'won') drawEnd(ctx, this, true);
    if (this.state === 'over') drawEnd(ctx, this, false);
  }
}
