import Phaser from 'phaser';
import { worldConfig } from '../../config/worldConfig';

/**
 * Procedural pixel art, drawn onto canvas textures at boot — the game ships
 * zero binary assets. This pass aims for GBA-era fidelity: outlines,
 * two-tone shading, dithering, and purpose-driven animation (tall grass and
 * water are the ONLY animated tiles, because they signal interactivity).
 * TODO milestone 3: replace with a real sprite/tileset pipeline.
 */

const S = worldConfig.pixelScale; // logical pixel -> canvas pixels
const T = 16; // logical tile size in art pixels

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, x: number, y: number, color: string, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x * S, y * S, w * S, h * S);
}

/** Checkerboard dither between two colors over a rect. */
function dither(ctx: Ctx, x1: number, y1: number, w: number, h: number, color: string, parity = 0): void {
  for (let y = y1; y < y1 + h; y++) {
    for (let x = x1; x < x1 + w; x++) {
      if ((x + y) % 2 === parity) px(ctx, x, y, color);
    }
  }
}

function makeTexture(
  scene: Phaser.Scene,
  key: string,
  wPx: number,
  hPx: number,
  draw: (ctx: Ctx) => void,
): void {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, wPx * S, hPx * S);
  if (!canvas) return;
  draw(canvas.context);
  canvas.refresh();
}

/** Deterministic speckle so tiles look textured but stable. */
function speckle(x: number, y: number, mod: number, salt = 0): boolean {
  return (x * 7 + y * 13 + ((x * y + salt) % 5)) % mod === 0;
}

// ---------------------------------------------------------------- palettes

const GRASS = { base: '#7fc25e', light: '#8ecf6d', dark: '#6fae50', deep: '#5d9a42' };
const WOOD = { dark: '#6b3f1d', mid: '#8a5a2b', light: '#a8743c', pale: '#c79256' };
const OUTLINE = '#1a1626';

// ------------------------------------------------------------------- tiles

function drawGrassBase(ctx: Ctx): void {
  px(ctx, 0, 0, GRASS.base, T, T);
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      if (speckle(x, y, 11)) px(ctx, x, y, GRASS.light);
      else if (speckle(x, y, 9, 3)) px(ctx, x, y, GRASS.dark);
    }
  }
  // a couple of tiny blade tufts
  for (const [tx, ty] of [[3, 4], [11, 10]] as const) {
    px(ctx, tx, ty, GRASS.deep);
    px(ctx, tx + 1, ty - 1, GRASS.deep);
    px(ctx, tx + 2, ty, GRASS.deep);
  }
}

/**
 * Tall grass — animated (frame 0/1) because it's interactable: wild
 * creatures hide here. Blade tips sway one pixel between frames.
 */
export function drawTallGrassFrame(ctx: Ctx, frame: number): void {
  px(ctx, 0, 0, GRASS.dark, T, T);
  dither(ctx, 0, 0, T, T, GRASS.deep, 1);
  const sway = frame % 2 === 0 ? 0 : 1;
  for (const gx of [1, 5, 9, 13]) {
    for (const gy of [3, 10]) {
      // blade cluster: two outer blades + taller center blade with swaying tip
      px(ctx, gx, gy + 1, '#2f7a2f', 1, 3);
      px(ctx, gx + 2, gy + 1, '#2f7a2f', 1, 3);
      px(ctx, gx + 1, gy - 1 , '#3da33d', 1, 5);
      px(ctx, gx + 1 + sway, gy - 2, '#54b854', 1, 1); // swaying tip
      px(ctx, gx + sway, gy, '#54b854');
      px(ctx, gx + 2 - sway, gy, '#3da33d');
    }
  }
}

/**
 * Water — animated (3 frames) because it will be fishable later. Wave
 * highlights drift and a sparkle blinks.
 */
export function drawWaterFrame(ctx: Ctx, frame: number): void {
  px(ctx, 0, 0, '#3878c8', T, T);
  dither(ctx, 0, 0, T, T, '#4a90d9', frame % 2);
  const drift = frame % 3;
  for (const [wy, base] of [[3, 1], [8, 7], [13, 4]] as const) {
    const wx = (base + drift * 2) % 10;
    px(ctx, wx, wy, '#8cc4ee', 4, 1);
    px(ctx, wx + 5, wy + 1, '#5ea2e0', 3, 1);
  }
  if (frame === 1) px(ctx, 12, 5, '#e8f4ff'); // blink sparkle
  if (frame === 2) px(ctx, 4, 11, '#e8f4ff');
}

/**
 * Marsh grass — animated like tall grass (it's the marsh's encounter tile).
 * Darker, reedier, with seed heads.
 */
export function drawMarshGrassFrame(ctx: Ctx, frame: number): void {
  px(ctx, 0, 0, '#4a6b42', T, T);
  dither(ctx, 0, 0, T, T, '#3d5c38', 1);
  const sway = frame % 2 === 0 ? 0 : 1;
  for (const gx of [2, 7, 12]) {
    for (const gy of [4, 11]) {
      px(ctx, gx, gy - 1, '#2c4a28', 1, 4);
      px(ctx, gx + 2, gy, '#2c4a28', 1, 3);
      px(ctx, gx + 1 + sway, gy - 3, '#6b8a4a', 1, 3); // swaying reed
      px(ctx, gx + 1 + sway, gy - 4, '#8a9a5a'); // seed head
    }
  }
}

/** Deep ocean — animated (3 frames): drifting foam crests + blinking glints. */
export function drawOceanFrame(ctx: Ctx, frame: number): void {
  px(ctx, 0, 0, '#2a9fae', T, T);
  dither(ctx, 0, 0, T, T, '#3ab4c2', frame % 2);
  const drift = frame % 3;
  for (const [wy, base] of [[2, 3], [7, 8], [12, 1]] as const) {
    const wx = (base + drift * 2) % 10;
    px(ctx, wx, wy, '#8ce0e8', 4, 1); // foam crest
    px(ctx, wx + 5, wy + 1, '#5ec8d4', 3, 1);
  }
  if (frame === 0) px(ctx, 13, 9, '#f2fcfc'); // sun glints
  if (frame === 2) px(ctx, 3, 14, '#f2fcfc');
}

/** Dune grass — the coast's encounter tile, swaying like tall grass. */
export function drawDuneGrassFrame(ctx: Ctx, frame: number): void {
  px(ctx, 0, 0, '#e8d8a8', T, T);
  dither(ctx, 0, 0, T, T, '#dcc890', 1);
  const sway = frame % 2 === 0 ? 0 : 1;
  for (const gx of [2, 7, 12]) {
    for (const gy of [4, 11]) {
      px(ctx, gx, gy, '#a8a052', 1, 4);
      px(ctx, gx + 2, gy + 1, '#a8a052', 1, 3);
      px(ctx, gx + 1 + sway, gy - 2, '#c2b862', 1, 3); // swaying blade
      px(ctx, gx + 1 + sway, gy - 3, '#d8cc78'); // sun-bleached tip
    }
  }
}

/** Murky marsh water — slow ripple, no sparkle (it's swamp). */
export function drawMarshWaterFrame(ctx: Ctx, frame: number): void {
  px(ctx, 0, 0, '#3d5a4e', T, T);
  dither(ctx, 0, 0, T, T, '#46685a', frame % 2);
  const drift = frame % 3;
  for (const [wy, base] of [[4, 2], [9, 6], [14, 0]] as const) {
    const wx = (base + drift) % 10;
    px(ctx, wx, wy, '#5d8270', 4, 1);
  }
  if (frame === 2) px(ctx, 11, 6, '#74a08a'); // lazy bubble
}

