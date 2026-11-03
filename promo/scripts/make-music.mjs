#!/usr/bin/env node
// Procedural soundtrack for the GreenIT Calc promo. Pure Node, zero dependencies, deterministic.
//   node scripts/make-music.mjs [--lufs=-14] [--tp=-1] [--out=public/soundtrack.wav]
// Every sync point is read from src/timeline.js (the same file the scenes use), so changing a
// frame there and re-running `npm run music` re-syncs the audio.
//
// Synthesis: oscillators + ADSR, filtered noise, ping-pong delay, Freeverb-style reverb
// (8 combs + 4 allpasses per channel), sidechain-style ducking, soft-clip master bus,
// then ITU-R BS.1770 loudness normalisation with a look-ahead true-peak limiter.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, DURATION, BPM, BEAT, T, AUDIO_EVENTS } from '../src/timeline.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const TARGET_LUFS = Number(arg('lufs', -14)); // integrated loudness target
const TP_MAX = Number(arg('tp', -1)); // true-peak ceiling (dBTP)
const OUT = path.resolve(here, '..', arg('out', 'public/soundtrack.wav'));

const SR = 48000;
const SPF = SR / FPS; // 800 samples per video frame
const N = DURATION * SPF; // exactly 45.0 s
const SEC_BEAT = BEAT / FPS; // 0.6 s at 100 BPM
const SEC_BAR = SEC_BEAT * 4;
if (!Number.isInteger(SPF) || BEAT * BPM !== 3600) throw new Error('timeline: expected 60 fps and 100 BPM');

// ---------------------------------------------------------------- helpers
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rng = mulberry32(20260101);
const noise = (n) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = rng() * 2 - 1; return a; };
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const TAU = Math.PI * 2;
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const stereo = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const panGains = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
const f2s = (f) => Math.round(f * SPF);
const lpCoef = (fc) => 1 - Math.exp((-TAU * fc) / SR);

/** mix a mono array into a stereo bus at sample s0 */
function put(bus, s0, arr, gain = 1, pan = 0) {
  const [gl, gr] = panGains(pan);
  const end = Math.min(arr.length, N - s0);
  for (let i = 0; i < end; i++) { const v = arr[i] * gain; bus.L[s0 + i] += v * gl; bus.R[s0 + i] += v * gr; }
}
function putSt(bus, s0, L, R, gain = 1) {
  const end = Math.min(L.length, N - s0);
  for (let i = 0; i < end; i++) { bus.L[s0 + i] += L[i] * gain; bus.R[s0 + i] += R[i] * gain; }
}

// ---------------------------------------------------------------- buses
const B = {
  drone: stereo(), pad: stereo(), arp: stereo(), bass: stereo(), drums: stereo(),
  bells: stereo(), clicks: stereo(), whoosh: stereo(), impact: stereo(),
};

// ---------------------------------------------------------------- instruments
/** Warm pad note: 4 detuned saws, 2-pole lowpass opening with the attack, sub-octave sine. */
function padNote(midi, s0, dur, gain, { a = 0.8, r = 1.3, cut = 1300 } = {}) {
  const f = mtof(midi);
  const n = Math.floor((dur + r) * SR);
  const det = [-11, -4, 4, 11].map((c) => 2 ** (c / 1200));
  const pans = [-0.85, -0.3, 0.3, 0.85].map(panGains);
  const ph = det.map(() => rng());
  const L = new Float32Array(n), R = new Float32Array(n);
  let yl1 = 0, yl2 = 0, yr1 = 0, yr2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = t < dur ? smooth(t / a) : 1 - smooth((t - dur) / r);
    if (env <= 0 && t > dur) break;
    const k = lpCoef(cut * (0.35 + 0.65 * smooth(t / (a * 1.6))));
    let sl = 0, sr = 0;
    for (let v = 0; v < 4; v++) {
      ph[v] += (f * det[v]) / SR; ph[v] -= Math.floor(ph[v]);
      const s = ph[v] * 2 - 1;
      sl += s * pans[v][0]; sr += s * pans[v][1];
    }
    const sub = Math.sin(TAU * (f / 2) * t) * 0.9;
    sl = (sl * 0.28 + sub * 0.5) * env; sr = (sr * 0.28 + sub * 0.5) * env;
    yl1 += k * (sl - yl1); yl2 += k * (yl1 - yl2);
    yr1 += k * (sr - yr1); yr2 += k * (yr1 - yr2);
    L[i] = yl2; R[i] = yr2;
  }
  putSt(B.pad, s0, L, R, gain);
}

