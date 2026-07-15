/**
 * Tiny WebAudio chiptune engine. All melodies are original compositions
 * written as note sequences — no audio files needed. Square-wave lead +
 * triangle bass, GBA style.
 */

type TrackName = 'title' | 'overworld' | 'gym' | 'battle' | 'marsh' | 'house' | 'coast';

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

/** One song section (verse/bridge/chorus). Lead and bass must span the same sixteenth count. */
interface Section {
  lead: Pattern;
  bass: Pattern;
}

const sectionSixteenths = (p: Pattern): number => p.reduce((total, [, dur]) => total + dur, 0);

/** Concatenate sections into a full song loop, warning on authoring mistakes. */
function compose(name: string, bpm: number, ...sections: Section[]): Song {
  for (const section of sections) {
    if (sectionSixteenths(section.lead) !== sectionSixteenths(section.bass)) {
      console.warn(`[chiptune] ${name}: lead/bass section lengths differ`);
    }
    for (const [note] of [...section.lead, ...section.bass]) {
      if (note && !(note in NOTE_FREQ)) console.warn(`[chiptune] ${name}: unknown note ${note}`);
    }
  }
  return {
    bpm,
    lead: sections.flatMap((s) => s.lead),
    bass: sections.flatMap((s) => s.bass),
  };
}

// Original songs composed for this project. Each is verse-verse-bridge-chorus.

const TITLE_VERSE: Section = {
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
};

const TITLE_BRIDGE: Section = {
  // Gentler, drifts toward the relative minor.
  lead: [
    ['A4', 4], ['C5', 4], ['E5', 4], ['D5', 2], ['C5', 2],
    ['B4', 4], ['G4', 4], ['A4', 6], [null, 2],
    ['F4', 4], ['A4', 4], ['C5', 4], ['B4', 2], ['A4', 2],
    ['G4', 4], ['A4', 4], ['B4', 6], [null, 2],
  ],
  bass: [
    ['A3', 8], ['E3', 8], ['F3', 8], ['C3', 8],
    ['D3', 8], ['A3', 8], ['G3', 8], ['G3', 8],
  ],
};

const TITLE_CHORUS: Section = {
  // Triumphant restatement up high, resolving home.
  lead: [
    ['G5', 4], ['E5', 2], ['G5', 2], ['C6', 4], ['B5', 2], ['A5', 2],
    ['G5', 4], ['A5', 4], ['G5', 6], [null, 2],
    ['F5', 4], ['A5', 4], ['G5', 4], ['E5', 2], ['D5', 2],
    ['C5', 4], ['D5', 4], ['C5', 6], [null, 2],
  ],
  bass: [
    ['C3', 8], ['E3', 8], ['F3', 8], ['G3', 8],
    ['F3', 8], ['G3', 8], ['C3', 8], ['G3', 8],
  ],
};

const OVERWORLD_VERSE: Section = {
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
};

const OVERWORLD_BRIDGE: Section = {
  // Wandering minor detour before heading home.
  lead: [
    ['A4', 2], ['C5', 2], ['E5', 4], ['D5', 2], ['C5', 2], ['B4', 4],
    ['A4', 2], ['B4', 2], ['C5', 4], ['E5', 2], ['D5', 2], ['C5', 4],
    ['F5', 2], ['E5', 2], ['D5', 4], ['C5', 2], ['B4', 2], ['A4', 4],
    ['G4', 2], ['A4', 2], ['B4', 8], [null, 4],
  ],
  bass: [
    ['A3', 4], ['E3', 4], ['A3', 4], ['E3', 4],
    ['F3', 4], ['C3', 4], ['G3', 4], ['G3', 4],
    ['D3', 4], ['A3', 4], ['F3', 4], ['C3', 4],
    ['G3', 4], ['G3', 4], ['G3', 8],
  ],
};

const OVERWORLD_CHORUS: Section = {
  // Brightest statement of the theme, up the octave.
  lead: [
    ['C6', 2], ['B5', 2], ['A5', 4], ['G5', 2], ['E5', 2], ['G5', 4],
    ['A5', 2], ['G5', 2], ['E5', 4], ['D5', 2], ['E5', 2], ['G5', 4],
    ['C6', 2], ['B5', 2], ['A5', 4], ['G5', 2], ['A5', 2], ['B5', 4],
    ['G5', 2], ['E5', 2], ['C5', 8], [null, 4],
  ],
  bass: [
    ['C3', 4], ['G3', 4], ['A3', 4], ['E3', 4],
    ['F3', 4], ['C3', 4], ['G3', 4], ['G3', 4],
    ['F3', 4], ['G3', 4], ['A3', 4], ['E3', 4],
    ['F3', 4], ['G3', 4], ['C3', 8],
  ],
};