export function generateTileTextures(scene: Phaser.Scene): void {
  makeTexture(scene, 'tile-grass', T, T, (ctx) => drawGrassBase(ctx));
  makeTexture(scene, 'tile-tallgrass', T, T, (ctx) => drawTallGrassFrame(ctx, 0));
  makeTexture(scene, 'tile-water', T, T, (ctx) => drawWaterFrame(ctx, 0));
  makeTexture(scene, 'tile-marsh-grass', T, T, (ctx) => drawMarshGrassFrame(ctx, 0));
  makeTexture(scene, 'tile-marsh-water', T, T, (ctx) => drawMarshWaterFrame(ctx, 0));

  makeTexture(scene, 'tile-ocean', T, T, (ctx) => drawOceanFrame(ctx, 0));
  makeTexture(scene, 'tile-dune-grass', T, T, (ctx) => drawDuneGrassFrame(ctx, 0));

  makeTexture(scene, 'tile-sand', T, T, (ctx) => {
    px(ctx, 0, 0, '#e8d8a8', T, T);
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        if (speckle(x, y, 10)) px(ctx, x, y, '#dcc890');
        else if (speckle(x, y, 13, 2)) px(ctx, x, y, '#f2e4bc');
      }
    }
    px(ctx, 4, 7, '#c8b078', 2, 1); // wind ripples
    px(ctx, 10, 12, '#c8b078', 3, 1);
  });

  makeTexture(scene, 'tile-palm', T, T, (ctx) => {
    px(ctx, 0, 0, '#e8d8a8', T, T);
    dither(ctx, 0, 0, T, T, '#dcc890', 0);
    px(ctx, 5, 13, '#c8b078', 7, 2); // shadow
    px(ctx, 7, 6, '#8a5a2b', 2, 9); // curved trunk
    px(ctx, 8, 4, '#8a5a2b', 1, 3);
    px(ctx, 7, 8, '#a8743c', 1, 6);
    px(ctx, 4, 2, '#3f9c4e', 4, 2); // fronds
    px(ctx, 9, 2, '#3f9c4e', 4, 2);
    px(ctx, 2, 4, '#2e7a3c', 4, 2);
    px(ctx, 11, 4, '#2e7a3c', 4, 2);
    px(ctx, 7, 1, '#4fb35e', 3, 2);
    px(ctx, 8, 5, '#d9542c', 2, 2); // coconuts
  });

  makeTexture(scene, 'tile-shells', T, T, (ctx) => {
    px(ctx, 0, 0, '#e8d8a8', T, T);
    dither(ctx, 0, 0, T, T, '#dcc890', 0);
    px(ctx, 3, 4, '#f2a0b8', 3, 2); // pink shell
    px(ctx, 4, 3, '#f2a0b8', 1, 1);
    px(ctx, 4, 4, '#fce8ee', 1, 1);
    px(ctx, 10, 8, '#f8f8f0', 3, 2); // white shell
    px(ctx, 11, 7, '#f8f8f0', 1, 1);
    px(ctx, 6, 12, '#f28066', 3, 2); // little starfish
    px(ctx, 7, 11, '#f28066', 1, 1);
    px(ctx, 7, 13, '#f28066', 1, 1);
  });

  makeTexture(scene, 'tile-coast-rock', T, T, (ctx) => {
    px(ctx, 0, 0, '#e8d8a8', T, T);
    dither(ctx, 0, 0, T, T, '#dcc890', 0);
    px(ctx, 3, 5, '#565e70', 10, 8); // rock outline
    px(ctx, 4, 4, '#8a93a6', 8, 8);
    px(ctx, 4, 4, '#aab2c4', 5, 2); // lit top
    px(ctx, 4, 11, '#6d7689', 8, 1);
    px(ctx, 11, 6, '#e8f4ff', 1, 1); // wet glint
    px(ctx, 2, 12, '#5ec8d4', 3, 1); // tidepool edge
    px(ctx, 12, 13, '#5ec8d4', 2, 1);
  });

  makeTexture(scene, 'tile-mud', T, T, (ctx) => {
    px(ctx, 0, 0, '#6b5638', T, T);
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        if (speckle(x, y, 9)) px(ctx, x, y, '#5d4a30');
        else if (speckle(x, y, 12, 4)) px(ctx, x, y, '#7d6644');
      }
    }
    px(ctx, 3, 5, '#52412a', 3, 1); // puddle glints
    px(ctx, 10, 11, '#52412a', 2, 1);
    px(ctx, 4, 5, '#86a08a', 1, 1);
  });

  makeTexture(scene, 'tile-dead-tree', T, T, (ctx) => {
    px(ctx, 0, 0, '#4a6b42', T, T);
    dither(ctx, 0, 0, T, T, '#3d5c38', 0);
    px(ctx, 5, 12, '#2c3a28', 7, 2); // shadow
    px(ctx, 6, 4, '#4a4038', 4, 10); // gnarled trunk
    px(ctx, 7, 4, '#5d534a', 2, 10);
    px(ctx, 3, 2, '#4a4038', 4, 2); // bare branches
    px(ctx, 4, 1, '#4a4038', 1, 3);
    px(ctx, 10, 3, '#4a4038', 4, 2);
    px(ctx, 12, 2, '#4a4038', 1, 2);
    px(ctx, 6, 6, '#5d7a4a', 3, 2); // moss patch
    px(ctx, 8, 10, '#5d7a4a', 2, 1);
  });

  makeTexture(scene, 'tile-reeds', T, T, (ctx) => {
    px(ctx, 0, 0, '#6b5638', T, T);
    dither(ctx, 0, 0, T, T, '#5d4a30', 0);
    for (const rx of [3, 6, 9, 12]) {
      px(ctx, rx, 4, '#5d7a3a', 1, 9);
      px(ctx, rx, 2, '#8a6b42', 1, 3); // cattail head
      px(ctx, rx + 1, 7, '#6b8a4a', 1, 5);
    }
  });

  makeTexture(scene, 'tile-mushroom', T, T, (ctx) => {
    px(ctx, 0, 0, '#6b5638', T, T);
    dither(ctx, 0, 0, T, T, '#5d4a30', 0);
    const caps: Array<[number, number, string]> = [[4, 7, '#c46a4a'], [10, 5, '#d9a05a'], [8, 11, '#c46a4a']];
    for (const [mx, my, color] of caps) {
      px(ctx, mx, my + 2, '#e8dcc8', 2, 2); // stem
      px(ctx, mx - 1, my, color, 4, 2); // cap
      px(ctx, mx, my - 1, color, 2, 1);
      px(ctx, mx, my, '#f2e0c0', 1, 1); // spot
    }
  });

  makeTexture(scene, 'tile-lilypad', T, T, (ctx) => {
    drawMarshWaterFrame(ctx, 0);
    px(ctx, 3, 4, '#3f7a3a', 10, 8); // pad
    px(ctx, 4, 3, '#3f7a3a', 8, 10);
    px(ctx, 4, 4, '#4f9448', 8, 7);
    px(ctx, 8, 4, '#3d5a4e', 2, 4); // notch
    px(ctx, 5, 5, '#6bb060', 3, 2); // highlight
    px(ctx, 10, 9, '#f2a0b8', 2, 2); // small blossom
    px(ctx, 10, 9, '#f8d048', 1, 1);
  });

  // ---- player house exterior (distinct teal roof + bright timberwork)
  makeTexture(scene, 'tile-roof-player', T, T, (ctx) => {
    px(ctx, 0, 0, '#3aa8a0', T, T);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      px(ctx, 0, y + 3, '#2c847e', T, 1);
      const offset = row % 2 === 0 ? 0 : 4;
      for (let x = offset; x < T; x += 8) px(ctx, x, y, '#2c847e', 1, 3);
      px(ctx, 0, y, '#56c4bc', T, 1);
    }
  });

  makeTexture(scene, 'tile-wall-player', T, T, (ctx) => {
    px(ctx, 0, 0, '#f4ede0', T, T);
    dither(ctx, 0, 0, T, T, '#e8dccb', 0);
    px(ctx, 0, 0, '#3aa8a0', T, 1); // teal trim
    px(ctx, 0, 15, '#3aa8a0', T, 1);
    px(ctx, 0, 0, '#3aa8a0', 1, T);
    px(ctx, 15, 0, '#3aa8a0', 1, T);
    px(ctx, 4, 4, '#2c847e', 8, 7); // window with flower box
    px(ctx, 5, 5, '#a7d3f2', 6, 5);
    px(ctx, 5, 5, '#d2ecfa', 3, 2);
    px(ctx, 8, 5, '#2c847e', 1, 5);
    px(ctx, 4, 11, '#8a5a2b', 8, 2);
    px(ctx, 5, 10, '#f2647c', 2, 1);
    px(ctx, 9, 10, '#f8d048', 2, 1);
  });

  makeTexture(scene, 'tile-door-player', T, T, (ctx) => {
    px(ctx, 0, 0, '#f4ede0', T, T);
    dither(ctx, 0, 0, T, T, '#e8dccb', 0);
    px(ctx, 2, 1, '#2c847e', 12, 15); // frame
    px(ctx, 3, 2, '#3aa8a0', 10, 14);
    px(ctx, 4, 3, '#56c4bc', 8, 2); // lit top
    // star emblem — it's YOUR house
    px(ctx, 7, 6, '#f8d048', 2, 2);
    px(ctx, 6, 7, '#f8d048', 4, 1);
    px(ctx, 7, 5, '#fff3b0', 2, 1);
    px(ctx, 7, 9, '#f8d048', 2, 1);
    px(ctx, 11, 9, '#fff3b0', 1, 1); // knob
    px(ctx, 3, 15, '#c4b288', 10, 1); // step
  });

  // ---- house interior
  makeTexture(scene, 'tile-wood-floor', T, T, (ctx) => {
    px(ctx, 0, 0, '#c79256', T, T);
    for (const fy of [0, 4, 8, 12]) {
      px(ctx, 0, fy + 3, '#a8743c', T, 1);
      const offset = (fy / 4) % 2 === 0 ? 0 : 8;
      px(ctx, offset, fy, '#a8743c', 1, 3);
      px(ctx, 0, fy, '#d9a868', T, 1);
    }
  });

  makeTexture(scene, 'tile-interior-wall', T, T, (ctx) => {
    // Vertical wood paneling, clearly darker than the floor.
    px(ctx, 0, 0, '#8a6b42', T, T);
    for (const wx of [0, 4, 8, 12]) {
      px(ctx, wx, 0, '#6b5232', 1, T);
      px(ctx, wx + 1, 0, '#9c7c50', 1, T);
    }
    px(ctx, 0, 0, '#a8895c', T, 2); // top trim
    px(ctx, 0, 13, '#5d4326', T, 3); // baseboard shadow
  });

  makeTexture(scene, 'tile-stairs-up', T, T, (ctx) => {
    px(ctx, 0, 0, '#c79256', T, T);
    for (let s = 0; s < 4; s++) {
      px(ctx, 0, 12 - s * 4, '#a8743c', T, 1);
      px(ctx, 0, 13 - s * 4, '#d9a868', T, 1);
    }
    px(ctx, 6, 1, '#5d4a30', 4, 2); // dark opening at top
    px(ctx, 7, 4, '#f8d048', 2, 1); // "up" arrow hint
    px(ctx, 6, 5, '#f8d048', 1, 1);
    px(ctx, 9, 5, '#f8d048', 1, 1);
  });

  makeTexture(scene, 'tile-stairs-down', T, T, (ctx) => {
    px(ctx, 0, 0, '#c79256', T, T);
    for (let s = 0; s < 4; s++) {
      px(ctx, 0, 2 + s * 4, '#a8743c', T, 1);
      px(ctx, 0, 3 + s * 4, '#8a6b42', T, 1);
    }
    px(ctx, 6, 13, '#5d4a30', 4, 2);
    px(ctx, 7, 10, '#f8d048', 2, 1);
    px(ctx, 6, 9, '#f8d048', 1, 1);
    px(ctx, 9, 9, '#f8d048', 1, 1);
  });

  makeTexture(scene, 'tile-house-exit', T, T, (ctx) => {
    px(ctx, 0, 0, '#c79256', T, T);
    px(ctx, 2, 2, '#5d4a30', 12, 14); // doorway shadow
    px(ctx, 3, 3, '#6b5a40', 10, 13);
    px(ctx, 6, 14, '#f8d048', 4, 1); // light from outside
  });

  makeTexture(scene, 'tile-path', T, T, (ctx) => {
    px(ctx, 0, 0, '#d9b873', T, T);
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        if (speckle(x, y, 10)) px(ctx, x, y, '#cba85f');
        else if (speckle(x, y, 13, 2)) px(ctx, x, y, '#e5c98a');
      }
    }
    // pebbles + soft top edge for depth
    px(ctx, 4, 6, '#b8954e', 2, 1);
    px(ctx, 11, 12, '#b8954e', 2, 1);
    px(ctx, 0, 0, '#e5c98a', T, 1);
  });

  makeTexture(scene, 'tile-flower', T, T, (ctx) => {
    drawGrassBase(ctx);
    const flowers: Array<[number, number, string]> = [
      [3, 4, '#f2647c'],
      [10, 6, '#f8d048'],
      [6, 11, '#f8f8f8'],
    ];
    for (const [fx, fy, color] of flowers) {
      px(ctx, fx, fy + 2, GRASS.deep, 1, 2); // stem
      px(ctx, fx - 1, fy + 3, GRASS.deep); // leaf
      px(ctx, fx, fy - 1, color);
      px(ctx, fx - 1, fy, color);
      px(ctx, fx + 1, fy, color);
      px(ctx, fx, fy + 1, color);
      px(ctx, fx, fy, '#fff3b0');
    }
  });

  makeTexture(scene, 'tile-tree', T, T, (ctx) => {
    drawGrassBase(ctx);
    px(ctx, 5, 13, '#4a7a38', 7, 2); // ground shadow
    // trunk with bark lines
    px(ctx, 6, 10, WOOD.dark, 4, 5);
    px(ctx, 7, 10, WOOD.mid, 2, 5);
    px(ctx, 7, 12, WOOD.dark, 1, 1);
    // canopy: outline, base, highlight, shade
    px(ctx, 3, 1, '#1f5429', 10, 2);
    px(ctx, 2, 2, '#1f5429', 12, 8);
    px(ctx, 3, 2, '#2e7a3c', 10, 7);
    px(ctx, 4, 1, '#2e7a3c', 8, 2);
    px(ctx, 4, 2, '#3f9c4e', 6, 3); // lit top-left
    px(ctx, 5, 1, '#4fb35e', 4, 1);
    px(ctx, 9, 6, '#236430', 4, 3); // shaded bottom-right
    px(ctx, 5, 5, '#4fb35e'); // leaf glints
    px(ctx, 10, 3, '#4fb35e');
  });

  makeTexture(scene, 'tile-roof', T, T, (ctx) => {
    px(ctx, 0, 0, '#cf5634', T, T);
    // shingle rows (offset brick pattern)
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      px(ctx, 0, y + 3, '#a83e22', T, 1);
      const offset = row % 2 === 0 ? 0 : 4;
      for (let x = offset; x < T; x += 8) px(ctx, x, y, '#a83e22', 1, 3);
      px(ctx, 0, y, '#e8744e', T, 1); // lit shingle top
    }
  });

  makeTexture(scene, 'tile-wall', T, T, (ctx) => {
    px(ctx, 0, 0, '#ead9ad', T, T);
    dither(ctx, 0, 0, T, T, '#e0cd9c', 0);
    // timber frame
    px(ctx, 0, 0, WOOD.mid, T, 1);
    px(ctx, 0, 15, WOOD.mid, T, 1);
    px(ctx, 0, 0, WOOD.mid, 1, T);
    px(ctx, 15, 0, WOOD.mid, 1, T);
    // window with frame and sky reflection
    px(ctx, 4, 4, WOOD.dark, 8, 7);
    px(ctx, 5, 5, '#7db8ea', 6, 5);
    px(ctx, 5, 5, '#b8dcf5', 3, 2);
    px(ctx, 8, 5, WOOD.dark, 1, 5); // mullion
  });

  makeTexture(scene, 'tile-door-gym', T, T, (ctx) => {
    px(ctx, 0, 0, '#ead9ad', T, T);
    dither(ctx, 0, 0, T, T, '#e0cd9c', 0);
    px(ctx, 2, 1, WOOD.dark, 12, 15); // frame
    px(ctx, 3, 2, '#2e3c78', 10, 14);
    px(ctx, 4, 3, '#4458a8', 8, 12);
    px(ctx, 4, 3, '#5a70c4', 8, 2); // lit top
    // gold plus emblem
    px(ctx, 7, 6, '#f8d048', 2, 6);
    px(ctx, 5, 8, '#f8d048', 6, 2);
    px(ctx, 7, 6, '#fff3b0', 2, 1);
    px(ctx, 3, 15, '#c4b288', 10, 1); // step
  });

  makeTexture(scene, 'tile-door-subgym', T, T, (ctx) => {
    // Subtraction Gym door: same build as the gym door, minus the plus.
    px(ctx, 0, 0, '#ead9ad', T, T);
    dither(ctx, 0, 0, T, T, '#e0cd9c', 0);
    px(ctx, 2, 1, WOOD.dark, 12, 15); // frame
    px(ctx, 3, 2, '#2e3c78', 10, 14);
    px(ctx, 4, 3, '#4458a8', 8, 12);
    px(ctx, 4, 3, '#5a70c4', 8, 2); // lit top
    // gold minus emblem
    px(ctx, 5, 8, '#f8d048', 6, 2);
    px(ctx, 5, 8, '#fff3b0', 6, 1);
    px(ctx, 3, 15, '#c4b288', 10, 1); // step
  });

  makeTexture(scene, 'tile-door-house', T, T, (ctx) => {
    px(ctx, 0, 0, '#ead9ad', T, T);
    dither(ctx, 0, 0, T, T, '#e0cd9c', 0);
    px(ctx, 3, 2, WOOD.dark, 10, 14); // frame
    px(ctx, 4, 3, WOOD.mid, 8, 13);
    px(ctx, 5, 3, WOOD.light, 2, 12); // plank highlights
    px(ctx, 8, 3, WOOD.light, 2, 12);
    px(ctx, 10, 9, '#f8d048'); // knob
    px(ctx, 4, 15, '#c4b288', 8, 1); // step
  });

  // Sign art is transparent — the scene layers it over the local ground
  // tile so signs work on grass, mud, or anything else.
  makeTexture(scene, 'tile-sign', T, T, (ctx) => {
    px(ctx, 6, 13, 'rgba(0,0,0,0.25)', 5, 1); // shadow
    px(ctx, 7, 9, WOOD.dark, 2, 5); // post
    px(ctx, 2, 2, WOOD.dark, 12, 7); // board outline
    px(ctx, 3, 3, WOOD.light, 10, 5);
    px(ctx, 3, 3, WOOD.pale, 10, 1); // lit edge
    px(ctx, 4, 5, WOOD.dark, 8, 1); // text dashes
    px(ctx, 4, 7, WOOD.dark, 5, 1);
  });

  makeTexture(scene, 'tile-fence', T, T, (ctx) => {
    drawGrassBase(ctx);
    px(ctx, 1, 6, WOOD.pale, 14, 2);
    px(ctx, 1, 7, WOOD.mid, 14, 1);
    for (const fx of [2, 12]) {
      px(ctx, fx, 4, WOOD.light, 2, 9);
      px(ctx, fx, 4, WOOD.pale, 1, 9);
      px(ctx, fx, 12, WOOD.dark, 2, 1);
    }
  });

  makeTexture(scene, 'tile-gym-floor', T, T, (ctx) => {
    px(ctx, 0, 0, '#cdd4e0', T, T);
    px(ctx, 0, 0, '#bcc4d4', 8, 8);
    px(ctx, 8, 8, '#bcc4d4', 8, 8);
    px(ctx, 0, 0, '#aab2c4', T, 1); // grout lines
    px(ctx, 0, 8, '#aab2c4', T, 1);
    px(ctx, 0, 0, '#aab2c4', 1, T);
    px(ctx, 8, 0, '#aab2c4', 1, T);
    px(ctx, 1, 1, '#dde2ec', 6, 1); // tile sheen
    px(ctx, 9, 9, '#dde2ec', 6, 1);
  });

  makeTexture(scene, 'tile-gym-wall', T, T, (ctx) => {
    px(ctx, 0, 0, '#34427c', T, T);
    px(ctx, 0, 0, '#4a5a9c', T, 3); // lit top
    px(ctx, 0, 12, '#26305c', T, 4); // shadow base
    for (const wx of [4, 8, 12]) px(ctx, wx, 3, '#2c3868', 1, 9); // panel seams
  });

  makeTexture(scene, 'tile-gym-mat', T, T, (ctx) => {
    px(ctx, 0, 0, '#cdd4e0', T, T);
    px(ctx, 1, 1, '#a83232', 14, 14);
    px(ctx, 2, 2, '#c84848', 12, 12);
    px(ctx, 3, 3, '#e06060', 10, 2); // sheen
    for (const [cx, cy] of [[2, 2], [13, 2], [2, 13], [13, 13]] as const) {
      px(ctx, cx, cy, '#f8d048');
    }
  });

  makeTexture(scene, 'tile-gym-exit', T, T, (ctx) => {
    px(ctx, 0, 0, '#cdd4e0', T, T);
    px(ctx, 2, 2, '#8a93a6', 12, 12);
    px(ctx, 3, 3, '#6d7689', 10, 10);
    // downward arrow (the way out)
    px(ctx, 7, 5, '#dde2ec', 2, 5);
    px(ctx, 5, 8, '#dde2ec', 2, 2);
    px(ctx, 9, 8, '#dde2ec', 2, 2);
  });
}

