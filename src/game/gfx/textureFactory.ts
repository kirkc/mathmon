import Phaser from 'phaser';
import { worldConfig } from '../../config/worldConfig';

/**
 * Procedural placeholder pixel art. Everything is drawn onto canvas
 * textures at boot, so the vertical slice needs zero binary assets.
 * TODO milestone 2: replace with a real sprite/tileset pipeline.
 */

const S = worldConfig.pixelScale; // logical pixel -> canvas pixels
const T = 16; // logical tile size in art pixels

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, x: number, y: number, color: string, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x * S, y * S, w * S, h * S);
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
function speckle(x: number, y: number, mod: number): boolean {
  return (x * 7 + y * 13 + ((x * y) % 5)) % mod === 0;
}

// ---------------------------------------------------------------- tiles

function drawGrassBase(ctx: Ctx): void {
  px(ctx, 0, 0, '#86c860', T, T);
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      if (speckle(x, y, 7)) px(ctx, x, y, '#74b850');
    }
  }
}

export function generateTileTextures(scene: Phaser.Scene): void {
  makeTexture(scene, 'tile-grass', T, T, (ctx) => drawGrassBase(ctx));

  makeTexture(scene, 'tile-tallgrass', T, T, (ctx) => {
    drawGrassBase(ctx);
    for (const gx of [1, 5, 9, 13]) {
      for (const gy of [2, 9]) {
        px(ctx, gx, gy + 2, '#2f8a2f', 1, 3);
        px(ctx, gx + 2, gy + 2, '#2f8a2f', 1, 3);
        px(ctx, gx + 1, gy, '#3da33d', 1, 4);
      }
    }
  });

  makeTexture(scene, 'tile-path', T, T, (ctx) => {
    px(ctx, 0, 0, '#dcc178', T, T);
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        if (speckle(x, y, 9)) px(ctx, x, y, '#c9ad62');
      }
    }
  });

  makeTexture(scene, 'tile-flower', T, T, (ctx) => {
    drawGrassBase(ctx);
    const flowers: Array<[number, number, string]> = [
      [3, 3, '#f2647c'],
      [10, 5, '#f8d048'],
      [5, 10, '#f2647c'],
      [12, 11, '#f8f8f8'],
    ];
    for (const [fx, fy, color] of flowers) {
      px(ctx, fx, fy - 1, color);
      px(ctx, fx - 1, fy, color);
      px(ctx, fx + 1, fy, color);
      px(ctx, fx, fy + 1, color);
      px(ctx, fx, fy, '#f8d048');
    }
  });

  makeTexture(scene, 'tile-tree', T, T, (ctx) => {
    drawGrassBase(ctx);
    px(ctx, 6, 11, '#7a4a21', 4, 5); // trunk
    px(ctx, 2, 2, '#2c7a3a', 12, 9); // canopy
    px(ctx, 4, 1, '#2c7a3a', 8, 1);
    px(ctx, 3, 3, '#3f9c4e', 6, 4); // highlight
    px(ctx, 9, 6, '#236430', 4, 4); // shade
  });

  makeTexture(scene, 'tile-water', T, T, (ctx) => {
    px(ctx, 0, 0, '#4a90d9', T, T);
    for (const wy of [3, 8, 13]) {
      px(ctx, 2, wy, '#7db8ea', 4, 1);
      px(ctx, 9, wy + 2 > 15 ? 1 : wy + 2, '#7db8ea', 4, 1);
    }
  });

  makeTexture(scene, 'tile-roof', T, T, (ctx) => {
    px(ctx, 0, 0, '#d9603b', T, T);
    for (const ry of [4, 9, 14]) px(ctx, 0, ry, '#b94a2a', T, 1);
    px(ctx, 0, 0, '#e87a52', T, 2);
  });

  makeTexture(scene, 'tile-wall', T, T, (ctx) => {
    px(ctx, 0, 0, '#ead9ad', T, T);
    px(ctx, 0, 0, '#d8c391', T, 1);
    px(ctx, 3, 4, '#7db8ea', 4, 5); // little window
    px(ctx, 3, 4, '#a7d3f2', 4, 2);
    px(ctx, 2, 3, '#9c8a5d', 6, 1);
    px(ctx, 2, 9, '#9c8a5d', 6, 1);
  });

  makeTexture(scene, 'tile-door-gym', T, T, (ctx) => {
    px(ctx, 0, 0, '#ead9ad', T, T);
    px(ctx, 3, 2, '#3a4a8c', 10, 14); // blue gym door
    px(ctx, 4, 3, '#5468b8', 8, 12);
    // plus-sign emblem
    px(ctx, 7, 5, '#f8d048', 2, 6);
    px(ctx, 5, 7, '#f8d048', 6, 2);
  });

  makeTexture(scene, 'tile-door-house', T, T, (ctx) => {
    px(ctx, 0, 0, '#ead9ad', T, T);
    px(ctx, 4, 3, '#8a5a2b', 8, 13);
    px(ctx, 5, 4, '#a8743c', 6, 11);
    px(ctx, 10, 9, '#f8d048', 1, 1); // knob
  });

  makeTexture(scene, 'tile-sign', T, T, (ctx) => {
    drawGrassBase(ctx);
    px(ctx, 7, 9, '#7a4a21', 2, 6); // post
    px(ctx, 2, 3, '#a8743c', 12, 6); // board
    px(ctx, 3, 4, '#c79256', 10, 4);
    px(ctx, 4, 5, '#7a4a21', 8, 1);
    px(ctx, 4, 7, '#7a4a21', 6, 1);
  });

  makeTexture(scene, 'tile-fence', T, T, (ctx) => {
    drawGrassBase(ctx);
    px(ctx, 1, 6, '#c79256', 14, 2);
    px(ctx, 2, 4, '#a8743c', 2, 9);
    px(ctx, 12, 4, '#a8743c', 2, 9);
  });

  makeTexture(scene, 'tile-gym-floor', T, T, (ctx) => {
    px(ctx, 0, 0, '#cdd4e0', T, T);
    px(ctx, 0, 0, '#bcc4d4', 8, 8);
    px(ctx, 8, 8, '#bcc4d4', 8, 8);
  });

  makeTexture(scene, 'tile-gym-wall', T, T, (ctx) => {
    px(ctx, 0, 0, '#3a4a8c', T, T);
    px(ctx, 0, 12, '#2c3a70', T, 4);
    px(ctx, 0, 0, '#5468b8', T, 2);
  });

  makeTexture(scene, 'tile-gym-mat', T, T, (ctx) => {
    px(ctx, 0, 0, '#cdd4e0', T, T);
    px(ctx, 1, 1, '#c84848', 14, 14);
    px(ctx, 3, 3, '#e06060', 10, 10);
  });

  makeTexture(scene, 'tile-gym-exit', T, T, (ctx) => {
    px(ctx, 0, 0, '#cdd4e0', T, T);
    px(ctx, 2, 2, '#8a93a6', 12, 12);
    px(ctx, 4, 4, '#6d7689', 8, 8);
  });
}

