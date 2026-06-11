import Phaser from 'phaser';
import { controlsConfig, matchesControl } from '../../config/controlsConfig';
import { worldConfig } from '../../config/worldConfig';
import { chiptune } from '../audio/ChiptunePlayer';
import { encounterService } from '../battle/EncounterService';
import { CREATURE_SPECIES } from '../data/creatures';
import { ENCOUNTER_TILES, MAPS, SOLID_TILES, type MapDefinition, type NpcDefinition } from '../data/maps';
import { creatureService } from '../entities/CreatureService';
import { startTileAnimations, TILE_TEXTURES } from '../gfx/textureFactory';
import { progressionService, saveService } from '../services';
import { FONT_BODY } from '../ui/fonts';
import { DialogBox } from '../ui/DialogBox';
import type { BattlePayload } from './BattleScene';

type Facing = 'up' | 'down' | 'left' | 'right';

const TILE = worldConfig.tileSize;

/**
 * Top-down grid-movement overworld. Reads the ASCII map, renders tiles,
 * handles collision, NPC interaction, warps, and tall-grass encounters.
 */
export class OverworldScene extends Phaser.Scene {
  private map!: MapDefinition;
  private player!: Phaser.GameObjects.Image;
  private playerTile = { x: 0, y: 0 };
  private facing: Facing = 'down';
  private moving = false;
  private stepFrame = 0;
  private dialog!: DialogBox;
  private hudText!: Phaser.GameObjects.Text;
  private npcSprites = new Map<string, Phaser.GameObjects.Image>();
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private pendingBattleNpc: NpcDefinition | null = null;

  constructor() {
    super('OverworldScene');
  }

  create(): void {
    const save = saveService.requireData();
    this.map = MAPS[save.player.mapKey] ?? MAPS.overworld;
    this.playerTile = { x: save.player.tileX, y: save.player.tileY };
    this.facing = save.player.facing;

    // Safety net: if a saved position is no longer walkable (e.g. the map
    // changed between versions), respawn at the town spawn point.
    if (!this.isTileWalkable(this.playerTile.x, this.playerTile.y)) {
      this.map = MAPS[worldConfig.spawn.mapKey];
      this.playerTile = { x: worldConfig.spawn.tileX, y: worldConfig.spawn.tileY };
      this.facing = worldConfig.spawn.facing;
      save.player.mapKey = worldConfig.spawn.mapKey;
      save.player.tileX = this.playerTile.x;
      save.player.tileY = this.playerTile.y;
      saveService.persist();
    }
    this.moving = false;
    this.pendingBattleNpc = null;
    this.npcSprites.clear();

    this.renderMap();
    this.spawnNpcs();
    startTileAnimations(this);

    this.player = this.add
      .image(this.playerTile.x * TILE + TILE / 2, this.playerTile.y * TILE + TILE / 2, this.playerTexture())
      .setScale(2)
      .setDepth(10);

    const mapW = this.map.grid[0].length * TILE;
    const mapH = this.map.grid.length * TILE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true);

    this.dialog = new DialogBox(this);

