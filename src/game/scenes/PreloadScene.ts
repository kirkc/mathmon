import Phaser from 'phaser';
import { generateAllTextures } from '../gfx/textureFactory';

/**
 * Generates every placeholder texture procedurally — the vertical slice
 * ships zero binary assets. TODO milestone 2: load a real tileset and
 * sprite atlas here instead.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    generateAllTextures(this);
    this.scene.start('TitleScene');
  }
}
