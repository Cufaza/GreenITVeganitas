import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Download, Info, ListChecks, PiggyBank, Printer, Server, Target } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { escenarioCombinado, evaluarRecomendaciones } from '../lib/calc.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';
import { CATEGORIAS } from '../data/constants.js';
import {
  Button, Card, CardContent, EmptyState, PageHeader, SectionTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn,
} from '../components/ui/UIComponents.jsx';

const NUM = 'text-right tabular-nums whitespace-nowrap';

function descargarCSV(filas, settings) {
  const cab = ['Equipo', 'Tipo', 'Cantidad', 'kWh IT/mes', 'kWh refrigeración/mes', 'kWh total/mes', `Costo/mes (ARS, ${settings.tarifaARS} $/kWh)`, `kg CO2/mes (${settings.factorEmision} kg/kWh)`];
  const rows = filas.map((f) => [f.nombre, CATEGORIAS[f.categoria], f.cantidad, f.kWhMesIT.toFixed(2), f.kWhRefrig.toFixed(2), f.kWhMes.toFixed(2), f.costoMes.toFixed(0), f.co2Mes.toFixed(2)]);
  const csv = [cab, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'greenit-calc-inventario.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Plan() {
  const { items, settings, calculo } = useData();
  const navigate = useNavigate();
  const [excluidas, setExcluidas] = useState([]);
  const recs = evaluarRecomendaciones(items, settings);
  const elegidas = recs.filter((r) => r.esAplicable && !excluidas.includes(r.id)).map((r) => r.id);
  const comb = escenarioCombinado(items, settings, elegidas);
  const toggle = (id) => setExcluidas((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  if (!items.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Plan de ahorro" />
        <EmptyState icon={PiggyBank} title="Todavía no hay equipos para simular" actions={<Button onClick={() => navigate('/inventario')}><Server className="h-4 w-4" /> Ir a Inventario</Button>}>
          Primero cargá equipos en Inventario.
        </EmptyState>
      </div>
    );
  }

  const b = comb.base.totales, d = comb.despues.totales;
  const filas = [
    ['Consumo (kWh/mes)', fmt(b.kWhMes, 1), fmt(d.kWhMes, 1), `${fmt(comb.ahorro.kWhMes, 1)} (${fmtPct(comb.ahorro.pct)})`],
    ['Costo de energía (ARS/mes)', fmtARS(b.costoMes), fmtARS(d.costoMes), fmtARS(comb.ahorro.costoMes)],
    ['Huella (kg CO₂/mes)', fmt(b.co2Mes, 1), fmt(d.co2Mes, 1), fmt(comb.ahorro.co2Mes, 1)],
    ['Costo de energía (ARS/año)', fmtARS(b.costoAnio), fmtARS(d.costoAnio), fmtARS(comb.ahorro.costoAnio)],
    ['Huella (t CO₂/año)', fmt(b.co2Anio / 1000, 2), fmt(d.co2Anio / 1000, 2), fmt(comb.ahorro.co2Anio / 1000, 2)],
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Plan de ahorro"
        subtitle="Elegí las medidas y mirá el efecto combinado. Cada una se simula sobre una copia de tu inventario."
        actions={(
          <>
            <Button variant="outline" size="sm" onClick={() => descargarCSV(calculo.filas, settings)}><Download className="h-3.5 w-3.5" /> Descargar CSV</Button>
            <Button size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Imprimir o guardar PDF</Button>
          </>
        )}
      />

      <div>
        <SectionTitle
          icon={ListChecks}
          right={<span className="text-xs text-muted-foreground"><b className="tabular-nums text-foreground">{elegidas.length}</b> de {recs.filter((r) => r.esAplicable).length} medidas elegidas</span>}
        >
          Medidas recomendadas
        </SectionTitle>
        <div className="space-y-3">
          {recs.map((r) => {
            const on = elegidas.includes(r.id);
            return (
              <label
                key={r.id}
                className={cn(
                  'flex gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors print-break-avoid',
                  r.esAplicable ? 'cursor-pointer hover:border-brand/40' : 'cursor-not-allowed opacity-60',
                  on && 'border-brand/40 bg-brand/[0.03] ring-1 ring-brand/30',
                )}
              >
                <input type="checkbox" className="peer sr-only" disabled={!r.esAplicable} checked={on} onChange={() => toggle(r.id)} />
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 print:hidden',
                    on ? 'border-brand bg-brand text-brand-foreground' : 'border-input bg-background',
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-semibold">{r.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{r.descripcion}</p>
                  <p className="text-xs text-muted-foreground/80">{r.supuesto}</p>
                  {r.esAplicable ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Saving value={`${fmt(r.ahorro.kWhMes)} kWh/mes`} sub={fmtPct(r.ahorro.pct)} />
                      <Saving value={`${fmtARS(r.ahorro.costoMes)}/mes`} />
                      <Saving value={`${fmt(r.ahorro.co2Mes)} kg CO₂/mes`} />
                    </div>
                  ) : (
                    <p className="pt-1 text-xs font-medium text-muted-foreground">No aplica a tu inventario actual.</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Target}>Resultado de las medidas elegidas</SectionTitle>

          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {filas.map(([label, hoy, plan, ahorro]) => (
              <div key={label} className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-semibold">{label}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Cell label="Hoy" value={hoy} />
                  <Cell label="Con el plan" value={plan} />
                  <Cell label="Ahorro" value={ahorro} brand />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicador</TableHead>
                  <TableHead className="text-right">Hoy</TableHead>
                  <TableHead className="text-right">Con el plan</TableHead>
                  <TableHead className="text-right">Ahorro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map(([label, hoy, plan, ahorro]) => (
                  <TableRow key={label}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className={NUM}>{hoy}</TableCell>
                    <TableCell className={NUM}>{plan}</TableCell>
                    <TableCell className={`${NUM} font-semibold text-brand`}>{ahorro}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              El ahorro combinado no es la suma de los individuales: las medidas se aplican en orden y cada una parte del resultado de la anterior
              (por ejemplo, si se retira un servidor, mejorar el PUE ahorra menos). Los importes usan solo el cargo variable de energía, sin cargo fijo ni impuestos.
              Revisá el método en <Link className="font-semibold underline-offset-2 hover:underline" to="/calculos">Cálculos</Link>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const Saving = ({ value, sub }) => (
  <span className="inline-flex items-baseline gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-700">
    {value}{sub && <span className="font-normal text-emerald-700/70">({sub})</span>}
  </span>
);

const Cell = ({ label, value, brand }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={cn('text-sm font-medium tabular-nums', brand && 'font-semibold text-brand')}>{value}</p>
  </div>
);
