// Solmar Nights — the city itself: a seeded grid of blocks, roads,
// buildings, palms and the beach, plus the road graph traffic drives on.
import { CFG, DISTRICTS, mulberry32 } from './config.js';

export function buildCity() {
  const rand = mulberry32(CFG.seed);
  const blocks = [];
  const palms = [];
  const pickups = [];
  const step = CFG.blockSize + CFG.roadWidth;
  const roofs = [CFG.palette.buildingRoof, CFG.palette.buildingRoof2, CFG.palette.buildingRoof3];

  for (let by = 0; by < CFG.worldSize; by += step) {
    for (let bx = 0; bx < CFG.worldSize; bx += step) {
      const beach = by + CFG.blockSize > 2050;
      if (beach) continue; // the southern strip is sand and sea
      const kind = rand();
      if (kind < 0.14) {
        // A park block: grass, palms, a cash pickup.
        const px = bx + 30 + rand() * (CFG.blockSize - 60);
        const py = by + 30 + rand() * (CFG.blockSize - 60);
        blocks.push({ x: bx, y: by, w: CFG.blockSize, h: CFG.blockSize, kind: 'park' });
        for (let i = 0; i < 5; i++) {
          palms.push({ x: bx + 25 + rand() * (CFG.blockSize - 50), y: by + 25 + rand() * (CFG.blockSize - 50) });
        }
        if (rand() < 0.6) pickups.push({ x: px, y: py, kind: 'cash', amount: 150 + Math.floor(rand() * 250), taken: false });
        continue;
      }
      // A built block: one or two buildings with a courtyard gap.
      const split = rand() < 0.5;
      const roof = roofs[Math.floor(rand() * roofs.length)];
      if (split) {
        const w1 = CFG.blockSize * (0.35 + rand() * 0.2);
        blocks.push({ x: bx, y: by, w: w1, h: CFG.blockSize, kind: 'building', roof, hgt: 8 + rand() * 22 });
        blocks.push({ x: bx + w1 + 26, y: by, w: CFG.blockSize - w1 - 26, h: CFG.blockSize, kind: 'building', roof, hgt: 8 + rand() * 22 });
      } else {
        blocks.push({ x: bx, y: by, w: CFG.blockSize, h: CFG.blockSize, kind: 'building', roof, hgt: 10 + rand() * 26 });
      }
      if (rand() < 0.35) {
        palms.push({ x: bx + 8, y: by + 8 });
        palms.push({ x: bx + CFG.blockSize - 8, y: by + CFG.blockSize - 8 });
      }
    }
  }

  // Road centre lines, for traffic waypoints and the minimap.
  const roadsX = [];
  const roadsY = [];
  for (let x = CFG.roadWidth / 2; x < CFG.worldSize; x += step) roadsX.push(x);
  for (let y = CFG.roadWidth / 2; y < CFG.worldSize; y += step) roadsY.push(y);

  // Named spots the missions use — all on road intersections, never
  // inside a building block, so the player can always stand on them.
  const spots = {
    safehouse: { x: 316, y: 600, label: 'Safehouse' },
    marina: { x: 300, y: 2250, label: 'Marina Bay' },
    bank: { x: 1452, y: 316, label: 'Solmar Bank' },
    garage: { x: 2020, y: 1452, label: 'Rico\u2019s Garage' },
    market: { x: 600, y: 1452, label: 'Old Market' },
    pier: { x: 1250, y: 2400, label: 'Sunset Pier' },
  };

  return { blocks, palms, pickups, roadsX, roadsY, spots };
}

// True when a point is inside a building (solid) or outside the city.
export function hitsBuilding(city, x, y, pad) {
  if (x < 0 || y < 0 || x > CFG.worldSize || y > CFG.worldSize) return true;
  for (const b of city.blocks) {
    if (b.kind !== 'building') continue;
    if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true;
  }
  return false;
}

// Nearest point on a road centre line, used to keep traffic on the streets.
export function nearestRoadPoint(city, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const rx of city.roadsX) {
    const d = Math.abs(x - rx);
    if (d < bestD) { bestD = d; best = { x: rx, y, axis: 'x' }; }
  }
  for (const ry of city.roadsY) {
    const d = Math.abs(y - ry);
    if (d < bestD) { bestD = d; best = { x, y: ry, axis: 'y' }; }
  }
  return best;
}

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d.name;
  }
  return 'Solmar';
}
