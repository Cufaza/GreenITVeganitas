// Fixed mockup space (1600x1000). Every interactive element is placed from these
// rects, so cursor targets and camera zoom rects always line up with what is drawn.
export const MOCK = { w: 1600, h: 1000 };
export const SIDEBAR_W = 260;
export const TOPBAR_H = 72;
export const CONTENT = { x: SIDEBAR_W, y: TOPBAR_H, w: MOCK.w - SIDEBAR_W, h: MOCK.h - TOPBAR_H };

export const NAV = ['Panel', 'Inventario', 'Plan de ahorro', 'Cálculos'];
const navRect = (i) => ({ x: 15, y: 160 + i * 60, w: 230, h: 52 });

// Plan page
export const MEASURE_RECT = (i) => ({ x: 296, y: 170 + i * 160, w: 680, h: 142 });
export const APPLY_RECT = { x: 296, y: 664, w: 420, h: 84 };
export const RESULT_RECT = { x: 1012, y: 108, w: 552, h: 392 };
export const PLAN_CHART_RECT = { x: 1012, y: 520, w: 552, h: 440 };

// Panel page
export const KPI_RECT = (i) => ({ x: 296 + i * 322, y: 108, w: 302, h: 170 });
export const CHART_A = { x: 296, y: 302, w: 780, h: 658 };
export const CHART_B = { x: 1096, y: 302, w: 468, h: 658 };

// Watti
export const WATTI_BTN = { x: 1500, y: 900, w: 76, h: 76 };
export const WATTI_PANEL = { x: 540, y: 96, w: 540, h: 780 };
export const CHIP_RECT = (i) => ({ x: WATTI_PANEL.x + 24, y: 680 + i * 62, w: 492, h: 52 });

const center = (r) => [r.x + r.w / 2, r.y + r.h / 2];

// Cursor targets: rect (hover area) + hotspot (where the arrow tip goes)
export const TARGETS = {
  'nav-panel': { rect: navRect(0), pt: [160, 186] },
  'nav-inventario': { rect: navRect(1), pt: [160, 246] },
  'nav-plan': { rect: navRect(2), pt: [160, 306] },
  'nav-calculos': { rect: navRect(3), pt: [160, 366] },
  'measure-0': { rect: MEASURE_RECT(0), pt: [MEASURE_RECT(0).x + 44, MEASURE_RECT(0).y + 71] },
  'measure-1': { rect: MEASURE_RECT(1), pt: [MEASURE_RECT(1).x + 44, MEASURE_RECT(1).y + 71] },
  'measure-2': { rect: MEASURE_RECT(2), pt: [MEASURE_RECT(2).x + 44, MEASURE_RECT(2).y + 71] },
  apply: { rect: APPLY_RECT, pt: [APPLY_RECT.x + 250, APPLY_RECT.y + 40] },
  'watti-btn': { rect: WATTI_BTN, pt: center(WATTI_BTN) },
  'chip-medida': { rect: CHIP_RECT(1), pt: [CHIP_RECT(1).x + 190, CHIP_RECT(1).y + 26] },
};
