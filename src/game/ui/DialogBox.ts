import Phaser from 'phaser';
import { worldConfig } from '../../config/worldConfig';

/**
 * Classic bottom-screen dialog box. Feed it pages of text; the player
 * advances with the interact key. Calls onComplete when the last page
 * is dismissed.
 */
export class DialogBox {
  private container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private moreArrow: Phaser.GameObjects.Text;
  private pages: string[] = [];
  private pageIndex = 0;
  private onComplete: (() => void) | null = null;
  private _open = false;

  constructor(scene: Phaser.Scene) {
    const { gameWidth, gameHeight } = worldConfig;
    const boxH = 76;
    const y = gameHeight - boxH - 6;

    const bg = scene.add.rectangle(6, y, gameWidth - 12, boxH, 0xf8f8f0).setOrigin(0);
    bg.setStrokeStyle(3, 0x3a4a8c);
    const inner = scene.add
      .rectangle(9, y + 3, gameWidth - 18, boxH - 6, 0xffffff, 0)
      .setOrigin(0)
      .setStrokeStyle(1, 0xb0b8d0);

    this.text = scene.add.text(18, y + 12, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      color: '#26203a',
      wordWrap: { width: gameWidth - 40 },
      lineSpacing: 4,
    });

    this.moreArrow = scene.add
      .text(gameWidth - 26, y + boxH - 18, '▼', {
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        color: '#c83a3a',
      })
      .setVisible(false);

    this.container = scene.add.container(0, 0, [bg, inner, this.text, this.moreArrow]);
    this.container.setDepth(1000).setScrollFactor(0).setVisible(false);

    scene.tweens.add({
      targets: this.moreArrow,
      y: '+=3',
      duration: 350,
      yoyo: true,
      repeat: -1,
    });
  }

  get isOpen(): boolean {
    return this._open;
  }

  show(pages: string[], onComplete?: () => void): void {
    this.pages = pages;
    this.pageIndex = 0;
    this.onComplete = onComplete ?? null;
    this._open = true;
    this.container.setVisible(true);
    this.renderPage();
  }

  /** Advance to the next page; closes when done. Returns true if still open. */
  advance(): boolean {
    if (!this._open) return false;
    this.pageIndex += 1;
    if (this.pageIndex >= this.pages.length) {
      this.close();
      return false;
    }
    this.renderPage();
    return true;
  }

  close(): void {
    this._open = false;
    this.container.setVisible(false);
    const cb = this.onComplete;
    this.onComplete = null;
    cb?.();
  }

  private renderPage(): void {
    this.text.setText(this.pages[this.pageIndex]);
    this.moreArrow.setVisible(this.pageIndex < this.pages.length - 1);
  }
}