// -------------------------------------------------------------- furniture

export function generateFurnitureTextures(scene: Phaser.Scene): void {
  makeTexture(scene, 'item-computer', T, T, (ctx) => {
    px(ctx, 1, 8, WOOD.mid, 14, 6); // desk
    px(ctx, 1, 8, WOOD.pale, 14, 1);
    px(ctx, 2, 14, WOOD.dark, 2, 2); // legs
    px(ctx, 12, 14, WOOD.dark, 2, 2);
    px(ctx, 4, 1, '#26203a', 8, 7); // monitor
    px(ctx, 5, 2, '#3a6ac8', 6, 5);
    px(ctx, 5, 2, '#7db8ea', 6, 1);
    px(ctx, 6, 3, '#f8d048', 2, 1); // shop icon on screen
    px(ctx, 6, 5, '#ffffff', 4, 1);
    px(ctx, 12, 9, '#d0d0c0', 3, 2); // mouse
  });

  makeTexture(scene, 'item-bed', T, 32, (ctx) => {
    px(ctx, 1, 2, WOOD.dark, 14, 28); // frame
    px(ctx, 2, 3, '#f4ede0', 12, 26);
    px(ctx, 2, 3, '#ffffff', 12, 7); // pillow
    px(ctx, 3, 4, '#e8e0f4', 10, 4);
    px(ctx, 2, 11, '#c84848', 12, 16); // blanket
    px(ctx, 2, 11, '#e06060', 12, 2);
    px(ctx, 2, 19, '#a83232', 12, 1); // fold
    px(ctx, 2, 27, '#f4ede0', 12, 2);
  });

  // Big furniture is drawn at its real footprint (couch 2x1, rug 3x2...)
  makeTexture(scene, 'item-couch', 32, T, (ctx) => {
    px(ctx, 0, 4, '#3a6ac8', 32, 10);
    px(ctx, 0, 3, '#5a86d8', 32, 2);
    px(ctx, 3, 7, '#5a86d8', 8, 4); // three cushions
    px(ctx, 12, 7, '#5a86d8', 8, 4);
    px(ctx, 21, 7, '#5a86d8', 8, 4);
    px(ctx, 0, 4, '#2c4f96', 3, 10); // arms
    px(ctx, 29, 4, '#2c4f96', 3, 10);
    px(ctx, 2, 14, WOOD.dark, 2, 2);
    px(ctx, 28, 14, WOOD.dark, 2, 2);
    px(ctx, 13, 5, '#f8d048', 6, 2); // throw pillow
  });

  makeTexture(scene, 'item-tv', 32, T, (ctx) => {
    px(ctx, 4, 11, WOOD.mid, 24, 4); // stand
    px(ctx, 4, 11, WOOD.pale, 24, 1);
    px(ctx, 0, 0, '#26203a', 32, 11); // widescreen
    px(ctx, 1, 1, '#3a4a8c', 30, 9);
    px(ctx, 3, 2, '#86c860', 12, 6); // battle replay on screen
    px(ctx, 18, 3, '#e8783c', 4, 4);
    px(ctx, 24, 4, '#58a8e0', 4, 3);
    px(ctx, 4, 8, '#f8f8f0', 20, 1);
    px(ctx, 1, 1, '#7db8ea', 30, 1); // glare
  });

  makeTexture(scene, 'item-fridge', T, 24, (ctx) => {
    px(ctx, 2, 0, '#d0d8e0', 12, 23);
    px(ctx, 2, 0, '#e8eef4', 12, 1);
    px(ctx, 2, 8, '#a8b4c0', 12, 1); // freezer line
    px(ctx, 12, 2, '#6d7689', 1, 4); // handles
    px(ctx, 12, 11, '#6d7689', 1, 6);
    px(ctx, 4, 12, '#f2647c', 2, 2); // magnets
    px(ctx, 7, 15, '#f8d048', 2, 2);
    px(ctx, 2, 23, '#8a93a6', 12, 1);
  });

  makeTexture(scene, 'item-plant', T, T, (ctx) => {
    px(ctx, 5, 10, '#c46a4a', 6, 5); // pot
    px(ctx, 4, 10, '#d9885a', 8, 2);
    px(ctx, 7, 4, '#2f8a2f', 2, 7); // stem
    px(ctx, 4, 2, '#3f9c4e', 4, 4); // leaves
    px(ctx, 9, 3, '#3f9c4e', 4, 3);
    px(ctx, 6, 0, '#4fb35e', 4, 3);
    px(ctx, 5, 2, '#6bc878', 2, 1);
  });

  makeTexture(scene, 'item-wardrobe', 32, 24, (ctx) => {
    px(ctx, 1, 0, WOOD.mid, 30, 23);
    px(ctx, 1, 0, WOOD.pale, 30, 1);
    px(ctx, 3, 2, WOOD.light, 12, 19); // doors
    px(ctx, 17, 2, WOOD.light, 12, 19);
    px(ctx, 16, 0, WOOD.dark, 1, 23); // center seam
    px(ctx, 13, 9, '#f8d048', 2, 3); // knobs
    px(ctx, 18, 9, '#f8d048', 2, 3);
    px(ctx, 4, 3, WOOD.pale, 3, 17); // door grain highlights
    px(ctx, 25, 3, WOOD.pale, 3, 17);
    px(ctx, 1, 23, WOOD.dark, 30, 1);
  });

  makeTexture(scene, 'item-wallart-1', T, T, (ctx) => {
    px(ctx, 2, 3, WOOD.dark, 12, 10); // frame
    px(ctx, 3, 4, '#9adcf0', 10, 8); // meadow scene
    px(ctx, 3, 9, '#86c860', 10, 3);
    px(ctx, 5, 5, '#f8d048', 2, 2); // sun
    px(ctx, 9, 8, '#c83a3a', 2, 2); // tiny roof
  });

  makeTexture(scene, 'item-wallart-2', T, T, (ctx) => {
    px(ctx, 2, 3, '#f8d048', 12, 10); // gold frame
    px(ctx, 3, 4, '#f8f8f0', 10, 8);
    px(ctx, 7, 5, '#c83a3a', 2, 4); // abstract "7"
    px(ctx, 6, 5, '#c83a3a', 3, 1);
    px(ctx, 4, 9, '#3a6ac8', 3, 2);
    px(ctx, 10, 6, '#3f9c4e', 2, 3);
  });

  makeTexture(scene, 'item-wallart-3', T, T, (ctx) => {
    px(ctx, 2, 3, WOOD.dark, 12, 10);
    px(ctx, 3, 4, '#c0d0f8', 10, 8);
    px(ctx, 4, 7, '#e8783c', 3, 3); // the three starters, tiny
    px(ctx, 7, 6, '#6ab84a', 3, 3);
    px(ctx, 10, 7, '#58a8e0', 2, 3);
  });

  makeTexture(scene, 'item-chair', T, T, (ctx) => {
    px(ctx, 3, 1, '#c84848', 10, 5); // back
    px(ctx, 3, 1, '#e06060', 10, 1);
    px(ctx, 3, 6, '#e06060', 10, 5); // seat
    px(ctx, 3, 11, WOOD.dark, 2, 4); // legs
    px(ctx, 11, 11, WOOD.dark, 2, 4);
  });

  makeTexture(scene, 'item-fireplace', 32, T, (ctx) => {
    px(ctx, 1, 0, '#8a8278', 30, 15); // stone surround
    px(ctx, 1, 0, '#a8a098', 30, 2);
    for (let y = 2; y < 14; y += 3) {
      for (let x = 1 + (y % 2) * 2; x < 31; x += 4) px(ctx, x, y, '#6d665c', 1, 1);
    }
    px(ctx, 8, 4, '#26203a', 16, 10); // firebox
    px(ctx, 10, 9, '#f04830', 12, 4); // fire
    px(ctx, 12, 7, '#f8841c', 8, 4);
    px(ctx, 14, 5, '#f8d048', 4, 4);
    px(ctx, 10, 13, WOOD.dark, 12, 1); // log
    px(ctx, 3, 1, '#f8d048', 4, 1); // mantel trinket
    px(ctx, 26, 1, '#3a6ac8', 2, 1);
  });

  makeTexture(scene, 'item-table', 32, T, (ctx) => {
    px(ctx, 1, 4, WOOD.light, 30, 8);
    px(ctx, 1, 4, WOOD.pale, 30, 1);
    px(ctx, 2, 12, WOOD.dark, 3, 4);
    px(ctx, 27, 12, WOOD.dark, 3, 4);
    px(ctx, 11, 5, '#f8f8f0', 10, 5); // table runner
    px(ctx, 14, 6, '#f2647c', 2, 2); // little flower
    px(ctx, 15, 6, '#f8d048', 1, 1);
    px(ctx, 4, 6, '#7db8ea', 3, 3); // juice cup
  });

  makeTexture(scene, 'item-lamp', T, 24, (ctx) => {
    px(ctx, 3, 0, '#f8d048', 10, 7); // shade
    px(ctx, 2, 6, '#e0b830', 12, 1);
    px(ctx, 5, 1, '#fff3b0', 4, 4); // glow
    px(ctx, 7, 7, WOOD.dark, 2, 14); // pole
    px(ctx, 4, 21, WOOD.dark, 8, 3); // base
    px(ctx, 4, 21, WOOD.mid, 8, 1);
  });

  makeTexture(scene, 'item-doormat', T, T, (ctx) => {
    px(ctx, 1, 4, '#a8743c', 14, 9);
    px(ctx, 2, 5, '#c79256', 12, 7);
    px(ctx, 3, 7, '#8a5a2b', 10, 1); // "WELCOME" dashes
    px(ctx, 4, 9, '#8a5a2b', 8, 1);
  });

  makeTexture(scene, 'item-mirror', T, T, (ctx) => {
    px(ctx, 4, 1, '#f8d048', 8, 14); // gold frame
    px(ctx, 5, 2, '#a7d3f2', 6, 12);
    px(ctx, 6, 3, '#d2ecfa', 2, 8); // shine
    px(ctx, 9, 4, '#7db8ea', 1, 6);
  });

  makeTexture(scene, 'item-nightstand', T, T, (ctx) => {
    px(ctx, 3, 4, WOOD.mid, 10, 10);
    px(ctx, 3, 4, WOOD.pale, 10, 1);
    px(ctx, 4, 7, WOOD.dark, 8, 1); // drawer line
    px(ctx, 7, 8, '#f8d048', 2, 1); // knob
    px(ctx, 4, 14, WOOD.dark, 2, 2);
    px(ctx, 10, 14, WOOD.dark, 2, 2);
    px(ctx, 5, 1, '#7db8ea', 3, 3); // water glass
    px(ctx, 9, 2, '#f8f8f0', 3, 2); // flashcards
  });

  makeTexture(scene, 'item-rug', 48, 32, (ctx) => {
    // The biggest item in the catalog: a 3x2-tile statement rug.
    px(ctx, 1, 1, '#a83232', 46, 30);
    px(ctx, 3, 3, '#c84848', 42, 26);
    px(ctx, 6, 6, '#e06060', 36, 20);
    px(ctx, 10, 9, '#f2a0a0', 28, 14);
    // corner diamonds + center medallion
    for (const [cx, cy] of [[4, 4], [42, 4], [4, 26], [42, 26]] as const) {
      px(ctx, cx, cy, '#f8d048', 2, 2);
    }
    px(ctx, 20, 13, '#f8d048', 8, 6);
    px(ctx, 22, 15, '#c84848', 4, 2);
  });
}

