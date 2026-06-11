import Phaser from 'phaser';
import { worldConfig } from './config/worldConfig';
import { BattleScene } from './game/scenes/BattleScene';
import { BootScene } from './game/scenes/BootScene';
import { DashboardScene } from './game/scenes/DashboardScene';
import { GlossaryScene } from './game/scenes/GlossaryScene';
import { OverworldScene } from './game/scenes/OverworldScene';
import { PreloadScene } from './game/scenes/PreloadScene';
import { SaveSlotScene } from './game/scenes/SaveSlotScene';
import { TitleScene } from './game/scenes/TitleScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: worldConfig.gameWidth,
  height: worldConfig.gameHeight,
  zoom: 2,
  pixelArt: true,
  backgroundColor: '#1a1424',
  scene: [BootScene, PreloadScene, TitleScene, SaveSlotScene, OverworldScene, BattleScene, DashboardScene, GlossaryScene],
});

// Exposed for debugging and automated playtesting only.
(window as unknown as { __MATHMON_GAME: Phaser.Game }).__MATHMON_GAME = game;