/** Soft pluck: sine + saw through a decaying lowpass. */
function pluck(midi, s0, vel, pan, dur = 0.9) {
  const f = mtof(midi);
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let y = 0, ph = rng();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += f / SR; ph -= Math.floor(ph);
    const env = Math.min(1, i / 48) * Math.exp(-t / 0.2);
    const k = lpCoef(700 + 4200 * Math.exp(-t / 0.09));
    y += k * ((ph * 2 - 1) * 0.45 + Math.sin(TAU * f * t) * 0.75 - y);
    out[i] = y * env;
  }
  put(B.arp, s0, out, vel, pan);
}

/** FM-ish bell with an instant attack (first sample is already loud). */
function bell(freq, s0, gain, decay, pan = 0, bus = B.bells, ratio = 2.0, idx = 1.6) {
  const n = Math.floor(Math.min(decay * 7, (N - s0) / SR) * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const mod = idx * Math.exp(-t / (decay * 0.18)) * Math.sin(TAU * freq * ratio * t);
    out[i] = Math.sin(TAU * freq * t + mod) * Math.exp(-t / decay) * Math.min(1, i / 24);
  }
  put(bus, s0, out, gain, pan);
}

/** Camera whoosh: band-passed noise whose centre sweeps f0 -> f1, panned across the stage. */
function whoosh(startF, dur, { f0, f1, level = 0.4, pan0 = -0.6, pan1 = 0.6, peak = 0.45, rumble = 0 }) {
  const n = Math.floor(dur * SR);
  const s0 = f2s(startF);
  const nl = noise(n), nr = noise(n);
  let hl = 0, hr = 0, a1l = 0, a2l = 0, a1r = 0, a2r = 0, rl = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const fc = f0 * (f1 / f0) ** smooth(t);
    const kh = lpCoef(fc * 0.45), kl = lpCoef(fc * 1.7);
    const env = t < peak ? Math.sin((Math.PI / 2) * (t / peak)) ** 2 : Math.cos((Math.PI / 2) * ((t - peak) / (1 - peak))) ** 2;
    hl += kh * (nl[i] - hl); hr += kh * (nr[i] - hr);
    const xl = nl[i] - hl, xr = nr[i] - hr;
    a1l += kl * (xl - a1l); a2l += kl * (a1l - a2l);
    a1r += kl * (xr - a1r); a2r += kl * (a1r - a2r);
    let sl = a2l, sr = a2r;
    if (rumble) { rl += lpCoef(140) * (nl[i] - rl); sl += rl * rumble; sr += rl * rumble; }
    const [gl, gr] = panGains(pan0 + (pan1 - pan0) * t);
    const g = env * level * (1.6 + 1.5 * Math.min(1, 900 / fc));
    if (s0 + i < N) { B.whoosh.L[s0 + i] += sl * g * gl * 1.4; B.whoosh.R[s0 + i] += sr * g * gr * 1.4; }
  }
}

/** Reverse-cymbal style riser: noise, rising high-pass, squared amplitude, hard stop at the hit. */
function riser(startF, endF, level) {
  const s0 = f2s(startF), n = f2s(endF) - s0;
  const nl = noise(n), nr = noise(n);
  let hl = 0, hr = 0, ll = 0, lr = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const kh = lpCoef(400 * (11000 / 400) ** t);
    const kl = lpCoef(14000);
    hl += kh * (nl[i] - hl); hr += kh * (nr[i] - hr);
    ll += kl * (nl[i] - hl - ll); lr += kl * (nr[i] - hr - lr);
    const tail = Math.min(1, (n - i) / (SR * 0.004)); // 4 ms fade so the cut never clicks
    const g = level * t ** 2.2 * tail;
    B.whoosh.L[s0 + i] += ll * g; B.whoosh.R[s0 + i] += lr * g;
  }
}

/** Sub boom + noise thump + airy tail. Attack is ~1 ms so the onset sits exactly on the frame. */
function impact(frame, level) {
  const s0 = f2s(frame);
  const n = 2.6 * SR;
  const sub = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (36 + 74 * Math.exp(-t / 0.1)) / SR;
    sub[i] = Math.sin(TAU * ph) * Math.exp(-t / 0.65) * Math.min(1, i / 48);
  }
  put(B.impact, s0, sub, level);
  const th = noise(Math.floor(0.7 * SR));
  let y = 0;
  for (let i = 0; i < th.length; i++) { y += lpCoef(520) * (th[i] - y); th[i] = y * Math.exp(-i / SR / 0.14) * Math.min(1, i / 24); }
  put(B.impact, s0, th, level * 2.6);
  const air = noise(Math.floor(2.2 * SR));
  let hp = 0;
  for (let i = 0; i < air.length; i++) { hp += lpCoef(3500) * (air[i] - hp); air[i] = (air[i] - hp) * Math.exp(-i / SR / 0.7) * Math.min(1, i / 24); }
  put(B.impact, s0, air, level * 0.32);
}

