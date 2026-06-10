import { LEVELS, progressionConfig, type LevelDefinition } from '../../config/progressionConfig';
import type { QuestionOutcome, QuestionResult } from '../math/types';
import type { SaveService } from '../save/SaveService';
import type { LevelStats } from '../save/saveTypes';

export interface UnlockCheck {
  unlocked: boolean;
  /** Set when unlocked = true. */
  newLevel?: LevelDefinition;
  /** Human-readable reasons the unlock is still locked (for dashboard/gym dialog). */
  unmetReasons: string[];
  /** True when only the gym badge is missing. */
  onlyBadgeMissing: boolean;
}

/**
 * Tracks per-tier fluency and decides when the student is ready for the
 * next tier. Core promises:
 *  - NEVER regresses the student to an earlier operation or tier.
 *  - Plateaus (keeps serving the current tier) while the student struggles.
 *  - Unlocks are earned through demonstrated fluency, not battle count.
 */
export class ProgressionService {
  constructor(private readonly save: SaveService) {}

  getCurrentLevel(): LevelDefinition {
    const n = this.save.requireData().progression.currentLevelNumber;
    return LEVELS.find((l) => l.levelNumber === n) ?? LEVELS[0];
  }

  getLevelStats(levelNumber: number): LevelStats {
    const data = this.save.requireData();
    let stats = data.progression.perLevel[levelNumber];
    if (!stats) {
      const def = LEVELS.find((l) => l.levelNumber === levelNumber) ?? LEVELS[0];
      stats = {
        levelNumber,
        operation: def.operation,
        tier: def.tier,
        attemptedCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        timeoutCount: 0,
        fastCorrectCount: 0,
        mediumCorrectCount: 0,
        slowCorrectCount: 0,
        recentOutcomes: [],
        recentScores: [],
        totalResponseMs: 0,
        battleWins: 0,
        battleLosses: 0,
        recentBattles: [],
        currentPlateauCount: 0,
      };
      data.progression.perLevel[levelNumber] = stats;
    }
    return stats;
  }

  recordQuestionResult(result: QuestionResult): void {
    const stats = this.getLevelStats(result.levelNumber);
    const score = progressionConfig.outcomeScores[result.outcome];

    stats.attemptedCount += 1;
    stats.totalResponseMs += result.responseMs;
    if (result.correct) {
      stats.correctCount += 1;
      if (result.outcome === 'fast') stats.fastCorrectCount += 1;
      else if (result.outcome === 'medium') stats.mediumCorrectCount += 1;
      else stats.slowCorrectCount += 1;
    } else if (result.outcome === 'timeout') {
      stats.timeoutCount += 1;
    } else {
      stats.incorrectCount += 1;
    }

    stats.recentOutcomes.push(result.outcome);
    stats.recentScores.push(score);
    while (stats.recentOutcomes.length > progressionConfig.rollingWindowSize) {
      stats.recentOutcomes.shift();
      stats.recentScores.shift();
    }

    this.save.requireData().totals.questionsAnswered += 1;
  }

  recordBattleResult(levelNumber: number, won: boolean): void {
    const stats = this.getLevelStats(levelNumber);
    if (won) stats.battleWins += 1;
    else stats.battleLosses += 1;
    stats.recentBattles.push(won);
    while (stats.recentBattles.length > 10) stats.recentBattles.shift();

    const totals = this.save.requireData().totals;
    if (won) totals.battlesWon += 1;
    else totals.battlesLost += 1;
  }

  /** Rolling accuracy over the fluency window (0..1). */
  getRollingAccuracy(levelNumber: number): number {
    const { recentOutcomes } = this.getLevelStats(levelNumber);
    if (recentOutcomes.length === 0) return 1;
    const correct = recentOutcomes.filter(
      (o) => o === 'fast' || o === 'medium' || o === 'slow',
    ).length;
    return correct / recentOutcomes.length;
  }

  /** Rolling average response score (0..1) — the currentFluencyScore. */
  getFluencyScore(levelNumber: number): number {
    const { recentScores } = this.getLevelStats(levelNumber);
    if (recentScores.length === 0) return 0;
    return recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  }

