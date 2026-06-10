/**
 * Tiny WebAudio chiptune engine. All melodies are original compositions
 * written as note sequences — no audio files needed. Square-wave lead +
 * triangle bass, GBA style.
 */

type TrackName = 'title' | 'overworld' | 'gym' | 'battle';

const NOTE_FREQ: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5,
};

/** A pattern is [note-or-rest, sixteenth-note-duration] pairs. */
type Pattern = Array<[string | null, number]>;

interface Song {
  bpm: number;
  lead: Pattern;
  bass: Pattern;
}

// Original loops composed for this project.
const SONGS: Record<TrackName, Song> = {
  title: {
    bpm: 112,
    lead: [
      ['C5', 4], ['E5', 4], ['G5', 4], ['E5', 2], ['D5', 2],
      ['C5', 4], ['D5', 4], ['E5', 6], [null, 2],
      ['F5', 4], ['E5', 4], ['D5', 4], ['C5', 2], ['D5', 2],
      ['E5', 4], ['D5', 4], ['C5', 6], [null, 2],
    ],
    bass: [
      ['C3', 8], ['G3', 8], ['A3', 8], ['G3', 8],
      ['F3', 8], ['C3', 8], ['G3', 8], ['C3', 8],
    ],
  },
  overworld: {
    bpm: 124,
    lead: [
      ['E5', 2], ['G5', 2], ['A5', 4], ['G5', 2], ['E5', 2], ['D5', 4],
      ['C5', 2], ['D5', 2], ['E5', 4], ['G5', 2], ['E5', 2], ['D5', 4],
      ['E5', 2], ['G5', 2], ['A5', 4], ['B5', 2], ['A5', 2], ['G5', 4],
      ['E5', 2], ['D5', 2], ['C5', 8], [null, 4],
    ],
    bass: [
      ['C3', 4], ['G3', 4], ['A3', 4], ['E3', 4],
      ['F3', 4], ['C3', 4], ['G3', 4], ['G3', 4],
      ['C3', 4], ['G3', 4], ['A3', 4], ['E3', 4],
      ['F3', 4], ['G3', 4], ['C3', 8],
    ],
  },
  gym: {
    bpm: 108,
    lead: [
      ['G4', 4], ['C5', 4], ['E5', 4], ['G5', 4],
      ['F5', 2], ['E5', 2], ['D5', 4], ['G4', 8],
      ['A4', 4], ['D5', 4], ['F5', 4], ['A5', 4],
      ['G5', 2], ['F5', 2], ['E5', 4], ['C5', 8],
    ],
    bass: [
      ['C3', 8], ['E3', 8], ['G3', 8], ['G3', 8],
      ['D3', 8], ['F3', 8], ['C3', 8], ['C3', 8],
    ],
  },
  battle: {
    bpm: 150,
    lead: [
      ['A4', 2], ['A4', 2], ['C5', 2], ['A4', 2], ['E5', 4], ['D5', 2], ['C5', 2],
      ['B4', 2], ['B4', 2], ['D5', 2], ['B4', 2], ['F5', 4], ['E5', 2], ['D5', 2],
      ['C5', 2], ['E5', 2], ['A5', 2], ['G5', 2], ['E5', 2], ['C5', 2], ['D5', 4],
      ['E5', 2], ['D5', 2], ['C5', 2], ['B4', 2], ['A4', 8],
    ],
    bass: [
      ['A3', 4], ['A3', 4], ['G3', 4], ['G3', 4],
      ['F3', 4], ['F3', 4], ['E3', 4], ['E3', 4],
      ['A3', 4], ['A3', 4], ['G3', 4], ['G3', 4],
      ['F3', 4], ['E3', 4], ['A3', 8],
    ],
  },
};

type SfxName = 'correct' | 'fast' | 'wrong' | 'timeout' | 'encounter' | 'select' | 'victory' | 'defeat' | 'levelup';

class ChiptunePlayer {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private currentTrack: TrackName | null = null;
  private loopTimer: number | null = null;
  private muted = false;

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.musicGain) this.musicGain.gain.value = this.muted ? 0 : 0.12;
    return this.muted;
  }

  playMusic(track: TrackName): void {
    if (!this.ctx || this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    this.scheduleLoop(track);
  }

  stopMusic(): void {
    if (this.loopTimer !== null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.currentTrack = null;
  }

  private scheduleLoop(track: TrackName): void {
    if (!this.ctx || !this.musicGain) return;
    const song = SONGS[track];
    const sixteenth = 60 / song.bpm / 4;
    const start = this.ctx.currentTime + 0.05;

    const scheduleVoice = (pattern: Pattern, type: OscillatorType, gainMul: number): number => {
      let t = start;
      for (const [note, dur] of pattern) {
        const len = dur * sixteenth;
        if (note) this.tone(NOTE_FREQ[note], t, len * 0.9, type, gainMul, this.musicGain!);
        t += len;
      }
      return t - start;
    };

    const leadLen = scheduleVoice(song.lead, 'square', 0.5);
    const bassLen = scheduleVoice(song.bass, 'triangle', 0.8);
    const loopLen = Math.max(leadLen, bassLen);

    this.loopTimer = window.setTimeout(() => {
      if (this.currentTrack === track) this.scheduleLoop(track);
    }, loopLen * 1000 - 30);
  }

  private tone(
    freq: number,
    when: number,
    dur: number,
    type: OscillatorType,
    gainMul: number,
    dest: AudioNode,
  ): void {
    if (!this.ctx || !freq) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(gainMul, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  playSfx(name: SfxName): void {
    if (!this.ctx || this.muted) return;
    const sfxGain = this.ctx.createGain();
    sfxGain.gain.value = 0.15;
    sfxGain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    const seq = (notes: Array<[number, number]>, type: OscillatorType = 'square') => {
      let t = now;
      for (const [freq, dur] of notes) {
        this.tone(freq, t, dur, type, 0.8, sfxGain);
        t += dur;
      }
    };
    switch (name) {
      case 'correct':
        seq([[523, 0.08], [659, 0.12]]);
        break;
      case 'fast':
        seq([[523, 0.06], [659, 0.06], [784, 0.06], [1047, 0.14]]);
        break;
      case 'wrong':
        seq([[220, 0.12], [185, 0.2]], 'sawtooth');
        break;
      case 'timeout':
        seq([[196, 0.25]], 'sawtooth');
        break;
      case 'encounter':
        seq([[440, 0.05], [494, 0.05], [523, 0.05], [587, 0.05], [659, 0.05], [740, 0.05], [831, 0.12]]);
        break;
      case 'select':
        seq([[660, 0.06]]);
        break;
      case 'victory':
        seq([[523, 0.1], [523, 0.08], [523, 0.08], [659, 0.1], [784, 0.1], [1047, 0.3]]);
        break;
      case 'defeat':
        seq([[392, 0.15], [330, 0.15], [262, 0.3]], 'triangle');
        break;
      case 'levelup':
        seq([[659, 0.08], [784, 0.08], [880, 0.08], [1047, 0.2]]);
        break;
    }
  }
}

export const chiptune = new ChiptunePlayer();
