// Chart tokens. Palette validated with dataviz/scripts/validate_palette.js (light, #ffffff):
// "#2E7D32,#2563eb" → ALL PASS. Do not add slots or cycle colors.
// BRAND mirrors --brand in styles.css; keep both in sync.
export const BRAND = '#2E7D32';
export const SERIES = [BRAND, '#2563eb'];
export const DEEMPHASIS = '#cbd5e1'; // below 3:1 → always paired with direct value labels
export const CHART_GRID = { stroke: '#eef0f2' };
export const X_TICK = { fontSize: 11, fill: '#52525b' };
export const Y_TICK = { fontSize: 10, fill: '#94a3b8' };
export const AXIS_LINE = { axisLine: false, tickLine: false };
export const BAR = { maxBarSize: 24, radiusV: [4, 4, 0, 0], radiusH: [0, 4, 4, 0] };
export const CURSOR = { fill: 'rgba(46,125,50,0.05)' };

/** Recharts custom tooltip shell. */
export const TooltipShell = ({ title, children }) => (
  <div className="min-w-[170px] rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
    {title && <p className="mb-1.5 font-semibold text-foreground">{title}</p>}
    <div className="space-y-1">{children}</div>
  </div>
);

export const TipRow = ({ label, value, color }) => (
  <div className="flex items-center gap-3">
    {color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />}
    <span className="text-muted-foreground">{label}</span>
    <span className="ml-auto font-semibold tabular-nums text-foreground">{value}</span>
  </div>
);

/** Legend for >= 2 series (goes in SectionTitle `right`). */
export const Legend = ({ items }) => (
  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
    {items.map(({ label, color }) => (
      <span key={label} className="flex items-center gap-1.5">
        <span className="h-2 w-3 rounded-full" style={{ background: color }} />
        {label}
      </span>
    ))}
  </div>
);
