import Phaser from 'phaser';
import { worldConfig } from '../../config/worldConfig';
import { chiptune } from '../audio/ChiptunePlayer';
import { CREATURE_SPECIES, STARTER_IDS } from '../data/creatures';
import { creatureService } from '../entities/CreatureService';
import { saveService } from '../services';

type Phase = 'menu' | 'starter';

const MONO = '"Courier New", monospace';

/**
 * Title screen: continue / new game (with starter pick) / dashboard /
 * glossary. First keypress also unlocks WebAudio for music.
 */
export class TitleScene extends Phaser.Scene {
  private phase: Phase = 'menu';
  private menuIndex = 0;
  private starterIndex = 0;
  private menuItems: string[] = [];
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private starterGroup: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { gameWidth: W, gameHeight: H } = worldConfig;
    this.phase = 'menu';
    this.menuIndex = 0;
    this.menuTexts = [];
    this.starterGroup = null;

    this.add.rectangle(0, 0, W, H, 0x1a2a5c).setOrigin(0);
    // decorative grass strip
    for (let x = 0; x < W; x += worldConfig.tileSize) {
      this.add.image(x, H - 32, 'tile-grass').setOrigin(0).setScale(1);
      this.add.image(x, H - 64, 'tile-tallgrass').setOrigin(0).setScale(1);
    }
    for (const [i, id] of (['embercub', 'leafloo', 'aquabbit'] as const).entries()) {
      this.add.image(120 + i * 120, H - 76, CREATURE_SPECIES[id].spriteKey).setScale(3);
    }

    this.add
      .text(W / 2, 58, 'MathMon Quest', {
        fontFamily: MONO,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#f8d048',
        stroke: '#26203a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 90, 'Math power. Tiny monsters. Big adventure.', {
        fontFamily: MONO,
        fontSize: '12px',
        color: '#c0d0f8',
      })
      .setOrigin(0.5);

    this.menuItems = saveService.hasSave()
      ? ['Continue', 'New Game', 'Parent Dashboard', 'Math Glossary']
      : ['New Game', 'Parent Dashboard', 'Math Glossary'];

    this.menuItems.forEach((item, i) => {
      const t = this.add
        .text(W / 2, 130 + i * 24, item, {
          fontFamily: MONO,
          fontSize: '15px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
      this.menuTexts.push(t);
    });
    this.refreshMenu();

    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKey, this);
    });
  }

  private handleKey(event: KeyboardEvent): void {
    chiptune.unlock();
    chiptune.playMusic('title');

    if (this.phase === 'menu') this.handleMenuKey(event);
    else this.handleStarterKey(event);
  }

  private handleMenuKey(event: KeyboardEvent): void {
    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.menuIndex = (this.menuIndex + this.menuItems.length - 1) % this.menuItems.length;
      chiptune.playSfx('select');
      this.refreshMenu();
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.menuIndex = (this.menuIndex + 1) % this.menuItems.length;
      chiptune.playSfx('select');
      this.refreshMenu();
    } else if (event.code === 'Enter' || event.code === 'Space') {
      this.selectMenuItem(this.menuItems[this.menuIndex]);
    }
  }

  private selectMenuItem(item: string): void {
    chiptune.playSfx('correct');
    switch (item) {
      case 'Continue':
        this.scene.start('OverworldScene');
        break;
      case 'New Game':
        this.showStarterPick();
        break;
      case 'Parent Dashboard':
        this.scene.start('DashboardScene', { from: 'TitleScene' });
        break;
      case 'Math Glossary':
        this.scene.start('GlossaryScene', { from: 'TitleScene' });
        break;
    }
  }

  private refreshMenu(): void {
    this.menuTexts.forEach((t, i) => {
      const active = i === this.menuIndex;
      t.setColor(active ? '#f8d048' : '#ffffff');
      t.setText(`${active ? '▶ ' : '  '}${this.menuItems[i]}${active ? ' ◀' : '  '}`);
    });
  }

  private showStarterPick(): void {
    this.phase = 'starter';
    this.starterIndex = 0;
    const { gameWidth: W, gameHeight: H } = worldConfig;

    const overlay = this.add.rectangle(0, 0, W, H, 0x1a1424, 0.92).setOrigin(0);
    const title = this.add
      .text(W / 2, 36, 'Choose your partner!', {
        fontFamily: MONO,
        fontSize: '18px',
        color: '#f8d048',
      })
      .setOrigin(0.5);

    const cards: Phaser.GameObjects.GameObject[] = [overlay, title];
    STARTER_IDS.forEach((id, i) => {
      const species = CREATURE_SPECIES[id];
      const x = 90 + i * 150;
      const card = this.add.rectangle(x, 130, 130, 130, 0x2c3a70).setStrokeStyle(3, 0x5468b8);
      card.setName(`starter-card-${i}`);
      const img = this.add.image(x, 110, species.spriteKey).setScale(4);
      const name = this.add
        .text(x, 160, species.name, { fontFamily: MONO, fontSize: '13px', color: '#ffffff' })
        .setOrigin(0.5);
      const type = this.add
        .text(x, 176, `${species.type} · ${species.personality}`, {
          fontFamily: MONO,
          fontSize: '10px',
          color: '#c0d0f8',
        })
        .setOrigin(0.5);
      cards.push(card, img, name, type);
    });

    const desc = this.add
      .text(W / 2, 230, '', {
        fontFamily: MONO,
        fontSize: '11px',
        color: '#ffffff',
        wordWrap: { width: W - 80 },
        align: 'center',
      })
      .setOrigin(0.5, 0);
    desc.setName('starter-desc');
    const hint = this.add
      .text(W / 2, H - 24, '← → to choose · ENTER to confirm · ESC to go back', {
        fontFamily: MONO,
        fontSize: '10px',
        color: '#8a93a6',
      })
      .setOrigin(0.5);
    cards.push(desc, hint);

    this.starterGroup = this.add.container(0, 0, cards).setDepth(10);
    this.refreshStarterPick();
  }

  private refreshStarterPick(): void {
    if (!this.starterGroup) return;
    STARTER_IDS.forEach((_id, i) => {
      const card = this.starterGroup!.getByName(`starter-card-${i}`) as Phaser.GameObjects.Rectangle;
      card.setStrokeStyle(3, i === this.starterIndex ? 0xf8d048 : 0x5468b8);
    });
    const desc = this.starterGroup.getByName('starter-desc') as Phaser.GameObjects.Text;
    desc.setText(CREATURE_SPECIES[STARTER_IDS[this.starterIndex]].description);
  }

  private handleStarterKey(event: KeyboardEvent): void {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.starterIndex = (this.starterIndex + STARTER_IDS.length - 1) % STARTER_IDS.length;
      chiptune.playSfx('select');
      this.refreshStarterPick();
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.starterIndex = (this.starterIndex + 1) % STARTER_IDS.length;
      chiptune.playSfx('select');
      this.refreshStarterPick();
    } else if (event.code === 'Escape') {
      this.starterGroup?.destroy();
      this.starterGroup = null;
      this.phase = 'menu';
    } else if (event.code === 'Enter' || event.code === 'Space') {
      const starterId = STARTER_IDS[this.starterIndex];
      const save = saveService.newGame('Trainer');
      save.party.push(creatureService.createInstance(starterId));
      saveService.persist();
      chiptune.playSfx('victory');
      this.scene.start('OverworldScene');
    }
  }
}
