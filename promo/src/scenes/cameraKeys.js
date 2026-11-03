// Camera keyframes (global frames). Scene N's first key equals scene N-1's last pose,
// so the overlap between scenes is seamless.
import { Easing } from 'remotion';
import { zoomTo, EXPO, GLIDE } from '../core/Camera.jsx';
import { T } from '../timeline.js';
import { WATTI_PANEL, WATTI_BTN } from '../mock/layout.js';

const ISO = { s: 0.5, rx: 58, ry: 0, rz: -42, x: 0, y: 70, z: -250 };
const TILT = { s: 0.84, rx: 12, ry: -14, rz: 0, x: 150, y: 0, z: 0 };
const PAN_END = { s: 0.94, rx: 8, ry: -9, rz: 0, x: -110, y: -4, z: 0 };

const SWEEP = Easing.bezier(0.5, 0, 0.1, 1);

export const REVEAL_KEYS = [
  { f: 180, ...ISO },
  { f: T.revealCamEnd, ...TILT, ease: SWEEP },
  { f: T.panEnd, ...PAN_END, ease: GLIDE },
];

const PLAN_A = zoomTo({ x: -20, y: 36, w: 1040, h: 820 }, { rx: 4, ry: -6 });
const PLAN_A2 = zoomTo({ x: -20, y: 36, w: 1040, h: 820 }, { rx: 3, ry: -5 }, 0.99);
const PLAN_B = zoomTo({ x: 760, y: 60, w: 840, h: 900 }, { rx: 3, ry: -5 });
const WATTI_C = zoomTo({ x: 0, y: 70, w: 1600, h: 900 }, { rx: 2, ry: -3 }, 1.02);
export const WATTI_FOCUS = WATTI_C;

export const FEATURE_KEYS = [
  { f: 900, ...PAN_END },
  { f: 985, ...PLAN_A, ease: EXPO },
  { f: 1385, ...PLAN_A2, ease: GLIDE },
  { f: 1470, ...PLAN_B, ease: EXPO },
  { f: T.pullWhoosh, ...PLAN_B },
  { f: 1585, ...WATTI_C, ease: EXPO },
];

export const OUTRO_KEYS = [
  { f: 1585, ...WATTI_C },
  { f: T.outroWhoosh, ...WATTI_C },
  { f: 2260, s: 0.45, rx: 30, ry: -24, rz: -8, x: -80, y: -120, z: -500, blur: 16, ease: SWEEP },
];

void WATTI_PANEL; void WATTI_BTN;
