/**
 * Audio manager wrapping Howler.js.
 * Phase 1 uses generated placeholder tones since audio files don't exist yet.
 * Provides the AudioContext-based tone generator for whistles, chugging, etc.
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