function kick(s0, g) {
  const n = Math.floor(0.3 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (46 + 90 * Math.exp(-t / 0.035)) / SR;
    out[i] = (Math.sin(TAU * ph) * Math.exp(-t / 0.11) + (t < 0.004 ? 0.25 * (1 - t / 0.004) : 0)) * Math.min(1, i / 16);
  }
  put(B.drums, s0, out, g);
}
function hat(s0, g, pan) {
  const n = Math.floor(0.06 * SR);
  const x = noise(n);
  let lp = 0;
  for (let i = 0; i < n; i++) { lp += lpCoef(7000) * (x[i] - lp); x[i] = (x[i] - lp) * Math.exp(-i / SR / 0.016) * Math.min(1, i / 8); }
  put(B.drums, s0, x, g, pan);
}
function bassNote(midi, s0, dur, g) {
  const f = mtof(midi), n = Math.floor((dur + 0.15) * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.012) * (t < dur ? Math.exp(-t / 0.55) : Math.exp(-dur / 0.55) * (1 - (t - dur) / 0.15));
    out[i] = (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 2 * t)) * env;
  }
  put(B.bass, s0, out, g);
}

/** UI tick: instant, high, tight. Cosine start so energy lands on the very first samples. */
function uiClick(frame, g = 0.28, f1 = 2600, f2 = 4300) {
  const s0 = f2s(frame), n = Math.floor(0.05 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.cos(TAU * f1 * t) * Math.exp(-t / 0.0045) + 0.55 * Math.cos(TAU * f2 * t) * Math.exp(-t / 0.003) + 0.5 * Math.cos(TAU * 950 * t) * Math.exp(-t / 0.012)) * Math.min(1, i / 12);
  }
  put(B.clicks, s0, out, g);
}
function blip(frame, freq, g) {
  const s0 = f2s(frame), n = Math.floor(0.07 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; out[i] = Math.cos(TAU * freq * t) * Math.exp(-t / 0.014) * Math.min(1, i / 12); }
  put(B.clicks, s0, out, g);
}

// ---------------------------------------------------------------- arrangement
const E = AUDIO_EVENTS;
const sec = (f) => f / FPS;

// Chords (voice-led): triad MIDI notes + bass root. Am - F - C - G
const CHORDS = [
  { tri: [57, 60, 64], bass: 33 }, // Am
  { tri: [57, 60, 65], bass: 29 }, // F
  { tri: [55, 60, 64], bass: 36 }, // C
  { tri: [55, 59, 62], bass: 31 }, // G
];
const chordOfBar = (bar) => CHORDS[(((bar - 1) % 4) + 4) % 4];

// 1. Intro: drone swell + reverse-cymbal riser + impact + shimmer
{
  const hit = E.logoHit;
  const n = 8 * SR;
  const drone = stereo();
  const freqs = [55, 110, 82.41, 164.81];
  let y1 = 0, y2 = 0;
  const ph = freqs.map(() => 0);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const th = sec(hit);
    const amp = t < th ? (t / th) ** 2 : 0.5 * Math.exp(-(t - th) / 2.4) + 0.5 * Math.max(0, 1 - (t - th) / (8 - th)) * 0.35;
    let s = 0;
    for (let v = 0; v < freqs.length; v++) { ph[v] += freqs[v] / SR; s += Math.sin(TAU * ph[v]) * [0.9, 0.5, 0.35, 0.12][v]; }
    const saw = ((ph[1] * 2) % 2) - 1;
    const k = lpCoef(200 + 1400 * smooth(t / th));
    y1 += k * (saw * 0.3 - y1); y2 += k * (y1 - y2);
    const o = (s * 0.6 + y2) * amp * Math.min(1, t / 0.05) * (1 - smooth((t - 6.2) / 1.8));
    drone.L[i] = o; drone.R[i] = o * 0.96;
  }
  putSt(B.drone, 0, drone.L.subarray(0, n), drone.R.subarray(0, n), 0.34);
  riser(0, hit, 0.5);
  impact(hit, 0.85);
  // shimmer: bright partials, the first one exactly on the hit
  [880, 1318.5, 1760, 2637, 3520].forEach((f, i) => bell(f, f2s(hit) + i * f2s(2.2), 0.12 / (1 + i * 0.35), 2.2, [-0.5, 0.5, -0.2, 0.7, -0.7][i], B.bells, 2.0, 0.9));
}

