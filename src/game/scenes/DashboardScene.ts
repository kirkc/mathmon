import Phaser from 'phaser';
import { LEVELS } from '../../config/progressionConfig';
import { worldConfig } from '../../config/worldConfig';
import { CREATURE_SPECIES } from '../data/creatures';
import { progressionService, saveService } from '../services';
import { FONT_BODY, FONT_HEADING } from '../ui/fonts';

const MONO = FONT_BODY;

/**
 * Parent dashboard: learning stats per tier, current focus, and overall
 * battle record. Read-only — kids can't break anything here.
 */
export class DashboardScene extends Phaser.Scene {
  private from = 'TitleScene';

  constructor() {
    super('DashboardScene');
  }

  init(data: { from?: string }): void {
    this.from = data.from ?? 'TitleScene';
  }

  create(): void {
    const { gameWidth: W, gameHeight: H } = worldConfig;
    this.add.rectangle(0, 0, W, H, 0x1a2a5c).setOrigin(0);
    this.add
      .text(W / 2, 12, 'PARENT DASHBOARD', { fontFamily: FONT_HEADING, fontSize: '13px', color: '#f8d048' })
      .setOrigin(0.5, 0);

    const save = saveService.getData();
    if (!save) {
      this.add
        .text(W / 2, H / 2, 'No save data yet.\nStart a New Game first!', {
          fontFamily: MONO, fontSize: '19px', color: '#ffffff', align: 'center',
        })
        .setOrigin(0.5);
      this.addReturnHint();
      return;
    }

    const level = progressionService.getCurrentLevel();
    const stats = progressionService.getLevelStats(level.levelNumber);
    const avgMs = stats.attemptedCount > 0 ? stats.totalResponseMs / stats.attemptedCount : 0;
    const accuracy = stats.attemptedCount > 0 ? (stats.correctCount / stats.attemptedCount) * 100 : 0;
    const lead = save.party[0];
    const species = lead ? CREATURE_SPECIES[lead.speciesId] : null;

    const leftCol = [
      `Student: ${save.player.name} · ${species ? `${species.name} Lv.${lead.level}` : 'no creature'}`,
      `CURRENT FOCUS: ${level.levelName}`,
      ``,
      `Questions attempted:  ${stats.attemptedCount}`,
      `Accuracy:             ${accuracy.toFixed(0)}%`,
      `Avg response time:    ${(avgMs / 1000).toFixed(1)}s`,
      `Fast correct (<3s):   ${stats.fastCorrectCount}`,
      `Medium correct:       ${stats.mediumCorrectCount}`,
      `Slow correct:         ${stats.slowCorrectCount}`,
      `Incorrect:            ${stats.incorrectCount}`,
      `Timeouts:             ${stats.timeoutCount}`,
      ``,
      `Fluency score:        ${(progressionService.getFluencyScore(level.levelNumber) * 100).toFixed(0)}%`,
      `Mastery score:        ${progressionService.getMasteryScore(level.levelNumber)}/100`,
      `Battles: ${stats.battleWins}W/${stats.battleLosses}L tier · ${save.totals.battlesWon}W/${save.totals.battlesLost}L total`,
      `Badges: ${save.badges.length > 0 ? save.badges.join(', ') : 'none yet'}`,
    ].join('\n');

    this.add.text(16, 36, leftCol, { fontFamily: MONO, fontSize: '15px', color: '#ffffff', lineSpacing: 0 });

    // Right column: learning ladder with unlock status.
    const ladderLines = LEVELS.map((l) => {
      const unlocked = l.levelNumber <= save.progression.currentLevelNumber;
      const marker = l.levelNumber === save.progression.currentLevelNumber ? '▶' : unlocked ? '✓' : '·';
      return `${marker} ${l.levelName}`;
    });
    this.add.text(W - 180, 36, ['LEARNING LADDER', '', ...ladderLines].join('\n'), {
      fontFamily: MONO,
      fontSize: '14px',
      color: '#c0d0f8',
      lineSpacing: 0,
    });

    // What's left before the next unlock.
    const check = previewUnlockReasons();
    if (check.length > 0) {
      this.add.text(16, H - 38, `Next unlock needs: ${check.join(' · ')}`, {
        fontFamily: MONO, fontSize: '14px', color: '#f8d048', wordWrap: { width: W - 32 },
      });
    }

    this.addReturnHint();
  }

  private addReturnHint(): void {
    const { gameWidth: W, gameHeight: H } = worldConfig;
    this.add
      .text(W / 2, H - 13, 'ESC or ENTER to return', { fontFamily: MONO, fontSize: '14px', color: '#8a93a6' })
      .setOrigin(0.5);
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(this.from));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(this.from));
  }
}

/** Non-mutating description of what stands between the student and the next tier. */
function previewUnlockReasons(): string[] {
  const save = saveService.getData();
  if (!save) return [];
  const levelNumber = save.progression.currentLevelNumber;
  const stats = progressionService.getLevelStats(levelNumber);
  const reasons: string[] = [];
  if (stats.attemptedCount < 30) reasons.push(`${30 - stats.attemptedCount} more questions`);
  if (progressionService.getRollingAccuracy(levelNumber) < 0.85) reasons.push('85% accuracy');
  if (progressionService.getFluencyScore(levelNumber) < 0.7) reasons.push('faster answers');
  if (progressionService.getTimeoutRate(levelNumber) > 0.1) reasons.push('fewer timeouts');
  if (stats.battleWins < 3) reasons.push(`${3 - stats.battleWins} more battle wins`);
  return reasons;
}