const GYM_VERSE: Section = {
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
};

const GYM_BRIDGE: Section = {
  // Tenser minor turn — the leader sizes you up.
  lead: [
    ['D5', 4], ['F5', 4], ['A5', 4], ['G5', 2], ['F5', 2],
    ['E5', 4], ['C5', 4], ['D5', 6], [null, 2],
    ['B4', 4], ['D5', 4], ['G5', 4], ['F5', 2], ['E5', 2],
    ['D5', 4], ['B4', 4], ['G4', 6], [null, 2],
  ],
  bass: [
    ['D3', 8], ['F3', 8], ['A3', 8], ['F3', 8],
    ['G3', 8], ['B3', 8], ['G3', 8], ['G3', 8],
  ],
};

const GYM_CHORUS: Section = {
  // Full-power march, climbing to the top and planting the flag.
  lead: [
    ['C5', 4], ['E5', 4], ['G5', 4], ['C6', 4],
    ['B5', 2], ['A5', 2], ['G5', 4], ['E5', 8],
    ['F5', 4], ['A5', 4], ['G5', 4], ['E5', 4],
    ['D5', 2], ['E5', 2], ['C5', 4], ['C5', 8],
  ],
  bass: [
    ['C3', 8], ['G3', 8], ['C3', 8], ['G3', 8],
    ['F3', 8], ['G3', 8], ['C3', 8], ['C3', 8],
  ],
};

// Slow, minor, a little mysterious — different ecosystem, different mood.
const MARSH_VERSE: Section = {
  lead: [
    ['D4', 4], ['F4', 4], ['A4', 6], [null, 2],
    ['G4', 4], ['F4', 4], ['E4', 6], [null, 2],
    ['D4', 4], ['F4', 4], ['C5', 4], ['A4', 4],
    ['G4', 4], ['E4', 4], ['D4', 6], [null, 2],
  ],
  bass: [
    ['D3', 8], ['A3', 8], ['C3', 8], ['G3', 8],
    ['D3', 8], ['F3', 8], ['A3', 8], ['D3', 8],
  ],
};

const MARSH_BRIDGE: Section = {
  // Sinks lower into the fog.
  lead: [
    ['A4', 4], ['G4', 4], ['E4', 6], [null, 2],
    ['F4', 4], ['E4', 4], ['D4', 6], [null, 2],
    ['C4', 4], ['E4', 4], ['G4', 4], ['F4', 4],
    ['E4', 4], ['C4', 4], ['A3', 6], [null, 2],
  ],
  bass: [
    ['A3', 8], ['E3', 8], ['F3', 8], ['C3', 8],
    ['A3', 8], ['G3', 8], ['E3', 8], ['A3', 8],
  ],
};

const MARSH_CHORUS: Section = {
  // The mist lifts for a moment before settling back on D.
  lead: [
    ['D5', 4], ['C5', 4], ['A4', 6], [null, 2],
    ['B4', 4], ['A4', 4], ['G4', 6], [null, 2],
    ['F4', 4], ['A4', 4], ['D5', 4], ['C5', 4],
    ['A4', 4], ['F4', 4], ['D4', 6], [null, 2],
  ],
  bass: [
    ['D3', 8], ['F3', 8], ['G3', 8], ['B3', 8],
    ['D3', 8], ['A3', 8], ['D3', 8], ['D3', 8],
  ],
};

// Cozy little waltz for home sweet home.
const HOUSE_VERSE: Section = {
  lead: [
    ['G4', 3], ['B4', 3], ['D5', 6], ['C5', 3], ['A4', 3], ['G4', 6],
    ['E4', 3], ['G4', 3], ['C5', 6], ['B4', 3], ['G4', 3], ['G4', 6],
  ],
  bass: [
    ['G3', 6], ['D3', 6], ['C3', 6], ['D3', 6],
    ['C3', 6], ['E3', 6], ['G3', 6], ['G3', 6],
  ],
};