// 2. Pad chords, one bar each, from bar 1 up to the CTA; final sustained chord on the CTA
{
  const lastBar = Math.floor(sec(E.ctaHit) / SEC_BAR);
  for (let bar = 1; bar <= lastBar; bar++) {
    const t0 = bar * SEC_BAR;
    const dur = Math.min(SEC_BAR, sec(E.ctaHit) - t0 - 0.05) + 0.25;
    const ch = chordOfBar(bar);
    const g = 0.2 * smooth(t0 / 6);
    ch.tri.forEach((m) => padNote(m, f2s(t0 * FPS), dur, g, { a: 0.9, r: 1.5, cut: 1100 + 900 * smooth((t0 - 6) / 10) }));
    padNote(ch.tri[0] + 12, f2s(t0 * FPS), dur, g * 0.5, { a: 1.1, r: 1.5, cut: 1500 });
    padNote(ch.bass + 12, f2s(t0 * FPS), dur, g * 0.9, { a: 0.5, r: 1.5, cut: 500 });
  }
  const s = f2s(E.ctaHit);
  const rest = sec(DURATION) - sec(E.ctaHit);
  [48, 55, 59, 62, 64, 67].forEach((m, i) => padNote(m, s, rest - 1.6, [0.3, 0.22, 0.2, 0.18, 0.16, 0.12][i], { a: 0.4, r: 1.5, cut: 2200 }));
  padNote(72, s, rest - 1.6, 0.09, { a: 0.9, r: 1.5, cut: 3500 });
}

// 3. Pluck arpeggio (enters as the UI assembles; stops with the outro riser)
{
  const stepF = BEAT / 2; // eighth note = 18 frames
  const pat = [0, 1, 2, 3, 2, 1, 2, 3];
  const startF = E.revealWhoosh + (T.arpIn - E.revealWhoosh);
  const first = Math.ceil(startF / stepF) * stepF;
  for (let f = first, k = 0; f < T.outroRiser + BEAT; f += stepF, k++) {
    const t = sec(f);
    const bar = Math.floor(t / SEC_BAR);
    const ch = chordOfBar(bar);
    const notes = [ch.tri[0] + 12, ch.tri[1] + 12, ch.tri[2] + 12, ch.tri[0] + 24];
    const stepIdx = Math.round((f % (BEAT * 4)) / stepF) % 8;
    const accent = stepIdx % 4 === 0 ? 1 : 0.72;
    const ramp = smooth((t - sec(T.arpIn)) / 5) * (f >= T.outroRiser ? 1 - (f - T.outroRiser) / BEAT : 1);
    if (ramp <= 0.01) continue;
    pluck(notes[pat[stepIdx]], f2s(f), 0.38 * accent * ramp * (t > sec(T.featureStart) ? 1.2 : 1), stepIdx % 2 ? 0.4 : -0.4);
  }
}

// 4. Feature groove: soft kick + closed hats + bass; kicks drive the sidechain-style pump
const kickSamples = [];
{
  const endF = T.outroWhoosh - 12; // last kick one beat before the zoom-out
  for (let f = T.featureStart; f <= endF; f += BEAT) {
    kick(f2s(f), 0.62);
    kickSamples.push(f2s(f));
    hat(f2s(f + BEAT / 2), 0.1, 0.25);
    hat(f2s(f + BEAT / 4), 0.035, -0.3);
    hat(f2s(f + (BEAT * 3) / 4), 0.045, 0.3);
    const bar = Math.floor(sec(f) / SEC_BAR);
    const beatInBar = Math.round((f % (BEAT * 4)) / BEAT);
    if (beatInBar === 0 || beatInBar === 2) bassNote(chordOfBar(bar).bass, f2s(f), SEC_BEAT * 1.6, 0.34);
    if (beatInBar === 3) bassNote(chordOfBar(bar).bass + 12, f2s(f + BEAT / 2), SEC_BEAT * 0.45, 0.16);
  }
}

// 5. Camera whooshes
whoosh(E.revealWhoosh, 2.6, { f0: 500, f1: 7500, level: 0.26, pan0: -0.7, pan1: 0.7, peak: 0.42 }); // airy, rising
whoosh(E.zoomPlanWhoosh, 1.1, { f0: 700, f1: 4500, level: 0.14, pan0: 0.5, pan1: -0.5, peak: 0.4 });
whoosh(E.pullWhoosh, 1.3, { f0: 800, f1: 5200, level: 0.15, pan0: -0.4, pan1: 0.8, peak: 0.4 });
// 6. Outro: riser -> big receding whoosh + sub hit
riser(T.outroRiser, E.outroWhoosh, 0.34);
whoosh(E.outroWhoosh, 3.0, { f0: 9000, f1: 260, level: 0.5, pan0: 0.7, pan1: -0.7, peak: 0.12, rumble: 0.55 });
impact(E.outroWhoosh, 0.55);

