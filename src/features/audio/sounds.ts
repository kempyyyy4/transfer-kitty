"use client";

import { isSoundOn } from "./sound-setting";

/**
 * Chiptune effects, made on the spot with the Web Audio API: no sound files to load or
 * license. Each plays only when sound is switched on.
 */

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!isSoundOn() || typeof window === "undefined") return null;
  context ??= new AudioContext();
  // Browsers start audio paused until the page has been interacted with.
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(
  ctx: AudioContext,
  type: OscillatorType,
  frequency: number,
  start: number,
  length: number,
  volume: number,
): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length);
  return osc;
}

function noise(ctx: AudioContext, start: number, length: number): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.start(start);
  return source;
}

/** "Ka-ching": a drawer clunk then two bright bells. Played for every fee. */
export function playCashRegister(): void {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;

  const clunk = noise(ctx, now, 0.06);
  const clunkGain = ctx.createGain();
  clunkGain.gain.setValueAtTime(0.15, now);
  clunkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  clunk.connect(clunkGain).connect(ctx.destination);

  tone(ctx, "square", 1568, now + 0.07, 0.25, 0.08);
  tone(ctx, "square", 2093, now + 0.12, 0.4, 0.07);
}

/** A cross "mrrROW" for a Stray. */
export function playAnnoyedMeow(): void {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;

  const voice = ctx.createOscillator();
  voice.type = "sawtooth";
  voice.frequency.setValueAtTime(520, now);
  voice.frequency.linearRampToValueAtTime(980, now + 0.25);
  voice.frequency.linearRampToValueAtTime(430, now + 0.7);

  // A fast wobble in pitch makes it sound like a voice rather than a siren.
  const wobble = ctx.createOscillator();
  const wobbleDepth = ctx.createGain();
  wobble.frequency.value = 9;
  wobbleDepth.gain.value = 25;
  wobble.connect(wobbleDepth).connect(voice.frequency);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

  voice.connect(filter).connect(gain).connect(ctx.destination);
  voice.start(now);
  wobble.start(now);
  voice.stop(now + 0.75);
  wobble.stop(now + 0.75);
}

/** A low rumbling roar for a Galacticat. */
export function playLionRoar(): void {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const length = 1.4;

  const growl = ctx.createOscillator();
  growl.type = "sawtooth";
  growl.frequency.setValueAtTime(140, now);
  growl.frequency.exponentialRampToValueAtTime(60, now + length);

  const breath = noise(ctx, now, length);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(250, now + length);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + length);

  // A tremble in the volume gives the roar its rasp.
  const rasp = ctx.createOscillator();
  const raspDepth = ctx.createGain();
  rasp.frequency.value = 22;
  raspDepth.gain.value = 0.08;
  rasp.connect(raspDepth).connect(gain.gain);

  growl.connect(filter);
  breath.connect(filter);
  filter.connect(gain).connect(ctx.destination);
  growl.start(now);
  rasp.start(now);
  growl.stop(now + length);
  rasp.stop(now + length);
}
