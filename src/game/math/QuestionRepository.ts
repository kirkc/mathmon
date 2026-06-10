import questionsJson from '../data/questions.json';
import type { MathQuestion } from './types';

/**
 * Abstraction over where questions come from. The MVP reads a bundled JSON
 * seed file; a future version can swap in an API/database implementation
 * without touching the QuestionService.
 */
export interface QuestionRepository {
  getQuestionsForLevel(levelNumber: number): MathQuestion[];
  getAllQuestions(): MathQuestion[];
}

interface SeedFile {
  metadata: unknown;
  questions: MathQuestion[];
}

export class JsonQuestionRepository implements QuestionRepository {
  private readonly byLevel = new Map<number, MathQuestion[]>();
  private readonly all: MathQuestion[];

  constructor() {
    this.all = (questionsJson as SeedFile).questions;
    for (const q of this.all) {
      const bucket = this.byLevel.get(q.levelNumber);
      if (bucket) {
        bucket.push(q);
      } else {
        this.byLevel.set(q.levelNumber, [q]);
      }
    }
  }

  getQuestionsForLevel(levelNumber: number): MathQuestion[] {
    return this.byLevel.get(levelNumber) ?? [];
  }

  getAllQuestions(): MathQuestion[] {
    return this.all;
  }
}