// 7. UI sounds
E.uiClicks.forEach((f) => uiClick(f));
E.typingBlips.forEach((f, i) => blip(f, i ? 1900 : 1550, 0.12));
{
  // Apply success: bright C major arpeggio, first note exactly on the click
  const s = f2s(E.applySuccess);
  [72, 76, 79, 84, 88, 91].forEach((m, i) => bell(mtof(m), s + i * f2s(3.3), 0.2 / (1 + i * 0.08), 1.1, [-0.3, 0.3, -0.5, 0.5, -0.2, 0.2][i], B.bells, 2.0, 1.1));
  const sp = noise(Math.floor(0.12 * SR)); let hp = 0;
  for (let i = 0; i < sp.length; i++) { hp += lpCoef(6000) * (sp[i] - hp); sp[i] = (sp[i] - hp) * Math.exp(-i / SR / 0.04) * Math.min(1, i / 16); }
  put(B.bells, s, sp, 0.1);
}
{
  // Watti pop (pitch-dropping sine) + soft ding
  const s = f2s(E.wattiOpen), n = Math.floor(0.25 * SR);
  const out = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (260 + 650 * Math.exp(-t / 0.03)) / SR; out[i] = Math.sin(TAU * ph) * Math.exp(-t / 0.055) * Math.min(1, i / 14); }
  put(B.bells, s, out, 0.42);
  bell(mtof(88), s + f2s(5.5), 0.1, 0.5, 0.3);
}
// 8. CTA bell + sub swell
{
  const s = f2s(E.ctaHit);
  bell(mtof(84), s, 0.22, 4.5, -0.15, B.bells, 2.0, 1.3);
  bell(mtof(88), s, 0.1, 3.8, 0.35, B.bells, 3.0, 0.7);
  bell(mtof(72), s, 0.14, 5.5, 0.1, B.bells, 2.0, 1.0);
  const n = Math.floor(6 * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; out[i] = Math.sin(TAU * 65.41 * t) * Math.min(1, t / 0.02) * Math.exp(-t / 2.4); }
  put(B.impact, s, out, 0.32);
}

// ---------------------------------------------------------------- mix
// sidechain-style pumping: gain dips on every kick and recovers
const duck = (depth) => {
  const g = new Float32Array(N).fill(1);
  for (const s0 of kickSamples) {
    const len = Math.floor(0.45 * SR);
    for (let i = 0; i < len && s0 + i < N; i++) {
      const v = 1 - depth * Math.exp(-i / SR / 0.14) * Math.min(1, i / 96);
      if (v < g[s0 + i]) g[s0 + i] = v;
    }
  }
  return g;
};
const applyGain = (bus, g) => { for (let i = 0; i < N; i++) { bus.L[i] *= g[i]; bus.R[i] *= g[i]; } };
applyGain(B.pad, duck(0.5)); applyGain(B.arp, duck(0.3)); applyGain(B.bass, duck(0.3));

const sum = (weights) => {
  const o = stereo();
  for (const [k, w] of Object.entries(weights)) {
    const b = B[k];
    for (let i = 0; i < N; i++) { o.L[i] += b.L[i] * w; o.R[i] += b.R[i] * w; }
  }
  return o;
};

// ping-pong delay (dotted eighth = 0.45 s)
function pingPong(send, timeS, fb) {
  const D = Math.round(timeS * SR);
  const dL = new Float32Array(N), dR = new Float32Array(N);
  const outL = new Float32Array(N), outR = new Float32Array(N);
  let lpL = 0, lpR = 0;
  const k = lpCoef(3800);
  for (let n = 0; n < N; n++) {
    const inp = (send.L[n] + send.R[n]) * 0.5;
    const fromR = n >= D ? dR[n - D] : 0;
    lpR += k * (fromR - lpR);
    dL[n] = inp + fb * lpR;
    const fromL = n >= D ? dL[n - D] : 0;
    lpL += k * (fromL - lpL);
    dR[n] = lpL;
    outL[n] = dL[n] - inp; outR[n] = dR[n];
  }
  return { L: outL, R: outR };
}

// Freeverb-style stereo reverb
function reverb(send, fb = 0.9, damp = 0.32) {
  const sc = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((c) => Math.round(c * sc));
  const aps = [556, 441, 341, 225].map((c) => Math.round(c * sc));
  const out = { L: new Float32Array(N), R: new Float32Array(N) };
  [0, 23].forEach((spread, ch) => {
    const dst = ch ? out.R : out.L;
    const bufs = combs.map((c) => new Float32Array(c + spread));
    const idx = combs.map(() => 0), lp = combs.map(() => 0);
    const apb = aps.map((c) => new Float32Array(c + spread)), api = aps.map(() => 0);
    const pre = Math.round(0.018 * SR);
    for (let n = 0; n < N; n++) {
      const x = n >= pre ? (send.L[n - pre] + send.R[n - pre]) * 0.5 * 0.05 : 0;
      let acc = 0;
      for (let c = 0; c < bufs.length; c++) {
        const b = bufs[c], v = b[idx[c]];
        lp[c] = v * (1 - damp) + lp[c] * damp;
        b[idx[c]] = x + lp[c] * fb;
        idx[c] = idx[c] + 1 === b.length ? 0 : idx[c] + 1;
        acc += v;
      }
      for (let a = 0; a < apb.length; a++) {
        const b = apb[a], v = b[api[a]];
        b[api[a]] = acc + v * 0.5;
        api[a] = api[a] + 1 === b.length ? 0 : api[a] + 1;
        acc = v - acc;
      }
      dst[n] = acc;
    }
  });
  return out;
}

