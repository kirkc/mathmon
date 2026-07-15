import { CREATURE_SPECIES, type CreatureSpecies } from '../data/creatures';
import type { CreatureInstance } from '../save/saveTypes';

export interface LevelUpResult {
  leveledUp: boolean;
  levelsGained: number;
  newLevel: number;
  hpGained: number;
}

export interface EvolutionResult {
  from: CreatureSpecies;
  to: CreatureSpecies;
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

  /** Non-null when the creature has reached its species' evolution level. */
  checkEvolution(creature: CreatureInstance): EvolutionResult | null {
    const species = this.getSpecies(creature.speciesId);
    if (!species.evolvesTo || !species.evolveLevel) return null;
    if (creature.level < species.evolveLevel) return null;
    return { from: species, to: this.getSpecies(species.evolvesTo) };
  }

  /** Evolve in place: new species, recomputed max HP, fully healed. */
  applyEvolution(creature: CreatureInstance): EvolutionResult | null {
    const evolution = this.checkEvolution(creature);
    if (!evolution) return null;
    creature.speciesId = evolution.to.id;
    creature.maxHp = evolution.to.baseHp + (creature.level - 1) * 3;
    creature.currentHp = creature.maxHp;
    return evolution;
  }
}

export const creatureService = new CreatureService();
