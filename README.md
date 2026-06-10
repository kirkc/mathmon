# MathMon Quest

A browser-based, GBA-inspired, top-down creature-collecting math RPG for grade
school homeschool students. Think *XtraMath* and a classic handheld monster
RPG had a baby: you explore a pixel world, encounter wild creatures, and battle
trainers and gym leaders — but every battle is resolved through **math fluency
questions** instead of attack menus. All creatures, names, maps, music, and UI
are original to this project.

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
| 0–9 | Type answer during battle |
| Backspace | Delete digit |
| Enter | Submit answer |
| P | Parent dashboard |
| G | Math glossary |
| M | Mute music |
| Esc | Back (menus) |

## How battles work

Each battle asks a fixed number of questions (wild 4, trainer 8, gym 20).
Speed and correctness decide the exchange:

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
    scenes/          # Boot, Preload, Title, Overworld, Battle, Dashboard, Glossary
    battle/          # BattleEngine (pure logic), BattleService, EncounterService
    math/            # QuestionRepository (swap JSON -> DB here), QuestionService
    progression/     # ProgressionService (fluency scoring, unlock rule)
    entities/        # CreatureService (XP, leveling)
    save/            # SaveService + SaveBackend (swap localStorage -> DB here)
    data/            # questions.json seed, creatures, maps (ASCII), vocabulary
    gfx/             # procedural placeholder pixel art
    audio/           # WebAudio chiptune engine (original tunes, no files)
    ui/              # DialogBox
```

Two seams are built for the future database:
- `QuestionRepository` interface — replace `JsonQuestionRepository`.
- `SaveBackend` interface — replace `LocalStorageBackend`.

## Milestone 1 (this build)

Title screen, starter pick, Meadow Town + Sumwood Trail map, tall-grass wild
battles, Trainer Finn, the Addition Gym with Leader Ada, full timing-based
battle system, adaptive progression with plateau, localStorage saves, parent
dashboard, math glossary, original chiptune music.

## TODO — Milestone 2+

- [ ] More maps: Minus Marsh, Difference Cave, Factor Farm, Product Peaks,
      Quotient Coast, Division Dojo + their gyms
- [ ] More creatures, evolutions, and catching wild creatures (party growth)
- [ ] Real asset pipeline (sprite atlas, Tiled tilemaps) replacing
      procedural placeholders
- [ ] Walk-cycle and battle animations; creature idle bounce
- [ ] Real database integration behind QuestionRepository + SaveBackend
- [ ] Sound effects polish and per-area music tracks
- [ ] Multiple child profiles with a profile picker
- [ ] Expanded question sets (word problems, missing-addend forms)
- [ ] Accessibility: font scaling, dyslexia-friendly font option, color-blind
      safe palette, configurable timing for IEP accommodations
- [ ] Items / creature center instead of auto-heal after battles
- [ ] Pause menu with save slot management
