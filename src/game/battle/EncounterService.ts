import { worldConfig, type AreaId } from '../../config/worldConfig';
import { creatureService } from '../entities/CreatureService';
import type { CreatureInstance } from '../save/saveTypes';

/**
 * Wild encounter rolls for tall grass. Encounters never chain back-to-back:
 * a minimum number of grass steps must pass between battles.
 */
export class EncounterService {
  private stepsSinceEncounter = Number.MAX_SAFE_INTEGER;

  /** Call on every completed step into a tall-grass tile. */
  rollEncounter(): boolean {
    this.stepsSinceEncounter += 1;
    if (this.stepsSinceEncounter < worldConfig.encounters.minStepsBetween) {
      return false;
    }
    if (Math.random() < worldConfig.encounters.chancePerStep) {
      this.stepsSinceEncounter = 0;
      return true;
    }
    return false;
  }

  /** Reset the grace counter (e.g. after any battle ends). */
  resetGrace(): void {
    this.stepsSinceEncounter = 0;
  }

  rollWildCreature(areaId: AreaId): CreatureInstance {
    const area = worldConfig.areas[areaId];
    return this.rollFromTable(area.wildSpecies, area.wildHp);
  }

  /** Fishing-rod encounters pull from the area's water table. */
  rollFishCreature(areaId: AreaId): CreatureInstance {
    const area = worldConfig.areas[areaId];
    return this.rollFromTable(area.fishSpecies, area.fishHp);
  }

  private rollFromTable(
    species: readonly string[],
    hpRange: { min: number; max: number },
  ): CreatureInstance {
    const speciesId = species[Math.floor(Math.random() * species.length)];
    const creature = creatureService.createInstance(speciesId);
    const hp = hpRange.min + Math.floor(Math.random() * (hpRange.max - hpRange.min + 1));
    creature.maxHp = hp;
    creature.currentHp = hp;
    return creature;
  }
}

export const encounterService = new EncounterService();
