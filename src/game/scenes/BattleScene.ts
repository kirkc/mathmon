import Phaser from 'phaser';
import { battleConfig, type BattleType } from '../../config/battleConfig';
import { worldConfig } from '../../config/worldConfig';
import { chiptune } from '../audio/ChiptunePlayer';
import { BattleEngine, type TurnResolution } from '../battle/BattleEngine';
import { CREATURE_SPECIES } from '../data/creatures';
import type { MathQuestion } from '../math/types';
import { ProgressionService } from '../progression/ProgressionService';
import type { CreatureInstance } from '../save/saveTypes';
import { battleService, progressionService, questionService, saveService } from '../services';
import { FONT_BODY, FONT_HEADING } from '../ui/fonts';

export interface BattlePayload {
  battleType: BattleType;
  enemy: CreatureInstance;
  introText: string;
  trainerId?: string;
  trainerName?: string;
  badgeId?: string;
  victoryDialog?: string[];
}

type Phase = 'intro' | 'question' | 'remediate' | 'resolve' | 'end';

const MONO = FONT_BODY;
const HEAD = FONT_HEADING;
const W = worldConfig.gameWidth;
const H = worldConfig.gameHeight;

/**
 * The math battle. Instead of picking attacks, the player answers math
 * facts; correctness + speed decide damage (see BattleEngine).
 */
export class BattleScene extends Phaser.Scene {
  private payload!: BattlePayload;
  private engine!: BattleEngine;
  private phase: Phase = 'intro';

