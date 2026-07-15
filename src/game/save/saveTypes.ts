import type { QuestionOutcome } from '../math/types';

/** One creature owned by the player. */
export interface CreatureInstance {
  speciesId: string;
  nickname?: string;
  level: number;
  xp: number;
  maxHp: number;
  currentHp: number;
}

/** Per-question memory used by the adaptive selector. */
export interface QuestionHistoryEntry {
  attempts: number;
  misses: number;
  timeouts: number;
  lastResponseMs: number;
  lastOutcome: QuestionOutcome;
  /** Consecutive fast-correct answers (mastery signal). */
  fastStreak: number;
}

/** Stats tracked for each operation+tier (one entry per level number). */
export interface LevelStats {
  levelNumber: number;
  operation: string;
  tier: string;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  timeoutCount: number;
  fastCorrectCount: number;
  mediumCorrectCount: number;
  slowCorrectCount: number;
  /** Rolling window (most recent last) of outcome labels. */
  recentOutcomes: QuestionOutcome[];
  /** Rolling window of fluency scores matching recentOutcomes. */
  recentScores: number[];
  totalResponseMs: number;
  battleWins: number;
  battleLosses: number;
  /** Most recent battle results, true = win (most recent last). */
  recentBattles: boolean[];
  /** Battles fought while unlock criteria were unmet (plateau length). */
  currentPlateauCount: number;
  lastUnlockedAt?: string;
}

export interface SaveData {
  version: 1;
  createdAt: string;
  updatedAt: string;
  player: {
    name: string;
    coins: number;
    mapKey: string;
    tileX: number;
    tileY: number;
    facing: 'up' | 'down' | 'left' | 'right';
  };
  party: CreatureInstance[];
  progression: {
    currentLevelNumber: number;
    perLevel: Record<number, LevelStats>;
  };
  questionHistory: Record<string, QuestionHistoryEntry>;
  defeatedTrainers: string[];
  badges: string[];
  /** Earned trophy ids (see data/trophies.ts), in the order they were won. */
  trophies: string[];
  /** Furniture purchased for the player's house (item ids). */
  house: {
    ownedItems: string[];
  };
  /** Gear the player carries (see GEAR_ITEMS in data/houseItems.ts). */
  inventory: {
    items: string[];
  };
  totals: {
    battlesWon: number;
    battlesLost: number;
    questionsAnswered: number;
  };
}