const reverbSend = sum({ pad: 0.3, arp: 0.3, bells: 0.55, whoosh: 0.2, impact: 0.4, clicks: 0.05, drone: 0.2, drums: 0.03 });
const delaySend = sum({ arp: 0.4, bells: 0.35 });
const wetRev = reverb(reverbSend);
const wetDly = pingPong(delaySend, 0.45, 0.4);
const dry = sum({ drone: 1, pad: 1, arp: 1, bass: 1, drums: 1, bells: 1, clicks: 1, whoosh: 1, impact: 1 });

const master = stereo();
{
  let hpL = 0, hpR = 0;
  const kh = lpCoef(28);
  const drive = 1.0;
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    const fade = t < 0.01 ? t / 0.01 : t > 41 ? Math.cos((Math.PI / 2) * Math.min(1, (t - 41) / 4)) ** 2 : 1;
    let l = dry.L[n] + wetRev.L[n] * 1.0 + wetDly.L[n] * 0.5;
    let r = dry.R[n] + wetRev.R[n] * 1.0 + wetDly.R[n] * 0.5;
    hpL += kh * (l - hpL); hpR += kh * (r - hpR);
    l -= hpL; r -= hpR;
    master.L[n] = Math.tanh(l * drive) * fade;
    master.R[n] = Math.tanh(r * drive) * fade;
  }
  master.L[N - 1] = 0; master.R[N - 1] = 0;
}

if (process.argv.includes('--levels')) {
  const db = (v) => (20 * Math.log10(v + 1e-9)).toFixed(1);
  for (const [k, b] of Object.entries(B)) {
    let pk = 0, e = 0, cnt = 0;
    for (let i = 0; i < N; i++) { const v = Math.abs(b.L[i]) + Math.abs(b.R[i]); pk = Math.max(pk, v / 2); if (v > 1e-5) { e += v * v / 4; cnt++; } }
    console.log(`  bus ${k.padEnd(7)} peak ${db(pk)} dBFS  rms(active) ${db(Math.sqrt(e / Math.max(1, cnt)))} dBFS`);
  }
}

// ---------------------------------------------------------------- loudness (BS.1770-4)
const biquad = (x, b, a) => {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
};
const kWeight = (x) =>
  biquad(biquad(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]), [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]);
export function integratedLoudness(L, R) {
  const kl = kWeight(L), kr = kWeight(R);
  const blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  const e = [];
  const csl = new Float64Array(kl.length + 1), csr = new Float64Array(kl.length + 1);
  for (let i = 0; i < kl.length; i++) { csl[i + 1] = csl[i] + kl[i] * kl[i]; csr[i + 1] = csr[i] + kr[i] * kr[i]; }
  for (let s = 0; s + blk <= kl.length; s += hop) e.push(((csl[s + blk] - csl[s]) + (csr[s + blk] - csr[s])) / blk);
  const lk = (z) => -0.691 + 10 * Math.log10(z);
  const abs = e.filter((z) => lk(z) > -70);
  const rel = lk(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((z) => lk(z) > rel);
  return lk(gated.reduce((a, b) => a + b, 0) / gated.length);
}
// 4x oversampled true peak (windowed-sinc polyphase, evaluated only near loud samples)
const TP_TAPS = 24;
const TP_PH = [0.25, 0.5, 0.75].map((frac) => {
  const h = new Float64Array(TP_TAPS * 2);
  for (let k = -TP_TAPS + 1; k <= TP_TAPS; k++) {
    const x = k - frac;
    const sinc = Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
    const w = 0.5 + 0.5 * Math.cos((Math.PI * x) / (TP_TAPS + 0.5));
    h[k + TP_TAPS - 1] = sinc * w;
  }
  return h;
});
export function truePeak(L, R) {
  let pk = 0;
  for (const ch of [L, R]) {
    for (let i = TP_TAPS; i < ch.length - TP_TAPS; i++) {
      const a = Math.abs(ch[i]);
      if (a > pk) pk = a;
      if (a < 0.25) continue;
      for (const h of TP_PH) {
        let s = 0;
        for (let k = -TP_TAPS + 1; k <= TP_TAPS; k++) s += ch[i + k] * h[k + TP_TAPS - 1];
        if (Math.abs(s) > pk) pk = Math.abs(s);
      }
    }
  }
  return 20 * Math.log10(pk);
}
const samplePeak = (L, R) => { let p = 0; for (let i = 0; i < L.length; i++) p = Math.max(p, Math.abs(L[i]), Math.abs(R[i])); return p; };

/** look-ahead peak limiter: min-filter of the required gain + box smoothing (output gain <= required at every sample) */
function limit(L, R, ceil, W = 240) {
  const n = L.length;
  const req = new Float32Array(n);
  // detect on the 4x-oversampled signal so the ceiling holds for true peak, not just sample peak
  const tpAt = (ch, i) => {
    let m = Math.abs(ch[i]);
    if (m < 0.25 || i < TP_TAPS || i >= n - TP_TAPS) return m;
    for (const h of TP_PH) {
      let v = 0;
      for (let k = -TP_TAPS + 1; k <= TP_TAPS; k++) v += ch[i + k] * h[k + TP_TAPS - 1];
      if (Math.abs(v) > m) m = Math.abs(v);
    }
    return m;
  };
  for (let i = 0; i < n; i++) { const p = Math.max(tpAt(L, i), tpAt(R, i)); req[i] = p > ceil ? ceil / p : 1; }
  const mn = new Float32Array(n), dq = new Int32Array(n); let h = 0, t = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (t > h && req[dq[t - 1]] >= req[i]) t--;
    dq[t++] = i;
    while (dq[h] > i + W - 1) h++;
    mn[i] = req[dq[h]];
  }
  const oL = new Float32Array(n), oR = new Float32Array(n);
  // box-average the look-ahead minimum over the preceding W samples
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += mn[i];
    if (i >= W) acc -= mn[i - W];
    const cnt = Math.min(i + 1, W);
    const gain = (acc + (W - cnt) * 1) / W;
    oL[i] = L[i] * gain; oR[i] = R[i] * gain;
  }
  return { L: oL, R: oR };
}

