/**
 * World-level tuning: tile size, encounter rates, and area definitions.
 */
export const worldConfig = {
  /** Logical art is 16px; we render at 2x for a crisp 480x320 GBA-style view. */
  tileSize: 32,
  pixelScale: 2,
  gameWidth: 480,
  gameHeight: 320,

  /** Grid step duration in ms (classic GBA walking pace). */
  stepDurationMs: 190,

  /** Where new games start and where the player respawns after a loss. */
  spawn: { mapKey: 'overworld', tileX: 33, tileY: 42, facing: 'down' as const },

  encounters: {
    /** Chance per tall-grass step of triggering a wild battle. */
    chancePerStep: 0.12,
    /** Minimum grass steps between encounters so battles don't chain. */
    minStepsBetween: 3,
  },

  /** Themed areas mapped to the learning ladder (vertical slice ships the first two + gym 1). */
  areas: {
    meadowTown: {
      id: 'meadow-town',
      name: 'Meadow Town',
      levelFocus: 1,
      wildSpecies: ['pebblit', 'fluffinch'],
      wildHp: { min: 25, max: 32 },
      fishSpecies: ['carpi', 'jellisum'],
      fishHp: { min: 28, max: 36 },
    },
    sumwoodTrail: {
      id: 'sumwood-trail',
      name: 'Sumwood Trail',
      levelFocus: 2,
      wildSpecies: ['pebblit', 'fluffinch', 'buzzlet'],
      wildHp: { min: 28, max: 38 },
      fishSpecies: ['carpi', 'jellisum'],
      fishHp: { min: 30, max: 40 },
    },
    minusMarsh: {
      id: 'minus-marsh',
      name: 'Minus Marsh',
      levelFocus: 3,
      wildSpecies: ['croakle', 'wisplit', 'snailby'],
      wildHp: { min: 32, max: 44 },
      fishSpecies: ['carpi', 'croakle', 'octoplus'],
      fishHp: { min: 34, max: 46 },
    },
    quotientCoast: {
      id: 'quotient-coast',
      name: 'Quotient Coast',
      levelFocus: 5,
      wildSpecies: ['sandigit', 'gulltiply', 'crabacus', 'fivestar'],
      wildHp: { min: 40, max: 55 },
      fishSpecies: ['carpi', 'octoplus', 'jellisum', 'fivestar', 'turtally', 'crabacus'],
      fishHp: { min: 42, max: 58 },
    },
  },
} as const;

export type AreaId = keyof typeof worldConfig.areas;
