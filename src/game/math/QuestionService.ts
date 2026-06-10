import { battleConfig } from '../../config/battleConfig';
import type { ProgressionService } from '../progression/ProgressionService';
import type { SaveService } from '../save/SaveService';
import type { QuestionHistoryEntry } from '../save/saveTypes';
import type { QuestionRepository } from './QuestionRepository';
import type { MathQuestion, QuestionResult } from './types';

/**
 * Adaptive question selector. Serves questions ONLY from the student's
 * current unlocked level, with weighted-random selection that:
 *  - prefers recently missed facts,
 *  - prefers facts answered slowly,
 *  - occasionally re-serves mastered facts for confidence,
 *  - favors easier facts (within the tier) when the student is struggling,
 *  - never repeats the same question back to back.
 */
export class QuestionService {
  private lastQuestionId: string | null = null;

  constructor(
    private readonly repo: QuestionRepository,
    private readonly progression: ProgressionService,
    private readonly save: SaveService,
  ) {}

  nextQuestion(): MathQuestion {
    const level = this.progression.getCurrentLevel();
    const pool = this.repo.getQuestionsForLevel(level.levelNumber);
    if (pool.length === 0) {
      throw new Error(`No questions found for level ${level.levelNumber}`);
    }

    const history = this.save.requireData().questionHistory;
    const struggling = this.progression.isStruggling(level.levelNumber);

    const candidates = pool.filter((q) => q.id !== this.lastQuestionId);
    const usable = candidates.length > 0 ? candidates : pool;

    const weights = usable.map((q) => this.weightFor(q, history[q.id], struggling));
    const picked = weightedPick(usable, weights);
    this.lastQuestionId = picked.id;
    return picked;
  }

  private weightFor(
    q: MathQuestion,
    entry: QuestionHistoryEntry | undefined,
    struggling: boolean,
  ): number {
    let weight = 1;

    if (entry) {
      // Recently missed facts come back sooner.
      if (entry.lastOutcome === 'incorrect' || entry.lastOutcome === 'timeout') {
        weight *= 3.5;
      }
      // Slow facts need more reps.
      if (entry.lastResponseMs >= battleConfig.timing.fluentMs) {
        weight *= 2;
      }
      // Mastered facts (3+ fast in a row) mostly rest, but still appear
      // occasionally as confidence builders.
      if (entry.fastStreak >= 3) {
        weight *= 0.35;
      }
    }

    // Struggle support: bias toward lighter facts in the SAME tier.
    if (struggling) {
      weight *= 1 / Math.max(1, q.difficultyWeight);
    }

    return weight;
  }

  /** Record the result so future selection adapts. */
  recordResult(result: QuestionResult): void {
    const history = this.save.requireData().questionHistory;
    const entry: QuestionHistoryEntry = history[result.questionId] ?? {
      attempts: 0,
      misses: 0,
      timeouts: 0,
      lastResponseMs: 0,
      lastOutcome: result.outcome,
      fastStreak: 0,
    };
    entry.attempts += 1;
    entry.lastResponseMs = result.responseMs;
    entry.lastOutcome = result.outcome;
    if (result.outcome === 'incorrect') entry.misses += 1;
    if (result.outcome === 'timeout') entry.timeouts += 1;
    entry.fastStreak = result.outcome === 'fast' ? entry.fastStreak + 1 : 0;
    history[result.questionId] = entry;
  }
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}
