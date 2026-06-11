import Phaser from 'phaser';
import { worldConfig } from '../../config/worldConfig';
import { VOCABULARY } from '../data/vocabulary';
import { FONT_BODY, FONT_HEADING } from '../ui/fonts';

const MONO = FONT_BODY;
const PAGE_SIZE = 4;

/**
 * Math vocabulary review screen. Kept outside battles on purpose —
 * vocabulary never interrupts gameplay.
 */
export class GlossaryScene extends Phaser.Scene {
  private from = 'TitleScene';
  private page = 0;
  private body!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;

  constructor() {
    super('GlossaryScene');
  }

  init(data: { from?: string }): void {
    this.from = data.from ?? 'TitleScene';
    this.page = 0;
  }

  create(): void {
    const { gameWidth: W, gameHeight: H } = worldConfig;
    this.add.rectangle(0, 0, W, H, 0x1a2a5c).setOrigin(0);
    this.add
      .text(W / 2, 12, 'MATH GLOSSARY', { fontFamily: FONT_HEADING, fontSize: '13px', color: '#f8d048' })
      .setOrigin(0.5, 0);

    this.body = this.add.text(20, 42, '', {
      fontFamily: MONO,
      fontSize: '17px',
      color: '#ffffff',
      wordWrap: { width: W - 40 },
      lineSpacing: 0,
    });
    this.pageText = this.add
      .text(W / 2, H - 30, '', { fontFamily: MONO, fontSize: '14px', color: '#c0d0f8' })
      .setOrigin(0.5);
    this.add
      .text(W / 2, H - 14, '← → pages · ESC to return', { fontFamily: MONO, fontSize: '14px', color: '#8a93a6' })
      .setOrigin(0.5);

    this.renderPage();

    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKey, this);
    });
  }

  private handleKey(event: KeyboardEvent): void {
    const pages = Math.ceil(VOCABULARY.length / PAGE_SIZE);
    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.page = (this.page + 1) % pages;
      this.renderPage();
    } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.page = (this.page + pages - 1) % pages;
      this.renderPage();
    } else if (event.code === 'Escape' || event.code === 'Enter') {
      this.scene.start(this.from);
    }
  }

  private renderPage(): void {
    const start = this.page * PAGE_SIZE;
    const terms = VOCABULARY.slice(start, start + PAGE_SIZE);
    this.body.setText(terms.map((t) => `${t.term.toUpperCase()}\n  ${t.definition}`).join('\n\n'));
    this.pageText.setText(`Page ${this.page + 1} / ${Math.ceil(VOCABULARY.length / PAGE_SIZE)}`);
  }
}
