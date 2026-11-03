// Single source of truth for timing. Pure data (no React) so the music generator
// (scripts/make-music.mjs) reads exactly the same frames the scenes use.
// All frames are GLOBAL composition frames at 60 fps.

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 2700; // 45 s
export const BPM = 100;
export const BEAT = (FPS * 60) / BPM; // 36 frames

// Scenes overlap ~20 frames so the camera never hard-cuts.
export const SCENES = {
  intro: { from: 0, to: 200 },
  reveal: { from: 180, to: 920 },
  feature: { from: 900, to: 2120 },
  outro: { from: 2100, to: 2700 },
};

export const T = {
  // Intro
  logoStart: 36,
  logoHit: 72, // logo is sharp: impact + shimmer (beat 2 of the grid)
  logoSweep: 84,
  lemaStart: 108,
  lemaEnd: 150,
  introFadeStart: 172,

  // Reveal
  revealWhoosh: 188, // iso -> tilt camera move starts
  revealCamEnd: 440,
  sidebarIn: 250,
  navStart: 290, // + 10 frames per item
  kpiStart: 340, // + 14 frames per card
  countStart: 350,
  countEnd: 500,
  barsStart: 470,
  captionIn: 215,
  captionOut: 430,
  arpIn: 360, // pluck arpeggio enters as the UI assembles
  panEnd: 900,

  // Feature (a): Plan de ahorro
  featureStart: 900,
  pageSwitch: 992, // = nav click
  zoomPlanWhoosh: 975,
  applyClick: 1362,
  morphStart: 1372,
  morphEnd: 1470,
  badgePop: 1440,
  pullWhoosh: 1500, // camera pulls to bottom-right

  // Feature (b): Watti
  wattiClick: 1600,
  chipClick: 1710,
  typingStart: 1730,
  typingCycle: 18, // one dot-bounce cycle, 2 cycles = 0.6 s
  typingCycles: 2,
  answerStart: 1766,
  answerCps: 2.4, // characters per frame while typing

  // Outro
  outroWhoosh: 2100, // zoom-out starts
  outroRiser: 2020,
  ctaHit: 2268, // beat 63 // CTA appears: sustained chord + bell
  ctaPill: 2328,
  ctaUrl: 2368,
  ctaFooter: 2408,
  end: 2700,
};

// Cursor script. `to` is a layout target id (resolved in mock/layout.js), `xy` raw mockup coords.
// f = arrival frame, dur = travel frames before f, lag = hover frames between arrival and click.
export const CURSOR = [
  { f: 925, xy: [640, 700], dur: 0 },
  { f: 982, to: 'nav-plan', dur: 52, click: true, lag: 10 },
  { f: 1128, to: 'measure-0', dur: 54, click: true, lag: 10 },
  { f: 1196, to: 'measure-1', dur: 44, click: true, lag: 10 },
  { f: 1264, to: 'measure-2', dur: 44, click: true, lag: 10 },
  { f: 1350, to: 'apply', dur: 56, click: true, lag: 12 },
  { f: 1590, to: 'watti-btn', dur: 80, click: true, lag: 10 },
  { f: 1698, to: 'chip-medida', dur: 50, click: true, lag: 12 },
  { f: 1745, xy: [1330, 640], dur: 36 },
];
export const CURSOR_FADE_IN = [905, 925];
export const CURSOR_FADE_OUT = [2040, 2090];

export const clickFrames = CURSOR.filter((c) => c.click).map((c) => c.f + (c.lag ?? 10));
// measure ticks are clickFrames[1..3]
export const MEASURE_CLICKS = clickFrames.slice(1, 4);
if (clickFrames[0] !== T.pageSwitch) throw new Error('timeline: nav click must equal T.pageSwitch');
if (clickFrames[4] !== T.applyClick) throw new Error('timeline: apply click mismatch');
if (clickFrames[5] !== T.wattiClick) throw new Error('timeline: watti click mismatch');
if (clickFrames[6] !== T.chipClick) throw new Error('timeline: chip click mismatch');

// Events consumed by the audio generator (name -> frame(s)).
export const AUDIO_EVENTS = {
  logoHit: T.logoHit,
  revealWhoosh: T.revealWhoosh,
  zoomPlanWhoosh: T.zoomPlanWhoosh,
  pullWhoosh: T.pullWhoosh,
  uiClicks: clickFrames, // every cursor click
  applySuccess: T.applyClick,
  wattiOpen: T.wattiClick,
  chipClick: T.chipClick,
  typingBlips: Array.from({ length: T.typingCycles }, (_, i) => T.typingStart + i * T.typingCycle),
  outroWhoosh: T.outroWhoosh,
  ctaHit: T.ctaHit,
};