// --------------------------------------------------------------- trophies

export function generateTrophyTextures(scene: Phaser.Scene): void {
  const GOLD = '#f8d048';
  const GOLD_DARK = '#d9b32e';
  const GOLD_LIGHT = '#fff3b0';

  // The trophy itself — shown big (scaled up) by the celebration overlay.
  makeTexture(scene, 'trophy-gold', T, T, (ctx) => {
    px(ctx, 3, 1, GOLD_LIGHT, 10, 1); // rim
    px(ctx, 4, 2, GOLD, 8, 5); // bowl
    px(ctx, 4, 5, GOLD_DARK, 8, 2);
    px(ctx, 5, 2, GOLD_LIGHT, 2, 2); // sheen
    px(ctx, 1, 2, GOLD_DARK, 2, 1); // left handle
    px(ctx, 1, 2, GOLD_DARK, 1, 4);
    px(ctx, 1, 5, GOLD_DARK, 3, 1);
    px(ctx, 13, 2, GOLD_DARK, 2, 1); // right handle
    px(ctx, 14, 2, GOLD_DARK, 1, 4);
    px(ctx, 12, 5, GOLD_DARK, 3, 1);
    px(ctx, 7, 3, '#c83a3a', 2, 2); // gem emblem
    px(ctx, 7, 3, '#e06060', 1, 1);
    px(ctx, 7, 7, GOLD_DARK, 2, 2); // stem
    px(ctx, 6, 9, GOLD, 4, 1); // collar
    px(ctx, 5, 10, '#8a5a2b', 6, 2); // wooden plinth
    px(ctx, 4, 12, '#6b3f1d', 8, 2);
    px(ctx, 4, 12, '#a8743c', 8, 1);
  });

  // Glass-front display cabinet for the player's house.
  makeTexture(scene, 'item-trophy-case', T, 24, (ctx) => {
    px(ctx, 1, 0, WOOD.dark, 14, 24); // cabinet body
    px(ctx, 2, 1, WOOD.mid, 12, 22);
    px(ctx, 1, 0, WOOD.pale, 14, 1); // top trim
    px(ctx, 3, 2, '#a7d3f2', 10, 19); // glass front
    px(ctx, 3, 2, '#d2ecfa', 3, 7); // glare
    for (const sy of [8, 14, 20]) px(ctx, 3, sy, WOOD.light, 10, 1); // shelves
    for (const [cx, cy] of [[4, 5], [9, 5], [5, 11], [10, 11], [7, 17]] as const) {
      px(ctx, cx, cy, GOLD, 2, 2); // tiny cups
      px(ctx, cx, cy + 2, GOLD_DARK, 2, 1);
    }
    px(ctx, 1, 23, WOOD.dark, 14, 1);
  });
}

