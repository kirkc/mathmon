import Phaser from 'phaser';
import { LEVELS } from '../../config/progressionConfig';
import { worldConfig } from '../../config/worldConfig';
import { chiptune } from '../audio/ChiptunePlayer';
import { CREATURE_SPECIES, STARTER_IDS } from '../data/creatures';
import { creatureService } from '../entities/CreatureService';
import { saveService } from '../services';
import { SLOT_COUNT, type SlotSummary } from '../save/SaveService';
import { FONT_BODY, FONT_HEADING } from '../ui/fonts';

type Mode = 'load' | 'new';
type Phase = 'slots' | 'confirmDelete' | 'name' | 'starter';

const W = worldConfig.gameWidth;
const H = worldConfig.gameHeight;
const MAX_NAME_LENGTH = 12;

/**
 * Save slot picker for both Continue (load) and New Game (pick an open
 * slot, enter a name, choose a starter).
 */
export class SaveSlotScene extends Phaser.Scene {
  private mode: Mode = 'load';
  private phase: Phase = 'slots';
  private slots: Array<SlotSummary | null> = [];
  private slotIndex = 0;
  private starterIndex = 0;
  private typedName = '';
  private ui: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('SaveSlotScene');
  }

  init(data: { mode?: Mode }): void {
    this.mode = data.mode ?? 'load';
    this.phase = 'slots';
    this.slotIndex = 0;
    this.starterIndex = 0;
    this.typedName = '';
  }

  create(): void {
    this.slots = saveService.listSlots();
    // Start the cursor somewhere useful: most recent save when loading,
    // first open slot when starting fresh.
    if (this.mode === 'load') {
      const recent = saveService.mostRecentSlot();
      if (recent) this.slotIndex = recent - 1;
    } else {
      const open = this.slots.findIndex((s) => s === null);
      if (open >= 0) this.slotIndex = open;
    }

    this.add.rectangle(0, 0, W, H, 0x1a2a5c).setOrigin(0);
    this.renderPhase();

    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKey, this);
    });
  }

  // ------------------------------------------------------------ rendering

  private renderPhase(): void {
    this.ui?.destroy();
    this.ui = this.add.container(0, 0);
    switch (this.phase) {
      case 'slots':
        this.renderSlots();
        break;
      case 'confirmDelete':
        this.renderSlots();
        this.renderDeleteConfirm();
        break;
      case 'name':
        this.renderNameEntry();
        break;
      case 'starter':
        this.renderStarterPick();
        break;
    }
  }

  private renderSlots(): void {
    const ui = this.ui!;
    const title = this.mode === 'load' ? 'LOAD GAME' : 'NEW GAME - PICK A SLOT';
    ui.add(
      this.add
        .text(W / 2, 14, title, { fontFamily: FONT_HEADING, fontSize: '13px', color: '#f8d048' })
        .setOrigin(0.5, 0),
    );

    this.slots.forEach((summary, i) => {
      const y = 44 + i * 58;
      const selected = i === this.slotIndex;
      const selectable = this.mode === 'load' ? summary !== null : summary === null;
      const fill = selectable ? 0x2c3a70 : 0x222c50;
      const card = this.add
        .rectangle(20, y, W - 40, 52, fill)
        .setOrigin(0)
        .setStrokeStyle(3, selected ? 0xf8d048 : selectable ? 0x5468b8 : 0x39426e);
      ui.add(card);

      const textColor = selectable ? '#ffffff' : '#7a86ad';
      if (summary) {
        const species = summary.partySpeciesId ? CREATURE_SPECIES[summary.partySpeciesId] : null;
        const level = LEVELS.find((l) => l.levelNumber === summary.currentLevelNumber);
        const detail = [
          species ? `Lv.${summary.partyLevel} ${species.name}` : 'No creature',
          level?.levelName ?? '',
          summary.badges > 0 ? `${summary.badges} badge${summary.badges > 1 ? 's' : ''}` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        ui.add(this.add.text(32, y + 5, summary.name, { fontFamily: FONT_BODY, fontSize: '19px', color: textColor }));
        ui.add(this.add.text(32, y + 24, detail, { fontFamily: FONT_BODY, fontSize: '14px', color: selectable ? '#c0d0f8' : '#7a86ad' }));
        ui.add(
          this.add.text(W - 32, y + 7, `Saved ${formatTimestamp(summary.updatedAt)}`, {
            fontFamily: FONT_BODY,
            fontSize: '13px',
            color: selectable ? '#8a93a6' : '#5d6788',
          }).setOrigin(1, 0),
        );
        if (species) {
          ui.add(this.add.image(W - 56, y + 36, species.spriteKey).setScale(1.4));
        }
      } else {
        ui.add(
          this.add.text(32, y + 15, '- Empty -', { fontFamily: FONT_BODY, fontSize: '17px', color: textColor }),
        );
      }
      ui.add(
        this.add.text(W - 32, y + 36, `Slot ${i + 1}`, {
          fontFamily: FONT_BODY,
          fontSize: '13px',
          color: '#5d6788',
        }).setOrigin(1, 0.5),
      );
    });

    const hint =
      this.mode === 'load'
        ? '↑↓ choose · ENTER play · X delete · ESC back'
        : '↑↓ choose an open slot · ENTER select · ESC back';
    ui.add(
      this.add
        .text(W / 2, H - 14, hint, { fontFamily: FONT_BODY, fontSize: '14px', color: '#8a93a6' })
        .setOrigin(0.5),
    );
  }

  private renderDeleteConfirm(): void {
    const ui = this.ui!;
    const summary = this.slots[this.slotIndex];
    if (!summary) return;
    ui.add(this.add.rectangle(0, 0, W, H, 0x1a1626, 0.75).setOrigin(0));
    const panel = this.add.rectangle(W / 2, H / 2, 360, 110, 0x2c3a70).setStrokeStyle(3, 0xc83a3a);
    ui.add(panel);
    ui.add(
      this.add
        .text(W / 2, H / 2 - 28, `Delete ${summary.name}'s save?`, {
          fontFamily: FONT_BODY,
          fontSize: '19px',
          color: '#ffffff',
        })
        .setOrigin(0.5),
    );
    ui.add(
      this.add
        .text(W / 2, H / 2 - 6, 'This cannot be undone!', {
          fontFamily: FONT_BODY,
          fontSize: '15px',
          color: '#f2a0a0',
        })
        .setOrigin(0.5),
    );
    ui.add(
      this.add
        .text(W / 2, H / 2 + 24, 'Y - delete · N or ESC - keep it', {
          fontFamily: FONT_BODY,
          fontSize: '15px',
          color: '#c0d0f8',
        })
        .setOrigin(0.5),
    );
  }

  private renderNameEntry(): void {
    const ui = this.ui!;
    ui.add(
      this.add
        .text(W / 2, 60, 'NEW ADVENTURE', { fontFamily: FONT_HEADING, fontSize: '13px', color: '#f8d048' })
        .setOrigin(0.5),
    );
    ui.add(
      this.add
        .text(W / 2, 112, "What's your name, trainer?", {
          fontFamily: FONT_BODY,
          fontSize: '20px',
          color: '#ffffff',
        })
        .setOrigin(0.5),
    );
    const box = this.add.rectangle(W / 2, 160, 280, 44, 0x2c3a70).setStrokeStyle(3, 0xf8d048);
    ui.add(box);
    const shown = this.typedName.length > 0 ? this.typedName : '';
    ui.add(
      this.add
        .text(W / 2, 160, `${shown}_`, { fontFamily: FONT_HEADING, fontSize: '14px', color: '#ffffff' })
        .setOrigin(0.5),
    );
    ui.add(
      this.add
        .text(W / 2, 210, `Type your name (letters and numbers, up to ${MAX_NAME_LENGTH})`, {
          fontFamily: FONT_BODY,
          fontSize: '14px',
          color: '#c0d0f8',
        })
        .setOrigin(0.5),
    );
    ui.add(
      this.add
        .text(W / 2, H - 14, 'ENTER confirm · BACKSPACE fix · ESC back', {
          fontFamily: FONT_BODY,
          fontSize: '14px',
          color: '#8a93a6',
        })
        .setOrigin(0.5),
    );
  }

  private renderStarterPick(): void {
    const ui = this.ui!;
    ui.add(
      this.add
        .text(W / 2, 36, `Choose your partner, ${this.typedName}!`, {
          fontFamily: FONT_HEADING,
          fontSize: '12px',
          color: '#f8d048',
        })
        .setOrigin(0.5),
    );

    STARTER_IDS.forEach((id, i) => {
      const species = CREATURE_SPECIES[id];
      const x = 90 + i * 150;
      const selected = i === this.starterIndex;
      ui.add(
        this.add
          .rectangle(x, 130, 130, 130, 0x2c3a70)
          .setStrokeStyle(3, selected ? 0xf8d048 : 0x5468b8),
      );
      ui.add(this.add.image(x, 110, species.spriteKey).setScale(4));
      ui.add(
        this.add
          .text(x, 160, species.name, { fontFamily: FONT_BODY, fontSize: '19px', color: '#ffffff' })
          .setOrigin(0.5),
      );
      ui.add(
        this.add
          .text(x, 177, `${species.type} · ${species.personality}`, {
            fontFamily: FONT_BODY,
            fontSize: '15px',
            color: '#c0d0f8',
          })
          .setOrigin(0.5),
      );
    });

    ui.add(
      this.add
        .text(W / 2, 230, CREATURE_SPECIES[STARTER_IDS[this.starterIndex]].description, {
          fontFamily: FONT_BODY,
          fontSize: '17px',
          color: '#ffffff',
          wordWrap: { width: W - 80 },
          align: 'center',
        })
        .setOrigin(0.5, 0),
    );
    ui.add(
      this.add
        .text(W / 2, H - 14, '← → choose · ENTER confirm · ESC back', {
          fontFamily: FONT_BODY,
          fontSize: '15px',
          color: '#8a93a6',
        })
        .setOrigin(0.5),
    );
  }

  // ---------------------------------------------------------------- input

  private handleKey(event: KeyboardEvent): void {
    chiptune.unlock();
    chiptune.playMusic('title');

    switch (this.phase) {
      case 'slots':
        this.handleSlotsKey(event);
        break;
      case 'confirmDelete':
        this.handleDeleteKey(event);
        break;
      case 'name':
        this.handleNameKey(event);
        break;
      case 'starter':
        this.handleStarterKey(event);
        break;
    }
  }

  private handleSlotsKey(event: KeyboardEvent): void {
    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.slotIndex = (this.slotIndex + SLOT_COUNT - 1) % SLOT_COUNT;
      chiptune.playSfx('select');
      this.renderPhase();
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.slotIndex = (this.slotIndex + 1) % SLOT_COUNT;
      chiptune.playSfx('select');
      this.renderPhase();
    } else if (event.code === 'Escape') {
      this.scene.start('TitleScene');
    } else if (event.code === 'KeyX' && this.mode === 'load' && this.slots[this.slotIndex]) {
      this.phase = 'confirmDelete';
      this.renderPhase();
    } else if (event.code === 'Enter' || event.code === 'Space') {
      const summary = this.slots[this.slotIndex];
      if (this.mode === 'load') {
        if (summary && saveService.loadSlot(summary.slot)) {
          chiptune.playSfx('correct');
          this.scene.start('OverworldScene');
        } else {
          chiptune.playSfx('wrong');
        }
      } else {
        if (summary === null) {
          chiptune.playSfx('correct');
          this.phase = 'name';
          this.typedName = '';
          this.renderPhase();
        } else {
          // Occupied: new games need an open slot (delete from Load Game).
          chiptune.playSfx('wrong');
        }
      }
    }
  }

  private handleDeleteKey(event: KeyboardEvent): void {
    if (event.code === 'KeyY') {
      const summary = this.slots[this.slotIndex];
      if (summary) saveService.deleteSlot(summary.slot);
      chiptune.playSfx('timeout');
      this.slots = saveService.listSlots();
      this.phase = 'slots';
      this.renderPhase();
    } else if (event.code === 'KeyN' || event.code === 'Escape') {
      this.phase = 'slots';
      this.renderPhase();
    }
  }

  private handleNameKey(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      this.phase = 'slots';
      this.renderPhase();
      return;
    }
    if (event.code === 'Backspace') {
      this.typedName = this.typedName.slice(0, -1);
      this.renderPhase();
      return;
    }
    if (event.code === 'Enter') {
      if (this.typedName.trim().length > 0) {
        this.typedName = this.typedName.trim();
        chiptune.playSfx('correct');
        this.phase = 'starter';
        this.renderPhase();
      } else {
        chiptune.playSfx('wrong');
      }
      return;
    }
    if (/^[a-zA-Z0-9 ]$/.test(event.key) && this.typedName.length < MAX_NAME_LENGTH) {
      // Capitalize the first letter automatically — nice for young typists.
      const ch = this.typedName.length === 0 ? event.key.toUpperCase() : event.key;
      this.typedName += ch;
      this.renderPhase();
    }
  }

  private handleStarterKey(event: KeyboardEvent): void {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.starterIndex = (this.starterIndex + STARTER_IDS.length - 1) % STARTER_IDS.length;
      chiptune.playSfx('select');
      this.renderPhase();
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.starterIndex = (this.starterIndex + 1) % STARTER_IDS.length;
      chiptune.playSfx('select');
      this.renderPhase();
    } else if (event.code === 'Escape') {
      this.phase = 'name';
      this.renderPhase();
    } else if (event.code === 'Enter' || event.code === 'Space') {
      const starterId = STARTER_IDS[this.starterIndex];
      const save = saveService.newGame(this.slotIndex + 1, this.typedName);
      save.party.push(creatureService.createInstance(starterId));
      saveService.persist();
      chiptune.playSfx('victory');
      this.scene.start('OverworldScene');
    }
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}
