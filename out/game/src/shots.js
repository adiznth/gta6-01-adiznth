// Solmar Nights — staged scenes for screenshots: the game reads ?shot=
// from the URL and sets up a moment worth photographing — a title screen,
// a downtown drive, a police chase, or a mission in progress. The same
// code path runs for a real player; staging only picks the starting state.
import { CFG, dist } from './config.js';
import { makeCar } from './entities.js';
import { startMission } from './missions.js';

export function applyShot(game, shot) {
  const p = game.player;
  const city = game.city;

  if (shot === 'start') {
    // Title screen: nothing to stage, the menu is the shot.
    game.state = 'title';
    return;
  }

  game.state = 'play';
  game.sounds = game.sounds; // audio stays silent until a key press
  // Keep the getaway rolling in staged shots: no keyboard is pressed in a
  // screenshot, so the game holds the throttle for the player.
  game.cruise = true;
  const clearNear = (x, y) => {
    game.traffic = game.traffic.filter((c) => dist(c.x, c.y, x, y) > 160);
  };

  if (shot === 'drive') {
    // Downtown, behind the wheel in traffic, mission 1 live.
    const car = makeCar(1150, 420, 0, 'traffic');
    car.color = '#e74c3c';
    clearNear(car.x, car.y);
    game.traffic.push(car);
    p.x = car.x; p.y = car.y;
    p.inCar = car;
    car.speed = 260;
    startMission(game, 0);
    game.mission.stage = 1;
    game.mission.text = 'Drive the car to Rico\u2019s Garage';
    game.showToast('First Wheels — drive to Rico\u2019s Garage', 60000);
  } else if (shot === 'chase') {
    // Four-star heat: three cruisers closing in on a speeding getaway car.
    const car = makeCar(1400, 900, Math.PI / 2, 'traffic');
    car.color = '#1abc9c';
    clearNear(car.x, car.y);
    game.traffic.push(car);
    p.x = car.x; p.y = car.y;
    p.inCar = car;
    car.speed = 380;
    p.wanted = 3;
    p.cash = 4820;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.7;
      const cop = makeCar(p.x + Math.cos(a) * 260, p.y + Math.sin(a) * 260, a, 'police');
      cop.speed = 300;
      game.police.push(cop);
    }
    startMission(game, 2);
    game.mission.stage = 0;
    game.mission.text = 'Lose the cops, then reach the safehouse';
    game.showToast('WANTED — 3 stars! Lose the Solmar PD!', 60000);
  } else if (shot === 'mission') {
    // On foot at the Old Market, courier package waiting, cab tail nearby.
    p.x = city.spots.market.x + 40;
    p.y = city.spots.market.y + 30;
    p.cash = 1750;
    p.ammo = 42;
    const car = makeCar(p.x + 90, p.y - 40, Math.PI, 'traffic');
    car.color = '#f1c40f';
    game.traffic.push(car);
    startMission(game, 1);
    game.showToast('Courier Run — pick up the package at the Old Market', 60000);
  } else {
    startMission(game, 0);
  }

  // Freeze a lively frame: let traffic and peds settle for a moment so the
  // screenshot shows a living street, not an empty one.
  for (let i = 0; i < 40; i++) {
    for (const car of game.traffic) {
      if (car !== p.inCar) {
        car.x += Math.cos(car.angle) * car.speed * 0.016;
        car.y += Math.sin(car.angle) * car.speed * 0.016;
      }
    }
  }
  game.cam.x = Math.max(-40, Math.min(p.x - CFG.viewWidth / 2, CFG.worldSize - CFG.viewWidth + 40));
  game.cam.y = Math.max(-40, Math.min(p.y - CFG.viewHeight / 2, CFG.worldSize - CFG.viewHeight + 40));
}