// -------------------------------------------------------------- humanoids

interface HumanoidStyle {
  hair: string;
  hairLight: string;
  skin: string;
  skinShade: string;
  shirt: string;
  shirtShade: string;
  pants: string;
  cap?: string;
  capLight?: string;
}

type WalkFrame = 0 | 1 | 2; // idle, left stride, right stride

function drawHumanoid(ctx: Ctx, s: HumanoidStyle, facing: 'down' | 'up' | 'side', frame: WalkFrame): void {
  const bob = frame === 0 ? 0 : -1; // step frames lift the body one pixel

  // ---- head
  px(ctx, 4, 2 + bob, OUTLINE, 8, 6);
  px(ctx, 5, 3 + bob, s.skin, 6, 4);
  const hat = s.cap ?? s.hair;
  const hatLight = s.capLight ?? s.hairLight;
  px(ctx, 4, 2 + bob, hat, 8, 2);
  px(ctx, 5, 2 + bob, hatLight, 4, 1); // lit crown
  px(ctx, 4, 4 + bob, hat, 1, 2);
  px(ctx, 11, 4 + bob, hat, 1, 2);
  if (s.cap) px(ctx, 3, 3 + bob, s.cap, 10, 1); // cap brim

  if (facing === 'up') {
    px(ctx, 5, 3 + bob, s.hair, 6, 4); // back of head
    px(ctx, 5, 3 + bob, s.hairLight, 2, 2);
  } else if (facing === 'down') {
    px(ctx, 6, 5 + bob, OUTLINE); // eyes
    px(ctx, 9, 5 + bob, OUTLINE);
    px(ctx, 5, 6 + bob, s.skinShade); // cheek shading
    px(ctx, 10, 6 + bob, s.skinShade);
  } else {
    px(ctx, 6, 5 + bob, OUTLINE); // profile eye
    px(ctx, 4, 5 + bob, s.skin); // nose hint
    px(ctx, 9, 4 + bob, s.hair, 3, 3); // hair sweep behind
  }

  // ---- torso (lit left, shaded right)
  px(ctx, 4, 8 + bob, OUTLINE, 8, 5);
  px(ctx, 5, 8 + bob, s.shirt, 4, 5);
  px(ctx, 9, 8 + bob, s.shirtShade, 2, 5);
  if (facing === 'up') px(ctx, 5, 9 + bob, s.shirtShade, 6, 3); // backpack-ish shading

  // ---- arms swing with the stride
  const armSwing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  px(ctx, 3, 9 + bob + armSwing, s.shirtShade, 1, 3);
  px(ctx, 12, 9 + bob - armSwing, s.shirtShade, 1, 3);
  px(ctx, 3, 12 + bob + armSwing, s.skin, 1, 1);
  px(ctx, 12, 12 + bob - armSwing, s.skin, 1, 1);

  // ---- legs: stride frames extend opposite legs
  if (frame === 0) {
    px(ctx, 5, 13 + bob, s.pants, 2, 2);
    px(ctx, 9, 13 + bob, s.pants, 2, 2);
    px(ctx, 5, 15, OUTLINE, 2, 1);
    px(ctx, 9, 15, OUTLINE, 2, 1);
  } else {
    const fwd = frame === 1 ? 5 : 9; // which leg strides
    const back = frame === 1 ? 9 : 5;
    px(ctx, fwd, 13 + bob, s.pants, 2, 3);
    px(ctx, fwd, 15, OUTLINE, 2, 1);
    px(ctx, back, 13 + bob, s.pants, 2, 1);
    px(ctx, back, 14 + bob, OUTLINE, 2, 1);
  }
}