  getTimeoutRate(levelNumber: number): number {
    const { recentOutcomes } = this.getLevelStats(levelNumber);
    if (recentOutcomes.length === 0) return 0;
    return recentOutcomes.filter((o) => o === 'timeout').length / recentOutcomes.length;
  }

  /** Composite mastery score 0..100 shown on the dashboard. */
  getMasteryScore(levelNumber: number): number {
    const accuracy = this.getRollingAccuracy(levelNumber);
    const fluency = this.getFluencyScore(levelNumber);
    return Math.round((accuracy * 0.5 + fluency * 0.5) * 100);
  }

  /**
   * True when the student is struggling in the current tier — the question
   * selector responds by favoring easier facts WITHIN the tier.
   */
  isStruggling(levelNumber: number): boolean {
    const { recentOutcomes } = this.getLevelStats(levelNumber);
    const window = recentOutcomes.slice(-progressionConfig.struggle.window);
    if (window.length < progressionConfig.struggle.window) return false;
    const correct = window.filter(
      (o) => o === 'fast' || o === 'medium' || o === 'slow',
    ).length;
    return correct / window.length < progressionConfig.struggle.accuracyThreshold;
  }

  /**
   * Evaluate the unlock rule for the current tier. When every criterion is
   * met (including any gym badge gate), advances the student and returns
   * the newly unlocked level. Otherwise increments the plateau counter.
   */
  checkUnlock(): UnlockCheck {
    const data = this.save.requireData();
    const current = this.getCurrentLevel();
    const next = LEVELS.find((l) => l.levelNumber === current.levelNumber + 1);
    if (!next) {
      return { unlocked: false, unmetReasons: ['Highest level reached!'], onlyBadgeMissing: false };
    }

    const stats = this.getLevelStats(current.levelNumber);
    const cfg = progressionConfig.unlock;
    const reasons: string[] = [];

    if (stats.attemptedCount < cfg.minAttempts) {
      reasons.push(`Answer ${cfg.minAttempts - stats.attemptedCount} more questions`);
    }
    if (this.getRollingAccuracy(current.levelNumber) < cfg.minAccuracy) {
      reasons.push(`Reach ${Math.round(cfg.minAccuracy * 100)}% accuracy`);
    }
    if (this.getFluencyScore(current.levelNumber) < cfg.minFluencyScore) {
      reasons.push('Answer a little faster');
    }
    if (this.getTimeoutRate(current.levelNumber) > cfg.maxTimeoutRate) {
      reasons.push('Fewer timeouts');
    }
    if (stats.battleWins < cfg.minBattleWins) {
      reasons.push(`Win ${cfg.minBattleWins - stats.battleWins} more battles`);
    }
    const lastTwo = stats.recentBattles.slice(-cfg.recentLossBlock);
    if (lastTwo.length === cfg.recentLossBlock && lastTwo.every((w) => !w)) {
      reasons.push('Win your next battle');
    }

    const badgeMissing = !!next.requiresBadge && !data.badges.includes(next.requiresBadge);
    const onlyBadgeMissing = reasons.length === 0 && badgeMissing;
    if (badgeMissing) {
      reasons.push('Earn the gym badge');
    }

    if (reasons.length > 0) {
      stats.currentPlateauCount += 1;
      return { unlocked: false, unmetReasons: reasons, onlyBadgeMissing };
    }

    // All criteria met — advance. This is the only place the level changes,
    // and it only ever moves forward.
    data.progression.currentLevelNumber = next.levelNumber;
    const nextStats = this.getLevelStats(next.levelNumber);
    nextStats.lastUnlockedAt = new Date().toISOString();
    stats.currentPlateauCount = 0;
    return { unlocked: true, newLevel: next, unmetReasons: [], onlyBadgeMissing: false };
  }

  /** Outcome classification shared by battle + progression layers. */
  static classifyOutcome(correct: boolean, responseMs: number, timedOut: boolean, fastMs: number, fluentMs: number): QuestionOutcome {
    if (timedOut) return 'timeout';
    if (!correct) return 'incorrect';
    if (responseMs < fastMs) return 'fast';
    if (responseMs < fluentMs) return 'medium';
    return 'slow';
  }
}
