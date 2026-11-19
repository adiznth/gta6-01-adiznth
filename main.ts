// Solmar Nights — the entrypoint for make.fun's gta6-01 bounty.
//
// What this program does, in plain terms: it takes the game that lives in
// this repository (the static files under game/, plus the screenshots under
// screenshots/) and lays them out in the output folder the grader reads,
// then writes dossier.json there — the summary the judge reads — using the
// vendored make.fun library, which must stay exactly as the kit shipped it.
//
// It runs on Node 22 with nothing but the standard library, and it runs
// twice in a sandbox: both runs have to produce byte-identical output, so
// there is no timestamp, no randomness and no network anywhere in here —
// just copying files and letting buildDossier describe them.
//
// To try it outside the grader, run:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and look in out/ for game/, screenshots/ and dossier.json.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The folder this file sits in is the repository root.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
// The grader sets /output; locally MAKEFUN_OUTPUT_DIR stands in for it.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

// The whole game, exactly as it is in the repo.
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// The screenshots, if the folder is there (it always is in a real entry).
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier: the same caps the scorer enforces, so a local run refuses
// exactly what the scorer would refuse — more than 4 screenshots, one over
// 256 KiB, or a game/ folder past its file and byte limits.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
