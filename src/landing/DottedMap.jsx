import { MAP } from './worldDots.js';

// Rough outline of Argentina as [lon, lat]: only used to tint its dots (decorative; not a cartographic source)
const AR = [
  [-66.2, -21.9], [-62.6, -22.3], [-60.0, -24.0], [-57.8, -25.3], [-56.0, -27.3], [-54.7, -25.6], [-53.7, -26.2], [-54.0, -27.2], [-55.7, -28.2],
  [-56.5, -30.0], [-58.2, -32.5], [-58.4, -33.9], [-58.4, -34.6], [-57.2, -35.5], [-56.7, -36.4], [-57.5, -38.0], [-58.9, -38.5], [-62.3, -38.8],
  [-62.1, -40.6], [-64.9, -40.8], [-65.1, -41.2], [-63.6, -42.0], [-64.2, -42.6], [-65.0, -42.8], [-65.3, -44.9], [-67.5, -46.0], [-65.8, -47.8],
  [-67.7, -49.3], [-68.4, -50.4], [-69.2, -51.6], [-68.4, -52.35], [-69.5, -52.2], [-72.0, -51.6], [-72.9, -50.0], [-72.6, -48.5], [-72.0, -46.8],
  [-71.7, -45.4], [-71.6, -44.0], [-71.7, -42.2], [-71.8, -41.0], [-71.4, -39.5], [-70.6, -38.0], [-70.4, -36.2], [-69.9, -34.2], [-70.1, -32.5],
  [-69.8, -30.6], [-69.0, -28.5], [-68.4, -26.9], [-68.6, -25.0], [-67.0, -23.0],
];
const inside = (pt, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

const CELL = 10;
const { step, lon0, lat0, rows } = MAP;
const VIEW_W = rows[0].length * CELL;
const VIEW_H = rows.length * CELL;

const DOTS = [];
rows.forEach((row, y) => {
  for (let x = 0; x < row.length; x += 1) {
    if (row[x] !== '#') continue;
    const lon = lon0 + x * step;
    const lat = lat0 - y * step;
    DOTS.push({ cx: x * CELL + CELL / 2, cy: y * CELL + CELL / 2, ar: inside([lon, lat], AR) });
  }
});

/** Position of a lon/lat on the map, as percentages of its box. */
export const mapPos = (lon, lat) => ({
  left: `${(((lon - lon0) / step) * CELL + CELL / 2) / VIEW_W * 100}%`,
  top: `${(((lat0 - lat) / step) * CELL + CELL / 2) / VIEW_H * 100}%`,
});
export const MAP_ASPECT = `${VIEW_W} / ${VIEW_H}`;

export default function DottedMap() {
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="map-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      {DOTS.map((d) => (
        <circle key={`${d.cx}-${d.cy}`} cx={d.cx} cy={d.cy} r={d.ar ? 3.6 : 3} className={d.ar ? 'map-dot ar' : 'map-dot'} />
      ))}
    </svg>
  );
}