export function generateCharacterTextures(scene: Phaser.Scene): void {
  const hero: HumanoidStyle = {
    hair: '#5a3a1e', hairLight: '#7a5230',
    skin: '#f2c79a', skinShade: '#dca878',
    shirt: '#3a6ac8', shirtShade: '#2c4f96',
    pants: '#2c3a70',
    cap: '#c83a3a', capLight: '#e05c5c',
  };
  const girl: HumanoidStyle = {
    hair: '#a8743c', hairLight: '#c79256',
    skin: '#f2c79a', skinShade: '#dca878',
    shirt: '#e06090', shirtShade: '#b84a72',
    pants: '#7a4a8c',
  };
  const boy: HumanoidStyle = {
    hair: '#26203a', hairLight: '#3c3454',
    skin: '#d9a06a', skinShade: '#bd8654',
    shirt: '#3f9c4e', shirtShade: '#2e7a3c',
    pants: '#5a3a1e',
  };
  const ada: HumanoidStyle = {
    hair: '#f8d048', hairLight: '#fff3b0',
    skin: '#f2c79a', skinShade: '#dca878',
    shirt: '#c84848', shirtShade: '#a83232',
    pants: '#26203a',
  };
  const rema: HumanoidStyle = {
    hair: '#3aa8a0', hairLight: '#56c4bc',
    skin: '#d9a06a', skinShade: '#bd8654',
    shirt: '#7a4a8c', shirtShade: '#5d3a6b',
    pants: '#26203a',
  };

  const facings: Array<'down' | 'up' | 'side'> = ['down', 'up', 'side'];
  for (const facing of facings) {
    for (const frame of [0, 1, 2] as const) {
      makeTexture(scene, `player-${facing}-${frame}`, T, T, (ctx) =>
        drawHumanoid(ctx, hero, facing, frame),
      );
    }
  }
  makeTexture(scene, 'npc-girl', T, T, (ctx) => drawHumanoid(ctx, girl, 'down', 0));
  makeTexture(scene, 'npc-boy', T, T, (ctx) => drawHumanoid(ctx, boy, 'down', 0));
  makeTexture(scene, 'npc-ada', T, T, (ctx) => drawHumanoid(ctx, ada, 'down', 0));
  makeTexture(scene, 'npc-rema', T, T, (ctx) => drawHumanoid(ctx, rema, 'down', 0));
}

// -------------------------------------------------------------- creatures

type CreatureShape =
  | 'cub' | 'leaf' | 'bunny' | 'rock' | 'bird' | 'bug' | 'spiky' | 'tank'
  | 'tankMinus' | 'frog' | 'wisp' | 'snail'
  | 'fish' | 'octo' | 'crab' | 'jelly' | 'star' | 'tankTally';

interface CreatureStyle {
  body: string;
  bodyLight: string;
  bodyShade: string;
  belly: string;
  accent: string;
  shape: CreatureShape;
}

