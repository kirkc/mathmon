/**
 * All battle tuning values live here so gameplay balance can be
 * adjusted without touching battle logic.
 */
export type BattleType = 'wild' | 'trainer' | 'gym';

export const battleConfig = {
  /** Timing model (milliseconds). */
  timing: {
    /** Correct under this = fast fact (full power). */
    fastMs: 3000,
    /** Correct under this = fluent (moderate power). */
    fluentMs: 6000,
    /** Past this with no correct answer = timeout. */
    lateMs: 12000,
    /** Hard cap on the "type the correct answer" remediation step. */
    hardTimeoutMs: 20000,
  },

  /** Damage the player's creature deals. */
  playerDamage: {
    high: 14,
    moderate: 9,
    low: 5,
  },

  /** Damage the enemy creature deals. */
  enemyDamage: {
    high: 12,
    moderate: 8,
    low: 4,
  },

  hitChance: {
    /** Player hit chance on a slow (6-12s) correct answer. */
    slowPlayerHit: 0.8,
    /** Enemy miss chance when the player answers fast (<3s). */
    fastEnemyMiss: 0.4,
  },

  /** Starter creature max HP. */
  starterMaxHp: 40,

  /** Enemy HP ranges by battle type (gym uses fixed per-leader HP). */
  wildHp: { min: 25, max: 45 },
  trainerHp: { min: 50, max: 80 },
  gymHp: { min: 120, max: 180 },

  /** Post-battle rewards. */
  rewards: {
    wild: { coins: 5, xp: 15 },
    trainer: { coins: 12, xp: 35 },
    gym: { coins: 30, xp: 90 },
  } satisfies Record<BattleType, { coins: number; xp: number }>,

  /** Consolation rewards on a loss (never zero — effort counts). */
  lossRewards: { coins: 2, xp: 5 },

  /** Post-victory befriending: a defeated wild mon may offer to join. */
  catching: {
    /** Chance a defeated wild creature asks to join (party not full). */
    offerChance: 0.4,
    /** The bonus question must be answered within this window. */
    answerWindowMs: 6000,
    partyCap: 6,
    /** New recruits join a couple of levels below your partner. */
    levelDeficit: 2,
  },
} as const;
