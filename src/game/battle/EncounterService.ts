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
    const speciesId = area.wildSpecies[Math.floor(Math.random() * area.wildSpecies.length)];
    const creature = creatureService.createInstance(speciesId);
    const hp =
      area.wildHp.min + Math.floor(Math.random() * (area.wildHp.max - area.wildHp.min + 1));
    creature.maxHp = hp;
    creature.currentHp = hp;
    return creature;
  }
}

export const encounterService = new EncounterService();
