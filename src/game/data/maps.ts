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
 *   N  subtraction gym door    s/O/v/k/c/x  coast: sand, ocean, dune
 *                                 grass, palm, shells, rock
 *   S  sign (solid, readable)  F  fence (solid)
 *   G  gym floor               g  gym wall (solid)
 *   E  warp exit (gym -> town) M  gym mat (walkable decor)
 */

export interface WarpTarget {
  mapKey: string;
  tileX: number;
  tileY: number;
  facing: 'up' | 'down' | 'left' | 'right';
  /** Optional gate: all conditions must hold or the warp shows a message. */
  requires?: {
    badgeId?: string;
    minLevelNumber?: number;
    lockedMessage: string;
  };
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
  musicTrack: 'overworld' | 'gym' | 'marsh' | 'house' | 'coast';
  /** True for the player-house floors (companion creature, furniture). */
  isPlayerHouse?: boolean;
}

const OVERWORLD_GRID = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT::TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT::TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
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
  'TTT...::::::::::::::::::::::::::::::::::::::::::::::::::::::::::',
  'TTT...::::::::::::::::::::::::::::::::::::::::::::::::::::::::::',
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
  'TTTTTT.............TT......QQQQ.::..RRRRRR..f.....f....f.....TTT',
  'TTTTTT..TTTTTTTTTTTTT......QQQQ.::..RRRRRR........,,,,,,,....TTT',
  'TTTTTT..TTTTTTTTTTTTT.RRRR.qqqq.::..RRRRRR..RRRR..,,,,,,,....TTT',
  'TTTTTT..TTTTTTTTTTTTT.RRRR.qhqq.::..BBBBBB..RRRR.............TTT',
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

const MARSH_GRID = [
  'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  'YYYmmmmmmmmmmmmmmmmmmmgggggmmmmmmmmmmmmmmYYY',
  'YYYm;;;;;;;;;mmmmmmSmmggNggmmmmmmmmmmmm;;YYY',
  'YYYm;;;;;;;;;mmmm;;;;;;;;mmwwwwwwwwwwwm;;YYY',
  'YYYm;;;;;;;;;mmmm;;;;;;;;rwwwwwwwwwwwww;;YYY',
  'YYYmmmmwwwwwwwwwm;;;;;;;;mwwwwLwwwwwwww;;YYY',
  'YYYmmrwwwwwwwYwww;;;;;;;;mwwwwwwwwwwwww;;YYY',
  'YYYmmYwwwLwwwwwww;;;;;;;;mwwwwwwwwwLwww;;YYY',
  'YYYmmYwwwwwwwwwww;;;mmmmmmwwwwwwwwwwwww;;YYY',
  'YYYmmmwwwwwwwLwww;;;mmmmmmmwwwwwwwwwwwm;;YYY',
  'YYYmmmwwwwwwwwwww;;;mmmmmmmrmmmmmmmmmrm;;YYY',
  'YYYmmmmwwwwwwwwwm;;;mumm;;;;;;;;;;;mYYm;;YYY',
  'YYYmmmrmmmmmmmmrmmmmmmmm;;;;;;;;;;;mmmmmmYYY',
  'YYYmmmmmmmmmmmmmmmmmmmmmmmummmmmmmmmmmmmmYYY',
  'YYYmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmYmmmmmmmYYY',
  'YYYmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmYYY',
  'YYYm;;;;;;;;;mmmmmmmmmmmmYYmmmmummmummmmmYYY',
  'YYYm;;;;;;;;;mYYmmmmmmmmmmmmmwwwwwwwwwwwmYYY',
  'YYYm;;;;;;;;;mmmmmmmmmmmmmmrwwwwwwwwwwwwwYYY',
  'YYYm;;;;;;;;;mmmmmmmmmmmmmmmwwwwwwwwwwwwwYYY',
  'YYYmmmmrmmmmmummmmmmmmmmYmmmwwwwLwwwwwwwwYYY',
  'YYYmmmmmmwwwwwwwwwmmmmmmYmmmwwwwwwwwwwwwwYYY',
  'YYYmmmmmwwwwwwwwwwwmmmmmmmmmwwwwwwwwwLwwwYYY',
  'YYYmmmmmwwwwwwwLwwwrmmmmmmmmwwwwwwwwwwwwwYYY',
  'YYYmmmmmwwwLwwwwwwwmmmmmmmmmwwwwwwwwwwwwwYYY',
  'YYYmmmumwwwwwwwwwwwmmmmmmmmmmwwwwwwwwwwwmYYY',
  'YYYmmmmmwwwwwwwwwwwmmmmmmmmmmrmmmmmmmmummYYY',
  'YYYmmmmmmwwwwwwwwwmmmmmm;;;;;;;YYm;;;;;;;YYY',
  'YYYmmmmrmmmmummmmmmmmmmm;;;;;;;mmm;;;;;;;YYY',
  'YYYmm;;;;;;;;;;;;mYmmmmm;;;;;;;mmm;;;;;;;YYY',
  'YYYmm;;;;;;;;;;;;mmmmmmmSummmmmmmm;;;;;;;YYY',
  'YYYmm;;;;;;;;;;;;mmmmmmmmmmmmmmmmm;;;;;;;YYY',
  'YYYmm;;;;;;;;;;;;mmmmmmmmmmmmmmmmmmmmmmmmYYY',
  'YYYYYYYYYYYYYYYYYYYYmmmmYYYYYYYYYYYYYYYYYYYY',
  'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
];