const HOUSE_BRIDGE: Section = {
  // A daydream out the window.
  lead: [
    ['C5', 3], ['E5', 3], ['G5', 6], ['F5', 3], ['D5', 3], ['B4', 6],
    ['A4', 3], ['C5', 3], ['E5', 6], ['D5', 3], ['B4', 3], ['A4', 6],
  ],
  bass: [
    ['C3', 6], ['E3', 6], ['G3', 6], ['G3', 6],
    ['A3', 6], ['E3', 6], ['D3', 6], ['D3', 6],
  ],
};

const HOUSE_CHORUS: Section = {
  // Warmest turn of the tune, settling back into the armchair.
  lead: [
    ['D5', 3], ['G5', 3], ['B5', 6], ['A5', 3], ['G5', 3], ['D5', 6],
    ['E5', 3], ['C5', 3], ['A4', 6], ['B4', 3], ['A4', 3], ['G4', 6],
  ],
  bass: [
    ['G3', 6], ['B3', 6], ['C3', 6], ['E3', 6],
    ['C3', 6], ['D3', 6], ['G3', 6], ['G3', 6],
  ],
};

const BATTLE_VERSE: Section = {
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
};

const BATTLE_BRIDGE: Section = {
  // Climbing tension — both sides dig in.
  lead: [
    ['D5', 2], ['D5', 2], ['F5', 2], ['D5', 2], ['A5', 4], ['G5', 2], ['F5', 2],
    ['E5', 2], ['E5', 2], ['G5', 2], ['E5', 2], ['B5', 4], ['A5', 2], ['G5', 2],
    ['F5', 2], ['A5', 2], ['G5', 2], ['B5', 2], ['A5', 2], ['C6', 2], ['B5', 4],
    ['A5', 2], ['G5', 2], ['F5', 2], ['E5', 2], ['E5', 8],
  ],
  bass: [
    ['D3', 4], ['D3', 4], ['A3', 4], ['A3', 4],
    ['E3', 4], ['E3', 4], ['B3', 4], ['B3', 4],
    ['F3', 4], ['F3', 4], ['G3', 4], ['G3', 4],
    ['E3', 4], ['E3', 4], ['E3', 8],
  ],
};

const BATTLE_CHORUS: Section = {
  // The showdown peak, hammering back down to A.
  lead: [
    ['A5', 2], ['A5', 2], ['C6', 2], ['A5', 2], ['E5', 4], ['G5', 2], ['A5', 2],
    ['F5', 2], ['F5', 2], ['A5', 2], ['F5', 2], ['D5', 4], ['E5', 2], ['F5', 2],
    ['E5', 2], ['G5', 2], ['C6', 2], ['B5', 2], ['A5', 2], ['G5', 2], ['E5', 4],
    ['D5', 2], ['C5', 2], ['B4', 2], ['C5', 2], ['A4', 8],
  ],
  bass: [
    ['A3', 4], ['E3', 4], ['A3', 4], ['E3', 4],
    ['D3', 4], ['A3', 4], ['D3', 4], ['A3', 4],
    ['C3', 4], ['G3', 4], ['E3', 4], ['E3', 4],
    ['D3', 4], ['E3', 4], ['A3', 8],
  ],
};

// Breezy and sunny for the beach — laid-back major with rolling bass tides.
const COAST_VERSE: Section = {
  lead: [
    ['G4', 2], ['C5', 2], ['E5', 4], ['D5', 2], ['C5', 2], ['D5', 4],
    ['E5', 2], ['G5', 2], ['E5', 4], ['C5', 2], ['D5', 2], ['E5', 4],
    ['F5', 2], ['E5', 2], ['D5', 4], ['E5', 2], ['D5', 2], ['C5', 4],
    ['D5', 2], ['E5', 2], ['G4', 8], [null, 4],
  ],
  bass: [
    ['C3', 4], ['G3', 4], ['F3', 4], ['G3', 4],
    ['C3', 4], ['G3', 4], ['A3', 4], ['G3', 4],
    ['F3', 4], ['G3', 4], ['C3', 4], ['A3', 4],
    ['F3', 4], ['G3', 4], ['C3', 8],
  ],
};

const COAST_BRIDGE: Section = {
  // The tide pulls out — a wistful minor drift.
  lead: [
    ['A4', 4], ['C5', 2], ['E5', 2], ['D5', 4], ['C5', 4],
    ['B4', 4], ['D5', 2], ['G5', 2], ['F5', 4], ['E5', 4],
    ['A4', 4], ['C5', 2], ['E5', 2], ['A5', 4], ['G5', 4],
    ['E5', 2], ['D5', 2], ['E5', 8], [null, 4],
  ],
  bass: [
    ['A3', 8], ['E3', 8],
    ['G3', 8], ['B3', 8],
    ['A3', 8], ['F3', 8],
    ['G3', 8], ['G3', 8],
  ],
};

