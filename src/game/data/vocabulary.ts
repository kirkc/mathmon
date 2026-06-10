/**
 * Kid-friendly math vocabulary for the glossary screen. Vocabulary never
 * interrupts battles — it lives in its own review screen.
 */
export interface VocabTerm {
  term: string;
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'general';
  definition: string;
}

export const VOCABULARY: VocabTerm[] = [
  { term: 'Equal sign', operation: 'general', definition: 'The = symbol. It means both sides have the same value.' },
  { term: 'Inverse Operations', operation: 'general', definition: 'Operations that undo each other, like adding and subtracting.' },
  { term: 'Add', operation: 'addition', definition: 'To put numbers together to find how many in all.' },
  { term: 'Addend', operation: 'addition', definition: 'A number being added. In 3 + 4, both 3 and 4 are addends.' },
  { term: 'Plus', operation: 'addition', definition: 'The + symbol. It tells you to add.' },
  { term: 'Sum', operation: 'addition', definition: 'The answer to an addition problem. In 3 + 4 = 7, the sum is 7.' },
  { term: 'Increase', operation: 'addition', definition: 'To make a number bigger.' },
  { term: 'Commutative Property', operation: 'addition', definition: 'Order does not change the answer: 3 + 4 equals 4 + 3.' },
  { term: 'Subtract', operation: 'subtraction', definition: 'To take away one number from another.' },
  { term: 'Subtrahend', operation: 'subtraction', definition: 'The number being taken away. In 9 - 4, the subtrahend is 4.' },
  { term: 'Minus', operation: 'subtraction', definition: 'The - symbol. It tells you to subtract.' },
  { term: 'Difference', operation: 'subtraction', definition: 'The answer to a subtraction problem. In 9 - 4 = 5, the difference is 5.' },
  { term: 'Decrease', operation: 'subtraction', definition: 'To make a number smaller.' },
  { term: 'Multiply', operation: 'multiplication', definition: 'To add equal groups quickly. 3 x 4 means 3 groups of 4.' },
  { term: 'Factors', operation: 'multiplication', definition: 'Numbers multiplied together. In 3 x 4, both 3 and 4 are factors.' },
  { term: 'Multiplicand', operation: 'multiplication', definition: 'The number being multiplied. In 3 x 4, the 4 is the multiplicand.' },
  { term: 'Multiplier', operation: 'multiplication', definition: 'The number you multiply by. In 3 x 4, the 3 is the multiplier.' },
  { term: 'Multiplication sign', operation: 'multiplication', definition: 'The x symbol. It tells you to multiply.' },
  { term: 'Product', operation: 'multiplication', definition: 'The answer to a multiplication problem. In 3 x 4 = 12, the product is 12.' },
  { term: 'Equal Groups', operation: 'multiplication', definition: 'Groups that all have the same number of things.' },
  { term: 'Divide', operation: 'division', definition: 'To split a number into equal groups.' },
  { term: 'Dividend', operation: 'division', definition: 'The number being split up. In 12 / 3, the dividend is 12.' },
  { term: 'Divisor', operation: 'division', definition: 'The number you divide by. In 12 / 3, the divisor is 3.' },
  { term: 'Division sign', operation: 'division', definition: 'The / or division symbol. It tells you to divide.' },
  { term: 'Quotient', operation: 'division', definition: 'The answer to a division problem. In 12 / 3 = 4, the quotient is 4.' },
];
