// Solmar Nights — missions and story: a five-job arc across the city.
// Each mission is a small state machine with an objective, a target point,
// a reward, and a wanted-level twist. Finishing all five is the win.
import { dist } from './config.js';

export const MISSIONS = [
  {
    id: 1,
    title: 'First Wheels',
    giver: 'Rico',
    brief: 'Rico needs a driver. Steal any car on the street and bring it to his garage.',
    objective: 'Steal a car (walk up to one, press E)',
    reward: 400,
  },
  {
    id: 2,
    title: 'Courier Run',
    giver: 'Mara',
    brief: 'Mara has a package for the Sunset Pier. Pick it up at the Old Market, then deliver it before the timer runs out.',
    objective: 'Pick up the package at the Old Market',
    reward: 700,
  },
  {
    id: 3,
    title: 'Heat',
    giver: 'Rico',
    brief: 'The cops saw too much. Lose the heat — get your wanted level back to zero, then lay low at the safehouse.',
    objective: 'Lose the cops, then reach the safehouse',
    reward: 900,
  },
  {
    id: 4,
    title: 'The Tail',
    giver: 'Mara',
    brief: 'A rival courier is running the Harbor Row route. Follow his yellow cab without spooking him, then grab his drop at the marina.',
    objective: 'Follow the yellow cab to the marina',
    reward: 1200,
  },
  {
    id: 5,
    title: 'Solmar Heist',
    giver: 'Rico',
    brief: 'The big one. Hit the Solmar Bank, grab the cash, and outrun a four-star response to the safehouse. Good luck, kid.',
    objective: 'Reach the Solmar Bank',
    reward: 3000,
  },
];

export function startMission(game, index) {
  const def = MISSIONS[index];
  const city = game.city;
  const m = {
    def, index, stage: 0, timer: 0, done: false,
    target: null, text: def.objective, tailCar: null,
  };
  if (index === 0) m.target = city.spots.garage;
  if (index === 1) { m.target = city.spots.market; m.timer = 0; }
  if (index === 2) { game.player.wanted = Math.max(game.player.wanted, 2); m.target = city.spots.safehouse; }
  if (index === 3) {
    m.tailCar = game.traffic.find((c) => c.color === '#f1c40f') || game.traffic[0];
    if (m.tailCar) { m.tailCar.kind = 'tail'; m.tailCar.color = '#f1c40f'; }
    m.target = m.tailCar ? { x: m.tailCar.x, y: m.tailCar.y } : city.spots.marina;
  }
  if (index === 4) m.target = city.spots.bank;
  game.mission = m;
  game.toast = `${def.title} — ${def.giver}: ${def.brief}`;
  game.sounds.mission();
  return m;
}

export function updateMission(game, dt) {
  const m = game.mission;
  if (!m || m.done) return;
  const p = game.player;
  const near = (t, r) => t && dist(p.x, p.y, t.x, t.y) < r;

  if (m.index === 0) {
    if (p.inCar && m.stage === 0) { m.stage = 1; m.text = 'Drive the car to Rico\u2019s Garage'; }
    if (m.stage === 1 && near(game.city.spots.garage, 90)) completeMission(game);
  } else if (m.index === 1) {
    if (m.stage === 0 && near(game.city.spots.market, 70)) {
      m.stage = 1; m.timer = 75; m.target = game.city.spots.pier;
      m.text = 'Deliver the package to Sunset Pier — 75 seconds!';
      game.toast = 'Package picked up. Move!';
      game.sounds.pickup();
    } else if (m.stage === 1) {
      m.timer -= dt;
      m.text = `Deliver the package to Sunset Pier — ${Math.max(0, Math.ceil(m.timer))}s left`;
      if (m.timer <= 0) { failMission(game, 'Too slow — the client walked away.'); return; }
      if (near(game.city.spots.pier, 80)) completeMission(game);
    }
  } else if (m.index === 2) {
    if (p.wanted === 0 && m.stage === 0) { m.stage = 1; m.text = 'Heat is off — get to the safehouse'; game.toast = 'Clean. Now disappear.'; }
    if (m.stage === 1 && near(game.city.spots.safehouse, 80)) completeMission(game);
  } else if (m.index === 3) {
    if (m.tailCar) {
      m.target = { x: m.tailCar.x, y: m.tailCar.y };
      const d = dist(p.x, p.y, m.tailCar.x, m.tailCar.y);
      if (d < 60) { failMission(game, 'You spooked him — he burned rubber and vanished.'); return; }
      if (m.stage === 0) m.text = 'Follow the yellow cab — stay close, not too close';
      if (near(game.city.spots.marina, 140) && d < 320) {
        m.stage = 1; m.target = game.city.spots.marina;
        m.text = 'Grab the drop at the marina';
      }
    }
    if (m.stage === 1 && near(game.city.spots.marina, 80)) completeMission(game);
  } else if (m.index === 4) {
    if (m.stage === 0 && near(game.city.spots.bank, 80)) {
      m.stage = 1; m.target = game.city.spots.safehouse;
      m.text = 'Cash grabbed! Escape to the safehouse — 4 stars!';
      p.wanted = 4; p.cash += 1500;
      game.toast = 'Vault emptied. Run!';
      game.sounds.cash();
    } else if (m.stage === 1 && near(game.city.spots.safehouse, 80) && p.wanted === 0) {
      completeMission(game);
    } else if (m.stage === 1) {
      m.text = 'Escape to the safehouse — lose the cops first!';
    }
  }
}

export function completeMission(game) {
  const m = game.mission;
  m.done = true;
  game.player.cash += m.def.reward;
  game.stats.missionsDone += 1;
  game.stats.earned += m.def.reward;
  game.toast = `${m.def.title} complete! +$${m.def.reward}`;
  game.sounds.cash();
  game.save();
  if (m.index + 1 < MISSIONS.length) {
    setTimeout(() => { if (game.state === 'play') startMission(game, m.index + 1); }, 2600);
  } else {
    game.state = 'won';
    game.sounds.mission();
    game.save();
  }
}

export function failMission(game, reason) {
  game.toast = `Mission failed: ${reason}`;
  game.sounds.fail();
  game.mission = null;
  setTimeout(() => { if (game.state === 'play') startMission(game, game.stats.missionsDone); }, 2600);
}
