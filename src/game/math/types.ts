export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type MathTier = 'beginning' | 'regular' | 'expanded';

/** Shape of one question in the seed database (src/game/data/questions.json). */
export interface MathQuestion {
  id: string;
  levelNumber: number;
  levelName: string;
  operation: MathOperation;
  tier: MathTier;
  prompt: string;
  answer: number;
  leftOperand: number;
  rightOperand: number;
  symbol: string;
  difficultyWeight: number;
  factFamily: string;
  tags: string[];
  vocabularyTerms: string[];
}

/** How a single question attempt resolved, per the timing model. */
export type QuestionOutcome = 'fast' | 'medium' | 'slow' | 'incorrect' | 'timeout';

export interface QuestionResult {
  questionId: string;
  levelNumber: number;
  outcome: QuestionOutcome;
  responseMs: number;
  correct: boolean;
}
