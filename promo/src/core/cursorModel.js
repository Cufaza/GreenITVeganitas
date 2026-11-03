// Pure cursor timeline model: position / hover / press as a function of the global frame.
// The Cursor component AND the buttons read the same functions, so hover and press
// light up on exactly the frames the arrow is there.
import { interpolate, spring } from 'remotion';
import { CURSOR, FPS } from '../timeline.js';
import { TARGETS } from '../mock/layout.js';

export const PRESS_FRAMES = 8;

const WP = CURSOR.map((c) => {
  const [x, y] = c.to ? TARGETS[c.to].pt : c.xy;
  return { f: c.f, x, y, dur: c.dur ?? 40, to: c.to, click: !!c.click, clickF: c.click ? c.f + (c.lag ?? 10) : null };
});

export const cursorPos = (frame) => {
  let i = 0;
  for (let k = 1; k < WP.length; k++) if (frame >= WP[k].f - WP[k].dur) i = k;
  if (i === 0) return { x: WP[0].x, y: WP[0].y };
  const a = WP[i - 1];
  const b = WP[i];
  const start = b.f - b.dur;
  const p = spring({ frame: frame - start, fps: FPS, durationInFrames: b.dur, config: { damping: 15, stiffness: 140, mass: 0.8 } });
  const lin = interpolate(frame, [start, b.f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const arc = Math.sin(Math.PI * lin) * 0.07; // gentle curved path
  return { x: a.x + dx * p - dy * arc, y: a.y + dy * p + dx * arc };
};

const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export const isHover = (id, frame) => {
  if (frame < WP[1].f - 30) return false;
  return inRect(cursorPos(frame), TARGETS[id].rect);
};

export const isPress = (id, frame) =>
  WP.some((w) => w.to === id && w.click && frame >= w.clickF && frame <= w.clickF + PRESS_FRAMES);

/** 0..1 hover amount with a short ease so glow fades instead of popping */
export const hoverAmount = (id, frame) => {
  let h = 0;
  for (let d = 0; d <= 6; d++) h += isHover(id, frame - d) ? 1 / 7 : 0;
  return h;
};

export const clickEvents = WP.filter((w) => w.click).map((w) => ({ f: w.clickF, x: w.x, y: w.y, to: w.to }));
