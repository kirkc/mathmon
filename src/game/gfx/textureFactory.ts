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

export function generateTileTextures(scene: Phaser.Scene): void {
  makeTexture(scene, 'tile-grass', T, T, (ctx) => drawGrassBase(ctx));
  makeTexture(scene, 'tile-tallgrass', T, T, (ctx) => drawTallGrassFrame(ctx, 0));
  makeTexture(scene, 'tile-water', T, T, (ctx) => drawWaterFrame(ctx, 0));

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

  makeTexture(scene, 'tile-sign', T, T, (ctx) => {
    drawGrassBase(ctx);
    px(ctx, 6, 13, '#4a7a38', 5, 1); // shadow
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
}

// -------------------------------------------------------------- creatures

type CreatureShape = 'cub' | 'leaf' | 'bunny' | 'rock' | 'bird' | 'bug' | 'spiky' | 'tank';

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
  'creature-leafloo': { body: '#6ab84a', bodyLight: '#85cc66', bodyShade: '#549939', belly: '#c8e8a0', accent: '#3f9c4e', shape: 'leaf' },
  'creature-aquabbit': { body: '#58a8e0', bodyLight: '#7cbfec', bodyShade: '#458cc0', belly: '#c0e4f8', accent: '#f2a0b8', shape: 'bunny' },
  'creature-pebblit': { body: '#9a948c', bodyLight: '#b3ada4', bodyShade: '#7e786f', belly: '#c4beb4', accent: '#6d6760', shape: 'rock' },
  'creature-fluffinch': { body: '#f2e0c0', bodyLight: '#faf0dc', bodyShade: '#d8c5a0', belly: '#ffffff', accent: '#f2a040', shape: 'bird' },
  'creature-buzzlet': { body: '#f8d048', bodyLight: '#ffe480', bodyShade: '#d9b32e', belly: '#f8e8a0', accent: '#26203a', shape: 'bug' },
  'creature-thistletot': { body: '#4a8c3a', bodyLight: '#62a850', bodyShade: '#39702c', belly: '#a0c878', accent: '#2c5a20', shape: 'spiky' },
  'creature-plusaur': { body: '#b09060', bodyLight: '#c7a978', bodyShade: '#94774b', belly: '#d8c391', accent: '#f8d048', shape: 'tank' },
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
}

// ---------------------------------------------------- ambient tile motion

/**
 * Animate the shared tall-grass and water canvas textures. One redraw
 * updates every tile on screen at once. Deliberately the ONLY ambient
 * animation: motion marks interactivity (grass hides creatures, water
 * will be fishable), so the world feels alive without being busy.
 */
export function startTileAnimations(scene: Phaser.Scene): void {
  const water = scene.textures.get('tile-water');
  const grass = scene.textures.get('tile-tallgrass');
  if (!(water instanceof Phaser.Textures.CanvasTexture)) return;
  if (!(grass instanceof Phaser.Textures.CanvasTexture)) return;

  let frame = 0;
  scene.time.addEvent({
    delay: 700,
    loop: true,
    callback: () => {
      frame = (frame + 1) % 6;
      drawWaterFrame(water.context, frame % 3);
      water.refresh();
      drawTallGrassFrame(grass.context, frame % 2);
      grass.refresh();
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
  d: 'tile-door-house',
  S: 'tile-sign',
  F: 'tile-fence',
  G: 'tile-gym-floor',
  g: 'tile-gym-wall',
  M: 'tile-gym-mat',
  E: 'tile-gym-exit',
};
