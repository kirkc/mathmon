/**
 * Original creature roster for MathMon. All names, types, and designs
 * are original to this project.
 */
export interface CreatureSpecies {
  id: string;
  name: string;
  type: string;
  personality: string;
  baseHp: number;
  spriteKey: string;
  description: string;
  /** True for the three starting picks. */
  starter?: boolean;
}

export const CREATURE_SPECIES: Record<string, CreatureSpecies> = {
  embercub: {
    id: 'embercub',
    name: 'Embercub',
    type: 'Spark',
    personality: 'brave',
    baseHp: 40,
    spriteKey: 'creature-embercub',
    description: 'A brave little cub with a warm glow. Loves a challenge.',
    starter: true,
  },
  leafloo: {
    id: 'leafloo',
    name: 'Leafloo',
    type: 'Sprout',
    personality: 'curious',
    baseHp: 40,
    spriteKey: 'creature-leafloo',
    description: 'A curious sprout creature that perks up around new facts.',
    starter: true,
  },
  aquabbit: {
    id: 'aquabbit',
    name: 'Aquabbit',
    type: 'Splash',
    personality: 'gentle',
    baseHp: 40,
    spriteKey: 'creature-aquabbit',
    description: 'A gentle splash bunny that cheers for every right answer.',
    starter: true,
  },
  pebblit: {
    id: 'pebblit',
    name: 'Pebblit',
    type: 'Stone',
    personality: 'stubborn',
    baseHp: 28,
    spriteKey: 'creature-pebblit',
    description: 'A round pebble creature that naps in tall grass.',
  },
  fluffinch: {
    id: 'fluffinch',
    name: 'Fluffinch',
    type: 'Breeze',
    personality: 'flighty',
    baseHp: 26,
    spriteKey: 'creature-fluffinch',
    description: 'A puffball bird that flits over Meadow Town.',
  },
  buzzlet: {
    id: 'buzzlet',
    name: 'Buzzlet',
    type: 'Spark',
    personality: 'zippy',
    baseHp: 30,
    spriteKey: 'creature-buzzlet',
    description: 'A zippy bug crackling with static along Sumwood Trail.',
  },
  thistletot: {
    id: 'thistletot',
    name: 'Thistletot',
    type: 'Sprout',
    personality: 'prickly',
    baseHp: 55,
    spriteKey: 'creature-thistletot',
    description: "Trainer Finn's prickly partner. Tougher than it looks.",
  },
  plusaur: {
    id: 'plusaur',
    name: 'Plusaur',
    type: 'Stone',
    personality: 'steady',
    baseHp: 130,
    spriteKey: 'creature-plusaur',
    description: "Gym Leader Ada's champion. Its shell is carved with plus signs.",
  },
  croakle: {
    id: 'croakle',
    name: 'Croakle',
    type: 'Bog',
    personality: 'patient',
    baseHp: 36,
    spriteKey: 'creature-croakle',
    description: 'A mossy marsh frog. It croaks once for every fact it forgets.',
  },
  wisplit: {
    id: 'wisplit',
    name: 'Wisplit',
    type: 'Mist',
    personality: 'shy',
    baseHp: 32,
    spriteKey: 'creature-wisplit',
    description: 'A drifting wisp of marsh fog. It splits in two when startled.',
  },
  snailby: {
    id: 'snailby',
    name: 'Snailby',
    type: 'Shell',
    personality: 'unhurried',
    baseHp: 40,
    spriteKey: 'creature-snailby',
    description: 'A patient snail whose spiral shell subtracts one ring each year.',
  },
};

export const STARTER_IDS = ['embercub', 'leafloo', 'aquabbit'] as const;
