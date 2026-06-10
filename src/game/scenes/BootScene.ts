import Phaser from 'phaser';

/** Minimal boot: jump straight to preload. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
