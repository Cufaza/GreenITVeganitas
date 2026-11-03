import { Card, CardContent, cn } from './ui/UIComponents.jsx';

/** Canonical dashboard metric card. `accent` paints the brand wash (one per row). */
export default function KpiCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <Card className={cn(accent && 'border-brand/25 bg-brand/[0.04]')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {Icon && (
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', accent ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground')}>
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="truncate text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <div className={cn('mt-3 text-2xl font-bold tracking-tight', accent && 'text-brand')}>{value}</div>
        {sub && <div className="mt-3 border-t pt-2.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
