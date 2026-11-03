import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, BarChart3, Database, Factory, Globe2, Leaf, PiggyBank, Server, TrendingDown, Wallet, Zap } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import KpiCard from '../components/KpiCard.jsx';
import { Button, Card, CardContent, EmptyState, PageHeader, SectionTitle } from '../components/ui/UIComponents.jsx';
import { AXIS_LINE, BAR, BRAND, CHART_GRID, CURSOR, DEEMPHASIS, Legend, SERIES, TipRow, TooltipShell, X_TICK, Y_TICK } from '../components/dashboard/shared.jsx';
import { escenarioCombinado, RECOMENDACIONES } from '../lib/calc.js';
import { CATEGORIAS } from '../data/constants.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';

const ODS = [
  ['7', 'Energía asequible y no contaminante'],
  ['9', 'Industria, innovación e infraestructura'],
  ['12', 'Producción y consumo responsables'],
  ['13', 'Acción por el clima'],
];

const ConsumoTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TooltipShell title={label}>
      <TipRow label="Equipos IT" value={`${fmt(d['Equipos IT'], 1)} kWh`} color={SERIES[0]} />
      <TipRow label="Refrigeración" value={`${fmt(d['Refrigeración'], 1)} kWh`} color={SERIES[1]} />
      <TipRow label="Total" value={`${fmt(d['Equipos IT'] + d['Refrigeración'], 1)} kWh`} />
    </TooltipShell>
  );
};

const Co2Tip = ({ active, payload, label, total }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TooltipShell title={label ?? d.name}>
      <TipRow label="Huella" value={`${fmt(d.value, 1)} kg CO₂`} color={BRAND} />
      {total > 0 && <TipRow label="Del total" value={fmtPct((d.value / total) * 100)} />}
    </TooltipShell>
  );
};