// Beach + ocean region east of Meadow Town. Grid generated + connectivity
// checked by script (all walkable tiles reachable from the west entry road).
const QUOTIENT_COAST_GRID = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TT........................ssssssssssssssOOOO',
  'TT....TT........vvvvvvv...ssssssssssssssOOOO',
  'TT....TT........vvvvvvv...sskssssssssssOOOOO',
  'TT..vvvvvvvvv...vvvvvvv...sssssssssssssOOOOO',
  'TT..vvvvvvvvv...vvvvvvv.c.ssssssssssssOOOOOO',
  'TT..vvvvvvvvv.............ssssskssssssOOOOOO',
  'TT..........TT........sssssssssssssssOOOOOOO',
  'TT..........TT........ssssssssssssssOOOOOOOO',
  'TT....................sssksssscsssssOOOOOOOO',
  'TT.f..................sssssssssssssOOOOOOOOO',
  'TT..S...f.............sssssssssssssOOOOOOOOO',
  '::::::::::::::::::ssssssssssskssssOOOOOOOOOO',
  '::::::::::::::::::ssssssssssssssssOOOOOOOOOO',
  'TT..f.....f.....ssssssssssscsssssOOOOOOOOOOO',
  'TT...vvvvvvvv...sssssksssssssssssOOOOOOOOOOO',
  'TT...vvvvvvvv...ssssssssssssssssOOOOOOOOOOOO',
  'TT...vvvvvvvv...ssssssssssksssssOOOOOOOOOOOO',
  'TT..............sssssscssssscsxOOOOOOOOOOOOO',
  'TT..TT..........ssssssssssssssOxOOOOOOOOOOOO',
  'TT..TT..ssssssssssksssssssssxOOOOOOOOOOOOOOO',
  'TT......sssssssscsssSsssssxOOOOOOOOOOOOOOOOO',
  'TT......ssssksssssxsssssOOOOOOOOOOOOOOOOOOOO',
  'TT......ssscsssssssxOOOOOOOOOOOOOOOOOOOOOOOO',
  'TT.sssssssssssOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
  'TT.sssOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
];

const PLAYER_HOUSE_1_GRID = [
  'pppppppppppp',
  'pPPPPPPPPPUp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pppppeeppppp',
];

