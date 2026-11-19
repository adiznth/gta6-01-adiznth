# Solmar Nights

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/adiznth/gta6-01-adiznth/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/adiznth/gta6-01-adiznth/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An open-world crime game set in Solmar, a sun-soaked coastal city that is entirely my own invention — its streets, its people, its cars and its story. You arrive with $250 and a name nobody knows. Rico and Mara have five jobs for you, the Solmar PD has other plans, and the whole city is yours to drive through.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network — the game is plain static files under `game/`, and it plays offline.

## What is in the city

- **A living open world**: driveable streets with traffic, pedestrians on the sidewalks, parks, palms and a beach at the southern edge, all drawn on a canvas with a camera that follows you.
- **Steal and drive**: walk up to any car, press E, and it is yours — the owner calls it in, so expect a star.
- **Wanted levels**: one to five stars. The Solmar PD sends cruisers that chase and ram you. Lose them and the heat fades; get caught with no health and you are busted.
- **Five missions, one story**: steal your first wheels, run a timed courier delivery, lose a two-star heat, tail a rival cab to the marina, and finish with the Solmar Bank heist at four stars. Each pays cash; finishing all five wins the game.
- **Combat and pickups**: a pistol (Space), cash lying on the street, and a health bar that matters.
- **HUD and minimap**: cash, health, ammo, wanted stars, the mission objective, a speedometer while driving, and a live minimap with the mission marker and police dots.
- **Sound, synthesized**: engine hum, sirens, gunshots and cash chimes are all made with WebAudio — no audio files shipped.
- **Save**: your cash and mission progress are kept in localStorage, so you can pick up where you left off.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move on foot, drive in a car |
| Shift | Run |
| E | Steal / enter a car, exit a car |
| Space | Shoot |
| P | Pause |
| M | Mute |

## Screenshots

The four images in `screenshots/` are real renders of the game running in Chrome: a three-star police chase (the cover), a downtown drive, a courier mission in progress, and the title screen.

## Structure

The game's source is split into small files under `game/src/`, one job each: `config.js` (tuning and palette), `world.js` (the city and its roads), `entities.js` (player, traffic, pedestrians, police), `missions.js` (the five-job story), `render.js` (all drawing, HUD and minimap), `input.js` (keyboard and mouse), `audio.js` (synthesized sound), `shots.js` (staged scenes for screenshots) and `main.js` (the game loop). `main.ts` at the root hands the entry to make.fun.

---

<sub>Entered on [make.fun](https://make.fun/?ref=p9nkmgn8&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
