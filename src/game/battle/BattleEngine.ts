import { battleConfig, type BattleType } from '../../config/battleConfig';
import type { QuestionOutcome } from '../math/types';

export interface Combatant {
  name: string;
  maxHp: number;
  currentHp: number;
}

export interface TurnResolution {
  outcome: QuestionOutcome;
  playerHit: boolean;
  playerDamage: number;
  enemyHit: boolean;
  enemyDamage: number;
  playerHpAfter: number;
  enemyHpAfter: number;
  questionsAsked: number;
  battleOver: boolean;
  /** Defined when battleOver. */
  playerWon?: boolean;
  feedback: string;
}

/**
 * Pure battle state machine — no Phaser, fully unit-testable. The
 * BattleScene drives it: one resolveAnswer() per math question.
 *
 * Timing rules (see battleConfig):
 *  - fast correct: player always hits hard; enemy misses 40% / else low dmg
 *  - medium correct: player always hits moderate; enemy low dmg
 *  - slow correct: player 80% to hit low; enemy moderate dmg
 *  - incorrect: player misses; enemy high dmg
 *  - timeout: player misses; enemy high dmg
 *
 * Battles run until one creature faints — questions keep coming as long
 * as both sides are standing. Tougher opponents simply have more HP.
 */
export class BattleEngine {
  questionsAsked = 0;

  constructor(
    readonly battleType: BattleType,
    readonly player: Combatant,
    readonly enemy: Combatant,
    private readonly rng: () => number = Math.random,
  ) {}

  resolveAnswer(outcome: QuestionOutcome): TurnResolution {
    this.questionsAsked += 1;
    const { playerDamage, enemyDamage, hitChance } = battleConfig;

    let playerHit = false;
    let playerDmg = 0;
    let enemyHit = false;
    let enemyDmg = 0;
    let feedback = '';

    switch (outcome) {
      case 'fast':
        playerHit = true;
        playerDmg = playerDamage.high;
        if (this.rng() < hitChance.fastEnemyMiss) {
          enemyHit = false;
        } else {
          enemyHit = true;
          enemyDmg = enemyDamage.low;
        }
        feedback = `Fast fact! ${this.player.name} landed a strong hit!`;
        break;
      case 'medium':
        playerHit = true;
        playerDmg = playerDamage.moderate;
        enemyHit = true;
        enemyDmg = enemyDamage.low;
        feedback = 'Correct! Nice steady answer.';
        break;
      case 'slow':
        playerHit = this.rng() < hitChance.slowPlayerHit;
        playerDmg = playerHit ? playerDamage.low : 0;
        enemyHit = true;
        enemyDmg = enemyDamage.moderate;
        feedback = playerHit
          ? 'Correct! A little slow, but it connected.'
          : `Correct, but too slow — ${this.player.name}'s attack missed!`;
        break;
      case 'incorrect':
        playerHit = false;
        enemyHit = true;
        enemyDmg = enemyDamage.high;
        feedback = "Good effort. Let's try the next one!";
        break;
      case 'timeout':
        playerHit = false;
        enemyHit = true;
        enemyDmg = enemyDamage.high;
        feedback = "Time's up — but now you know this one!";
        break;
    }

    // Player attacks first; a fainted enemy cannot counterattack.
    this.enemy.currentHp = Math.max(0, this.enemy.currentHp - playerDmg);
    if (this.enemy.currentHp === 0) {
      enemyHit = false;
      enemyDmg = 0;
    }
    if (enemyHit) {
      this.player.currentHp = Math.max(0, this.player.currentHp - enemyDmg);
    }

    let battleOver = false;
    let playerWon: boolean | undefined;
    if (this.enemy.currentHp === 0) {
      battleOver = true;
      playerWon = true;
    } else if (this.player.currentHp === 0) {
      battleOver = true;
      playerWon = false;
    }

    return {
      outcome,
      playerHit,
      playerDamage: playerDmg,
      enemyHit,
      enemyDamage: enemyDmg,
      playerHpAfter: this.player.currentHp,
      enemyHpAfter: this.enemy.currentHp,
      questionsAsked: this.questionsAsked,
      battleOver,
      playerWon,
      feedback,
    };
  }
}