function normalise(inL, inR) {
  let ceil = Math.pow(10, (TP_MAX - 0.15) / 20);
  let gainDb = TARGET_LUFS - integratedLoudness(inL, inR);
  let best = null;
  for (let it = 0; it < 14; it++) {
    const g = Math.pow(10, gainDb / 20);
    const L = new Float32Array(N), R = new Float32Array(N);
    for (let i = 0; i < N; i++) { L[i] = inL[i] * g; R[i] = inR[i] * g; }
    const lim = limit(L, R, ceil);
    const lufs = integratedLoudness(lim.L, lim.R);
    const tp = truePeak(lim.L, lim.R);
    best = { ...lim, lufs, tp, gainDb, ceil, it };
    const okL = Math.abs(lufs - TARGET_LUFS) <= 0.1;
    const okT = tp <= TP_MAX - 0.05;
    console.log(`  iter ${it}: gain ${gainDb.toFixed(2)} dB  LUFS ${lufs.toFixed(2)}  TP ${tp.toFixed(2)} dBTP  ceil ${(20 * Math.log10(ceil)).toFixed(2)} dBFS`);
    if (okL && okT) break;
    if (!okT) ceil = Math.min(ceil, samplePeak(lim.L, lim.R)) * Math.pow(10, -(tp - TP_MAX + 0.1) / 20); // engage the limiter below the current peak
    gainDb += TARGET_LUFS - lufs;
  }
  return best;
}

// ---------------------------------------------------------------- write WAV (16-bit, TPDF dither)
function writeWav(file, L, R) {
  const data = Buffer.alloc(N * 4);
  const dr = mulberry32(777);
  for (let i = 0; i < N; i++) {
    for (const [ch, off] of [[L, 0], [R, 2]]) {
      const v = ch[i] * 32767 + (dr() - dr()) * 0.5;
      data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v))), i * 4 + off);
    }
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

// ---------------------------------------------------------------- run
console.log(`GreenIT Calc soundtrack: ${DURATION / FPS}s @ ${SR} Hz, ${BPM} BPM, target ${TARGET_LUFS} LUFS / ${TP_MAX} dBTP`);
console.log('normalising...');
const res = normalise(master.L, master.R);
writeWav(OUT, res.L, res.R);

// read back what was actually written (int16) and verify
const wav = fs.readFileSync(OUT);
const frames = (wav.length - 44) / 4;
const rl = new Float32Array(frames), rr = new Float32Array(frames);
let clip = 0;
for (let i = 0; i < frames; i++) {
  const a = wav.readInt16LE(44 + i * 4), b = wav.readInt16LE(46 + i * 4);
  if (Math.abs(a) >= 32767 || Math.abs(b) >= 32767) clip++;
  rl[i] = a / 32768; rr[i] = b / 32768;
}
const finalLufs = integratedLoudness(rl, rr), finalTp = truePeak(rl, rr);

