import { BattleService } from './battle/BattleService';
import { JsonQuestionRepository } from './math/QuestionRepository';
import { QuestionService } from './math/QuestionService';
import { ProgressionService } from './progression/ProgressionService';
import { TrophyService } from './progression/TrophyService';
import { saveService } from './save/SaveService';

/**
 * Composition root: one shared instance of each service, wired together.
 * Scenes import from here instead of constructing their own.
 */
export const questionRepository = new JsonQuestionRepository();
export const progressionService = new ProgressionService(saveService);
export const questionService = new QuestionService(questionRepository, progressionService, saveService);
export const trophyService = new TrophyService(saveService);
export const battleService = new BattleService(saveService, progressionService, trophyService);
export { saveService };

// Dev-only debug handle for automated playtesting and parent/teacher support.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__MATHMON_DEBUG = {
    saveService,
    progressionService,
    questionService,
    battleService,
    trophyService,
    questionRepository,
  };
}