const PLAYER_HOUSE_2_GRID = [
  'pppppppppppp',
  'pPPPPPPPPPVp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pPPPPPPPPPPp',
  'pppppppppppp',
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

const SUBTRACTION_GYM_GRID = [
  'gggggggggggg',
  'gGGGGGGGGGGg',
  'gGGGGMMGGGGg',
  'gGGGGMMGGGGg',
  'gGGGGGGGGGGg',
  'gGMGGGGGGMGg',
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
      '28,37': { mapKey: 'playerHouse1', tileX: 5, tileY: 8, facing: 'up' },
      // North gate to Minus Marsh: gym badge + Beginning Subtraction unlocked.
      '32,0': {
        mapKey: 'minusMarsh', tileX: 21, tileY: 33, facing: 'up',
        requires: {
          badgeId: 'addition-gym',
          minLevelNumber: 3,
          lockedMessage: 'The gate to Minus Marsh is closed. Earn the Sum Badge and unlock Beginning Subtraction to enter!',
        },
      },
      '33,0': {
        mapKey: 'minusMarsh', tileX: 22, tileY: 33, facing: 'up',
        requires: {
          badgeId: 'addition-gym',
          minLevelNumber: 3,
          lockedMessage: 'The gate to Minus Marsh is closed. Earn the Sum Badge and unlock Beginning Subtraction to enter!',
        },
      },
      // East road to Quotient Coast: opens with the Difference Badge.
      '63,18': {
        mapKey: 'quotientCoast', tileX: 1, tileY: 13, facing: 'right',
        requires: {
          badgeId: 'subtraction-gym',
          lockedMessage: 'The coast road is roped off. Earn the Difference Badge at the Subtraction Gym to pass!',
        },
      },
      '63,19': {
        mapKey: 'quotientCoast', tileX: 1, tileY: 14, facing: 'right',
        requires: {
          badgeId: 'subtraction-gym',
          lockedMessage: 'The coast road is roped off. Earn the Difference Badge at the Subtraction Gym to pass!',
        },
      },
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
      { tileX: 31, tileY: 2, text: 'NORTH GATE - Minus Marsh ahead! Trainers need the Sum Badge and Beginning Subtraction to enter.' },
      { tileX: 8, tileY: 20, text: 'WHISPERING WOODS - Shady paths, rustling grass, and one very quiet trainer.' },
      { tileX: 37, tileY: 21, text: 'LAKE LUMEN - No swimming until you know your facts! Anglers: MathMart Online sells fishing rods.' },
      { tileX: 34, tileY: 40, text: 'MEADOW TOWN - A friendly place to start an adventure. Gym door is the blue one!' },
      { tileX: 60, tileY: 17, text: 'EAST ROAD - Quotient Coast: where the waves divide the shore evenly. Difference Badge required!' },
    ],
    musicTrack: 'overworld',
  },
  quotientCoast: {
    key: 'quotientCoast',
    name: 'Quotient Coast',
    grid: QUOTIENT_COAST_GRID,
    areaId: 'quotientCoast',
    warps: {
      '0,13': { mapKey: 'overworld', tileX: 62, tileY: 18, facing: 'left' },
      '0,14': { mapKey: 'overworld', tileX: 62, tileY: 19, facing: 'left' },
    },
    npcs: [
      {
        id: 'trainer-isla',
        name: 'Trainer Isla',
        spriteKey: 'npc-girl',
        tileX: 26,
        tileY: 12,
        facing: 'down',
        dialog: ['The reef MathMon only bite a hook — but my Fivestar washed right up to me!'],
        battle: {
          type: 'trainer',
          speciesId: 'fivestar',
          enemyHp: 70,
          enemyLevel: 6,
          introText: 'Trainer Isla challenges you!',
          defeatedDialog: [
            'Five high fives! You earned every one.',
            'Fisher Quill says six different MathMon swim these waters. Got your rod?',
          ],
        },
      },
      {
        id: 'fisher-quill',
        name: 'Fisher Quill',
        spriteKey: 'npc-boy',
        tileX: 29,
        tileY: 17,
        facing: 'down',
        dialog: [
          'Cast a line anywhere along the shore — just face the water and press ENTER.',
          'No rod? MathMart Online back in Meadow Town sells them. Best 80 coins I ever spent.',
        ],
      },
    ],
    signs: [
      { tileX: 4, tileY: 12, text: 'QUOTIENT COAST - Where the waves divide the shore evenly!' },
      { tileX: 20, tileY: 22, text: 'TIDEPOOLS - Look closely: every pool holds exactly the same number of shells...' },
    ],
    musicTrack: 'coast',
  },
  minusMarsh: {
    key: 'minusMarsh',
    name: 'Minus Marsh',
    grid: MARSH_GRID,
    areaId: 'minusMarsh',
    warps: {
      '20,34': { mapKey: 'overworld', tileX: 32, tileY: 1, facing: 'down' },
      '21,34': { mapKey: 'overworld', tileX: 32, tileY: 1, facing: 'down' },
      '22,34': { mapKey: 'overworld', tileX: 33, tileY: 1, facing: 'down' },
      '23,34': { mapKey: 'overworld', tileX: 33, tileY: 1, facing: 'down' },
      '24,3': { mapKey: 'subtractionGym', tileX: 5, tileY: 8, facing: 'up' },
    },
    npcs: [
      {
        id: 'trainer-fern',
        name: 'Trainer Fern',
        spriteKey: 'npc-girl',
        tileX: 21,
        tileY: 15,
        facing: 'down',
        dialog: ['The marsh teaches patience. And subtraction.'],
        battle: {
          type: 'trainer',
          speciesId: 'croakle',
          enemyHp: 68,
          enemyLevel: 5,
          introText: 'Trainer Fern challenges you!',
          defeatedDialog: [
            'Croaked! Your facts are quick.',
            'Wisplit fog gets thick near the big pools. Watch your step!',
          ],
        },
      },
      {
        id: 'trainer-silt',
        name: 'Trainer Silt',
        spriteKey: 'npc-boy',
        tileX: 22,
        tileY: 9,
        facing: 'down',
        dialog: ['Slow and steady... that is the Snailby way.'],
        battle: {
          type: 'trainer',
          speciesId: 'snailby',
          enemyHp: 74,
          enemyLevel: 6,
          introText: 'Trainer Silt challenges you!',
          defeatedDialog: [
            'Whoa. Not slow at all!',
            'The Subtraction Gym is open just north of here. Gym Leader Rema takes no prisoners!',
          ],
        },
      },
    ],
    signs: [
      { tileX: 19, tileY: 3, text: 'SUBTRACTION GYM - Gym Leader Rema takes away every challenger\'s confidence. Bring your best facts!' },
      { tileX: 24, tileY: 31, text: 'MINUS MARSH - Squishy ground! Wild MathMon lurk in the dark reeds.' },
    ],
    musicTrack: 'marsh',
  },
  subtractionGym: {
    key: 'subtractionGym',
    name: 'Subtraction Gym',
    grid: SUBTRACTION_GYM_GRID,
    areaId: 'minusMarsh',
    warps: {
      '5,9': { mapKey: 'minusMarsh', tileX: 24, tileY: 4, facing: 'down' },
      '6,9': { mapKey: 'minusMarsh', tileX: 24, tileY: 4, facing: 'down' },
    },
    npcs: [
      {
        id: 'gym-rema',
        name: 'Gym Leader Rema',
        spriteKey: 'npc-rema',
        tileX: 5,
        tileY: 2,
        facing: 'down',
        dialog: [
          "I'm Rema, the Subtraction Gym Leader!",
          'I take away, and take away, until only the answer is left!',
        ],
        battle: {
          type: 'gym',
          speciesId: 'subgator',
          enemyHp: 150,
          enemyLevel: 7,
          badgeId: 'subtraction-gym',
          introText: 'Gym Leader Rema wants to battle!',
          defeatedDialog: [
            'Subtracted... by you! The Difference Badge is yours!',
            'Keep practicing — bigger differences await.',
          ],
        },
      },
    ],
    signs: [],
    musicTrack: 'gym',
  },
  playerHouse1: {
    key: 'playerHouse1',
    name: 'Your House',
    grid: PLAYER_HOUSE_1_GRID,
    areaId: 'meadowTown',
    isPlayerHouse: true,
    warps: {
      '5,9': { mapKey: 'overworld', tileX: 28, tileY: 38, facing: 'down' },
      '6,9': { mapKey: 'overworld', tileX: 28, tileY: 38, facing: 'down' },
      '10,1': { mapKey: 'playerHouse2', tileX: 10, tileY: 2, facing: 'down' },
    },
    npcs: [],
    signs: [],
    musicTrack: 'house',
  },
  playerHouse2: {
    key: 'playerHouse2',
    name: 'Your Bedroom',
    grid: PLAYER_HOUSE_2_GRID,
    areaId: 'meadowTown',
    isPlayerHouse: true,
    warps: {
      '10,1': { mapKey: 'playerHouse1', tileX: 10, tileY: 2, facing: 'down' },
    },
    npcs: [],
    signs: [],
    musicTrack: 'house',
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
export const SOLID_TILES = new Set(['T', 'W', 'R', 'B', 'd', 'S', 'F', 'g', 'Y', 'w', 'L', 'Q', 'q', 'p', 'O', 'k', 'x']);
/** Tiles that can trigger wild encounters. */
export const ENCOUNTER_TILES = new Set([',', ';', 'v']);
/** Water tiles the player can fish while facing (with a rod). */
export const WATER_TILES = new Set(['W', 'w', 'O']);
