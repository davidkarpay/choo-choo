/**
 * Audio manager using Web Audio API.
 * Generates placeholder tones since audio files don't exist yet.
 * Provides the AudioContext-based tone generator for whistles, chugging,
 * ambient loops, and Phase 4 interior/station sounds.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Play a simple tone as a placeholder whistle. */
export function playWhistle(
  type: 'deep' | 'high' | 'horn' | 'scratchy' | 'mellow' | 'sharp',
  duration = 1.5
): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const freqMap: Record<string, number> = {
    deep: 220,
    high: 880,
    horn: 180,
    scratchy: 440,
    mellow: 330,
    sharp: 660,
  };

  const waveMap: Record<string, OscillatorType> = {
    deep: 'sawtooth',
    high: 'sine',
    horn: 'square',
    scratchy: 'sawtooth',
    mellow: 'triangle',
    sharp: 'square',
  };

  osc.type = waveMap[type] ?? 'sine';
  osc.frequency.setValueAtTime(freqMap[type] ?? 440, ctx.currentTime);

  // Add slight vibrato for warmth
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 5;
  lfoGain.gain.value = type === 'scratchy' ? 15 : 5;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start();

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.15, ctx.currentTime + duration - 0.2);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** Play a single chug puff sound. */
export function playChug(pitch = 1.0): void {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // White noise burst shaped as a puff
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const envelope = Math.sin(t * Math.PI);
    data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = pitch;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800 * pitch;

  const gain = ctx.createGain();
  gain.gain.value = 0.1;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** Play a UI click sound. */
export function playUIClick(): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.06);
}

/** Play a mechanical gear grinding sound (for turntable). */
export function playGearGrind(duration = 1.0): void {
  const ctx = getAudioContext();
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const envelope = Math.sin(t * Math.PI);
    // Low rumble + metallic clicks
    const rumble = Math.sin(i / (ctx.sampleRate / 60)) * 0.3;
    const clicks = Math.sin(i / (ctx.sampleRate / 400)) > 0.9 ? 0.5 : 0;
    data[i] = (rumble + clicks + (Math.random() * 0.1 - 0.05)) * envelope * 0.15;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.12;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** Play a bell ring. */
export function playBell(): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
}

/** Play a station bell — two cheerful dings when a train arrives. */
export function playStationBell(): void {
  const ctx = getAudioContext();

  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const offset = i * 0.25;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime + offset);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + offset + 0.4);
    gain.gain.setValueAtTime(0, ctx.currentTime + offset);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.5);
  }
}

/** Play a cheerful celebration chime — for cargo delivery milestones. */
export function playCelebrationChime(): void {
  const ctx = getAudioContext();
  const notes = [523, 659, 784]; // C5, E5, G5 — major chord arpeggio

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const offset = i * 0.12;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
    gain.gain.setValueAtTime(0, ctx.currentTime + offset);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.6);
  });
}

// ===== Phase 4: Interior and Station Ambient Sounds =====

/**
 * Play a rhythmic rail joint click — the "clickety-clack" heard inside trains.
 * Pitch and interval vary with speed.
 */
export function playWheelClack(speed = 1.0): void {
  const ctx = getAudioContext();
  const bufferSize = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const envelope = Math.exp(-t * 20);
    // Sharp metallic click
    const click = Math.sin(i / (ctx.sampleRate / (600 * speed))) * 0.5;
    const noise = (Math.random() * 2 - 1) * 0.3;
    data[i] = (click + noise) * envelope * 0.08;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = 0.8 + speed * 0.4;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200 * speed;
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.value = 0.06;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/**
 * Start a continuous filtered white noise loop simulating wind.
 * Returns a stop function to cleanly end the loop.
 */
export function startWindLoop(): { stop: () => void } {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.value = 0.03;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(() => { try { source.stop(); } catch { /* already stopped */ } }, 600);
    },
  };
}

/**
 * Start a low-frequency murmur loop simulating crowd/conversation ambience.
 * Returns a stop function.
 */
export function startMurmurLoop(): { stop: () => void } {
  const ctx = getAudioContext();
  const oscillators: OscillatorNode[] = [];
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.02;
  masterGain.connect(ctx.destination);

  // Several low-frequency sine waves at slightly different frequencies
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 100 + Math.random() * 80;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.3 + Math.random() * 0.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.5;

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    oscillators.push(osc);
  }

  return {
    stop: () => {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(() => {
        for (const osc of oscillators) {
          try { osc.stop(); } catch { /* already stopped */ }
        }
      }, 600);
    },
  };
}

/** Play a single bird chirp — ascending sine sweep. */
export function playBirdChirp(): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.12);
  osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

/** Play a single clock tick — short percussive click. */
export function playClockTick(): void {
  const ctx = getAudioContext();
  const bufferSize = Math.floor(ctx.sampleRate * 0.015);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    data[i] = Math.sin(i / (ctx.sampleRate / 3000)) * Math.exp(-t * 30) * 0.2;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.05;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** Play a heavy clunk sound — for loading cargo. */
export function playLoadingSound(): void {
  const ctx = getAudioContext();
  const bufferSize = Math.floor(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    // Sharp impact with fast decay
    const envelope = Math.exp(-t * 12);
    const rumble = Math.sin(i / (ctx.sampleRate / 80)) * 0.6;
    const click = Math.sin(i / (ctx.sampleRate / 300)) * 0.4;
    data[i] = (rumble + click) * envelope * 0.12;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.1;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