export default function Dashboard() {
  const { items, settings, calculo, resetDemo } = useData();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Panel" subtitle="Consumo, costo y huella de carbono de tu infraestructura IT." />
        <EmptyState
          icon={Server}
          title="Todavía no cargaste equipos"
          actions={(
            <>
              <Button onClick={() => navigate('/inventario')}><Database className="h-4 w-4" /> Cargar inventario</Button>
              <Button variant="outline" onClick={resetDemo}><Leaf className="h-4 w-4 text-brand" /> Cargar ejemplo de demo</Button>
            </>
          )}
        >
          Agregá tu inventario IT o cargá el ejemplo de demostración para ver cómo funciona.
        </EmptyState>
      </div>
    );
  }

  const { totales, porCategoria } = calculo;
  const plan = escenarioCombinado(items, settings, RECOMENDACIONES.map((r) => r.id));

  const barData = Object.entries(porCategoria).map(([k, v]) => ({
    name: CATEGORIAS[k],
    'Equipos IT': Number(v.kWhMesIT.toFixed(1)),
    Refrigeración: Number(v.kWhRefrig.toFixed(1)),
  }));
  const co2Data = Object.entries(porCategoria)
    .map(([k, v]) => ({ name: CATEGORIAS[k], value: Number(v.co2Mes.toFixed(1)) }))
    .sort((a, b) => b.value - a.value);
  const co2Total = co2Data.reduce((s, d) => s + d.value, 0);
  const compData = [
    { name: 'Hoy', value: Number(totales.co2Mes.toFixed(1)) },
    { name: 'Con el plan', value: Number(plan.despues.totales.co2Mes.toFixed(1)) },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Panel"
        subtitle={`${settings.empresa || 'Tu empresa'} · cifras mensuales con la tarifa y el factor de emisión cargados en Inventario.`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Zap} label="Consumo mensual" value={`${fmt(totales.kWhMes)} kWh`} sub={`${fmt(totales.kWhRefrig)} kWh son refrigeración`} />
        <KpiCard icon={Wallet} label="Costo de energía por mes" value={fmtARS(totales.costoMes)} sub={`${fmtARS(totales.costoAnio)} por año`} />
        <KpiCard icon={Factory} label="Huella de carbono por mes" value={`${fmt(totales.co2Mes)} kg CO₂`} sub={`${fmt(totales.co2Anio / 1000, 1)} t CO₂ por año`} />
        <KpiCard
          icon={PiggyBank}
          label="Ahorro posible con el plan"
          value={fmtPct(plan.ahorro.pct)}
          sub={`${fmtARS(plan.ahorro.costoAnio)} y ${fmt(plan.ahorro.co2Anio / 1000, 1)} t CO₂ por año`}
          accent
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <SectionTitle
              icon={BarChart3}
              right={<Legend items={[{ label: 'Equipos IT', color: SERIES[0] }, { label: 'Refrigeración', color: SERIES[1] }]} />}
            >
              Consumo por tipo (kWh/mes)
            </SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID} vertical={false} />
                <XAxis dataKey="name" tick={X_TICK} {...AXIS_LINE} interval={0} angle={-20} textAnchor="end" height={52} />
                <YAxis tick={Y_TICK} {...AXIS_LINE} width={48} />
                <Tooltip content={<ConsumoTip />} cursor={CURSOR} />
                <Bar dataKey="Equipos IT" stackId="a" fill={SERIES[0]} maxBarSize={BAR.maxBarSize} stroke="#ffffff" strokeWidth={1} />
                <Bar dataKey="Refrigeración" stackId="a" fill={SERIES[1]} maxBarSize={BAR.maxBarSize} radius={BAR.radiusV} stroke="#ffffff" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={Leaf}>Huella de carbono por tipo (kg CO₂/mes)</SectionTitle>
            <ResponsiveContainer width="100%" height={Math.max(160, co2Data.length * 40)}>
              <BarChart data={co2Data} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={Y_TICK} {...AXIS_LINE} />
                <YAxis type="category" dataKey="name" tick={X_TICK} {...AXIS_LINE} width={118} />
                <Tooltip content={<Co2Tip total={co2Total} />} cursor={CURSOR} />
                <Bar dataKey="value" fill={BRAND} maxBarSize={BAR.maxBarSize} radius={BAR.radiusH}>
                  <LabelList dataKey="value" position="right" formatter={(v) => fmt(v, 1)} style={{ fontSize: 11, fill: '#52525b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <SectionTitle
              icon={TrendingDown}
              right={<Legend items={[{ label: 'Hoy', color: DEEMPHASIS }, { label: 'Con el plan', color: BRAND }]} />}
            >
              Hoy vs. con el plan (kg CO₂/mes)
            </SectionTitle>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={compData} margin={{ top: 24, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID} vertical={false} />
                <XAxis dataKey="name" tick={X_TICK} {...AXIS_LINE} />
                <YAxis tick={Y_TICK} {...AXIS_LINE} width={48} />
                <Tooltip content={<Co2Tip />} cursor={CURSOR} />
                <Bar dataKey="value" maxBarSize={56} radius={BAR.radiusV}>
                  <Cell fill={DEEMPHASIS} />
                  <Cell fill={BRAND} />
                  <LabelList dataKey="value" position="top" formatter={(v) => `${fmt(v, 1)} kg`} style={{ fontSize: 11, fontWeight: 600, fill: '#18181b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-3 text-xs text-muted-foreground">
              Detalle del plan en <Link className="font-medium text-brand hover:underline" to="/plan">Plan de ahorro</Link>.
              Todas las cuentas en <Link className="font-medium text-brand hover:underline" to="/calculos">Cálculos</Link>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <SectionTitle icon={Globe2}>Objetivos de Desarrollo Sostenible</SectionTitle>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ODS.map(([n, txt]) => (
                <div key={n} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">{n}</span>
                  <span className="text-xs font-medium leading-snug">{txt}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5 text-brand" />
              Cada kWh que se deja de consumir reduce el costo y las emisiones de la empresa.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
