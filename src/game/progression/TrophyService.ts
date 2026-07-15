import { TROPHY_BY_ID, type TrophyDefinition } from '../data/trophies';
import type { SaveService } from '../save/SaveService';

/**
 * Awards trophies and queues them for presentation. Awards happen deep in
 * services (battle end, the shop) and often right before a scene transition,
 * so each award persists immediately and waits in an in-memory queue until
 * whichever scene is alive next drains it into a CelebrationOverlay. A missed
 * presentation self-heals: OverworldScene drains on create.
 */
export class TrophyService {
  private pending: TrophyDefinition[] = [];

  constructor(private readonly save: SaveService) {}

  /** Award once; no-op for unknown or already-earned ids. Returns true when newly earned. */
  award(id: string): boolean {
    const def = TROPHY_BY_ID[id];
    if (!def) return false;
    const data = this.save.getData();
    if (!data || data.trophies.includes(id)) return false;
    data.trophies.push(id);
    this.save.persist();
    this.pending.push(def);
    return true;
  }

  get hasPending(): boolean {
    return this.pending.length > 0;
  }

  /** Take everything awaiting celebration (presentation is the caller's job). */
  drainPending(): TrophyDefinition[] {
    const out = this.pending;
    this.pending = [];
    return out;
  }

  /** All earned trophies, in the order they were won. */
  earned(): TrophyDefinition[] {
    const data = this.save.getData();
    if (!data) return [];
    return data.trophies
      .map((id) => TROPHY_BY_ID[id])
      .filter((t): t is TrophyDefinition => Boolean(t));
  }
}
