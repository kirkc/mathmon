import { battleConfig, type BattleType } from '../../config/battleConfig';
import { creatureService } from '../entities/CreatureService';
import type { ProgressionService, UnlockCheck } from '../progression/ProgressionService';
import type { SaveService } from '../save/SaveService';

export interface BattleRewards {
  won: boolean;
  coins: number;
  xp: number;
  levelsGained: number;
  newCreatureLevel: number;
  unlock: UnlockCheck | null;
  encouragement: string;
}

const WIN_MESSAGES = [
  'Amazing work! Your math is getting stronger!',
  'Victory! Those facts are really sticking!',
  'You did it! Keep that streak going!',
];

const LOSS_MESSAGES = [
  "Good try! Every battle makes your brain stronger.",
  "So close! Let's rest up and try again.",
  "Nice effort! Practice makes powerful.",
];

/**
 * Post-battle bookkeeping: rewards, creature XP, battle record, the
 * unlock check, and saving. Losing NEVER regresses learning progress.
 */
export class BattleService {
  constructor(
    private readonly save: SaveService,
    private readonly progression: ProgressionService,
  ) {}

  finishBattle(
    battleType: BattleType,
    won: boolean,
    opts: { trainerId?: string; badgeId?: string } = {},
  ): BattleRewards {
    const { trainerId, badgeId } = opts;
    const data = this.save.requireData();
    const level = this.progression.getCurrentLevel();

    this.progression.recordBattleResult(level.levelNumber, won);

    const reward = won ? battleConfig.rewards[battleType] : battleConfig.lossRewards;
    data.player.coins += reward.coins;

    const partyLead = data.party[0];
    let levelsGained = 0;
    let newCreatureLevel = partyLead?.level ?? 1;
    if (partyLead) {
      const result = creatureService.grantXp(partyLead, reward.xp);
      levelsGained = result.levelsGained;
      newCreatureLevel = result.newLevel;
      // Forgiving MVP loop: creatures rest to full after every battle.
      // TODO: replace with heal items / a creature center in milestone 2.
      creatureService.healFull(partyLead);
    }

    if (won && trainerId && !data.defeatedTrainers.includes(trainerId)) {
      data.defeatedTrainers.push(trainerId);
    }

    // Gym wins award the badge regardless of fluency — but the badge alone
    // does not advance the math tier; the progression engine decides that.
    if (won && battleType === 'gym' && badgeId && !data.badges.includes(badgeId)) {
      data.badges.push(badgeId);
    }

    // Only check for tier advancement after wins; losses never regress
    // and never count against the student beyond the battle record.
    const unlock = won ? this.progression.checkUnlock() : null;

    const pool = won ? WIN_MESSAGES : LOSS_MESSAGES;
    const encouragement = pool[Math.floor(Math.random() * pool.length)];

    this.save.persist();

    return {
      won,
      coins: reward.coins,
      xp: reward.xp,
      levelsGained,
      newCreatureLevel,
      unlock,
      encouragement,
    };
  }
}
