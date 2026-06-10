import type { MathOperation, MathTier } from '../game/math/types';

export interface LevelDefinition {
  levelNumber: number;
  operation: MathOperation;
  tier: MathTier;
  levelName: string;
  /** Badge id that must be earned before this level can unlock (gym gate). */
  requiresBadge?: string;
}

/**
 * The fixed learning ladder. The student climbs it one rung at a time and
 * NEVER moves back down.
 */
export const LEVELS: LevelDefinition[] = [
  { levelNumber: 1, operation: 'addition', tier: 'beginning', levelName: 'Beginning Addition' },
  { levelNumber: 2, operation: 'addition', tier: 'regular', levelName: 'Regular Addition' },
  { levelNumber: 3, operation: 'subtraction', tier: 'beginning', levelName: 'Beginning Subtraction', requiresBadge: 'addition-gym' },
  { levelNumber: 4, operation: 'subtraction', tier: 'regular', levelName: 'Regular Subtraction' },
  { levelNumber: 5, operation: 'multiplication', tier: 'beginning', levelName: 'Beginning Multiplication', requiresBadge: 'subtraction-gym' },
  { levelNumber: 6, operation: 'multiplication', tier: 'regular', levelName: 'Regular Multiplication' },
  { levelNumber: 7, operation: 'division', tier: 'beginning', levelName: 'Beginning Division', requiresBadge: 'multiplication-gym' },
  { levelNumber: 8, operation: 'division', tier: 'regular', levelName: 'Regular Division' },
  { levelNumber: 9, operation: 'addition', tier: 'expanded', levelName: 'Expanded Addition', requiresBadge: 'division-gym' },
  { levelNumber: 10, operation: 'subtraction', tier: 'expanded', levelName: 'Expanded Subtraction' },
  { levelNumber: 11, operation: 'multiplication', tier: 'expanded', levelName: 'Expanded Multiplication' },
  { levelNumber: 12, operation: 'division', tier: 'expanded', levelName: 'Expanded Division' },
];

export const progressionConfig = {
  /** Rolling window of recent question results used for fluency scoring. */
  rollingWindowSize: 30,

  /** Score awarded per question outcome (rolling fluency average). */
  outcomeScores: {
    fast: 1.0,
    medium: 0.75,
    slow: 0.45,
    incorrect: 0,
    timeout: 0,
  },

  /**
   * A new tier unlocks only when ALL of these hold for the current tier.
   * Gym-gated levels additionally require the badge (see LEVELS).
   */
  unlock: {
    minAttempts: 30,
    minAccuracy: 0.85,
    minFluencyScore: 0.7,
    maxTimeoutRate: 0.1,
    minBattleWins: 3,
    /** Block unlock if the student lost this many most-recent battles in a row. */
    recentLossBlock: 2,
  },

  /**
   * Struggle support: when rolling accuracy over the last `window` questions
   * drops below `accuracyThreshold`, the question selector favors easier
   * facts within the SAME tier. The student is never moved backward.
   */
  struggle: {
    window: 10,
    accuracyThreshold: 0.6,
  },
} as const;
