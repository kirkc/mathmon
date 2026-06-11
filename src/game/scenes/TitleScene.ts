import Phaser from 'phaser';
import { worldConfig } from '../../config/worldConfig';
import { chiptune } from '../audio/ChiptunePlayer';
import { CREATURE_SPECIES } from '../data/creatures';
import { startTileAnimations } from '../gfx/textureFactory';
import { saveService } from '../services';
import { FONT_BODY, FONT_HEADING } from '../ui/fonts';

const MONO = FONT_BODY;
const HEAD = FONT_HEADING;

/**
 * Main menu: continue (pick a save), new game (pick an open slot),
 * parent dashboard, glossary. First keypress also unlocks WebAudio.
 */
export class TitleScene extends Phaser.Scene {
  private menuIndex = 0;
  private menuItems: string[] = [];
  private menuTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { gameWidth: W, gameHeight: H } = worldConfig;
    this.menuIndex = 0;
    this.menuTexts = [];

    this.add.rectangle(0, 0, W, H, 0x1a2a5c).setOrigin(0);
    // decorative grass strip
    for (let x = 0; x < W; x += worldConfig.tileSize) {
      this.add.image(x, H - 32, 'tile-grass').setOrigin(0).setScale(1);
      this.add.image(x, H - 64, 'tile-tallgrass').setOrigin(0).setScale(1);
    }
    for (const [i, id] of (['embercub', 'leafloo', 'aquabbit'] as const).entries()) {
      const mon = this.add.image(120 + i * 120, H - 76, CREATURE_SPECIES[id].spriteKey).setScale(3);
      this.tweens.add({
        targets: mon,
        y: mon.y - 3,
        duration: 900 + i * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(W / 2, 54, 'MathMon Quest', {
        fontFamily: HEAD,
        fontSize: '24px',
        color: '#f8d048',
        stroke: '#26203a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 88, 'Math power. Tiny monsters. Big adventure.', {
        fontFamily: MONO,
        fontSize: '18px',
        color: '#c0d0f8',
      })
      .setOrigin(0.5);

    startTileAnimations(this);

    this.menuItems = saveService.hasAnySave()
      ? ['Continue', 'New Game', 'Parent Dashboard', 'Math Glossary']
      : ['New Game', 'Parent Dashboard', 'Math Glossary'];

    this.menuItems.forEach((item, i) => {
      const t = this.add
        .text(W / 2, 122 + i * 24, item, {
          fontFamily: MONO,
          fontSize: '22px',
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
        this.scene.start('SaveSlotScene', { mode: 'load' });
        break;
      case 'New Game':
        this.scene.start('SaveSlotScene', { mode: 'new' });
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
}