// onset checks on the isolated stems (exact) and on the final mix (high-passed flux)
const mono = (b) => { const o = new Float32Array(N); for (let i = 0; i < N; i++) o[i] = b.L[i] + b.R[i]; return o; };
const stemOnset = (sig, frame, rel) => {
  const a = f2s(frame) - 3 * SPF, z = f2s(frame) + 3 * SPF;
  let pk = 0;
  for (let i = a; i < z; i++) pk = Math.max(pk, Math.abs(sig[i]));
  for (let i = a; i < z; i++) if (Math.abs(sig[i]) > pk * rel) return (i - f2s(frame)) / SPF;
  return NaN;
};
const hp = (x, fc) => { const o = new Float32Array(x.length); let y = 0; const k = lpCoef(fc); for (let i = 0; i < x.length; i++) { y += k * (x[i] - y); o[i] = x[i] - y; } return o; };
const mixOnset = (hsig, frame) => {
  const bin = 48, a = f2s(frame) - 4 * SPF, nb = Math.floor((8 * SPF) / bin);
  const env = new Float64Array(nb);
  for (let b = 0; b < nb; b++) { let m = 0; for (let i = 0; i < bin; i++) m = Math.max(m, Math.abs(hsig[a + b * bin + i])); env[b] = m; }
  let bestB = 0, best = -1;
  for (let b = 8; b < nb; b++) {
    let avg = 0; for (let k = 1; k <= 8; k++) avg += env[b - k]; avg /= 8;
    const jump = env[b] - avg;
    if (jump > best) { best = jump; bestB = b; }
  }
  return (a + bestB * bin - f2s(frame)) / SPF;
};
const stems = { clicks: mono(B.clicks), bells: mono(B.bells), impact: mono(B.impact), whoosh: mono(B.whoosh) };
const mixHP = hp(mono({ L: res.L, R: res.R }), 2500);
const checks = [];
const add = (name, frames_, stem, rel = 0.12) => frames_.forEach((f) => checks.push({ name, frame: f, stemOnsetFrames: stemOnset(stems[stem], f, rel), mixOnsetFrames: mixOnset(mixHP, f) }));
add('uiClick', E.uiClicks, 'clicks');
add('typingBlip', E.typingBlips, 'clicks');
add('applyChime', [E.applySuccess], 'bells');
add('wattiPop', [E.wattiOpen], 'bells');
add('ctaBell', [E.ctaHit], 'bells');
add('logoImpact', [E.logoHit], 'impact');
add('outroImpact', [E.outroWhoosh], 'impact');
const whooshes = [E.revealWhoosh, E.zoomPlanWhoosh, E.pullWhoosh, E.outroWhoosh].map((f) => ({ f, ramp: stemOnset(stems.whoosh, f, 0.03) }));

const report = {
  file: OUT, frames, seconds: frames / SR, sampleRate: SR, channels: 2, bitDepth: 16,
  clippedSamples: clip, integratedLUFS: +finalLufs.toFixed(2), truePeakdBTP: +finalTp.toFixed(2),
  targetLUFS: TARGET_LUFS, truePeakCeiling: TP_MAX, gainAppliedDb: +res.gainDb.toFixed(2), limiterCeilingdBFS: +(20 * Math.log10(res.ceil)).toFixed(2),
  onsets: checks.map((c) => ({ ...c, stemOnsetFrames: +c.stemOnsetFrames.toFixed(3), mixOnsetFrames: +c.mixOnsetFrames.toFixed(3) })),
  whooshRampStartFrames: whooshes.map((w) => ({ event: w.f, rampStart: +w.ramp.toFixed(3) })),
};
const reportPath = path.resolve(here, '..', 'out', 'music-report.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

const worstStem = Math.max(...checks.map((c) => Math.abs(c.stemOnsetFrames)));
const worstMix = Math.max(...checks.map((c) => Math.abs(c.mixOnsetFrames)));
console.log(`wrote ${OUT}`);
console.log(`length ${frames} samples = ${(frames / SR).toFixed(3)} s (expected ${N}) ${frames === N ? 'OK' : 'MISMATCH'}`);
console.log(`integrated ${finalLufs.toFixed(2)} LUFS (target ${TARGET_LUFS}), true peak ${finalTp.toFixed(2)} dBTP (max ${TP_MAX}), clipped samples ${clip}`);
console.log(`onset error vs timeline: stems worst ${worstStem.toFixed(3)} frames, final mix worst ${worstMix.toFixed(3)} frames (budget 1.0)`);
const wm = checks.reduce((a, c) => (Math.abs(c.mixOnsetFrames) > Math.abs(a.mixOnsetFrames) ? c : a));
console.log(`  worst mix event: ${wm.name} @ frame ${wm.frame} (${wm.mixOnsetFrames.toFixed(2)} frames)`);
console.log(`details: ${reportPath}`);
if (frames !== N || clip > 0 || finalTp > TP_MAX + 0.05 || Math.abs(finalLufs - TARGET_LUFS) > 0.3 || worstStem > 1) process.exitCode = 1;
