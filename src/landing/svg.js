// SVG path helpers (ported from sumar-web lib/svg-helpers.ts)
export function toPoints(vals, w, h, pad = 12, range) {
  const mn = range ? range[0] : Math.min(...vals);
  const mx = range ? range[1] : Math.max(...vals);
  return vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * w,
    y: pad + (1 - (v - mn) / (mx - mn || 1)) * (h - pad * 2),
  }));
}

export function curvePath(pts) {
  if (!pts.length) return '';
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const mx = (p.x + c.x) / 2;
    d += ` C ${mx},${p.y} ${mx},${c.y} ${c.x},${c.y}`;
  }
  return d;
}

export function fillPath(pts, h) {
  return `${curvePath(pts)} L ${pts[pts.length - 1].x},${h} L ${pts[0].x},${h} Z`;
}

export function arcPath(cx, cy, r, s, e) {
  const r2 = (d) => ((d - 90) * Math.PI) / 180;
  const sx = cx + r * Math.cos(r2(s));
  const sy = cy + r * Math.sin(r2(s));
  const ex = cx + r * Math.cos(r2(e));
  const ey = cy + r * Math.sin(r2(e));
  return `M ${sx} ${sy} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${ex} ${ey}`;
}
