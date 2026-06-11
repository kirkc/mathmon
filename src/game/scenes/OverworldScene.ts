import Phaser from 'phaser';
import { controlsConfig, matchesControl } from '../../config/controlsConfig';
import { worldConfig } from '../../config/worldConfig';
import { chiptune } from '../audio/ChiptunePlayer';
import { encounterService } from '../battle/EncounterService';
import { CREATURE_SPECIES } from '../data/creatures';
import { HOUSE_FIXTURES, HOUSE_ITEMS } from '../data/houseItems';
import { ENCOUNTER_TILES, MAPS, SOLID_TILES, type MapDefinition, type NpcDefinition } from '../data/maps';
import { creatureService } from '../entities/CreatureService';
import { startTileAnimations, TILE_TEXTURES } from '../gfx/textureFactory';
import { progressionService, saveService } from '../services';
import { FONT_BODY, FONT_HEADING } from '../ui/fonts';
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
  private paused = false;
  private pauseIndex = 0;
  private pausePage: 'menu' | 'help' | 'controls' = 'menu';
  private pauseUi: Phaser.GameObjects.Container | null = null;
  private npcSprites = new Map<string, Phaser.GameObjects.Image>();
  // ---- player house state
  private itemSolids = new Set<string>();
  private itemAt = new Map<string, { name?: string; examine: string; isComputer?: boolean }>();
  private itemSprites: Phaser.GameObjects.Image[] = [];
  private shopOpen = false;
  private shopIndex = 0;
  private shopMessage = '';
  private shopUi: Phaser.GameObjects.Container | null = null;
  private companion: Phaser.GameObjects.Image | null = null;
  private companionTile = { x: 0, y: 0 };
  private companionHopping = false;
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
    this.renderHouseItems();
    this.spawnCompanion();
    startTileAnimations(this);
    this.shopOpen = false;
    this.shopUi = null;

    this.player = this.add
      .image(this.playerTile.x * TILE + TILE / 2, this.playerTile.y * TILE + TILE / 2, this.playerTexture())
      .setScale(2)
      .setDepth(10);

    // Center maps smaller than the viewport (house interiors) by widening
    // the camera bounds symmetrically.
    const mapW = this.map.grid[0].length * TILE;
    const mapH = this.map.grid.length * TILE;
    const padX = Math.max(0, (worldConfig.gameWidth - mapW) / 2);
    const padY = Math.max(0, (worldConfig.gameHeight - mapH) / 2);
    this.cameras.main.setBounds(-padX, -padY, mapW + padX * 2, mapH + padY * 2);
    this.cameras.main.startFollow(this.player, true);

    this.dialog = new DialogBox(this);
    this.paused = false;
    this.pauseUi = null;

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
    const ground = this.map.key === 'minusMarsh' ? 'tile-mud' : 'tile-grass';
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const ch = grid[y][x];
        const base = TILE_TEXTURES[ch] ?? 'tile-grass';
        // Signs are transparent sprites layered over the local ground.
        if (ch === 'S') {
          this.add.image(x * TILE, y * TILE, ground).setOrigin(0).setScale(1);
        }
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
    if (this.paused || this.shopOpen || this.dialog.isOpen || this.moving) return;

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

    if (this.shopOpen) {
      this.handleShopKey(event);
      return;
    }
    if (this.paused) {
      this.handlePauseKey(event);
      return;
    }

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
    } else if (matchesControl(event.code, controlsConfig.cancel)) {
      this.openPause();
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

  // ---------------------------------------------------------- pause menu

  private openPause(): void {
    this.paused = true;
    this.pauseIndex = 0;
    this.pausePage = 'menu';
    chiptune.playSfx('select');
    this.renderPauseUi();
  }

  private closePause(): void {
    this.paused = false;
    this.pauseUi?.destroy();
    this.pauseUi = null;
  }

  private handlePauseKey(event: KeyboardEvent): void {
    if (this.pausePage !== 'menu') {
      if (
        matchesControl(event.code, controlsConfig.cancel) ||
        matchesControl(event.code, controlsConfig.interact)
      ) {
        this.pausePage = 'menu';
        this.renderPauseUi();
      }
      return;
    }

    const items = this.pauseMenuItems();
    if (matchesControl(event.code, controlsConfig.cancel)) {
      this.closePause();
    } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.pauseIndex = (this.pauseIndex + items.length - 1) % items.length;
      chiptune.playSfx('select');
      this.renderPauseUi();
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.pauseIndex = (this.pauseIndex + 1) % items.length;
      chiptune.playSfx('select');
      this.renderPauseUi();
    } else if (matchesControl(event.code, controlsConfig.interact)) {
      this.selectPauseItem(items[this.pauseIndex]);
    }
  }

  private pauseMenuItems(): string[] {
    return ['Resume', 'How to Play', 'Controls', 'Main Menu'];
  }

  private selectPauseItem(item: string): void {
    chiptune.playSfx('correct');
    switch (item) {
      case 'Resume':
        this.closePause();
        break;
      case 'How to Play':
        this.pausePage = 'help';
        this.renderPauseUi();
        break;
      case 'Controls':
        this.pausePage = 'controls';
        this.renderPauseUi();
        break;
      case 'Main Menu':
        this.persistPosition();
        this.closePause();
        this.scene.start('TitleScene');
        break;
    }
  }

  private renderPauseUi(): void {
    this.pauseUi?.destroy();
    const { gameWidth: GW, gameHeight: GH } = worldConfig;
    const ui = this.add.container(0, 0).setScrollFactor(0).setDepth(1500);
    this.pauseUi = ui;

    ui.add(this.add.rectangle(0, 0, GW, GH, 0x1a1626, 0.72).setOrigin(0));

    if (this.pausePage === 'menu') {
      // Trainer info panel — the old corner HUD now lives here.
      const save = saveService.requireData();
      const level = progressionService.getCurrentLevel();
      const lead = save.party[0];
      const species = lead ? CREATURE_SPECIES[lead.speciesId] : null;
      const info = [
        `${save.player.name} · ${this.map.name}`,
        species ? `Partner: ${species.name} Lv.${lead.level}` : 'No creature yet',
        `Coins: ${save.player.coins} · Badges: ${save.badges.length}`,
        `Practicing: ${level.levelName}`,
      ].join('\n');
      ui.add(this.add.rectangle(GW / 2, 70, 320, 84, 0x2c3a70).setStrokeStyle(3, 0x5468b8));
      ui.add(
        this.add
          .text(GW / 2, 70, info, { fontFamily: FONT_BODY, fontSize: '16px', color: '#ffffff', align: 'center', lineSpacing: 0 })
          .setOrigin(0.5),
      );
      if (species) {
        ui.add(this.add.image(GW / 2 - 138, 70, species.spriteKey).setScale(2));
      }

      ui.add(
        this.add
          .text(GW / 2, 128, 'PAUSED', { fontFamily: FONT_HEADING, fontSize: '12px', color: '#f8d048' })
          .setOrigin(0.5),
      );
      this.pauseMenuItems().forEach((item, i) => {
        const active = i === this.pauseIndex;
        ui.add(
          this.add
            .text(GW / 2, 156 + i * 24, `${active ? '▶ ' : '  '}${item}${active ? ' ◀' : '  '}`, {
              fontFamily: FONT_BODY,
              fontSize: '20px',
              color: active ? '#f8d048' : '#ffffff',
            })
            .setOrigin(0.5),
        );
      });
      ui.add(
        this.add
          .text(GW / 2, GH - 16, 'ESC resume · ENTER select', { fontFamily: FONT_BODY, fontSize: '14px', color: '#8a93a6' })
          .setOrigin(0.5),
      );
      return;
    }

    const isHelp = this.pausePage === 'help';
    ui.add(
      this.add
        .text(GW / 2, 28, isHelp ? 'HOW TO PLAY' : 'CONTROLS', {
          fontFamily: FONT_HEADING,
          fontSize: '13px',
          color: '#f8d048',
        })
        .setOrigin(0.5),
    );
    const body = isHelp
      ? [
          'Explore the world! Wild MathMon hide in the swaying tall grass.',
          '',
          'Battles are math duels: answer facts to attack. The faster you answer, the harder your creature hits. Wrong or slow answers let the enemy strike back — but every battle makes you stronger.',
          '',
          'Talk to trainers to battle them, and challenge the Gym Leader in town to earn badges. Practice unlocks new math powers!',
          '',
          'Your game saves by itself after every battle.',
        ].join('\n')
      : [
          'ARROWS / WASD ... move',
          'ENTER / SPACE ... talk, confirm',
          '0-9 ............ answer math questions',
          'BACKSPACE ...... fix your answer',
          'ESC ............ pause menu',
          'P .............. parent dashboard',
          'G .............. math glossary',
          'M .............. mute music',
        ].join('\n');
    ui.add(
      this.add.text(40, 52, body, {
        fontFamily: FONT_BODY,
        fontSize: '17px',
        color: '#ffffff',
        wordWrap: { width: GW - 80 },
        lineSpacing: 0,
      }),
    );
    ui.add(
      this.add
        .text(GW / 2, GH - 16, 'ESC or ENTER to go back', { fontFamily: FONT_BODY, fontSize: '14px', color: '#8a93a6' })
        .setOrigin(0.5),
    );
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

  /** Terrain-only walkability (ignores NPCs, includes furniture). */
  private isTileWalkable(x: number, y: number): boolean {
    const grid = this.map.grid;
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[y].length) return false;
    if (this.itemSolids.has(`${x},${y}`)) return false;
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
      if (warp.requires) {
        const hasBadge = !warp.requires.badgeId || save.badges.includes(warp.requires.badgeId);
        const hasLevel =
          !warp.requires.minLevelNumber ||
          save.progression.currentLevelNumber >= warp.requires.minLevelNumber;
        if (!hasBadge || !hasLevel) {
          this.dialog.show([warp.requires.lockedMessage]);
          return;
        }
      }
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

    const item = this.itemAt.get(`${tx},${ty}`);
    if (item) {
      if (item.isComputer) this.openShop();
      else if (item.examine) this.dialog.show([item.examine]);
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

  // -------------------------------------------------------- player house

  /** Place fixtures + purchased furniture, with collision and examine text. */
  private renderHouseItems(): void {
    this.itemSolids.clear();
    this.itemAt.clear();
    for (const sprite of this.itemSprites) sprite.destroy();
    this.itemSprites = [];
    if (!this.map.isPlayerHouse) return;

    const save = saveService.requireData();
    const placed = [
      ...HOUSE_FIXTURES.filter((f) => f.mapKey === this.map.key),
      ...HOUSE_ITEMS.filter((i) => i.mapKey === this.map.key && save.house.ownedItems.includes(i.id)),
    ];
    for (const item of placed) {
      if (item.textureKey) {
        const scale = 'scale' in item && item.scale ? item.scale : 1;
        const isBed = item.textureKey === 'item-bed';
        const img = this.add
          .image(
            item.tileX * TILE + TILE / 2,
            // The bed is two tiles tall; center it over both tiles.
            item.tileY * TILE + (isBed ? TILE : TILE / 2),
            item.textureKey,
          )
          .setScale(scale)
          .setDepth(item.solid ? 8 : 2);
        this.itemSprites.push(img);
      }
      const key = `${item.tileX},${item.tileY}`;
      if (item.solid) this.itemSolids.add(key);
      this.itemAt.set(key, {
        name: 'name' in item ? item.name : undefined,
        examine: item.examine,
        isComputer: 'isComputer' in item ? item.isComputer : undefined,
      });
    }
  }

  /** The player's partner creature lives in the house, hopping about. */
  private spawnCompanion(): void {
    this.companion = null;
    if (!this.map.isPlayerHouse) return;
    const lead = saveService.requireData().party[0];
    if (!lead) return;
    const species = CREATURE_SPECIES[lead.speciesId];

    // Find a free tile near the middle of the room.
    const candidates: Array<[number, number]> = [[7, 5], [6, 6], [8, 4], [4, 6], [7, 3], [3, 4]];
    const spot = candidates.find(([x, y]) => this.isWalkable(x, y) && !this.map.warps[`${x},${y}`]);
    if (!spot) return;

    this.companionTile = { x: spot[0], y: spot[1] };
    this.companion = this.add
      .image(spot[0] * TILE + TILE / 2, spot[1] * TILE + TILE / 2, species.spriteKey)
      .setScale(1.5)
      .setDepth(9);

    this.time.addEvent({ delay: 1100, loop: true, callback: () => this.companionHop() });
  }

  private companionHop(): void {
    if (!this.companion || this.companionHopping || this.paused || this.shopOpen) return;
    const dirs = Phaser.Utils.Array.Shuffle([
      [0, -1], [0, 1], [-1, 0], [1, 0],
    ] as Array<[number, number]>);
    let target: [number, number] | null = null;
    for (const [dx, dy] of dirs) {
      const nx = this.companionTile.x + dx;
      const ny = this.companionTile.y + dy;
      if (
        this.isWalkable(nx, ny) &&
        !this.map.warps[`${nx},${ny}`] &&
        !(nx === this.playerTile.x && ny === this.playerTile.y)
      ) {
        target = [nx, ny];
        break;
      }
    }

    this.companionHopping = true;
    const sprite = this.companion;
    const hopDone = () => {
      this.companionHopping = false;
    };
    // Little vertical hop either way — it's just happy to be home.
    this.tweens.add({ targets: sprite, y: sprite.y - 7, duration: 130, yoyo: true, ease: 'Quad.easeOut' });
    if (target) {
      if (target[0] !== this.companionTile.x) sprite.setFlipX(target[0] > this.companionTile.x);
      this.companionTile = { x: target[0], y: target[1] };
      this.tweens.add({
        targets: sprite,
        x: target[0] * TILE + TILE / 2,
        duration: 260,
        onComplete: hopDone,
      });
      this.tweens.add({
        targets: sprite,
        y: target[1] * TILE + TILE / 2,
        duration: 260,
        delay: 130,
        onComplete: () => undefined,
      });
    } else {
      this.time.delayedCall(300, hopDone);
    }
  }

  // ------------------------------------------------------- furniture shop

  private openShop(): void {
    this.shopOpen = true;
    this.shopIndex = 0;
    this.shopMessage = 'Welcome to MathMart! Buy comfy things with your battle coins.';
    chiptune.playSfx('select');
    this.renderShopUi();
  }

  private closeShop(): void {
    this.shopOpen = false;
    this.shopUi?.destroy();
    this.shopUi = null;
  }

  private shopCatalog() {
    return [...HOUSE_ITEMS].sort((a, b) => a.price - b.price);
  }

  private handleShopKey(event: KeyboardEvent): void {
    const catalog = this.shopCatalog();
    if (matchesControl(event.code, controlsConfig.cancel)) {
      this.closeShop();
      return;
    }
    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.shopIndex = (this.shopIndex + catalog.length - 1) % catalog.length;
      chiptune.playSfx('select');
      this.renderShopUi();
      return;
    }
    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.shopIndex = (this.shopIndex + 1) % catalog.length;
      chiptune.playSfx('select');
      this.renderShopUi();
      return;
    }
    if (matchesControl(event.code, controlsConfig.interact)) {
      const save = saveService.requireData();
      const item = catalog[this.shopIndex];
      if (save.house.ownedItems.includes(item.id)) {
        this.shopMessage = `You already own the ${item.name}!`;
        chiptune.playSfx('wrong');
      } else if (save.player.coins < item.price) {
        this.shopMessage = `Not enough coins for the ${item.name}. Win battles to earn more!`;
        chiptune.playSfx('wrong');
      } else {
        save.player.coins -= item.price;
        save.house.ownedItems.push(item.id);
        saveService.persist();
        this.shopMessage = `${item.name} delivered! Check ${item.mapKey === this.map.key ? 'the room' : 'the other floor'}.`;
        chiptune.playSfx('victory');
        this.renderHouseItems(); // appears instantly if it's on this floor
      }
      this.renderShopUi();
    }
  }

  private renderShopUi(): void {
    this.shopUi?.destroy();
    const { gameWidth: GW, gameHeight: GH } = worldConfig;
    const ui = this.add.container(0, 0).setScrollFactor(0).setDepth(1500);
    this.shopUi = ui;
    const save = saveService.requireData();
    const catalog = this.shopCatalog();

    ui.add(this.add.rectangle(0, 0, GW, GH, 0x1a1626, 0.8).setOrigin(0));
    ui.add(this.add.rectangle(GW / 2, GH / 2, GW - 60, GH - 36, 0x2c3a70).setStrokeStyle(3, 0x5468b8));
    ui.add(
      this.add
        .text(GW / 2, 32, 'MATHMART ONLINE', { fontFamily: FONT_HEADING, fontSize: '13px', color: '#f8d048' })
        .setOrigin(0.5),
    );
    ui.add(
      this.add
        .text(GW - 44, 30, `${save.player.coins} coins`, { fontFamily: FONT_BODY, fontSize: '16px', color: '#f8d048' })
        .setOrigin(1, 0.5),
    );

    // Scrolling window of rows around the cursor.
    const VISIBLE = 8;
    const first = Phaser.Math.Clamp(this.shopIndex - 3, 0, Math.max(0, catalog.length - VISIBLE));
    catalog.slice(first, first + VISIBLE).forEach((item, row) => {
      const i = first + row;
      const y = 56 + row * 22;
      const selected = i === this.shopIndex;
      const owned = save.house.ownedItems.includes(item.id);
      const affordable = save.player.coins >= item.price;
      const color = owned ? '#7a86ad' : selected ? '#f8d048' : '#ffffff';
      ui.add(
        this.add.text(52, y, `${selected ? '▶' : ' '} ${item.name}`, {
          fontFamily: FONT_BODY,
          fontSize: '17px',
          color,
        }),
      );
      ui.add(
        this.add
          .text(GW - 52, y, owned ? 'Owned' : `${item.price}c`, {
            fontFamily: FONT_BODY,
            fontSize: '17px',
            color: owned ? '#7a86ad' : affordable ? '#8ee08e' : '#e08a8a',
          })
          .setOrigin(1, 0),
      );
    });
    if (catalog.length > VISIBLE) {
      if (first > 0) ui.add(this.add.text(GW / 2, 48, '▲', { fontFamily: FONT_BODY, fontSize: '12px', color: '#8a93a6' }).setOrigin(0.5));
      if (first + VISIBLE < catalog.length)
        ui.add(this.add.text(GW / 2, 56 + VISIBLE * 22, '▼', { fontFamily: FONT_BODY, fontSize: '12px', color: '#8a93a6' }).setOrigin(0.5));
    }

    ui.add(
      this.add
        .text(GW / 2, GH - 44, this.shopMessage, {
          fontFamily: FONT_BODY,
          fontSize: '15px',
          color: '#c0d0f8',
          wordWrap: { width: GW - 90 },
          align: 'center',
        })
        .setOrigin(0.5),
    );
    ui.add(
      this.add
        .text(GW / 2, GH - 24, '↑↓ browse · ENTER buy · ESC exit', { fontFamily: FONT_BODY, fontSize: '14px', color: '#8a93a6' })
        .setOrigin(0.5),
    );
  }

}

