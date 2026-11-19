// Solmar Nights — everyone who moves: the player (on foot or driving),
// traffic cars on the road graph, pedestrians on the sidewalks, police
// cruisers that chase a wanted player, and bullets.
import { CFG, clamp, dist, angleTo, turnToward, mulberry32 } from './config.js';
import { hitsBuilding, nearestRoadPoint } from './world.js';

const CAR_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];
const PED_COLORS = ['#ff9f43', '#2ed573', '#70a1ff', '#eccc68', '#ff6b81', '#a55eea'];

export function makeCar(x, y, angle, kind) {
  return {
    x, y, angle, speed: 0, kind: kind || 'traffic',
    color: kind === 'police' ? '#1e3a5f' : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
    hp: 100, targetAngle: angle, stuck: 0,
  };
}

export function makePed(x, y, rand) {
  return {
    x, y, angle: rand() * Math.PI * 2, speed: 28 + rand() * 30,
    color: PED_COLORS[Math.floor(rand() * PED_COLORS.length)],
    panic: 0, wait: rand() * 2,
  };
}

export function makePlayer(x, y) {
  return {
    x, y, angle: -Math.PI / 2, speed: 0, health: CFG.playerHealth,
    cash: 250, wanted: 0, inCar: null, ammo: CFG.pistolAmmo,
    fireAt: 0, lastCrimeAt: 0, alive: true,
  };
}

