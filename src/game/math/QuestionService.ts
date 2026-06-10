import { battleConfig } from '../../config/battleConfig';
import type { ProgressionService } from '../progression/ProgressionService';
import type { SaveService } from '../save/SaveService';
import type { QuestionHistoryEntry } from '../save/saveTypes';
import type { QuestionRepository } from './QuestionRepository';
import type { MathQuestion, QuestionResult } from './types';

/** How many recently served questions are barred from re-selection. */
const RECENT_QUESTION_MEMORY = 8;
/** How many recent answers are penalized to avoid same-answer streaks. */
const RECENT_ANSWER_MEMORY = 3;

/**
 * Adaptive question selector. Serves questions ONLY from the student's
 * current unlocked level, with weighted-random selection that:
 *  - prefers recently missed facts,
 *  - prefers facts answered slowly,
 *  - occasionally re-serves mastered facts for confidence,
 *  - favors easier facts (within the tier) when the student is struggling,
 *  - leans into harder facts when the student is cruising,
 *  - enforces variety: no recent repeats, no same-answer streaks, no
 *    same-fact-family streaks, and trivial zero-facts are kept rare.
 */
export class QuestionService {
  private recentQuestionIds: string[] = [];
  private recentAnswers: number[] = [];
  private lastFactFamily: string | null = null;

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

    // Hard-exclude anything served in the last few questions (window is
    // capped to half the pool so tiny pools still work).
    const barWindow = Math.min(RECENT_QUESTION_MEMORY, Math.floor(pool.length / 2));
    const barred = new Set(this.recentQuestionIds.slice(-barWindow));
    const candidates = pool.filter((q) => !barred.has(q.id));
    const usable = candidates.length > 0 ? candidates : pool;

    const weights = usable.map((q) => this.weightFor(q, history[q.id], struggling));
    const picked = weightedPick(usable, weights);

    this.recentQuestionIds.push(picked.id);
    if (this.recentQuestionIds.length > RECENT_QUESTION_MEMORY) this.recentQuestionIds.shift();
    this.recentAnswers.push(picked.answer);
    if (this.recentAnswers.length > RECENT_ANSWER_MEMORY) this.recentAnswers.shift();
    this.lastFactFamily = picked.factFamily;
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

    // Variety: avoid serving the same answer or fact family in a row.
    if (this.recentAnswers.includes(q.answer)) weight *= 0.2;
    if (q.factFamily === this.lastFactFamily) weight *= 0.4;
    // Zero-facts (x+0, x-0, x*0...) are a third of some pools — keep them rare.
    if (q.tags.includes('zero-fact')) weight *= 0.3;

    if (struggling) {
      // Struggle support: bias toward lighter facts in the SAME tier.
      weight *= 1 / Math.max(1, q.difficultyWeight);
    } else {
      // Cruising: lean into the meatier facts so the tier stays challenging.
      weight *= 1 + (q.difficultyWeight - 1) * 0.4;
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
