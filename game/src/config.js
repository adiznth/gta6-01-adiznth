// Solmar Nights — configuration: every tuning number for the city, the
// vehicles, the police and the missions lives here so the rest of the game
// reads plain values instead of magic numbers.
export const CFG = {
  // World: a coastal city of square blocks separated by roads.
  worldSize: 2600,
  blockSize: 220,
  roadWidth: 64,
  seed: 20261119,

  // Player on foot.
  walkSpeed: 165,
  runSpeed: 265,
  playerRadius: 13,
  playerHealth: 100,

  // Driving.
  carAccel: 520,
  carBrake: 700,
  carMaxSpeed: 430,
  carReverseSpeed: 150,
  carTurn: 2.6,
  carRadius: 20,

  // Traffic and crowds.
  trafficCars: 26,
  pedestrians: 42,
  maxPolice: 6,

  // Wanted system: 0 calm, 5 the whole city on your tail.
  wantedDecayMs: 14000,
  policeSpawnMs: 2600,

  // Combat.
  bulletSpeed: 720,
  bulletDamage: 34,
  fireCooldownMs: 240,
  pistolAmmo: 60,

  // Camera and view.
  viewWidth: 1280,
  viewHeight: 800,
  minimapSize: 168,

  // Colours of a sun-soaked coastal city.
  palette: {
    grass: '#7fae5a',
    sand: '#e8d29a',
    sea: '#2f8fb5',
    road: '#3d3a38',
    roadLine: '#e8d44f',
    sidewalk: '#b9b2a4',
    buildingRoof: '#c96f4a',
    buildingRoof2: '#4a7a96',
    buildingRoof3: '#d9a441',
    palm: '#3f8f4f',
    hudBg: 'rgba(12, 14, 20, 0.72)',
    hudText: '#f5f1e6',
    accent: '#ffb02e',
    danger: '#ff4d4d',
  },
};

// District names paint the minimap and the mission text.
export const DISTRICTS = [
  { name: 'Marina Bay', x: 0, y: 2000, w: 1300, h: 600 },
  { name: 'Old Town', x: 0, y: 0, w: 900, h: 1000 },
  { name: 'Downtown', x: 900, y: 0, w: 900, h: 1100 },
  { name: 'Palm Heights', x: 1800, y: 0, w: 800, h: 1300 },
  { name: 'Harbor Row', x: 1300, y: 2000, w: 1300, h: 600 },
];

// Small deterministic random helper, so the city is the same every load.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Shortest signed turn from angle a toward angle b.
export function turnToward(a, b, maxStep) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + clamp(d, -maxStep, maxStep);
}
