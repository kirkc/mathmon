import type { AreaId } from '../../config/worldConfig';

/**
 * Maps are authored as ASCII grids — readable, diffable, and easy to extend.
 * The overworld grid was generated with a connectivity-validated script
 * (every walkable tile is reachable from the town spawn).
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

/** Row-band encounter zones: rows y1..y2 use the given area's wild table. */
export interface EncounterZone {
  y1: number;
  y2: number;
  areaId: AreaId;
}

export interface MapDefinition {
  key: string;
  name: string;
  grid: string[];
  /** Fallback area when no zone matches. */
  areaId: AreaId;
  zones?: EncounterZone[];
  warps: Record<string, WarpTarget>; // keyed by "x,y"
  npcs: NpcDefinition[];
  signs: SignDefinition[];
  musicTrack: 'overworld' | 'gym';
}

const OVERWORLD_GRID = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTT............................S::...........................TTT',
  'TTT.............................::...........................TTT',
  'TTT.....,,,,,,,,,,,.TT..........::..,,,,,,,,,,.TT.........T..TTT',
  'TTT.....,,,,,,,,,,,.T.,,,,,,,,..::..,,,,,,,,,,............T..TTT',
  'TTT.....,,,,,,,,,,,...,,,,,,,,..::..,,,,,,,,,,...,,,,,,,,,...TTT',
  'TTT.....,,,,,,,,,,,...,,,,,,,,..::..,,,,,,,,,,...,,,,,,,,,...TTT',
  'TTT.....,,,,,,,,,,,...,,,,,,,,..::..,,,,,,,,,,...,,,,,,,,,...TTT',
  'TTT.....,,,,,,,,,,,...,,,,,,,,..::..,,,,,,,,,,...,,,,,,,,,...TTT',
  'TTT...................,,,,,,,,..::...............,,,,,,,,,...TTT',
  'TTT.....TT......................::.TT............,,,,,,,,,...TTT',
  'TTT.........,,,,,,,,,,,,,.....TT::......,,,,,,,,,,,,,,,,,,...TTT',
  'TTT.........,,,,,,,,,,,,,.TT....::......,,,,,,,,,,,..........TTT',
  'TTT.........,,,,,,,,,,,,,.......::......,,,,,,,,,,,..........TTT',
  'TTT.........,,,,,,,,,,,,,.......::......,,,,,,,,,,,..........TTT',
  'TTT.............................::...........................TTT',
  'TTT.............................::...........................TTT',
  'TTT...:::::::::::::::::::::::::::::::::::::::::::::::::::::..TTT',
  'TTT...:::::::::::::::::::::::::::::::::::::::::::::::::::::..TTT',
  'TTT.....S.......................::....::.....................TTT',
  'TTTTTT..TTTTTTTTTTTTT...........::...S::....f...f...f...f....TTT',
  'TTTTTT..TTTTTTTTTTTTT...........::......f...WWWWWWWWWWWW.....TTT',
  'TTTTTT..TTTTTTTTTTTTT...........::.........WWWWWWWWWWWWWW....TTT',
  'TTTTTT..TTTTTTTTTTTTT...........::........WWWWWWWWWWWWWWWW...TTT',
  'TTTTTT..........fffTT...........::.......fWWWWWWWWWWWWWWWW...TTT',
  'TTTTTT...,,,,,..fffTT...........::........WWWWWWWWWWWWWWWW...TTT',
  'TTTTTT...,,,,,.....TT...........::........WWWWWWWWWWWWWWWW...TTT',
  'TTTTTT...,,,,,.....TT...........::......f.WWWWWWWWWWWWWWWW...TTT',
  'TTTTTT...,,,,,.....TT...........::........WWWWWWWWWWWWWWWW...TTT',
  'TTTTTT........,,,,.TT...........::........WWWWWWWWWWWWWWWW...TTT',
  'TTTTTT........,,,,.TT...........::.......fWWWWWWWWWWWWWWWW...TTT',
  'TTTTTT........,,,,.TT...........::.........WWWWWWWWWWWWWW....TTT',
  'TTTTTT........,,,,.TT...........::..........WWWWWWWWWWWW.....TTT',
  'TTTTTT.............TT...........::..RRRRRR..f.....f....f.....TTT',
  'TTTTTT..TTTTTTTTTTTTT......f....::..RRRRRR........,,,,,,,....TTT',
  'TTTTTT..TTTTTTTTTTTTT.RRRR....f.::..RRRRRR..RRRR..,,,,,,,....TTT',
  'TTTTTT..TTTTTTTTTTTTT.RRRR......::..BBBBBB..RRRR.............TTT',
  'TTTT,,..TTTTTTTTTTTTT.BBBB......::..BBDBBB..BBBB......,,,,,..TTT',
  'TTTT,,..TTTTTTTTTTTTT.BdBB......::..........BdBB......,,,,,..TTT',
  'TTT...::::::::::::::::::::::::::::S::::::::::::..............TTT',
  'TTT...:::::::::::::::::::::::::::::::::::::::::...f..........TTT',
  'TTT.....,,,,,,,.......f.....f...::.......f....f.....f........TTT',
  'TTT.....,,,,,,,........f.......f::..f.......f.....,,,,,,,,,..TTT',
  'TTT.....,,,,,,,.................::................,,,,,,,,,..TTT',
  'TTT..........................................................TTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
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
    name: 'Meadow Town',
    grid: OVERWORLD_GRID,
    areaId: 'meadowTown',
    // North fields, the woods, and the lake use the trail's tougher wild table;
    // the grass around town stays beginner-friendly.
    zones: [{ y1: 0, y2: 35, areaId: 'sumwoodTrail' }],
    warps: {
      '38,38': { mapKey: 'gym', tileX: 5, tileY: 8, facing: 'up' },
    },
    npcs: [
      {
        id: 'npc-mira',
        name: 'Mira',
        spriteKey: 'npc-girl',
        tileX: 30,
        tileY: 41,
        facing: 'down',
        dialog: [
          'Welcome to Meadow Town!',
          'Sumwood Trail is up north, Whispering Woods is out west, and Lake Lumen sparkles to the east.',
          'Answer math facts quickly and your creature hits harder!',
        ],
      },
      {
        id: 'trainer-finn',
        name: 'Trainer Finn',
        spriteKey: 'npc-boy',
        tileX: 32,
        tileY: 9,
        facing: 'down',
        dialog: ['Hey! My Thistletot and I train on Sumwood Trail every day!'],
        battle: {
          type: 'trainer',
          speciesId: 'thistletot',
          enemyHp: 55,
          enemyLevel: 3,
          introText: 'Trainer Finn challenges you!',
          defeatedDialog: [
            'Whoa, your math is quick!',
            'The Addition Gym is the blue-doored building in town. Go for it!',
          ],
        },
      },
      {
        id: 'trainer-maya',
        name: 'Trainer Maya',
        spriteKey: 'npc-girl',
        tileX: 41,
        tileY: 24,
        facing: 'down',
        dialog: ['I love watching Fluffinch skim across Lake Lumen!'],
        battle: {
          type: 'trainer',
          speciesId: 'fluffinch',
          enemyHp: 58,
          enemyLevel: 4,
          introText: 'Trainer Maya challenges you!',
          defeatedDialog: [
            'Splash! You sank me fair and square.',
            'The lakeside grass hides speedy wild MathMon. Good hunting!',
          ],
        },
      },
      {
        id: 'trainer-theo',
        name: 'Trainer Theo',
        spriteKey: 'npc-boy',
        tileX: 10,
        tileY: 32,
        facing: 'down',
        dialog: ['Shhh... Buzzlet and I are listening to the woods.'],
        battle: {
          type: 'trainer',
          speciesId: 'buzzlet',
          enemyHp: 62,
          enemyLevel: 4,
          introText: 'Trainer Theo challenges you!',
          defeatedDialog: [
            'Zap! Out-counted in my own woods.',
            'You might be ready for Gym Leader Ada back in town.',
          ],
        },
      },
    ],
    signs: [
      { tileX: 31, tileY: 2, text: 'NORTH GATE - Minus Marsh is under construction. Come back soon!' },
      { tileX: 8, tileY: 20, text: 'WHISPERING WOODS - Shady paths, rustling grass, and one very quiet trainer.' },
      { tileX: 37, tileY: 21, text: 'LAKE LUMEN - No swimming until you know your facts!' },
      { tileX: 34, tileY: 40, text: 'MEADOW TOWN - A friendly place to start an adventure. Gym door is the blue one!' },
    ],
    musicTrack: 'overworld',
  },
  gym: {
    key: 'gym',
    name: 'Addition Gym',
    grid: GYM_GRID,
    areaId: 'meadowTown',
    warps: {
      '5,9': { mapKey: 'overworld', tileX: 38, tileY: 39, facing: 'down' },
      '6,9': { mapKey: 'overworld', tileX: 38, tileY: 39, facing: 'down' },
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
