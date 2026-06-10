import { worldConfig } from '../../config/worldConfig';
import type { SaveData } from './saveTypes';

/**
 * Storage backend abstraction. The MVP uses localStorage; replacing this
 * with a database-backed implementation (per-student profiles, sync, etc.)
 * only requires a new SaveBackend.
 */
export interface SaveBackend {
  load(): SaveData | null;
  save(data: SaveData): void;
  clear(): void;
}

const STORAGE_KEY = 'mathmon-quest-save-v1';

export class LocalStorageBackend implements SaveBackend {
  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.version !== 1) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  save(data: SaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('MathMon: failed to write save data', err);
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export class SaveService {
  private data: SaveData | null = null;

  constructor(private readonly backend: SaveBackend = new LocalStorageBackend()) {}

  hasSave(): boolean {
    return this.getData() !== null;
  }

  getData(): SaveData | null {
    if (!this.data) {
      this.data = this.backend.load();
    }
    return this.data;
  }

  /** Returns current save or throws — call hasSave()/newGame() first. */
  requireData(): SaveData {
    const data = this.getData();
    if (!data) throw new Error('No save data loaded');
    return data;
  }

  newGame(playerName: string): SaveData {
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
      totals: { battlesWon: 0, battlesLost: 0, questionsAnswered: 0 },
    };
    this.persist();
    return this.data;
  }

  persist(): void {
    if (!this.data) return;
    this.data.updatedAt = new Date().toISOString();
    this.backend.save(this.data);
  }

  clear(): void {
    this.data = null;
    this.backend.clear();
  }
}

/** Single shared instance for the whole game. */
export const saveService = new SaveService();
