import { battleConfig, type BattleType } from '../../config/battleConfig';
import { MAPS } from '../data/maps';
import { creatureService, type EvolutionResult } from '../entities/CreatureService';
import type { ProgressionService, UnlockCheck } from '../progression/ProgressionService';
import type { TrophyService } from '../progression/TrophyService';
import type { SaveService } from '../save/SaveService';

export interface BattleRewards {
  won: boolean;
  coins: number;
  xp: number;
  levelsGained: number;
  newCreatureLevel: number;
  /** Set when the party lead evolved as a result of this battle's XP. */
  evolution: EvolutionResult | null;
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

/** Gym badge id -> the trophy celebrating it. */
const BADGE_TROPHIES: Record<string, string> = {
  'addition-gym': 'sum-badge',
  'subtraction-gym': 'difference-badge',
};

/** Every trainer in the world — beating them all earns Neighborhood Champ. */
const ALL_TRAINER_IDS = Object.values(MAPS).flatMap((map) =>
  map.npcs.filter((npc) => npc.battle?.type === 'trainer').map((npc) => npc.id),
);

/**
 * Post-battle bookkeeping: rewards, creature XP, battle record, the
 * unlock check, and saving. Losing NEVER regresses learning progress.
 */
export class BattleService {
  constructor(
    private readonly save: SaveService,
    private readonly progression: ProgressionService,
    private readonly trophies: TrophyService,
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
    let evolution: EvolutionResult | null = null;
    if (partyLead) {
      const result = creatureService.grantXp(partyLead, reward.xp);
      levelsGained = result.levelsGained;
      newCreatureLevel = result.newLevel;
      // Forgiving MVP loop: creatures rest to full after every battle.
      // TODO: replace with heal items / a creature center in milestone 2.
      creatureService.healFull(partyLead);
      // Evolutions only trigger on wins so the moment always feels earned.
      if (won) {
        evolution = creatureService.applyEvolution(partyLead);
        if (evolution) this.trophies.award('first-evolution');
      }
    }

    if (won && trainerId && !data.defeatedTrainers.includes(trainerId)) {
      data.defeatedTrainers.push(trainerId);
    }

    // Gym wins award the badge regardless of fluency — but the badge alone
    // does not advance the math tier; the progression engine decides that.
    if (won && battleType === 'gym' && badgeId && !data.badges.includes(badgeId)) {
      data.badges.push(badgeId);
    }

    // Milestone trophies (award() dedupes, so these are safe to re-check).
    if (won) {
      this.trophies.award('first-win');
      if (battleType === 'gym' && badgeId && BADGE_TROPHIES[badgeId]) {
        this.trophies.award(BADGE_TROPHIES[badgeId]);
      }
      for (const [level, id] of [[5, 'level-5'], [10, 'level-10'], [15, 'level-15']] as const) {
        if (newCreatureLevel >= level) this.trophies.award(id);
      }
      if (data.totals.questionsAnswered >= 100) this.trophies.award('century-scholar');
      if (ALL_TRAINER_IDS.every((id) => data.defeatedTrainers.includes(id))) {
        this.trophies.award('neighborhood-champ');
      }
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
      evolution,
      unlock,
      encouragement,
    };
  }
}
