const cache = new Map();
const nf = (d) => {
  if (!cache.has(d)) cache.set(d, new Intl.NumberFormat('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }));
  return cache.get(d);
};

export const fmt = (v, d = 0) => nf(d).format(Number.isFinite(v) ? v : 0);
export const fmtKwh = (v, d = 0) => `${fmt(v, d)} kWh`;
export const fmtKg = (v, d = 0) => `${fmt(v, d)} kg CO₂`;
export const fmtPct = (v, d = 0) => `${fmt(v, d)}%`;

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
export const fmtARS = (v) => ars.format(Number.isFinite(v) ? v : 0);