const COAST_CHORUS: Section = {
  // Full sunshine — the theme crests like a wave and rolls home.
  lead: [
    ['C6', 4], ['B5', 2], ['A5', 2], ['G5', 4], ['E5', 4],
    ['A5', 4], ['G5', 2], ['E5', 2], ['G5', 4], ['C5', 4],
    ['F5', 2], ['G5', 2], ['A5', 4], ['G5', 2], ['E5', 2], ['D5', 4],
    ['E5', 2], ['D5', 2], ['C5', 8], [null, 4],
  ],
  bass: [
    ['C3', 4], ['E3', 4], ['F3', 4], ['G3', 4],
    ['A3', 4], ['E3', 4], ['F3', 4], ['C3', 4],
    ['D3', 4], ['A3', 4], ['F3', 4], ['G3', 4],
    ['G3', 4], ['G3', 4], ['C3', 8],
  ],
};

const SONGS: Record<TrackName, Song> = {
  title: compose('title', 112, TITLE_VERSE, TITLE_VERSE, TITLE_BRIDGE, TITLE_CHORUS),
  overworld: compose('overworld', 124, OVERWORLD_VERSE, OVERWORLD_VERSE, OVERWORLD_BRIDGE, OVERWORLD_CHORUS),
  gym: compose('gym', 108, GYM_VERSE, GYM_VERSE, GYM_BRIDGE, GYM_CHORUS),
  marsh: compose('marsh', 88, MARSH_VERSE, MARSH_VERSE, MARSH_BRIDGE, MARSH_CHORUS),
  house: compose('house', 100, HOUSE_VERSE, HOUSE_VERSE, HOUSE_BRIDGE, HOUSE_CHORUS),
  battle: compose('battle', 150, BATTLE_VERSE, BATTLE_VERSE, BATTLE_BRIDGE, BATTLE_CHORUS),
  coast: compose('coast', 126, COAST_VERSE, COAST_VERSE, COAST_BRIDGE, COAST_CHORUS),
};

type SfxName =
  | 'correct' | 'fast' | 'wrong' | 'timeout' | 'encounter' | 'select'
  | 'victory' | 'defeat' | 'levelup' | 'trophy' | 'evolve';

class ChiptunePlayer {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  // Per-track bus: every scheduled note routes through this so stopMusic()
  // can silence notes already queued on the AudioContext timeline.
  private trackBus: GainNode | null = null;
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
    this.trackBus = this.ctx.createGain();
    this.trackBus.connect(this.musicGain!);
    this.currentTrack = track;
    this.scheduleLoop(track);
  }

  stopMusic(): void {
    if (this.loopTimer !== null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.trackBus && this.ctx) {
      // Short fade before disconnect — a hard cut mid-note clicks audibly.
      const bus = this.trackBus;
      const now = this.ctx.currentTime;
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0.0001, now + 0.05);
      window.setTimeout(() => bus.disconnect(), 80);
      this.trackBus = null;
    }
    this.currentTrack = null;
  }

  private scheduleLoop(track: TrackName): void {
    if (!this.ctx || !this.trackBus) return;
    const song = SONGS[track];
    const sixteenth = 60 / song.bpm / 4;
    const start = this.ctx.currentTime + 0.05;

    const scheduleVoice = (pattern: Pattern, type: OscillatorType, gainMul: number): number => {
      let t = start;
      for (const [note, dur] of pattern) {
        const len = dur * sixteenth;
        if (note) this.tone(NOTE_FREQ[note], t, len * 0.9, type, gainMul, this.trackBus!);
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
      case 'trophy':
        // Rising fanfare with a triumphant final hold.
        seq([[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.12], [784, 0.08], [1047, 0.3]]);
        break;
      case 'evolve':
        // Shimmering ascending run — something is transforming...
        seq([[440, 0.07], [523, 0.07], [659, 0.07], [784, 0.07], [880, 0.07], [1047, 0.1], [880, 0.07], [1047, 0.25]], 'triangle');
        break;
    }
  }
}

export const chiptune = new ChiptunePlayer();
