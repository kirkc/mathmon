/**
 * The player's house furniture catalog. Items are bought with coins at the
 * computer; each goes to a fixed spot on one of the two floors (the house
 * is not rearrangeable). Prices scale with how exciting the item is —
 * the TV is the long-term goal, the door mat is the first treat.
 */
export interface HouseItem {
  id: string;
  name: string;
  price: number;
  /** Which floor the item appears on. */
  mapKey: 'playerHouse1' | 'playerHouse2';
  tileX: number;
  tileY: number;
  /** Footprint in tiles (defaults 1x1). Big furniture takes real space. */
  tilesW?: number;
  tilesH?: number;
  textureKey: string;
  /** Blocks walking when true. */
  solid: boolean;
  /** Flavor line when the player examines it. */
  examine: string;
  /** Extra display scale tweak (textures are 16px-logical by default). */
  scale?: number;
}

export const HOUSE_ITEMS: HouseItem[] = [
  { id: 'doormat', name: 'Door Mat', price: 10, mapKey: 'playerHouse1', tileX: 5, tileY: 8, textureKey: 'item-doormat', solid: false, examine: 'It says WELCOME, MATHLETE!' },
  { id: 'plant', name: 'Potted Plant', price: 15, mapKey: 'playerHouse1', tileX: 1, tileY: 2, textureKey: 'item-plant', solid: true, examine: 'A happy little plant. It grows one leaf per badge.' },
  { id: 'wallart1', name: 'Wall Art: Meadow', price: 20, mapKey: 'playerHouse1', tileX: 3, tileY: 1, textureKey: 'item-wallart-1', solid: false, examine: 'A painting of Meadow Town in spring.' },
  { id: 'wallart2', name: 'Wall Art: Numbers', price: 20, mapKey: 'playerHouse1', tileX: 6, tileY: 1, textureKey: 'item-wallart-2', solid: false, examine: 'Abstract art. Or maybe just a 7. Genius!' },
  { id: 'wallart3', name: 'Wall Art: Starters', price: 20, mapKey: 'playerHouse2', tileX: 4, tileY: 1, textureKey: 'item-wallart-3', solid: false, examine: 'A portrait of the three starter MathMon.' },
  { id: 'lamp', name: 'Reading Lamp', price: 25, mapKey: 'playerHouse1', tileX: 1, tileY: 6, textureKey: 'item-lamp', solid: true, examine: 'Perfect light for late-night times tables.' },
  { id: 'mirror', name: 'Mirror', price: 30, mapKey: 'playerHouse2', tileX: 8, tileY: 1, textureKey: 'item-mirror', solid: false, examine: 'Looking sharp, champ.' },
  { id: 'chair', name: 'Cozy Chair', price: 35, mapKey: 'playerHouse1', tileX: 9, tileY: 6, textureKey: 'item-chair', solid: true, examine: 'The official thinking chair.' },
  { id: 'nightstand', name: 'Nightstand', price: 40, mapKey: 'playerHouse2', tileX: 3, tileY: 2, textureKey: 'item-nightstand', solid: true, examine: 'A glass of water and a flashcard deck on top.' },
  { id: 'plush-embercub', name: 'Embercub Plush', price: 50, mapKey: 'playerHouse2', tileX: 3, tileY: 5, textureKey: 'creature-embercub', solid: true, examine: 'A soft Embercub plush. Slightly warm somehow.', scale: 1.4 },
  { id: 'plush-leafloo', name: 'Leafloo Plush', price: 50, mapKey: 'playerHouse2', tileX: 5, tileY: 5, textureKey: 'creature-leafloo', solid: true, examine: 'A squishy Leafloo plush. Smells like fresh grass.', scale: 1.4 },
  { id: 'plush-aquabbit', name: 'Aquabbit Plush', price: 50, mapKey: 'playerHouse2', tileX: 7, tileY: 5, textureKey: 'creature-aquabbit', solid: true, examine: 'An Aquabbit plush with extra floppy ears.', scale: 1.4 },
  { id: 'table', name: 'Dining Table', price: 60, mapKey: 'playerHouse1', tileX: 7, tileY: 6, tilesW: 2, textureKey: 'item-table', solid: true, examine: 'Homework happens here. So do snacks.' },
  { id: 'rug', name: 'Big Rug', price: 70, mapKey: 'playerHouse1', tileX: 4, tileY: 4, tilesW: 3, tilesH: 2, textureKey: 'item-rug', solid: false, examine: 'It really ties the room together.' },
  { id: 'wardrobe', name: 'Wardrobe', price: 80, mapKey: 'playerHouse2', tileX: 5, tileY: 2, tilesW: 2, textureKey: 'item-wardrobe', solid: true, examine: 'Seven identical adventure outfits. Efficient!' },
  { id: 'couch', name: 'Comfy Couch', price: 90, mapKey: 'playerHouse1', tileX: 4, tileY: 5, tilesW: 2, textureKey: 'item-couch', solid: true, examine: 'Premium napping technology.' },
  { id: 'fireplace', name: 'Fireplace', price: 110, mapKey: 'playerHouse1', tileX: 7, tileY: 2, tilesW: 2, textureKey: 'item-fireplace', solid: true, examine: 'Crackle, crackle. Cozy and warm.' },
  { id: 'fridge', name: 'Refrigerator', price: 120, mapKey: 'playerHouse1', tileX: 10, tileY: 4, textureKey: 'item-fridge', solid: true, examine: 'Stocked with juice boxes and victory snacks.' },
  { id: 'tv', name: 'Big TV', price: 150, mapKey: 'playerHouse1', tileX: 4, tileY: 2, tilesW: 2, textureKey: 'item-tv', solid: true, examine: "It's playing a MathMon battle replay!" },
];

/**
 * Gear (tools) sold at the computer alongside furniture. Unlike furniture,
 * gear travels with the player — ownership lives in SaveData.inventory.
 */
export interface GearItem {
  id: string;
  name: string;
  price: number;
  examine: string;
}

export const GEAR_ITEMS: GearItem[] = [
  { id: 'fishing-rod', name: 'Fishing Rod', price: 80, examine: 'A trusty rod. Face any water and press ENTER to cast!' },
];

/** Items every house starts with (not purchasable, fixed). */
export interface HouseFixture {
  id: string;
  mapKey: 'playerHouse1' | 'playerHouse2';
  tileX: number;
  tileY: number;
  tilesW?: number;
  tilesH?: number;
  textureKey: string;
  solid: boolean;
  examine: string;
  /** The computer opens the furniture shop. */
  isComputer?: boolean;
  /** The trophy case shows earned trophies when examined. */
  isTrophyCase?: boolean;
}

export const HOUSE_FIXTURES: HouseFixture[] = [
  { id: 'computer', mapKey: 'playerHouse1', tileX: 2, tileY: 2, textureKey: 'item-computer', solid: true, examine: '', isComputer: true },
  { id: 'trophy-case', mapKey: 'playerHouse1', tileX: 9, tileY: 2, textureKey: 'item-trophy-case', solid: true, examine: '', isTrophyCase: true },
  { id: 'bed', mapKey: 'playerHouse2', tileX: 2, tileY: 2, tilesH: 2, textureKey: 'item-bed', solid: true, examine: 'Your cozy bed. Dream of big sums.' },
];
