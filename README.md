# MathMon Quest

A browser-based, GBA-inspired, top-down creature-collecting math RPG for grade
school homeschool students. Think *XtraMath* and a classic handheld monster
RPG had a baby: you explore a pixel world, encounter wild creatures, and battle
trainers and gym leaders — but every battle is resolved through **math fluency
questions** instead of attack menus. All creatures, names, maps, music, and UI
are original to this project.

**▶ Play it: https://kirkc.github.io/mathmon-quest/**

Every push to `main` auto-builds and deploys via GitHub Actions
(`.github/workflows/deploy.yml`).

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build to dist/
```

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / WASD | Move |
| Enter / Space | Interact, advance dialog, confirm |
| 0–9 | Type answer (auto-submits on the last digit — no Enter needed) |
| Backspace | Delete digit |
| Esc | Pause menu in-game; back in menus |
| P | Parent dashboard |
| G | Math glossary |
| M | Mute music |

## How battles work

Battles run until one creature faints — tougher opponents simply have more
HP (wild < trainer < gym leader). Speed and correctness decide each exchange:

| Outcome | Player attack | Enemy attack |
| --- | --- | --- |
| Correct < 3s | Always hits, high damage | Misses 40% / low damage |
| Correct 3–6s | Always hits, moderate damage | Low damage |
| Correct 6–12s | 80% to hit, low damage | Moderate damage |
| Incorrect | Misses | High damage |
| Timeout (12s) | Misses | High damage |

Wrong answers and timeouts show the correct answer and require the student to
type it before the battle continues (XtraMath style). All tuning lives in
`src/config/battleConfig.ts`.

## Learning progression

Twelve tiers from Beginning Addition through Expanded Division
(`src/config/progressionConfig.ts`). A tier unlocks only when **all** hold:

- ≥ 30 questions attempted in the current tier
- ≥ 85% rolling accuracy (last 30 questions)
- ≥ 0.70 rolling fluency score
- < 10% timeout rate
- ≥ 3 battle wins in the tier, and not lost the 2 most recent battles
- The gym badge, where the ladder is gym-gated

The engine **never regresses** a student. When they struggle it plateaus —
same tier, easier facts favored — and creature XP keeps flowing so the game
still feels rewarding. Beating a gym awards the badge, but the progression
engine alone decides when the next tier unlocks.

## Architecture

```
src/
  config/            # all tuning knobs (battle, progression, world, controls)
  game/
    scenes/          # Boot, Preload, Title, SaveSlot, Overworld, Battle,
                     #   Dashboard, Glossary
    battle/          # BattleEngine (pure logic), BattleService, EncounterService
    math/            # QuestionRepository (swap JSON -> DB here), QuestionService
    progression/     # ProgressionService (fluency scoring, unlock rule)
    entities/        # CreatureService (XP, leveling)
    save/            # SaveService + slotted SaveBackend (swap localStorage -> DB here)
    data/            # questions.json seed, creatures, maps (ASCII), vocabulary
    gfx/             # procedural pixel art + animated grass/water canvas textures
    audio/           # WebAudio chiptune engine (original tunes, no files)
    ui/              # DialogBox, pixel font setup (Press Start 2P + VT323)
```

Two seams are built for the future database:
- `QuestionRepository` interface — replace `JsonQuestionRepository`.
- `SaveBackend` interface — replace `LocalStorageBackend`.

## Saves

Four local save slots (great for siblings). Each new game asks for the
player's name and an open slot; the slot list shows the name, partner
creature, current math focus, and last-saved time. The game auto-saves
after every battle, so progress is never lost. Saves from versions before
slots existed are migrated into Slot 1 automatically. Delete a save from
the Continue screen with X.

## What's in the current build

- 64x48 connected overworld: Meadow Town, Sumwood Trail (north fields),
  Whispering Woods (west), and Lake Lumen (east), with three trainers
  (Finn, Maya, Theo) plus the Addition Gym with Leader Ada
- **Minus Marsh**: a swampy second region north of town with its own
  ecosystem — murky pools, lily pads, reeds, mushrooms, dead trees, marsh
  music, two trainers (Fern, Silt), and three new wild creatures
  (Croakle, Wisplit, Snailby). Gated behind the Sum Badge + unlocking
  Beginning Subtraction
- **Your own house**: a distinct teal-roofed home in the town center with
  two floors (living room + bedroom). The computer downstairs runs the
  MathMart shop — spend battle coins on 19 furniture items (door mat to
  big-screen TV, including starter plushies) that appear in fixed spots.
  Your partner creature lives there, hopping happily around
- Full timing-based battle system with auto-submit answers, attack
  animations, damage popups, and XtraMath-style remediation
- Adaptive 12-tier progression that never regresses and plateaus while
  the student struggles
- Four named save slots with auto-save after every battle, plus a pause
  menu (Esc) with how-to-play and controls pages
- Pixel typography (Press Start 2P + VT323), shaded procedural pixel
  art, a 3-frame walk cycle, and purpose-driven ambient animation: only
  tall grass (encounters) and water (future fishing) move
- Parent dashboard, math glossary, original WebAudio chiptune music

## TODO — next milestones

- [ ] More maps: Difference Cave (+ Subtraction Gym), Factor Farm,
      Product Peaks, Quotient Coast, Division Dojo + their gyms
- [ ] More creatures, evolutions, and catching wild creatures (party growth)
- [ ] Real asset pipeline (sprite atlas, Tiled tilemaps) replacing
      procedural placeholders
- [ ] Creature idle animations in battle; richer attack effects per type
- [ ] Real database integration behind QuestionRepository + SaveBackend
      (would also let saves sync across devices)
- [ ] Sound effects polish and per-area music tracks
- [ ] Fishing at Lake Lumen
- [ ] Expanded question sets (word problems, missing-addend forms)
- [ ] Accessibility: font scaling, dyslexia-friendly font option, color-blind
      safe palette, configurable timing for IEP accommodations
- [ ] Items / creature center instead of auto-heal after battles
