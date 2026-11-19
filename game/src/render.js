// Solmar Nights — all drawing: the city, the cars, the people, the HUD,
// the minimap and the menus. Everything is canvas, so every screenshot
// shows exactly what the player sees.
import { CFG, clamp } from './config.js';
import { districtAt } from './world.js';

export function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-22, -11, 46, 24);
  ctx.fillStyle = car.color;
  roundRect(ctx, -21, -11, 42, 22, 6);
  ctx.fill();
  ctx.fillStyle = car.kind === 'police' ? '#e8e8e8' : '#222';
  ctx.fillRect(-6, -9, 12, 18); // cabin / windshield
  ctx.fillStyle = car.kind === 'police' ? '#2244aa' : '#9fd8ff';
  ctx.fillRect(4, -8, 8, 16);
  if (car.kind === 'police') {
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(-12, -9, 5, 4);
    ctx.fillStyle = '#2244ff';
    ctx.fillRect(-12, 5, 5, 4);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('POLICE', -14, 3);
  }
  if (car.kind === 'tail') {
    ctx.fillStyle = '#111';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('TAXI', -10, 3);
  }
  ctx.restore();
}

export function drawPed(ctx, ped) {
  ctx.save();
  ctx.translate(ped.x, ped.y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 3, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ped.color;
  ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(Math.cos(ped.angle) * 3, Math.sin(ped.angle) * 3, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawPlayer(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 4, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Orange jacket, dark jeans — the look of a Solmar street kid.
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(Math.cos(p.angle) * 5, Math.sin(p.angle) * 5, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffb02e';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 13, p.angle - 0.5, p.angle + 0.5); ctx.stroke();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawCity(ctx, city, cam, viewW, viewH) {
  const P = CFG.palette;
  // Ground: grass north, sand and sea south.
  ctx.fillStyle = P.grass;
  ctx.fillRect(cam.x - 40, cam.y - 40, viewW + 80, viewH + 80);
  ctx.fillStyle = P.sand;
  ctx.fillRect(cam.x - 40, 2050, viewW + 80, viewH + 80);
  ctx.fillStyle = P.sea;
  ctx.fillRect(cam.x - 40, 2380, viewW + 80, viewH + 80);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 5; i++) {
    const wx = ((i * 530 + 120) % CFG.worldSize);
    ctx.fillRect(wx, 2400 + (i % 2) * 40, 180, 6);
  }
  // Roads.
  ctx.fillStyle = P.road;
  for (const rx of city.roadsX) ctx.fillRect(rx - CFG.roadWidth / 2, cam.y - 40, CFG.roadWidth, viewH + 80);
  for (const ry of city.roadsY) ctx.fillRect(cam.x - 40, ry - CFG.roadWidth / 2, viewW + 80, CFG.roadWidth);
  // Dashed centre lines.
  ctx.fillStyle = P.roadLine;
  for (const rx of city.roadsX) {
    for (let y = Math.floor(cam.y / 48) * 48; y < cam.y + viewH; y += 48) ctx.fillRect(rx - 2, y, 4, 22);
  }
  for (const ry of city.roadsY) {
    for (let x = Math.floor(cam.x / 48) * 48; x < cam.x + viewW; x += 48) ctx.fillRect(x, ry - 2, 22, 4);
  }
  // Blocks: buildings with shaded roofs and windows, parks with grass.
  for (const b of city.blocks) {
    if (b.x + b.w < cam.x - 60 || b.x > cam.x + viewW + 60 || b.y + b.h < cam.y - 60 || b.y > cam.y + viewH + 60) continue;
    if (b.kind === 'park') {
      ctx.fillStyle = '#69a84f';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#5d9b45';
      ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 34, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(b.x + 5, b.y + 7, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(b.x, b.y, b.w, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    const cols = Math.max(1, Math.floor(b.w / 34));
    const rows = Math.max(1, Math.floor(b.h / 34));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      ctx.fillRect(b.x + 12 + i * 34, b.y + 16 + j * 34, 16, 12);
    }
  }
  // Palms.
  for (const palm of city.palms) {
    if (palm.x < cam.x - 40 || palm.x > cam.x + viewW + 40 || palm.y < cam.y - 40 || palm.y > cam.y + viewH + 40) continue;
    ctx.strokeStyle = '#6b4a2f';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(palm.x, palm.y); ctx.lineTo(palm.x + 3, palm.y - 12); ctx.stroke();
    ctx.fillStyle = CFG.palette.palm;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(palm.x + 3 + Math.cos(a) * 8, palm.y - 12 + Math.sin(a) * 6, 9, 3.5, a, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Mission target beacon.
  // (drawn by drawBeacon below)
}

export function drawBeacon(ctx, target, time) {
  if (!target) return;
  const pulse = 1 + Math.sin(time / 180) * 0.12;
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.strokeStyle = CFG.palette.accent;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,176,46,0.25)';
  ctx.beginPath(); ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CFG.palette.accent;
  ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(10, -34); ctx.lineTo(-10, -34); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawMinimap(ctx, game) {
  const size = CFG.minimapSize;
  const x0 = CFG.viewWidth - size - 16;
  const y0 = CFG.viewHeight - size - 16;
  const s = size / CFG.worldSize;
  ctx.save();
  ctx.fillStyle = CFG.palette.hudBg;
  roundRect(ctx, x0 - 6, y0 - 6, size + 12, size + 12, 10);
  ctx.fill();
  ctx.fillStyle = '#2c4a3a';
  ctx.fillRect(x0, y0, size, size);
  ctx.fillStyle = '#e8d29a';
  ctx.fillRect(x0, 2050 * s + y0, size, size - 2050 * s);
  ctx.fillStyle = '#2f8fb5';
  ctx.fillRect(x0, 2380 * s + y0, size, size - 2380 * s);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  for (const rx of game.city.roadsX) { ctx.beginPath(); ctx.moveTo(x0 + rx * s, y0); ctx.lineTo(x0 + rx * s, y0 + size); ctx.stroke(); }
  for (const ry of game.city.roadsY) { ctx.beginPath(); ctx.moveTo(x0, y0 + ry * s); ctx.lineTo(x0 + size, y0 + ry * s); ctx.stroke(); }
  if (game.mission && game.mission.target) {
    ctx.fillStyle = CFG.palette.accent;
    ctx.beginPath(); ctx.arc(x0 + game.mission.target.x * s, y0 + game.mission.target.y * s, 5, 0, Math.PI * 2); ctx.fill();
  }
  for (const car of game.police) {
    ctx.fillStyle = '#4d8dff';
    ctx.fillRect(x0 + car.x * s - 2, y0 + car.y * s - 2, 4, 4);
  }
  const p = game.player;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x0 + p.x * s, y0 + p.y * s, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = CFG.palette.accent;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x0 + p.x * s, y0 + p.y * s, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = CFG.palette.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(districtAt(p.x, p.y).toUpperCase(), x0, y0 - 10);
  ctx.restore();
}

export function drawHud(ctx, game) {
  const P = CFG.palette;
  const p = game.player;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  // Top-left: cash, health, ammo.
  ctx.fillStyle = P.hudBg;
  roundRect(ctx, 14, 14, 250, 86, 10);
  ctx.fill();
  ctx.fillStyle = '#7ee787';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`$${p.cash.toLocaleString()}`, 28, 24);
  ctx.fillStyle = P.hudText;
  ctx.font = '13px sans-serif';
  ctx.fillText(`HEALTH ${Math.max(0, Math.ceil(p.health))}`, 28, 58);
  ctx.fillStyle = '#333';
  ctx.fillRect(110, 58, 120, 10);
  ctx.fillStyle = p.health > 30 ? '#7ee787' : P.danger;
  ctx.fillRect(110, 58, 120 * clamp(p.health / 100, 0, 1), 10);
  ctx.fillStyle = P.hudText;
  ctx.fillText(p.inCar ? 'DRIVING' : `AMMO ${p.ammo}`, 28, 78);
  // Top-right: wanted stars.
  ctx.fillStyle = P.hudBg;
  roundRect(ctx, CFG.viewWidth - 220, 14, 206, 52, 10);
  ctx.fill();
  ctx.font = 'bold 26px sans-serif';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < p.wanted ? P.accent : '#555';
    ctx.fillText('\u2605', CFG.viewWidth - 200 + i * 38, 24);
  }
  ctx.font = '11px sans-serif';
  ctx.fillStyle = P.hudText;
  ctx.fillText(p.wanted > 0 ? 'WANTED — LOSE THE COPS' : 'CLEAN', CFG.viewWidth - 200, 52);
  // Top-centre: mission objective.
  if (game.mission && !game.mission.done) {
    ctx.fillStyle = P.hudBg;
    const label = `${game.mission.def.title}: ${game.mission.text}`;
    ctx.font = 'bold 14px sans-serif';
    const w = ctx.measureText(label).width + 28;
    roundRect(ctx, (CFG.viewWidth - w) / 2, 14, w, 34, 10);
    ctx.fill();
    ctx.fillStyle = P.accent;
    ctx.fillText(label, (CFG.viewWidth - w) / 2 + 14, 24);
  }
  // Bottom-left: controls hint.
  ctx.fillStyle = 'rgba(12,14,20,0.55)';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = P.hudText;
  const hint = p.inCar
    ? 'W/S drive  •  A/D steer  •  E exit car  •  P pause  •  M mute'
    : 'WASD move  •  Shift run  •  E steal car  •  Space shoot  •  P pause  •  M mute';
  ctx.fillText(hint, 16, CFG.viewHeight - 24);
  // Speedometer while driving, bottom-left so it never covers the minimap.
  if (p.inCar) {
    const kmh = Math.round(Math.abs(p.inCar.speed) * 0.36);
    ctx.fillStyle = P.hudBg;
    roundRect(ctx, 16, CFG.viewHeight - 96, 120, 56, 10);
    ctx.fill();
    ctx.fillStyle = P.hudText;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`${kmh}`, 36, CFG.viewHeight - 88);
    ctx.font = '12px sans-serif';
    ctx.fillText('km/h', 92, CFG.viewHeight - 82);
  }
  // Toast message.
  if (game.toastUntil > performance.now() && game.toast) {
    ctx.font = 'bold 17px sans-serif';
    const w = ctx.measureText(game.toast).width + 32;
    ctx.fillStyle = P.hudBg;
    roundRect(ctx, (CFG.viewWidth - w) / 2, 64, w, 36, 10);
    ctx.fill();
    ctx.fillStyle = P.hudText;
    ctx.fillText(game.toast, (CFG.viewWidth - w) / 2 + 16, 75);
  }
  ctx.restore();
}

export function drawTitle(ctx, game) {
  const W = CFG.viewWidth;
  const H = CFG.viewHeight;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#ff9a3d');
  g.addColorStop(0.55, '#e85d75');
  g.addColorStop(1, '#5b2a86');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Sun and skyline silhouette.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(W - 180, 150, 84, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1740';
  const skyline = [120, 200, 150, 260, 180, 230, 140, 280, 190, 160, 240, 130];
  let x = 0;
  for (const h of skyline) { ctx.fillRect(x, 560 - h, 110, h + 240); x += 110; }
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 92px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOLMAR', W / 2, 210);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 92px sans-serif';
  ctx.fillText('NIGHTS', W / 2, 300);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('An open-world crime story in the sun-soaked city of Solmar', W / 2, 350);
  ctx.fillStyle = 'rgba(12,14,20,0.75)';
  roundRect(ctx, W / 2 - 330, 420, 660, 190, 14);
  ctx.fill();
  ctx.fillStyle = '#f5f1e6';
  ctx.font = '16px sans-serif';
  ctx.fillText('Steal cars. Outrun the police. Run five missions for Rico and Mara.', W / 2, 452);
  ctx.fillText('WASD move / drive  •  E steal or enter a car  •  Space shoot  •  Shift run', W / 2, 484);
  ctx.fillText('Missions pay cash. Wanted stars bring the Solmar PD. Lose them to go clean.', W / 2, 516);
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(game.saveData && game.saveData.missionsDone > 0
    ? `PRESS ENTER — continue (${game.saveData.missionsDone}/5 missions done, $${game.saveData.cash})`
    : 'PRESS ENTER TO START', W / 2, 566);
  ctx.fillStyle = '#cbb8ff';
  ctx.font = '14px sans-serif';
  ctx.fillText('A fully original game — its city, people and story belong to Solmar Nights.', W / 2, 640);
  ctx.textAlign = 'left';
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(10,10,18,0.6)';
  ctx.fillRect(0, 0, CFG.viewWidth, CFG.viewHeight);
  ctx.fillStyle = '#f5f1e6';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CFG.viewWidth / 2, CFG.viewHeight / 2 - 10);
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P to keep playing', CFG.viewWidth / 2, CFG.viewHeight / 2 + 30);
  ctx.textAlign = 'left';
}

export function drawEnd(ctx, game, won) {
  ctx.fillStyle = 'rgba(10,10,18,0.78)';
  ctx.fillRect(0, 0, CFG.viewWidth, CFG.viewHeight);
  ctx.fillStyle = won ? '#ffb02e' : '#ff4d4d';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'SOLMAR IS YOURS' : 'BUSTED', CFG.viewWidth / 2, 320);
  ctx.fillStyle = '#f5f1e6';
  ctx.font = '20px sans-serif';
  ctx.fillText(won
    ? `All five missions done. You leave with $${game.player.cash.toLocaleString()} — king of Solmar.`
    : 'The Solmar PD caught up with you. The city keeps its secrets — for now.',
  CFG.viewWidth / 2, 370);
  ctx.font = '17px sans-serif';
  ctx.fillText(`Missions: ${game.stats.missionsDone}/5   •   Cash earned: $${game.stats.earned.toLocaleString()}   •   Cars stolen: ${game.stats.carsStolen}`, CFG.viewWidth / 2, 410);
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Press R to play again', CFG.viewWidth / 2, 470);
  ctx.textAlign = 'left';
}