  private playerCreature!: CreatureInstance;
  private question: MathQuestion | null = null;
  private questionStartedAt = 0;
  private remediateStartedAt = 0;
  private input$ = '';

  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private enemyHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private answerText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Rectangle;
  private timerBarBg!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('BattleScene');
  }

  init(payload: BattlePayload): void {
    this.payload = payload;
  }

  create(): void {
    const save = saveService.requireData();
    this.playerCreature = save.party[0];
    this.engine = new BattleEngine(
      this.payload.battleType,
      {
        name: CREATURE_SPECIES[this.playerCreature.speciesId].name,
        maxHp: this.playerCreature.maxHp,
        currentHp: this.playerCreature.currentHp,
      },
      {
        name: this.enemyDisplayName(),
        maxHp: this.payload.enemy.maxHp,
        currentHp: this.payload.enemy.currentHp,
      },
    );
    this.phase = 'intro';
    this.input$ = '';
    this.question = null;

    this.buildLayout();
    chiptune.playMusic('battle');

    this.messageText.setText(this.payload.introText + '\n\nPress ENTER to begin!');

    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKey, this);
    });
  }

  private enemyDisplayName(): string {
    const species = CREATURE_SPECIES[this.payload.enemy.speciesId];
    return this.payload.trainerName ? `${this.payload.trainerName}'s ${species.name}` : species.name;
  }

  // -------------------------------------------------------------- layout

  private buildLayout(): void {
    // backdrop: layered sky, drifting clouds, grounded horizon
    this.add.rectangle(0, 0, W, H * 0.3, 0xb4e8f6).setOrigin(0);
    this.add.rectangle(0, H * 0.3, W, H * 0.25, 0x9adcf0).setOrigin(0);
    for (const [cx, cy, cw] of [[80, 38, 70], [300, 24, 90], [430, 52, 60]] as const) {
      this.add.ellipse(cx, cy, cw, 18, 0xffffff, 0.9);
      this.add.ellipse(cx + cw * 0.3, cy + 6, cw * 0.7, 14, 0xffffff, 0.9);
    }
    this.add.rectangle(0, H * 0.55 - 4, W, 4, 0x6fae50).setOrigin(0); // horizon
    this.add.rectangle(0, H * 0.55, W, H * 0.45, 0x86c860).setOrigin(0);
    this.add.ellipse(W - 110, 176, 140, 32, 0x74b850); // enemy ground pad
    this.add.ellipse(W - 110, 178, 120, 24, 0x68a847);
    this.add.ellipse(120, 206, 140, 28, 0x74b850); // player ground pad
    this.add.ellipse(120, 208, 120, 22, 0x68a847);

    // Sprites are 16 art px at 2x texture scale, so display size is
    // 16 * 2 * scale — keep panels clear of those bounds.
    const enemySpecies = CREATURE_SPECIES[this.payload.enemy.speciesId];
    this.enemySprite = this.add.image(W - 110, 120, enemySpecies.spriteKey).setScale(4);
    const playerSpecies = CREATURE_SPECIES[this.playerCreature.speciesId];
    // Scale 4 with center y156: the art's transparent top rows tuck under
    // the info panel and the feet sit on the ground pad, fully visible
    // above the question box.
    this.playerSprite = this.add.image(120, 156, playerSpecies.spriteKey).setScale(4).setFlipX(true);

    // Each creature's info panel sits on ITS side: enemy top-right above the
    // enemy, player mid-left above the player.
    this.buildPanel(W - 200, 8, 190, 44);
    this.add.text(W - 192, 11, this.enemyDisplayName(), { fontFamily: MONO, fontSize: '16px', color: '#26203a' });
    this.add.rectangle(W - 192, 30, 150, 8, 0xd0d0c0).setOrigin(0);
    this.enemyHpBar = this.add.rectangle(W - 192, 30, 150, 8, 0x3f9c4e).setOrigin(0);
    this.enemyHpText = this.add.text(W - 192, 38, '', { fontFamily: MONO, fontSize: '14px', color: '#26203a' });

    this.buildPanel(10, 70, 190, 50);
    this.add.text(18, 73, `${playerSpecies.name} Lv.${this.playerCreature.level}`, {
      fontFamily: MONO,
      fontSize: '16px',
      color: '#26203a',
    });
    this.add.rectangle(18, 94, 150, 8, 0xd0d0c0).setOrigin(0);
    this.playerHpBar = this.add.rectangle(18, 94, 150, 8, 0x3f9c4e).setOrigin(0);
    this.playerHpText = this.add.text(18, 102, '', { fontFamily: MONO, fontSize: '14px', color: '#26203a' });

    // progress counter (top-left, away from the enemy panel)
    this.progressText = this.add
      .text(10, 10, '', { fontFamily: MONO, fontSize: '16px', color: '#26203a', backgroundColor: '#f8f8f0', padding: { x: 6, y: 2 } })
      .setOrigin(0, 0)
      .setVisible(false);

    // timer bar
    this.timerBarBg = this.add.rectangle(20, 206, W - 40, 6, 0x26203a).setOrigin(0).setVisible(false);
    this.timerBar = this.add.rectangle(21, 207, W - 42, 4, 0x3f9c4e).setOrigin(0).setVisible(false);

    // question/message panel (bottom)
    this.buildPanel(6, 216, W - 12, H - 222);
    this.promptText = this.add
      .text(W / 2, 244, '', { fontFamily: HEAD, fontSize: '20px', color: '#26203a' })
      .setOrigin(0.5, 0);
    this.answerText = this.add
      .text(W / 2, 278, '', { fontFamily: HEAD, fontSize: '20px', color: '#3a6ac8' })
      .setOrigin(0.5, 0);
    this.messageText = this.add.text(18, 222, '', {
      fontFamily: MONO,
      fontSize: '18px',
      color: '#26203a',
      wordWrap: { width: W - 40 },
      lineSpacing: 0,
    });

    this.refreshHpBars();
  }

  private buildPanel(x: number, y: number, w: number, h: number): void {
    this.add.rectangle(x, y, w, h, 0xf8f8f0).setOrigin(0).setStrokeStyle(3, 0x3a4a8c);
  }

  private refreshHpBars(animate = false): void {
    const setBar = (bar: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text, hp: number, max: number) => {
      const pct = Math.max(0, hp / max);
      bar.fillColor = pct > 0.5 ? 0x3f9c4e : pct > 0.25 ? 0xf8d048 : 0xc83a3a;
      text.setText(`HP ${hp}/${max}`);
      if (animate) {
        this.tweens.add({ targets: bar, width: 150 * pct, duration: 350, ease: 'Cubic.easeOut' });
      } else {
        bar.width = 150 * pct;
      }
    };
    setBar(this.enemyHpBar, this.enemyHpText, this.engine.enemy.currentHp, this.engine.enemy.maxHp);
    setBar(this.playerHpBar, this.playerHpText, this.engine.player.currentHp, this.engine.player.maxHp);
  }

  // ---------------------------------------------------------------- flow

  private askNextQuestion(): void {
    this.phase = 'question';
    this.question = questionService.nextQuestion();
    this.questionStartedAt = this.time.now;
    this.input$ = '';

    this.messageText.setText('');
    this.promptText.setText(`${this.question.prompt} = ?`).setVisible(true);
    this.answerText.setVisible(true).setColor('#3a6ac8');
    this.renderInput();
    this.progressText.setText(`Question ${this.engine.questionsAsked + 1} of ${this.engine.questionsTotal}`).setVisible(true);
    this.timerBarBg.setVisible(true);
    this.timerBar.setVisible(true).setFillStyle(0x3f9c4e);
    this.timerBar.width = W - 42;
  }

  update(): void {
    if (this.phase === 'question') {
      const elapsed = this.time.now - this.questionStartedAt;
      const { lateMs, fluentMs, fastMs } = battleConfig.timing;
      const remaining = Math.max(0, 1 - elapsed / lateMs);
      this.timerBar.width = (W - 42) * remaining;
      this.timerBar.fillColor = elapsed < fastMs ? 0x3f9c4e : elapsed < fluentMs ? 0xf8d048 : 0xc83a3a;
      if (elapsed >= lateMs) {
        this.beginRemediation(true);
      }
    } else if (this.phase === 'remediate') {
      if (this.time.now - this.remediateStartedAt >= battleConfig.timing.hardTimeoutMs) {
        // Hard timeout: keep the game flowing rather than stalling forever.
        this.finishRemediation();
      }
    }
  }

  private handleKey(event: KeyboardEvent): void {
    chiptune.unlock();

    if (this.phase === 'intro') {
      if (event.code === 'Enter' || event.code === 'Space') this.askNextQuestion();
      return;
    }
    if (this.phase === 'end') {
      if (event.code === 'Enter' || event.code === 'Space') this.advanceEndPage();
      return;
    }
    if (this.phase !== 'question' && this.phase !== 'remediate') return;

    const digit = digitFrom(event);
    if (digit !== null && this.input$.length < this.answerLength()) {
      this.input$ += digit;
      this.renderInput();
      if (this.phase === 'question') {
        // Auto-submit on the final digit — no ENTER needed, so the timer
        // measures pure answer speed.
        if (this.input$.length === this.answerLength()) this.submitAnswer();
      } else {
        this.checkRemediationInput();
      }
      return;
    }
    if (event.code === 'Backspace') {
      this.input$ = this.input$.slice(0, -1);
      this.renderInput();
    }
  }

  /** Digit count of the expected answer (the answer box shows one blank per digit). */
  private answerLength(): number {
    return this.question ? String(this.question.answer).length : 1;
  }

  private renderInput(): void {
    const blanks: string[] = [];
    for (let i = 0; i < this.answerLength(); i++) {
      blanks.push(this.input$[i] ?? '_');
    }
    this.answerText.setText(blanks.join(' '));
  }

  private submitAnswer(): void {
    if (!this.question || this.input$.length === 0) return;
    const elapsed = this.time.now - this.questionStartedAt;
    const correct = parseInt(this.input$, 10) === this.question.answer;

    if (!correct) {
      chiptune.playSfx('wrong');
      this.beginRemediation(false);
      return;
    }

    const outcome = ProgressionService.classifyOutcome(
      true,
      elapsed,
      false,
      battleConfig.timing.fastMs,
      battleConfig.timing.fluentMs,
    );
    chiptune.playSfx(outcome === 'fast' ? 'fast' : 'correct');
    this.resolveQuestion(outcome, elapsed);
  }

  /**
   * Wrong answer or 12s timeout: show the correct answer and require the
   * student to type it before the battle continues (XtraMath style).
   */
  private beginRemediation(timedOut: boolean): void {
    if (!this.question) return;
    this.phase = 'remediate';
    this.remediateStartedAt = this.time.now;
    this.pendingOutcome = timedOut ? 'timeout' : 'incorrect';
    this.input$ = '';
    if (timedOut) chiptune.playSfx('timeout');

    const lead = timedOut ? "Time's up!" : 'Almost!';
    this.messageText.setText(`${lead} Type ${this.question.answer} to continue.`);
    // Show the completed fact for reinforcement while the student retypes it.
    this.promptText.setText(`${this.question.prompt} = ${this.question.answer}`);
    this.timerBar.width = 0;
    this.timerBarBg.setVisible(false);
    this.timerBar.setVisible(false);
    this.renderInput();
  }

  private pendingOutcome: 'incorrect' | 'timeout' = 'incorrect';

  private checkRemediationInput(): void {
    if (!this.question) return;
    if (parseInt(this.input$, 10) === this.question.answer) {
      chiptune.playSfx('correct');
      this.answerText.setColor('#3f9c4e');
      this.time.delayedCall(250, () => this.finishRemediation());
    } else if (this.input$.length >= this.answerLength()) {
      // Full but wrong: flash red and clear so the student can retry
      // without needing to know about Backspace.
      this.answerText.setColor('#c83a3a');
      this.time.delayedCall(350, () => {
        if (this.phase === 'remediate') {
          this.input$ = '';
          this.answerText.setColor('#3a6ac8');
          this.renderInput();
        }
      });
    }
  }

  private finishRemediation(): void {
    if (this.phase !== 'remediate') return;
    const elapsed = this.time.now - this.questionStartedAt;
    this.resolveQuestion(this.pendingOutcome, Math.min(elapsed, battleConfig.timing.lateMs));
  }

  // ------------------------------------------------------------- resolve

  private resolveQuestion(outcome: 'fast' | 'medium' | 'slow' | 'incorrect' | 'timeout', responseMs: number): void {
    if (!this.question) return;
    this.phase = 'resolve';

    const result = {
      questionId: this.question.id,
      levelNumber: this.question.levelNumber,
      outcome,
      responseMs: Math.round(responseMs),
      correct: outcome === 'fast' || outcome === 'medium' || outcome === 'slow',
    };
    progressionService.recordQuestionResult(result);
    questionService.recordResult(result);

    const turn = this.engine.resolveAnswer(outcome);

    this.promptText.setVisible(false);
    this.answerText.setVisible(false);
    this.timerBar.setVisible(false);
    this.timerBarBg.setVisible(false);

    const seconds = (responseMs / 1000).toFixed(1);
    const lines: string[] = [turn.feedback];
    if (result.correct) lines.push(`Answered in ${seconds}s.`);
    this.messageText.setText(lines.join('\n'));

    this.playTurnAnimation(turn, () => {
      this.time.delayedCall(450, () => {
        if (turn.battleOver) this.endBattle(turn.playerWon === true);
        else this.askNextQuestion();
      });
    });
  }

  // ----------------------------------------------------- attack animation

  /** Player attack -> enemy counter, with lunges, impacts, and damage popups. */
  private playTurnAnimation(turn: TurnResolution, onDone: () => void): void {
    this.animateAttack(this.playerSprite, this.enemySprite, 1, turn.playerHit, turn.playerDamage, () => {
      this.refreshHpBars(true);
      if (turn.enemyHpAfter === 0) {
        this.animateFaint(this.enemySprite, onDone);
        return;
      }
      // Enemy counterattacks unless it fainted.
      this.time.delayedCall(280, () => {
        this.animateAttack(this.enemySprite, this.playerSprite, -1, turn.enemyHit, turn.enemyDamage, () => {
          this.refreshHpBars(true);
          if (turn.playerHpAfter === 0) this.animateFaint(this.playerSprite, onDone);
          else onDone();
        });
      });
    });
  }

  private animateAttack(
    attacker: Phaser.GameObjects.Image,
    defender: Phaser.GameObjects.Image,
    dir: 1 | -1,
    hit: boolean,
    damage: number,
    onDone: () => void,
  ): void {
    const homeX = attacker.x;
    this.tweens.add({
      targets: attacker,
      x: homeX + dir * 38,
      duration: 140,
      yoyo: true,
      ease: 'Quad.easeIn',
      onYoyo: () => {
        if (hit) {
          this.impactBurst(defender.x, defender.y);
          this.damagePopup(defender.x, defender.y - 44, `-${damage}`, '#c83a3a');
          this.tweens.add({ targets: defender, x: defender.x + dir * 8, duration: 55, yoyo: true, repeat: 3 });
          this.tweens.add({ targets: defender, alpha: 0.25, duration: 80, yoyo: true, repeat: 2 });
        } else {
          // Defender sidesteps the whiffed attack.
          this.damagePopup(defender.x, defender.y - 44, 'MISS!', '#6d7689');
          this.tweens.add({ targets: defender, x: defender.x + dir * 22, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
        }
      },
      onComplete: () => {
        attacker.x = homeX;
        this.time.delayedCall(420, onDone);
      },
    });
  }

  /** Radiating spark burst at the point of impact. */
  private impactBurst(x: number, y: number): void {
    const flash = this.add.circle(x, y, 6, 0xffffff).setDepth(50);
    this.tweens.add({
      targets: flash,
      scale: 4,
      alpha: 0,
      duration: 220,
      onComplete: () => flash.destroy(),
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spark = this.add.rectangle(x, y, 5, 5, 0xf8d048).setDepth(50);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 34,
        y: y + Math.sin(angle) * 34,
        alpha: 0,
        scale: 0.4,
        duration: 280,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Floating combat number ("-14" / "MISS!"). */
  private damagePopup(x: number, y: number, label: string, color: string): void {
    const text = this.add
      .text(x, y, label, {
        fontFamily: HEAD,
        fontSize: '13px',
        color,
        stroke: '#f8f8f0',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 750,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  /** Defeated creature sinks and fades. */
  private animateFaint(sprite: Phaser.GameObjects.Image, onDone: () => void): void {
    this.tweens.add({
      targets: sprite,
      y: sprite.y + 26,
      alpha: 0,
      angle: sprite === this.playerSprite ? -14 : 14,
      duration: 480,
      ease: 'Quad.easeIn',
      onComplete: () => this.time.delayedCall(250, onDone),
    });
  }

  // ----------------------------------------------------------------- end

  private endBattle(won: boolean): void {
    this.phase = 'end';
    chiptune.stopMusic();
    chiptune.playSfx(won ? 'victory' : 'defeat');

    // Sync engine HP back to the saved creature before rewards/healing.
    this.playerCreature.currentHp = this.engine.player.currentHp;

    const rewards = battleService.finishBattle(this.payload.battleType, won, {
      trainerId: this.payload.trainerId,
      badgeId: this.payload.badgeId,
    });

    if (won) this.enemySprite.setVisible(false);
    else this.playerSprite.setVisible(false);

    // Build short pages so text never overflows the panel.
    this.endPages = [];
    if (won) {
      const page1: string[] = [`You won! +${rewards.coins} coins, +${rewards.xp} XP.`];
      if (rewards.levelsGained > 0) {
        chiptune.playSfx('levelup');
        page1.push(`${this.engine.player.name} grew to level ${rewards.newCreatureLevel}!`);
      }
      if (this.payload.battleType === 'gym' && this.payload.badgeId) {
        page1.push('You earned the gym badge!');
      }
      this.endPages.push(page1.join('\n'));

      if (rewards.unlock?.unlocked && rewards.unlock.newLevel) {
        this.endPages.push(`★ New power unlocked: ${rewards.unlock.newLevel.levelName}! ★`);
      } else if (this.payload.battleType === 'gym' && rewards.unlock && !rewards.unlock.unlocked) {
        this.endPages.push(
          'You beat the gym leader, but your creature wants a little more practice before learning the next power. Try a few more battles in this area!',
        );
      }
      this.endPages.push(rewards.encouragement);
    } else {
      this.endPages.push(
        `${this.engine.player.name} fainted... but that was great practice!\nYour learning progress is safe — it never goes backward.`,
      );
      this.endPages.push(rewards.encouragement);
    }

    this.endPageIndex = 0;
    this.renderEndPage();
    this.progressText.setVisible(false);

    if (!won) {
      // Send the player home to rest, fully healed (handled in finishBattle).
      const save = saveService.requireData();
      save.player.mapKey = worldConfig.spawn.mapKey;
      save.player.tileX = worldConfig.spawn.tileX;
      save.player.tileY = worldConfig.spawn.tileY;
      save.player.facing = worldConfig.spawn.facing;
      saveService.persist();
    }
  }

  private endPages: string[] = [];
  private endPageIndex = 0;

  private renderEndPage(): void {
    this.messageText.setText(`${this.endPages[this.endPageIndex]}\n\n▶ ENTER`);
  }

  private advanceEndPage(): void {
    this.endPageIndex += 1;
    if (this.endPageIndex >= this.endPages.length) {
      this.exitBattle();
    } else {
      this.renderEndPage();
    }
  }

  private exitBattle(): void {
    this.scene.start('OverworldScene');
  }
}

function digitFrom(event: KeyboardEvent): string | null {
  if (event.code.startsWith('Digit')) return event.code.slice(5);
  if (event.code.startsWith('Numpad') && /^Numpad[0-9]$/.test(event.code)) return event.code.slice(6);
  return null;
}
