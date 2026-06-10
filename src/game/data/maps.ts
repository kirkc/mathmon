import type { AreaId } from '../../config/worldConfig';

/**
 * Maps are authored as ASCII grids — readable, diffable, and easy to extend.
 *
 * Legend:
 *   T  tree (solid)            .  short grass
 *   ,  tall grass (encounters) :  path
 *   f  flowers (walkable)      W  water (solid)
 *   R  roof (solid)            B  building wall (solid)
 *   D  warp door               d  decorative door (solid)
 *   S  sign (solid, readable)  F  fence (solid)
 *   G  gym floor               g  gym wall (solid)
 *   E  warp exit (gym -> town) M  gym mat (walkable decor)
 */

export interface WarpTarget {
  mapKey: string;
  tileX: number;
  tileY: number;
  facing: 'up' | 'down' | 'left' | 'right';
}

export interface NpcDefinition {
  id: string;
  name: string;
  spriteKey: string;
  tileX: number;
  tileY: number;
  facing: 'up' | 'down' | 'left' | 'right';
  dialog: string[];
  /** Present if talking to this NPC starts a battle. */
  battle?: {
    type: 'trainer' | 'gym';
    speciesId: string;
    enemyHp: number;
    enemyLevel: number;
    badgeId?: string;
    introText: string;
    defeatedDialog: string[];
  };
}

export interface SignDefinition {
  tileX: number;
  tileY: number;
  text: string;
}

export interface MapDefinition {
  key: string;
  name: string;
  grid: string[];
  /** Which themed area governs wild encounters here. */
  areaId: AreaId;
  warps: Record<string, WarpTarget>; // keyed by "x,y"
  npcs: NpcDefinition[];
  signs: SignDefinition[];
  musicTrack: 'overworld' | 'gym';
}

const OVERWORLD_GRID = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTT,,,,,TT.....TT,,,,,,TTTT',
  'TTT,,,,,,TT..:..TT,,,,,,,TTT',
  'TTT,,,,,,,...:...,,,,,,,,TTT',
  'TTT,,,,,,,...:...,,,,,,,,TTT',
  'TTTT,,,,,....:....,,,,,,TTTT',
  'TTTT,,,......:......,,,,TTTT',
  'TTTTT.....f..:..f......TTTTT',
  'TTTTT........:.........TTTTT',
  'TTTT....S....:....f....TTTTT',
  'TTTT.........:.........TTTTT',
  'TTTT,,,,.....:......,,,TTTTT',
  'TTTT,,,,.....:......,,,TTTTT',
  'TTTT,,,,.....:......,,,TTTTT',
  'TTTTTTTTT....:....TTTTTTTTTT',
  'TTTTTTTTT....:....TTTTTTTTTT',
  'TTTT.........:.........TTTTT',
  'TTT....RRRR..:..RRRR....TTTT',
  'TTT....RBBR..:..RBBR....TTTT',
  'TTT....RBdR..:..RBDR....TTTT',
  'TTT....:::...:...:::....TTTT',
  'TTT..f.......:.......f..TTTT',
  'TTT......::::::::S......TTTT',
  'TTT......:......:.......TTTT',
  'TTT...RRRR......:..ff...TTTT',
  'TTT...RBBR......:.......TTTT',
  'TTT...RBdR......:..f....TTTT',
  'TTT...:::.......:.......TTTT',
  'TTT.............:....WWWTTTT',
  'TTTf............:...WWWWTTTT',
  'TTTT............:...WWWTTTTT',
  'TTTTTTTTTTTTTTTT:TTTTTTTTTTT',
];

const GYM_GRID = [
  'gggggggggggg',
  'gGGGGGGGGGGg',
  'gGGGGMMGGGGg',
  'gGGGGMMGGGGg',
  'gGGGGGGGGGGg',
  'gGGGGGGGGGGg',
  'gGGGGGGGGGGg',
  'gGGGGGGGGGGg',
  'gGGGGGGGGGGg',
  'gggggEEggggg',
];

export const MAPS: Record<string, MapDefinition> = {
  overworld: {
    key: 'overworld',
    name: 'Meadow Town & Sumwood Trail',
    grid: OVERWORLD_GRID,
    areaId: 'sumwoodTrail',
    warps: {
      // The right house in town is the Addition Gym.
      '18,19': { mapKey: 'gym', tileX: 5, tileY: 8, facing: 'up' },
    },
    npcs: [
      {
        id: 'npc-mira',
        name: 'Mira',
        spriteKey: 'npc-girl',
        tileX: 10,
        tileY: 21,
        facing: 'down',
        dialog: [
          'Welcome to Meadow Town!',
          'Wild MathMon hide in the tall grass up north.',
          'Answer math facts quickly and your creature hits harder!',
        ],
      },
      {
        id: 'trainer-finn',
        name: 'Trainer Finn',
        spriteKey: 'npc-boy',
        tileX: 13,
        tileY: 8,
        facing: 'down',
        dialog: ['Hey! My Thistletot and I train here every day!'],
        battle: {
          type: 'trainer',
          speciesId: 'thistletot',
          enemyHp: 55,
          enemyLevel: 3,
          introText: 'Trainer Finn challenges you!',
          defeatedDialog: [
            'Whoa, your math is quick!',
            'The Addition Gym is the right-hand building in town. Go for it!',
          ],
        },
      },
    ],
    signs: [
      { tileX: 8, tileY: 9, text: 'SUMWOOD TRAIL - Tall grass ahead! Wild MathMon love hiding here.' },
      { tileX: 17, tileY: 22, text: 'MEADOW TOWN - A friendly place to start an adventure. Gym on the right!' },
    ],
    musicTrack: 'overworld',
  },
  gym: {
    key: 'gym',
    name: 'Addition Gym',
    grid: GYM_GRID,
    areaId: 'meadowTown',
    warps: {
      '5,9': { mapKey: 'overworld', tileX: 18, tileY: 20, facing: 'down' },
      '6,9': { mapKey: 'overworld', tileX: 18, tileY: 20, facing: 'down' },
    },
    npcs: [
      {
        id: 'gym-ada',
        name: 'Gym Leader Ada',
        spriteKey: 'npc-ada',
        tileX: 5,
        tileY: 2,
        facing: 'down',
        dialog: ["I'm Ada, the Addition Gym Leader!", 'Show me your fastest facts!'],
        battle: {
          type: 'gym',
          speciesId: 'plusaur',
          enemyHp: 130,
          enemyLevel: 5,
          badgeId: 'addition-gym',
          introText: 'Gym Leader Ada wants to battle!',
          defeatedDialog: [
            'Incredible! You earned the Sum Badge!',
            'Keep practicing and new powers will unlock.',
          ],
        },
      },
    ],
    signs: [],
    musicTrack: 'gym',
  },
};

/** Tiles the player cannot walk through. */
export const SOLID_TILES = new Set(['T', 'W', 'R', 'B', 'd', 'S', 'F', 'g']);
/** Tiles that can trigger wild encounters. */
export const ENCOUNTER_TILES = new Set([',']);
