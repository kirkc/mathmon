import { CREATURE_SPECIES, type CreatureSpecies } from '../data/creatures';
import type { CreatureInstance } from '../save/saveTypes';

export interface LevelUpResult {
  leveledUp: boolean;
  levelsGained: number;
  newLevel: number;
  hpGained: number;
}

/**
 * Creature creation, XP, and leveling. Creature level is intentionally
 * independent from math progression — a student can keep leveling their
 * creature even while their math tier plateaus.
 */
export class CreatureService {
  getSpecies(id: string): CreatureSpecies {
    const species = CREATURE_SPECIES[id];
    if (!species) throw new Error(`Unknown creature species: ${id}`);
    return species;
  }

  createInstance(speciesId: string, level = 1): CreatureInstance {
    const species = this.getSpecies(speciesId);
    const maxHp = species.baseHp + (level - 1) * 3;
    return { speciesId, level, xp: 0, maxHp, currentHp: maxHp };
  }

  /** XP needed to go from `level` to `level + 1`. */
  xpToNext(level: number): number {
    return 20 + level * 10;
  }

  grantXp(creature: CreatureInstance, amount: number): LevelUpResult {
    creature.xp += amount;
    let levelsGained = 0;
    let hpGained = 0;
    while (creature.xp >= this.xpToNext(creature.level)) {
      creature.xp -= this.xpToNext(creature.level);
      creature.level += 1;
      levelsGained += 1;
      hpGained += 3;
      creature.maxHp += 3;
    }
    if (levelsGained > 0) {
      // Level-ups feel good: heal up to the new max.
      creature.currentHp = creature.maxHp;
    }
    return {
      leveledUp: levelsGained > 0,
      levelsGained,
      newLevel: creature.level,
      hpGained,
    };
  }

  healFull(creature: CreatureInstance): void {
    creature.currentHp = creature.maxHp;
  }
}

export const creatureService = new CreatureService();
