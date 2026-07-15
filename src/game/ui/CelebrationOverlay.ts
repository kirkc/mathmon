import Phaser from 'phaser';
import { controlsConfig, matchesControl } from '../../config/controlsConfig';
import { worldConfig } from '../../config/worldConfig';
import { chiptune } from '../audio/ChiptunePlayer';
import type { CreatureSpecies } from '../data/creatures';
import type { TrophyDefinition } from '../data/trophies';
import { FONT_BODY, FONT_HEADING } from './fonts';

/**
 * Full-screen cut-in for milestone moments (trophy earned, evolution).
 * Gameplay pauses while it plays: scenes must gate their input handlers and
 * update() on isActive. Dismisses on the interact key or after a few seconds.
 */
export class CelebrationOverlay {
  private container: Phaser.GameObjects.Container | null = null;
  private dismissTimer: Phaser.Time.TimerEvent | null = null;
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private onDone: (() => void) | null = null;
  private _active = false;

  constructor(private readonly scene: Phaser.Scene) {}

  get isActive(): boolean {
    return this._active;
  }

  /** Present trophies one after another, then call onAllDone. */
  showQueue(trophies: TrophyDefinition[], onAllDone: () => void): void {
    const next = (i: number): void => {
      if (i >= trophies.length) {
        onAllDone();
        return;
      }
      this.showTrophy(trophies[i], () => next(i + 1));
    };
    next(0);
  }

  showTrophy(trophy: TrophyDefinition, onDone: () => void): void {
    const { gameWidth: GW, gameHeight: GH } = worldConfig;
    const container = this.begin(onDone);
    const scene = this.scene;

    const heading = scene.add
      .text(GW / 2, 62, 'TROPHY EARNED!', { fontFamily: FONT_HEADING, fontSize: '15px', color: '#f8d048' })
      .setOrigin(0.5)
      .setAlpha(0);
    const cup = scene.add.image(GW / 2, GH / 2 - 22, 'trophy-gold').setScale(0);
    const name = scene.add
      .text(GW / 2, GH / 2 + 44, trophy.name, { fontFamily: FONT_BODY, fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0);
    const desc = scene.add
      .text(GW / 2, GH / 2 + 70, trophy.description, {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: '#c0d0f8',
        align: 'center',
        wordWrap: { width: GW - 100 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    container.add([heading, cup, name, desc]);

    chiptune.playSfx('trophy');
    scene.tweens.add({
      targets: cup,
      scale: 5,
      angle: 720,
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (!this._active) return;
        this.sparkleBurst(GW / 2, GH / 2 - 22, container);
        scene.tweens.add({ targets: [heading, name, desc], alpha: 1, duration: 250 });
        // Gentle bob while on display.
        scene.tweens.add({ targets: cup, y: '+=4', duration: 600, yoyo: true, repeat: -1 });
      },
    });

    this.armDismiss(900, 3400);
  }

  showEvolution(evolution: { from: CreatureSpecies; to: CreatureSpecies }, onDone: () => void): void {
    const { gameWidth: GW, gameHeight: GH } = worldConfig;
    const container = this.begin(onDone);
    const scene = this.scene;

    const label = scene.add
      .text(GW / 2, GH / 2 + 64, `What's this? ${evolution.from.name} is evolving!`, {
        fontFamily: FONT_BODY,
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: GW - 80 },
      })
      .setOrigin(0.5);
    const sprite = scene.add.image(GW / 2, GH / 2 - 22, evolution.from.spriteKey).setScale(5);
    const flash = scene.add.rectangle(0, 0, GW, GH, 0xffffff, 0).setOrigin(0);
    container.add([label, sprite, flash]);

    chiptune.playSfx('evolve');
    // White pulses build up, then the new form bursts out.
    scene.tweens.add({
      targets: flash,
      alpha: 0.85,
      duration: 280,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (!this._active) return;
        flash.destroy();
        sprite.setTexture(evolution.to.spriteKey);
        this.sparkleBurst(GW / 2, GH / 2 - 22, container);
        scene.tweens.add({ targets: sprite, scale: 6, duration: 250, ease: 'Back.easeOut' });
        label.setText(`${evolution.from.name} evolved into ${evolution.to.name}!`);
        chiptune.playSfx('victory');
      },
    });

    this.armDismiss(2400, 5200);
  }

  // ------------------------------------------------------------- internals

  /** Shared setup: dim layer, container, active flag. */
  private begin(onDone: () => void): Phaser.GameObjects.Container {
    const { gameWidth: GW, gameHeight: GH } = worldConfig;
    this._active = true;
    this.onDone = onDone;
    const container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(2000);
    container.add(this.scene.add.rectangle(0, 0, GW, GH, 0x1a1626, 0.82).setOrigin(0));
    this.container = container;
    return container;
  }

  /** Enable key dismiss after minMs (so the moment lands), auto-dismiss at maxMs. */
  private armDismiss(minMs: number, maxMs: number): void {
    this.keyHandler = (event: KeyboardEvent) => {
      if (matchesControl(event.code, controlsConfig.interact)) this.dismiss();
    };
    const handler = this.keyHandler;
    this.scene.time.delayedCall(minMs, () => {
      if (this._active && this.keyHandler === handler) {
        this.scene.input.keyboard?.on('keydown', handler);
      }
    });
    this.dismissTimer = this.scene.time.delayedCall(maxMs, () => this.dismiss());
  }

  private dismiss(): void {
    if (!this._active) return;
    this._active = false;
    if (this.keyHandler) {
      this.scene.input.keyboard?.off('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    this.dismissTimer?.remove();
    this.dismissTimer = null;
    const container = this.container;
    this.container = null;
    const cb = this.onDone;
    this.onDone = null;
    if (container) {
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: 180,
        onComplete: () => container.destroy(),
      });
    }
    cb?.();
  }

  /** Radiating gold sparkle ring (same idiom as BattleScene's impactBurst). */
  private sparkleBurst(x: number, y: number, container: Phaser.GameObjects.Container): void {
    const flash = this.scene.add.circle(x, y, 8, 0xffffff);
    container.add(flash);
    this.scene.tweens.add({ targets: flash, scale: 5, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const spark = this.scene.add.rectangle(x, y, 6, 6, i % 2 === 0 ? 0xf8d048 : 0xfff3b0);
      container.add(spark);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 64,
        y: y + Math.sin(angle) * 64,
        alpha: 0,
        scale: 0.3,
        angle: 180,
        duration: 480,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }
}