// ------------------------------------------------------------ humanoids

interface HumanoidStyle {
  hair: string;
  skin: string;
  shirt: string;
  pants: string;
  cap?: string;
}

function drawHumanoid(ctx: Ctx, style: HumanoidStyle, facing: 'down' | 'up' | 'side', frame: 0 | 1): void {
  const O = '#26203a';
  // head
  px(ctx, 4, 2, O, 8, 6);
  px(ctx, 5, 3, style.skin, 6, 4);
  // hair / cap
  px(ctx, 4, 2, style.cap ?? style.hair, 8, 2);
  px(ctx, 4, 4, style.cap ?? style.hair, 1, 2);
  px(ctx, 11, 4, style.cap ?? style.hair, 1, 2);
  if (style.cap) px(ctx, 3, 3, style.cap, 10, 1); // cap brim
  if (facing === 'up') {
    px(ctx, 5, 3, style.hair, 6, 4); // back of head
  } else if (facing === 'down') {
    px(ctx, 6, 5, O); // eyes
    px(ctx, 9, 5, O);
  } else {
    px(ctx, 6, 5, O); // single eye, looking left
  }
  // body
  px(ctx, 4, 8, O, 8, 5);
  px(ctx, 5, 8, style.shirt, 6, 5);
  // arms
  px(ctx, 3, 9, style.shirt, 1, 3);
  px(ctx, 12, 9, style.shirt, 1, 3);
  px(ctx, 3, 12, style.skin, 1, 1);
  px(ctx, 12, 12, style.skin, 1, 1);
  // legs (frame toggles the stride)
  const leftUp = frame === 1;
  px(ctx, 5, 13, style.pants, 2, leftUp ? 2 : 3);
  px(ctx, 9, 13, style.pants, 2, leftUp ? 3 : 2);
  px(ctx, 5, leftUp ? 15 : 15, O, 2, 1);
  px(ctx, 9, 15, O, 2, 1);
}

export function generateCharacterTextures(scene: Phaser.Scene): void {
  const hero: HumanoidStyle = {
    hair: '#5a3a1e',
    skin: '#f2c79a',
    shirt: '#3a6ac8',
    pants: '#2c3a70',
    cap: '#c83a3a',
  };
  const girl: HumanoidStyle = { hair: '#a8743c', skin: '#f2c79a', shirt: '#e06090', pants: '#7a4a8c' };
  const boy: HumanoidStyle = { hair: '#26203a', skin: '#d9a06a', shirt: '#3f9c4e', pants: '#5a3a1e' };
  const ada: HumanoidStyle = { hair: '#f8d048', skin: '#f2c79a', shirt: '#c84848', pants: '#26203a' };

  const facings: Array<'down' | 'up' | 'side'> = ['down', 'up', 'side'];
  for (const facing of facings) {
    for (const frame of [0, 1] as const) {
      makeTexture(scene, `player-${facing}-${frame}`, T, T, (ctx) =>
        drawHumanoid(ctx, hero, facing, frame),
      );
    }
  }
  makeTexture(scene, 'npc-girl', T, T, (ctx) => drawHumanoid(ctx, girl, 'down', 0));
  makeTexture(scene, 'npc-boy', T, T, (ctx) => drawHumanoid(ctx, boy, 'down', 0));
  makeTexture(scene, 'npc-ada', T, T, (ctx) => drawHumanoid(ctx, ada, 'down', 0));
}