function drawCreature(ctx: Ctx, s: CreatureStyle): void {
  const { body, bodyLight, bodyShade, belly, accent, shape } = s;

  // Water shapes replace the whole base body, so draw them and return early.
  switch (shape) {
    case 'fish': // side-on carp: rounded oval body, pi-curl tail, bubbles
      px(ctx, 3, 6, OUTLINE, 8, 6); // stacked rects round the silhouette
      px(ctx, 2, 7, OUTLINE, 10, 4);
      px(ctx, 4, 5, OUTLINE, 6, 8);
      px(ctx, 4, 6, body, 6, 6);
      px(ctx, 3, 7, body, 8, 4);
      px(ctx, 4, 6, bodyLight, 3, 1); // top sheen
      px(ctx, 3, 10, bodyShade, 8, 1);
      px(ctx, 4, 8, belly, 4, 2);
      px(ctx, 4, 7, OUTLINE); // eye
      px(ctx, 4, 7, '#ffffff', 1, 1);
      px(ctx, 2, 9, OUTLINE, 1, 1); // pouty mouth
      px(ctx, 6, 4, accent, 3, 1); // dorsal fin
      px(ctx, 7, 3, accent, 1, 1);
      px(ctx, 6, 12, accent, 2, 1); // pectoral fin
      px(ctx, 11, 7, OUTLINE, 1, 2); // tail joint
      px(ctx, 12, 5, accent, 3, 1); // pi-curl tail: bar + two legs
      px(ctx, 12, 6, accent, 1, 4);
      px(ctx, 14, 6, accent, 1, 4);
      px(ctx, 1, 4, '#e8f4ff', 1, 1); // bubbles
      px(ctx, 2, 2, '#e8f4ff', 1, 1);
      return;
    case 'octo': // dome head with dangling plus-tipped tentacles
      px(ctx, 4, 2, OUTLINE, 8, 7);
      px(ctx, 3, 4, OUTLINE, 10, 5);
      px(ctx, 5, 3, body, 6, 5);
      px(ctx, 4, 5, body, 8, 3);
      px(ctx, 5, 3, bodyLight, 3, 1);
      px(ctx, 6, 5, OUTLINE); // eyes
      px(ctx, 9, 5, OUTLINE);
      px(ctx, 6, 5, '#ffffff', 1, 1);
      px(ctx, 6, 7, belly, 4, 1); // little smile band
      for (const tx of [3, 6, 9, 12]) {
        px(ctx, tx, 9, body, 1, 4); // tentacle
        px(ctx, tx, 13, accent, 1, 1); // plus tip: center
        px(ctx, tx - 1, 13, accent, 3, 1); // plus tip: bar
        px(ctx, tx, 12, accent, 1, 1);
        px(ctx, tx, 14, accent, 1, 1);
      }
      return;
    case 'crab': // wide shell, raised claws, stalk eyes
      px(ctx, 3, 7, OUTLINE, 10, 6);
      px(ctx, 4, 8, body, 8, 4);
      px(ctx, 4, 8, bodyLight, 4, 1);
      px(ctx, 4, 11, bodyShade, 8, 1);
      px(ctx, 6, 9, belly, 4, 2);
      px(ctx, 6, 4, OUTLINE, 1, 3); // eye stalks
      px(ctx, 9, 4, OUTLINE, 1, 3);
      px(ctx, 6, 3, body, 1, 1);
      px(ctx, 9, 3, body, 1, 1);
      px(ctx, 1, 4, accent, 3, 3); // raised claws
      px(ctx, 2, 3, accent, 2, 1);
      px(ctx, 12, 4, accent, 3, 3);
      px(ctx, 12, 3, accent, 2, 1);
      px(ctx, 2, 5, OUTLINE, 1, 1); // claw notches
      px(ctx, 13, 5, OUTLINE, 1, 1);
      px(ctx, 4, 13, OUTLINE, 2, 1); // legs
      px(ctx, 7, 13, OUTLINE, 2, 1);
      px(ctx, 10, 13, OUTLINE, 2, 1);
      return;
    case 'jelly': // translucent bell with trailing streamers
      px(ctx, 4, 3, OUTLINE, 8, 5);
      px(ctx, 3, 5, OUTLINE, 10, 3);
      px(ctx, 5, 4, body, 6, 3);
      px(ctx, 4, 6, body, 8, 2);
      px(ctx, 5, 4, bodyLight, 3, 1);
      px(ctx, 6, 6, accent, 4, 1); // glowing sum band
      px(ctx, 6, 5, OUTLINE); // sleepy eyes
      px(ctx, 9, 5, OUTLINE);
      for (const [sx, len] of [[4, 4], [6, 6], [9, 5], [11, 4]] as const) {
        px(ctx, sx, 8, body, 1, len); // streamers
        px(ctx, sx, 8 + len, bodyShade, 1, 1);
      }
      px(ctx, 12, 2, '#e8f4ff', 1, 1); // sparkle
      return;
    case 'star': // five radiating arms with a center face
      px(ctx, 7, 1, accent, 2, 5); // top arm
      px(ctx, 6, 2, accent, 1, 3);
      px(ctx, 9, 2, accent, 1, 3);
      px(ctx, 1, 5, accent, 5, 2); // left arm
      px(ctx, 10, 5, accent, 5, 2); // right arm
      px(ctx, 3, 10, accent, 2, 4); // legs
      px(ctx, 11, 10, accent, 2, 4);
      px(ctx, 4, 5, body, 8, 6); // center body
      px(ctx, 5, 4, body, 6, 8);
      px(ctx, 5, 5, bodyLight, 3, 1);
      px(ctx, 6, 7, OUTLINE); // face
      px(ctx, 9, 7, OUTLINE);
      px(ctx, 6, 7, '#ffffff', 1, 1);
      px(ctx, 7, 9, belly, 2, 1); // smile
      return;
  }

  // base round body with outline, highlight, and shaded underside
  px(ctx, 4, 6, OUTLINE, 8, 8);
  px(ctx, 3, 7, OUTLINE, 10, 6);
  px(ctx, 5, 7, body, 6, 6);
  px(ctx, 4, 8, body, 8, 4);
  px(ctx, 5, 7, bodyLight, 3, 1); // top-left sheen
  px(ctx, 4, 8, bodyLight, 1, 2);
  px(ctx, 4, 11, bodyShade, 8, 1); // underside shading
  px(ctx, 6, 10, belly, 4, 3);
  px(ctx, 6, 12, bodyShade, 4, 1);
  // eyes with shine
  px(ctx, 5, 8, OUTLINE);
  px(ctx, 10, 8, OUTLINE);
  px(ctx, 5, 8, '#ffffff', 1, 1);
  px(ctx, 10, 8, '#cfcfe6', 1, 1);

  switch (shape) {
    case 'cub': // round ears + flickering flame tail
      px(ctx, 4, 4, OUTLINE, 2, 2);
      px(ctx, 10, 4, OUTLINE, 2, 2);
      px(ctx, 4, 4, body, 2, 1);
      px(ctx, 10, 4, bodyLight, 2, 1);
      px(ctx, 13, 6, accent, 2, 3);
      px(ctx, 14, 4, accent, 1, 3);
      px(ctx, 14, 5, '#f8d048', 1, 2); // flame core
      break;
    case 'leaf': // sprout on head
      px(ctx, 7, 2, '#2f7a2f', 2, 4);
      px(ctx, 5, 1, accent, 2, 2);
      px(ctx, 9, 1, accent, 2, 2);
      px(ctx, 5, 1, '#8ecf6d', 1, 1); // lit leaf
      break;
    case 'bunny': // tall ears with inner color
      px(ctx, 4, 1, OUTLINE, 2, 6);
      px(ctx, 10, 1, OUTLINE, 2, 6);
      px(ctx, 4, 1, body, 1, 5);
      px(ctx, 10, 1, body, 1, 5);
      px(ctx, 5, 2, accent, 1, 3);
      px(ctx, 11, 2, accent, 1, 3);
      break;
    case 'rock': // craggy top with mineral glint
      px(ctx, 5, 5, body, 2, 2);
      px(ctx, 9, 5, body, 3, 2);
      px(ctx, 7, 4, accent, 2, 2);
      px(ctx, 9, 5, bodyLight, 1, 1);
      px(ctx, 11, 9, '#e8f4ff'); // glint
      break;
    case 'bird': // beak, wing, crest
      px(ctx, 12, 9, accent, 3, 2);
      px(ctx, 12, 9, '#f8d048', 3, 1);
      px(ctx, 4, 10, accent, 3, 2);
      px(ctx, 4, 10, bodyShade, 3, 1); // folded wing shadow
      px(ctx, 7, 3, accent, 1, 3);
      px(ctx, 8, 2, accent, 1, 3);
      break;
    case 'bug': // antennae + stripes
      px(ctx, 5, 3, OUTLINE, 1, 4);
      px(ctx, 10, 3, OUTLINE, 1, 4);
      px(ctx, 4, 2, accent, 2, 2);
      px(ctx, 10, 2, accent, 2, 2);
      px(ctx, 4, 11, OUTLINE, 8, 1);
      px(ctx, 4, 9, OUTLINE, 8, 1);
      break;
    case 'spiky': // thistle spikes
      for (const [sx, sy, h] of [[4, 4, 2], [7, 3, 3], [11, 4, 2]] as const) {
        px(ctx, sx, sy, accent, 1, h);
        px(ctx, sx, sy, '#8ecf6d', 1, 1);
      }
      px(ctx, 2, 9, accent, 2, 1);
      px(ctx, 12, 9, accent, 2, 1);
      break;
    case 'frog': // eye bumps on top, wide grin, splayed feet
      px(ctx, 4, 4, OUTLINE, 3, 3);
      px(ctx, 9, 4, OUTLINE, 3, 3);
      px(ctx, 5, 5, '#f8f8f0', 1, 1);
      px(ctx, 10, 5, '#f8f8f0', 1, 1);
      px(ctx, 5, 10, OUTLINE, 6, 1); // grin
      px(ctx, 4, 9, OUTLINE, 1, 1);
      px(ctx, 11, 9, OUTLINE, 1, 1);
      px(ctx, 2, 12, body, 3, 2); // splayed legs
      px(ctx, 11, 12, body, 3, 2);
      px(ctx, 6, 6, accent, 4, 1); // moss stripe
      break;
    case 'wisp': // wavy fog tail, faint inner glow
      px(ctx, 5, 13, OUTLINE, 2, 2); // wavy tail wisps
      px(ctx, 8, 14, OUTLINE, 2, 1);
      px(ctx, 11, 12, OUTLINE, 2, 2);
      px(ctx, 6, 14, body, 1, 1);
      px(ctx, 11, 13, body, 1, 1);
      px(ctx, 7, 9, accent, 2, 2); // inner glow
      px(ctx, 3, 5, body, 2, 2); // drifting puff
      px(ctx, 12, 4, body, 2, 2);
      break;
    case 'snail': // spiral shell on the back
      px(ctx, 7, 2, OUTLINE, 8, 9);
      px(ctx, 8, 3, accent, 6, 7);
      px(ctx, 9, 4, body, 4, 5); // spiral rings
      px(ctx, 10, 5, accent, 2, 3);
      px(ctx, 10, 6, '#f8f8f0', 1, 1); // shell glint
      px(ctx, 4, 3, OUTLINE, 1, 3); // eye stalks
      px(ctx, 6, 2, OUTLINE, 1, 4);
      px(ctx, 4, 2, belly, 1, 1);
      px(ctx, 6, 1, belly, 1, 1);
      break;
    case 'tankTally': { // wide shell scored with tally marks
      px(ctx, 2, 6, OUTLINE, 12, 8);
      px(ctx, 3, 7, body, 10, 6);
      px(ctx, 3, 7, bodyLight, 4, 1);
      px(ctx, 3, 12, bodyShade, 10, 1);
      px(ctx, 5, 8, OUTLINE); // wider-set eyes
      px(ctx, 10, 8, OUTLINE);
      px(ctx, 5, 8, '#ffffff', 1, 1);
      for (const tx of [5, 7, 9, 11]) px(ctx, tx, 9, accent, 1, 3); // tallies
      px(ctx, 4, 10, accent, 9, 1); // the strike-through: that's five!
      px(ctx, 1, 12, body, 2, 2); // stubby legs
      px(ctx, 13, 12, body, 2, 2);
      break;
    }
    case 'tankMinus': { // wide gator with a bold minus emblem
      px(ctx, 2, 6, OUTLINE, 12, 8);
      px(ctx, 3, 7, body, 10, 6);
      px(ctx, 3, 7, bodyLight, 4, 1);
      px(ctx, 3, 12, bodyShade, 10, 1);
      px(ctx, 4, 8, belly, 8, 4);
      px(ctx, 5, 8, OUTLINE); // wider-set eyes
      px(ctx, 10, 8, OUTLINE);
      px(ctx, 5, 8, '#ffffff', 1, 1);
      px(ctx, 5, 10, accent, 6, 2); // the minus stripe
      px(ctx, 5, 10, '#fff3b0', 6, 1);
      px(ctx, 13, 9, body, 3, 2); // snout
      px(ctx, 14, 10, '#f8f8f0', 1, 1); // tooth
      px(ctx, 3, 4, body, 2, 3); // ridged brow scales
      px(ctx, 11, 4, body, 2, 3);
      px(ctx, 1, 12, body, 2, 2); // stubby legs
      px(ctx, 13, 12, body, 2, 2);
      break;
    }
    case 'tank': { // wide shell with plus emblem
      px(ctx, 2, 6, OUTLINE, 12, 8);
      px(ctx, 3, 7, body, 10, 6);
      px(ctx, 3, 7, bodyLight, 4, 1);
      px(ctx, 3, 12, bodyShade, 10, 1);
      px(ctx, 4, 8, belly, 8, 4);
      px(ctx, 5, 8, OUTLINE); // wider-set eyes
      px(ctx, 10, 8, OUTLINE);
      px(ctx, 5, 8, '#ffffff', 1, 1);
      px(ctx, 7, 9, accent, 2, 3);
      px(ctx, 6, 10, accent, 4, 1);
      px(ctx, 1, 12, body, 2, 2);
      px(ctx, 13, 12, body, 2, 2);
      break;
    }
  }
  // feet
  px(ctx, 5, 13, OUTLINE, 2, 1);
  px(ctx, 9, 13, OUTLINE, 2, 1);
}

