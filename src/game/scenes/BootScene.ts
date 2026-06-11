import Phaser from 'phaser';
import { waitForFonts } from '../ui/fonts';

/** Boot: wait for the pixel webfonts so no scene renders fallback text. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    void waitForFonts().then(() => this.scene.start('PreloadScene'));
  }
}