    this.hudText = this.add
      .text(8, 6, '', { fontFamily: FONT_BODY, fontSize: '15px', color: '#ffffff', backgroundColor: '#26203acc', padding: { x: 6, y: 4 }, lineSpacing: -2 })
      .setScrollFactor(0)
      .setDepth(900);
    this.refreshHud();

    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    kb.on('keydown', this.handleKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown', this.handleKeyDown, this);
    });

    chiptune.playMusic(this.map.musicTrack);
  }

  private renderMap(): void {
    const grid = this.map.grid;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const ch = grid[y][x];
        const base = TILE_TEXTURES[ch] ?? 'tile-grass';
        this.add.image(x * TILE, y * TILE, base).setOrigin(0).setScale(1);
      }
    }
  }

  private spawnNpcs(): void {
    const save = saveService.requireData();
    for (const npc of this.map.npcs) {
      const sprite = this.add
        .image(npc.tileX * TILE + TILE / 2, npc.tileY * TILE + TILE / 2, npc.spriteKey)
        .setScale(2)
        .setDepth(9);
      this.npcSprites.set(npc.id, sprite);
      // Defeated trainers get a subtle tint so kids can see who's done.
      if (npc.battle && save.defeatedTrainers.includes(npc.id)) {
        sprite.setTint(0xb8c8b8);
      }
    }
  }

  update(): void {
    if (this.dialog.isOpen || this.moving) return;

    let dir: Facing | null = null;
    if (this.keys.up.isDown || this.keys.w.isDown) dir = 'up';
    else if (this.keys.down.isDown || this.keys.s.isDown) dir = 'down';
    else if (this.keys.left.isDown || this.keys.a.isDown) dir = 'left';
    else if (this.keys.right.isDown || this.keys.d.isDown) dir = 'right';

    if (dir) this.tryStep(dir);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    chiptune.unlock();
    chiptune.playMusic(this.map.musicTrack);

    if (this.dialog.isOpen) {
      if (matchesControl(event.code, controlsConfig.interact)) {
        const stillOpen = this.dialog.advance();
        if (!stillOpen && this.pendingBattleNpc) {
          const npc = this.pendingBattleNpc;
          this.pendingBattleNpc = null;
          this.startNpcBattle(npc);
        }
      }
      return;
    }

    if (matchesControl(event.code, controlsConfig.interact)) {
      this.interact();
    } else if (matchesControl(event.code, controlsConfig.dashboard)) {
      this.persistPosition();
      this.scene.start('DashboardScene', { from: 'OverworldScene' });
    } else if (matchesControl(event.code, controlsConfig.glossary)) {
      this.persistPosition();
      this.scene.start('GlossaryScene', { from: 'OverworldScene' });
    } else if (event.code === 'KeyM') {
      chiptune.toggleMute();
    }
  }

  // ------------------------------------------------------------ movement

  private tryStep(dir: Facing): void {
    this.facing = dir;
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const nx = this.playerTile.x + delta[0];
    const ny = this.playerTile.y + delta[1];
    this.player.setTexture(this.playerTexture());

    if (!this.isWalkable(nx, ny)) return;

    this.moving = true;
    // Alternate stride frames (1 = left foot, 2 = right foot) each step.
    this.stepFrame = this.stepFrame === 1 ? 2 : 1;
    this.playerTile = { x: nx, y: ny };
    this.player.setTexture(this.playerTexture(true));

    this.tweens.add({
      targets: this.player,
      x: nx * TILE + TILE / 2,
      y: ny * TILE + TILE / 2,
      duration: worldConfig.stepDurationMs,
      onComplete: () => {
        this.moving = false;
        this.player.setTexture(this.playerTexture());
        this.onStepComplete(nx, ny);
      },
    });
  }

  private playerTexture(stepping = false): string {
    const dirKey = this.facing === 'right' || this.facing === 'left' ? 'side' : this.facing;
    this.player?.setFlipX(this.facing === 'right');
    return `player-${dirKey}-${stepping ? this.stepFrame : 0}`;
  }

  /** Terrain-only walkability (ignores NPCs). */
  private isTileWalkable(x: number, y: number): boolean {
    const grid = this.map.grid;
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[y].length) return false;
    return !SOLID_TILES.has(grid[y][x]);
  }

  private isWalkable(x: number, y: number): boolean {
    if (!this.isTileWalkable(x, y)) return false;
    for (const npc of this.map.npcs) {
      if (npc.tileX === x && npc.tileY === y) return false;
    }
    return true;
  }

  /** Which themed area governs encounters at this row (zone bands). */
  private areaIdAt(y: number) {
    const zone = this.map.zones?.find((z) => y >= z.y1 && y <= z.y2);
    return zone?.areaId ?? this.map.areaId;
  }

  private onStepComplete(x: number, y: number): void {
    const ch = this.map.grid[y][x];

    const warp = this.map.warps[`${x},${y}`];
    if (warp) {
      const save = saveService.requireData();
      save.player.mapKey = warp.mapKey;
      save.player.tileX = warp.tileX;
      save.player.tileY = warp.tileY;
      save.player.facing = warp.facing;
      saveService.persist();
      this.scene.restart();
      return;
    }

    if (ENCOUNTER_TILES.has(ch) && encounterService.rollEncounter()) {
      this.startWildBattle();
    }
  }

  // ---------------------------------------------------------- interaction

  private interact(): void {
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.facing];
    const tx = this.playerTile.x + delta[0];
    const ty = this.playerTile.y + delta[1];

    const npc = this.map.npcs.find((n) => n.tileX === tx && n.tileY === ty);
    if (npc) {
      this.talkTo(npc);
      return;
    }

    const sign = this.map.signs.find((s) => s.tileX === tx && s.tileY === ty);
    if (sign) {
      this.dialog.show([sign.text]);
      return;
    }

    if (this.map.grid[ty]?.[tx] === 'd') {
      this.dialog.show(['The door is locked. Someone must be out adventuring.']);
    }
  }

  private talkTo(npc: NpcDefinition): void {
    const save = saveService.requireData();
    if (!npc.battle) {
      this.dialog.show(npc.dialog);
      return;
    }

    const defeated = save.defeatedTrainers.includes(npc.id);
    if (npc.battle.type === 'trainer' && defeated) {
      this.dialog.show(npc.battle.defeatedDialog);
      return;
    }
    if (npc.battle.type === 'gym' && save.badges.includes(npc.battle.badgeId ?? '')) {
      // Gym leaders offer friendly rematches for extra practice.
      this.dialog.show(['Back for more training? I love it!', npc.battle.introText], () => undefined);
      this.pendingBattleNpc = npc;
      return;
    }

    this.dialog.show([...npc.dialog, npc.battle.introText]);
    this.pendingBattleNpc = npc;
  }

  private startNpcBattle(npc: NpcDefinition): void {
    if (!npc.battle) return;
    const enemy = creatureService.createInstance(npc.battle.speciesId, npc.battle.enemyLevel);
    enemy.maxHp = npc.battle.enemyHp;
    enemy.currentHp = npc.battle.enemyHp;

    this.launchBattle({
      battleType: npc.battle.type,
      enemy,
      trainerId: npc.id,
      trainerName: npc.name,
      badgeId: npc.battle.badgeId,
      introText: npc.battle.introText,
      victoryDialog: npc.battle.defeatedDialog,
    });
  }

  private startWildBattle(): void {
    chiptune.playSfx('encounter');
    const enemy = encounterService.rollWildCreature(this.areaIdAt(this.playerTile.y));
    const species = CREATURE_SPECIES[enemy.speciesId];
    this.launchBattle({
      battleType: 'wild',
      enemy,
      introText: `A wild ${species.name} appeared!`,
    });
  }

  private launchBattle(payload: BattlePayload): void {
    this.persistPosition();
    this.cameras.main.flash(180, 255, 255, 255);
    this.time.delayedCall(200, () => this.scene.start('BattleScene', payload));
  }

  private persistPosition(): void {
    const save = saveService.requireData();
    save.player.mapKey = this.map.key;
    save.player.tileX = this.playerTile.x;
    save.player.tileY = this.playerTile.y;
    save.player.facing = this.facing;
    saveService.persist();
  }

  private refreshHud(): void {
    const save = saveService.requireData();
    const level = progressionService.getCurrentLevel();
    const lead = save.party[0];
    const species = lead ? CREATURE_SPECIES[lead.speciesId] : null;
    const partyLine = lead && species ? `${species.name} Lv.${lead.level}` : 'No creature';
    this.hudText.setText(
      `${this.map.name}\n${partyLine} · ${save.player.coins} coins\nPracticing: ${level.levelName}\nENTER talk · P dashboard · G glossary · M mute`,
    );
  }
}