// ------------------------------------------------------------ creatures

type CreatureShape = 'cub' | 'leaf' | 'bunny' | 'rock' | 'bird' | 'bug' | 'spiky' | 'tank';

interface CreatureStyle {
  body: string;
  belly: string;
  accent: string;
  shape: CreatureShape;
}

function drawCreature(ctx: Ctx, style: CreatureStyle): void {
  const O = '#26203a';
  const { body, belly, accent, shape } = style;

  // base round body
  px(ctx, 4, 6, O, 8, 8);
  px(ctx, 3, 7, O, 10, 6);
  px(ctx, 5, 7, body, 6, 6);
  px(ctx, 4, 8, body, 8, 4);
  px(ctx, 6, 10, belly, 4, 3);
  // eyes
  px(ctx, 5, 8, O);
  px(ctx, 10, 8, O);
  px(ctx, 5, 8, '#ffffff', 1, 1);

  switch (shape) {
    case 'cub': // round ears + flame tail
      px(ctx, 4, 4, body, 2, 2);
      px(ctx, 10, 4, body, 2, 2);
      px(ctx, 13, 6, accent, 2, 3);
      px(ctx, 14, 4, accent, 1, 3);
      break;
    case 'leaf': // sprout on head
      px(ctx, 7, 2, '#2f8a2f', 2, 4);
      px(ctx, 5, 1, accent, 2, 2);
      px(ctx, 9, 1, accent, 2, 2);
      break;
    case 'bunny': // tall ears
      px(ctx, 4, 1, body, 2, 6);
      px(ctx, 10, 1, body, 2, 6);
      px(ctx, 4, 2, accent, 1, 3);
      px(ctx, 11, 2, accent, 1, 3);
      break;
    case 'rock': // craggy top
      px(ctx, 5, 5, body, 2, 2);
      px(ctx, 9, 5, body, 3, 2);
      px(ctx, 7, 4, accent, 2, 2);
      break;
    case 'bird': // beak + wing + crest
      px(ctx, 12, 9, accent, 3, 2);
      px(ctx, 4, 10, accent, 3, 2);
      px(ctx, 7, 3, accent, 1, 3);
      px(ctx, 8, 2, accent, 1, 3);
      break;
    case 'bug': // antennae + stripes
      px(ctx, 5, 3, O, 1, 4);
      px(ctx, 10, 3, O, 1, 4);
      px(ctx, 4, 2, accent, 2, 2);
      px(ctx, 10, 2, accent, 2, 2);
      px(ctx, 4, 11, O, 8, 1);
      break;
    case 'spiky': // thistle spikes
      px(ctx, 4, 4, accent, 1, 2);
      px(ctx, 7, 3, accent, 2, 3);
      px(ctx, 11, 4, accent, 1, 2);
      px(ctx, 2, 9, accent, 2, 1);
      px(ctx, 12, 9, accent, 2, 1);
      break;
    case 'tank': { // wide shell with plus emblem
      px(ctx, 2, 6, O, 12, 8);
      px(ctx, 3, 7, body, 10, 6);
      px(ctx, 4, 8, belly, 8, 4);
      px(ctx, 5, 8, O); // redraw eyes wider
      px(ctx, 10, 8, O);
      px(ctx, 7, 9, accent, 2, 3);
      px(ctx, 6, 10, accent, 4, 1);
      px(ctx, 1, 12, body, 2, 2);
      px(ctx, 13, 12, body, 2, 2);
      break;
    }
  }
  // feet
  px(ctx, 5, 13, O, 2, 1);
  px(ctx, 9, 13, O, 2, 1);
}

const CREATURE_STYLES: Record<string, CreatureStyle> = {
  'creature-embercub': { body: '#e8783c', belly: '#f8c888', accent: '#f04830', shape: 'cub' },
  'creature-leafloo': { body: '#6ab84a', belly: '#c8e8a0', accent: '#3f9c4e', shape: 'leaf' },
  'creature-aquabbit': { body: '#58a8e0', belly: '#c0e4f8', accent: '#f2a0b8', shape: 'bunny' },
  'creature-pebblit': { body: '#9a948c', belly: '#c4beb4', accent: '#6d6760', shape: 'rock' },
  'creature-fluffinch': { body: '#f2e0c0', belly: '#ffffff', accent: '#f2a040', shape: 'bird' },
  'creature-buzzlet': { body: '#f8d048', belly: '#f8e8a0', accent: '#26203a', shape: 'bug' },
  'creature-thistletot': { body: '#4a8c3a', belly: '#a0c878', accent: '#2c5a20', shape: 'spiky' },
  'creature-plusaur': { body: '#b09060', belly: '#d8c391', accent: '#f8d048', shape: 'tank' },
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
