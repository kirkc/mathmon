/**
 * Trophy definitions — milestone achievements displayed in the player's
 * trophy case. Curated so earning one feels special: big firsts and real
 * accomplishments only, never every-battle spam.
 */
export interface TrophyDefinition {
  id: string;
  name: string;
  description: string;
}

export const TROPHIES: TrophyDefinition[] = [
  { id: 'first-win', name: 'First Victory', description: 'Won your very first MathMon battle!' },
  { id: 'sum-badge', name: 'Sum Badge Champion', description: 'Defeated Gym Leader Ada at the Addition Gym.' },
  { id: 'difference-badge', name: 'Difference Badge Champion', description: 'Defeated Gym Leader Rema at the Subtraction Gym.' },
  { id: 'level-5', name: 'Rising Star', description: 'Your partner reached level 5!' },
  { id: 'level-10', name: 'Shining Star', description: 'Your partner reached level 10!' },
  { id: 'level-15', name: 'Superstar', description: 'Your partner reached level 15!' },
  { id: 'first-catch', name: 'New Friend', description: 'A wild MathMon joined your team!' },
  { id: 'full-team', name: 'Full House', description: 'Six MathMon strong — a complete team!' },
  { id: 'first-fish', name: 'Gone Fishing', description: 'Hooked your first MathMon out of the water.' },
  { id: 'coast-found', name: 'Beachcomber', description: 'Discovered sunny Quotient Coast.' },
  { id: 'first-evolution', name: 'Growing Up', description: 'One of your MathMon evolved!' },
  { id: 'home-decorator', name: 'Home Decorator', description: 'Furnished your house with 5 pieces of furniture.' },
  { id: 'century-scholar', name: 'Century Scholar', description: 'Answered 100 math questions. Your brain is buff!' },
  { id: 'neighborhood-champ', name: 'Neighborhood Champ', description: 'Defeated every trainer in the meadow and the marsh.' },
];

export const TROPHY_BY_ID: Record<string, TrophyDefinition> = Object.fromEntries(
  TROPHIES.map((t) => [t.id, t]),
);
