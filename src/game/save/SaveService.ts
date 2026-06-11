import { worldConfig } from '../../config/worldConfig';
import type { SaveData } from './saveTypes';

export const SLOT_COUNT = 4;

/**
 * Storage backend abstraction over numbered save slots. The MVP uses
 * localStorage; replacing this with a database-backed implementation
 * (per-student profiles, sync, etc.) only requires a new SaveBackend.
 */
export interface SaveBackend {
  load(slot: number): SaveData | null;
  save(slot: number, data: SaveData): void;
  clear(slot: number): void;
}

const LEGACY_KEY = 'mathmon-quest-save-v1';

export class LocalStorageBackend implements SaveBackend {
  constructor() {
    this.migrateLegacySave();
  }

  private key(slot: number): string {
    return `mathmon-quest-save-v1-slot${slot}`;
  }

  /** Pre-slot saves move into slot 1 so existing players keep progress. */
  private migrateLegacySave(): void {
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        if (!localStorage.getItem(this.key(1))) {
          localStorage.setItem(this.key(1), legacy);
        }
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch {
      /* storage unavailable — nothing to migrate */
    }
  }

  load(slot: number): SaveData | null {
    try {
      const raw = localStorage.getItem(this.key(slot));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.version !== 1) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  save(slot: number, data: SaveData): void {
    try {
      localStorage.setItem(this.key(slot), JSON.stringify(data));
    } catch (err) {
      console.warn('MathMon: failed to write save data', err);
    }
  }

  clear(slot: number): void {
    localStorage.removeItem(this.key(slot));
  }
}

/** Lightweight slot info for menus — no full SaveData parse needed by UI. */
export interface SlotSummary {
  slot: number;
  name: string;
  updatedAt: string;
  partySpeciesId: string | null;
  partyLevel: number | null;
  currentLevelNumber: number;
  badges: number;
}

export class SaveService {
  private data: SaveData | null = null;
  private activeSlot: number | null = null;

  constructor(private readonly backend: SaveBackend = new LocalStorageBackend()) {}

  getActiveSlot(): number | null {
    return this.activeSlot;
  }

  /** Summaries for all slots, index 0..SLOT_COUNT-1; null = empty slot. */
  listSlots(): Array<SlotSummary | null> {
    const out: Array<SlotSummary | null> = [];
    for (let slot = 1; slot <= SLOT_COUNT; slot++) {
      const data = this.backend.load(slot);
      if (!data) {
        out.push(null);
        continue;
      }
      const lead = data.party[0];
      out.push({
        slot,
        name: data.player.name,
        updatedAt: data.updatedAt,
        partySpeciesId: lead?.speciesId ?? null,
        partyLevel: lead?.level ?? null,
        currentLevelNumber: data.progression.currentLevelNumber,
        badges: data.badges.length,
      });
    }
    return out;
  }

  hasAnySave(): boolean {
    return this.listSlots().some((s) => s !== null);
  }

  /** Slot with the most recent save, or null when all are empty. */
  mostRecentSlot(): number | null {
    let best: SlotSummary | null = null;
    for (const summary of this.listSlots()) {
      if (summary && (!best || summary.updatedAt > best.updatedAt)) best = summary;
    }
    return best?.slot ?? null;
  }

  /** Load a slot and make it the active save. */
  loadSlot(slot: number): boolean {
    const data = this.backend.load(slot);
    if (!data) return false;
    // Schema upgrades for saves created before newer features existed.
    data.house ??= { ownedItems: [] };
    this.data = data;
    this.activeSlot = slot;
    return true;
  }

  getData(): SaveData | null {
    return this.data;
  }

  /** Returns the active save or throws — load or create a slot first. */
  requireData(): SaveData {
    if (!this.data) throw new Error('No save data loaded');
    return this.data;
  }

  newGame(slot: number, playerName: string): SaveData {
    const now = new Date().toISOString();
    this.data = {
      version: 1,
      createdAt: now,
      updatedAt: now,
      player: {
        name: playerName,
        coins: 0,
        mapKey: worldConfig.spawn.mapKey,
        tileX: worldConfig.spawn.tileX,
        tileY: worldConfig.spawn.tileY,
        facing: worldConfig.spawn.facing,
      },
      party: [],
      progression: {
        currentLevelNumber: 1,
        perLevel: {},
      },
      questionHistory: {},
      defeatedTrainers: [],
      badges: [],
      house: { ownedItems: [] },
      totals: { battlesWon: 0, battlesLost: 0, questionsAnswered: 0 },
    };
    this.activeSlot = slot;
    this.persist();
    return this.data;
  }

  /** Write the active save to its slot (auto-called after every battle). */
  persist(): void {
    if (!this.data || this.activeSlot === null) return;
    this.data.updatedAt = new Date().toISOString();
    this.backend.save(this.activeSlot, this.data);
  }

  deleteSlot(slot: number): void {
    this.backend.clear(slot);
    if (this.activeSlot === slot) {
      this.activeSlot = null;
      this.data = null;
    }
  }
}

/** Single shared instance for the whole game. */
export const saveService = new SaveService();