export function spawnTraffic(city, count, rand) {
  const cars = [];
  for (let i = 0; i < count; i++) {
    const rx = city.roadsX[Math.floor(rand() * city.roadsX.length)];
    const ry = city.roadsY[Math.floor(rand() * city.roadsY.length)];
    const onX = rand() < 0.5;
    const angle = onX ? (rand() < 0.5 ? 0 : Math.PI) : (rand() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    cars.push(makeCar(onX ? rx : rx + (rand() - 0.5) * 400, onX ? ry + (rand() - 0.5) * 400 : ry, angle));
    cars[cars.length - 1].speed = 60 + rand() * 70;
  }
  return cars;
}

export function spawnPeds(city, count, rand) {
  const peds = [];
  let guard = 0;
  while (peds.length < count && guard++ < count * 20) {
    const x = rand() * CFG.worldSize;
    const y = rand() * (CFG.worldSize - 500);
    if (!hitsBuilding(city, x, y, 6)) peds.push(makePed(x, y, rand));
  }
  return peds;
}

// Move one traffic car along the roads: drive straight, turn at
// intersections, slow down for the car ahead.
export function updateTrafficCar(car, city, cars, dt) {
  const ahead = car.x + Math.cos(car.angle) * 46;
  const aheadY = car.y + Math.sin(car.angle) * 46;
  let blocked = hitsBuilding(city, ahead, aheadY, 4);
  for (const other of cars) {
    if (other !== car && dist(ahead, aheadY, other.x, other.y) < 34) { blocked = true; break; }
  }
  const target = blocked ? 0 : 95;
  car.speed += clamp(target - car.speed, -260 * dt, 140 * dt);
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  if (car.x < 20 || car.x > CFG.worldSize - 20 || car.y < 20 || car.y > CFG.worldSize - 20) {
    car.angle += Math.PI;
    car.x = clamp(car.x, 30, CFG.worldSize - 30);
    car.y = clamp(car.y, 30, CFG.worldSize - 30);
  }
  // At an intersection, sometimes turn onto the crossing road.
  const rp = nearestRoadPoint(city, car.x, car.y);
  const onXRoad = Math.abs(car.y - rp.y) < 6 && rp.axis === 'y';
  const onYRoad = Math.abs(car.x - rp.x) < 6 && rp.axis === 'x';
  if ((onXRoad || onYRoad) && Math.random() < dt * 0.25) {
    car.angle = [0, Math.PI / 2, Math.PI, -Math.PI / 2][Math.floor(Math.random() * 4)];
  }
}

// Pedestrians wander the sidewalks and run away from danger.
export function updatePed(ped, city, player, dt) {
  const d = dist(ped.x, ped.y, player.x, player.y);
  if (d < 130 || (player.wanted > 0 && d < 260)) ped.panic = 2.5;
  if (ped.panic > 0) {
    ped.panic -= dt;
    const away = angleTo(player.x, player.y, ped.x, ped.y);
    ped.angle = turnToward(ped.angle, away, 6 * dt);
    movePed(ped, city, 95, dt);
    return;
  }
  ped.wait -= dt;
  if (ped.wait <= 0) {
    ped.angle = Math.random() * Math.PI * 2;
    ped.wait = 1.5 + Math.random() * 3;
  }
  movePed(ped, city, ped.speed, dt);
}

function movePed(ped, city, speed, dt) {
  const nx = ped.x + Math.cos(ped.angle) * speed * dt;
  const ny = ped.y + Math.sin(ped.angle) * speed * dt;
  if (!hitsBuilding(city, nx, ped.y, 6)) ped.x = nx;
  if (!hitsBuilding(city, ped.x, ny, 6)) ped.y = ny;
  ped.x = clamp(ped.x, 10, CFG.worldSize - 10);
  ped.y = clamp(ped.y, 10, CFG.worldSize - 10);
}

// A police cruiser hunts the player: steer toward them, ram on contact.
export function updatePolice(car, player, city, dt) {
  const want = angleTo(car.x, car.y, player.x, player.y);
  car.angle = turnToward(car.angle, want, 2.4 * dt);
  const target = dist(car.x, car.y, player.x, player.y) > 60 ? 330 : 120;
  car.speed += clamp(target - car.speed, -500 * dt, 420 * dt);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  if (!hitsBuilding(city, nx, ny, 10)) { car.x = nx; car.y = ny; }
  else { car.angle += 0.9 * dt * 10; car.speed *= 0.9; }
  if (dist(car.x, car.y, player.x, player.y) < 34) {
    player.health -= 26 * dt;
    if (player.inCar) player.inCar.hp -= 30 * dt;
  }
}

// Drive the player's car with arcade handling.
export function driveCar(car, keys, dt) {
  const fwd = keys.up ? 1 : keys.down ? -0.6 : 0;
  car.speed += fwd * CFG.carAccel * dt;
  if (!keys.up && !keys.down) car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 320 * dt);
  const max = car.speed >= 0 ? CFG.carMaxSpeed : CFG.carReverseSpeed;
  car.speed = clamp(car.speed, -CFG.carReverseSpeed, CFG.carMaxSpeed);
  if (Math.abs(car.speed) > 12) {
    const dir = keys.left ? -1 : keys.right ? 1 : 0;
    car.angle += dir * CFG.carTurn * dt * Math.sign(car.speed) * clamp(Math.abs(car.speed) / 120, 0.4, 1);
  }
  return max;
}

export function moveCar(car, city, dt) {
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  if (!hitsBuilding(city, nx, car.y, 12)) car.x = nx; else car.speed *= -0.25;
  if (!hitsBuilding(city, car.x, ny, 12)) car.y = ny; else car.speed *= -0.25;
  car.x = clamp(car.x, 16, CFG.worldSize - 16);
  car.y = clamp(car.y, 16, CFG.worldSize - 16);
}

// Walk the player on foot, sliding along building walls.
export function walkPlayer(player, keys, city, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  const speed = keys.run ? CFG.runSpeed : CFG.walkSpeed;
  const nx = player.x + (dx / len) * speed * dt;
  const ny = player.y + (dy / len) * speed * dt;
  if (!hitsBuilding(city, nx, player.y, CFG.playerRadius)) player.x = nx;
  if (!hitsBuilding(city, player.x, ny, CFG.playerRadius)) player.y = ny;
  player.angle = Math.atan2(dy, dx);
}