const CREATURE_STYLES: Record<string, CreatureStyle> = {
  'creature-embercub': { body: '#e8783c', bodyLight: '#f59758', bodyShade: '#c45f2c', belly: '#f8c888', accent: '#f04830', shape: 'cub' },
  // Evolved forms reuse their base shape with a bolder, hotter palette.
  'creature-emberoar': { body: '#d9542c', bodyLight: '#f07040', bodyShade: '#b03e1e', belly: '#f8b060', accent: '#f8d048', shape: 'cub' },
  'creature-bloomarch': { body: '#4a9c3c', bodyLight: '#66b856', bodyShade: '#38792c', belly: '#d8f0b0', accent: '#f2647c', shape: 'leaf' },
  'creature-tidebound': { body: '#3878c8', bodyLight: '#5a96da', bodyShade: '#2c5f9e', belly: '#a8d8f0', accent: '#8cc4ee', shape: 'bunny' },
  'creature-boulderit': { body: '#7e786f', bodyLight: '#9a948c', bodyShade: '#615c54', belly: '#aaa49a', accent: '#e8f4ff', shape: 'rock' },
  'creature-galefinch': { body: '#a8b4c0', bodyLight: '#c4cdd6', bodyShade: '#8a95a2', belly: '#e8eef4', accent: '#5a70c4', shape: 'bird' },
  'creature-leafloo': { body: '#6ab84a', bodyLight: '#85cc66', bodyShade: '#549939', belly: '#c8e8a0', accent: '#3f9c4e', shape: 'leaf' },
  'creature-aquabbit': { body: '#58a8e0', bodyLight: '#7cbfec', bodyShade: '#458cc0', belly: '#c0e4f8', accent: '#f2a0b8', shape: 'bunny' },
  'creature-pebblit': { body: '#9a948c', bodyLight: '#b3ada4', bodyShade: '#7e786f', belly: '#c4beb4', accent: '#6d6760', shape: 'rock' },
  'creature-fluffinch': { body: '#f2e0c0', bodyLight: '#faf0dc', bodyShade: '#d8c5a0', belly: '#ffffff', accent: '#f2a040', shape: 'bird' },
  'creature-buzzlet': { body: '#f8d048', bodyLight: '#ffe480', bodyShade: '#d9b32e', belly: '#f8e8a0', accent: '#26203a', shape: 'bug' },
  'creature-thistletot': { body: '#4a8c3a', bodyLight: '#62a850', bodyShade: '#39702c', belly: '#a0c878', accent: '#2c5a20', shape: 'spiky' },
  'creature-plusaur': { body: '#b09060', bodyLight: '#c7a978', bodyShade: '#94774b', belly: '#d8c391', accent: '#f8d048', shape: 'tank' },
  'creature-croakle': { body: '#6b9a4a', bodyLight: '#85b362', bodyShade: '#557d3a', belly: '#d8e0a0', accent: '#3d5c38', shape: 'frog' },
  'creature-wisplit': { body: '#c8d4dc', bodyLight: '#e4ecf2', bodyShade: '#a8b8c4', belly: '#f0f4f8', accent: '#8cc4ee', shape: 'wisp' },
  'creature-snailby': { body: '#d9a05a', bodyLight: '#e8b878', bodyShade: '#b88344', belly: '#f2e0c0', accent: '#8a5a2b', shape: 'snail' },
  'creature-subgator': { body: '#557d3a', bodyLight: '#6b9a4a', bodyShade: '#425f2e', belly: '#a8c078', accent: '#f8d048', shape: 'tankMinus' },
  // water dwellers
  'creature-carpi': { body: '#f2a040', bodyLight: '#f8c070', bodyShade: '#d08028', belly: '#f8e8d0', accent: '#f04830', shape: 'fish' },
  'creature-octoplus': { body: '#9a6ac8', bodyLight: '#b488da', bodyShade: '#7e50a8', belly: '#e0d0f0', accent: '#f8d048', shape: 'octo' },
  'creature-crabacus': { body: '#d9542c', bodyLight: '#f07040', bodyShade: '#b03e1e', belly: '#f8c888', accent: '#c83a3a', shape: 'crab' },
  'creature-jellisum': { body: '#f2a0b8', bodyLight: '#f8c4d2', bodyShade: '#d0839c', belly: '#fce8ee', accent: '#f8d048', shape: 'jelly' },
  'creature-fivestar': { body: '#f28066', bodyLight: '#f8a48e', bodyShade: '#d0654e', belly: '#f8d8c8', accent: '#e86048', shape: 'star' },
  'creature-turtally': { body: '#3aa88c', bodyLight: '#56c4a8', bodyShade: '#2c8a70', belly: '#c0e8dc', accent: '#26203a', shape: 'tankTally' },
  // beach dwellers
  'creature-sandigit': { body: '#d9b873', bodyLight: '#e5c98a', bodyShade: '#b8954e', belly: '#f0e0b8', accent: '#c83a3a', shape: 'rock' },
  'creature-gulltiply': { body: '#f0f4f8', bodyLight: '#ffffff', bodyShade: '#c8d4dc', belly: '#ffffff', accent: '#f2a040', shape: 'bird' },
};

export function generateCreatureTextures(scene: Phaser.Scene): void {
  for (const [key, style] of Object.entries(CREATURE_STYLES)) {
    makeTexture(scene, key, T, T, (ctx) => drawCreature(ctx, style));
  }
}

export function generateAllTextures(scene: Phaser.Scene): void {
  generateTileTextures(scene);
  generateCharacterTextures(scene);
  generateCreatureTextures(scene);
  generateFurnitureTextures(scene);
  generateTrophyTextures(scene);
}

// ---------------------------------------------------- ambient tile motion

/**
 * Animate the shared tall-grass and water canvas textures. One redraw
 * updates every tile on screen at once. Deliberately the ONLY ambient
 * animation: motion marks interactivity (grass hides creatures, water
 * will be fishable), so the world feels alive without being busy.
 */
export function startTileAnimations(scene: Phaser.Scene): void {
  const canvases: Array<[Phaser.Textures.CanvasTexture, (ctx: Ctx, frame: number) => void, number]> = [];
  const register = (key: string, draw: (ctx: Ctx, frame: number) => void, frames: number) => {
    const tex = scene.textures.get(key);
    if (tex instanceof Phaser.Textures.CanvasTexture) canvases.push([tex, draw, frames]);
  };
  register('tile-water', drawWaterFrame, 3);
  register('tile-tallgrass', drawTallGrassFrame, 2);
  register('tile-marsh-water', drawMarshWaterFrame, 3);
  register('tile-marsh-grass', drawMarshGrassFrame, 2);
  register('tile-ocean', drawOceanFrame, 3);
  register('tile-dune-grass', drawDuneGrassFrame, 2);

  let frame = 0;
  scene.time.addEvent({
    delay: 700,
    loop: true,
    callback: () => {
      frame = (frame + 1) % 6;
      for (const [tex, draw, frames] of canvases) {
        draw(tex.context, frame % frames);
        tex.refresh();
      }
    },
  });
}

/** Map ASCII tile chars to texture keys. */
export const TILE_TEXTURES: Record<string, string> = {
  '.': 'tile-grass',
  ',': 'tile-tallgrass',
  ':': 'tile-path',
  f: 'tile-flower',
  T: 'tile-tree',
  W: 'tile-water',
  R: 'tile-roof',
  B: 'tile-wall',
  D: 'tile-door-gym',
  N: 'tile-door-subgym',
  d: 'tile-door-house',
  S: 'tile-sign',
  F: 'tile-fence',
  G: 'tile-gym-floor',
  g: 'tile-gym-wall',
  M: 'tile-gym-mat',
  E: 'tile-gym-exit',
  // marsh ecosystem
  ';': 'tile-marsh-grass',
  w: 'tile-marsh-water',
  m: 'tile-mud',
  Y: 'tile-dead-tree',
  r: 'tile-reeds',
  u: 'tile-mushroom',
  L: 'tile-lilypad',
  // quotient coast
  s: 'tile-sand',
  O: 'tile-ocean',
  v: 'tile-dune-grass',
  k: 'tile-palm',
  c: 'tile-shells',
  x: 'tile-coast-rock',
  // player house
  Q: 'tile-roof-player',
  q: 'tile-wall-player',
  h: 'tile-door-player',
  P: 'tile-wood-floor',
  p: 'tile-interior-wall',
  U: 'tile-stairs-up',
  V: 'tile-stairs-down',
  e: 'tile-house-exit',
};
