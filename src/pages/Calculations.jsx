import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, ChevronDown, Database, ExternalLink, FunctionSquare, ListOrdered, PiggyBank, Sigma, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { CATALOGO } from '../data/catalog.js';
import { CATEGORIAS, FACTOR_EMISION, FUENTES, HORAS_SEMANA, PUE, SEMANAS_MES, TARIFA_EDENOR_T1G } from '../data/constants.js';
import { evaluarRecomendaciones, escenarioCombinado } from '../lib/calc.js';
import { fmt, fmtARS } from '../lib/format.js';
import {
  Card, CardContent, PageHeader, SectionTitle,
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '../components/ui/UIComponents.jsx';

const NUM = 'text-right tabular-nums whitespace-nowrap';
const LINK = 'inline-flex items-center gap-1 font-medium text-brand hover:underline';

const Formula = ({ children }) => (
  <pre className="overflow-x-auto rounded-lg bg-primary p-4 font-mono text-xs leading-relaxed text-primary-foreground">{children}</pre>
);

const Source = ({ href }) => (
  <a className={LINK} href={href} target="_blank" rel="noreferrer">Ver fuente <ExternalLink className="h-3 w-3" /></a>
);

const Section = ({ icon, title, children }) => (
  <Card>
    <CardContent className="p-5">
      <SectionTitle icon={icon}>{title}</SectionTitle>
      {children}
    </CardContent>
  </Card>
);

const Note = ({ children }) => <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{children}</p>;

function DetalleEquipo({ f, settings }) {
  const { pot } = f;
  const x = (v, d = 2) => fmt(v, d);
  const steps = [
    ['Potencia en uso.', <>
      {pot.interpolado
        ? `P_uso = P_reposo + carga × (P_máx − P_reposo) = ${x(pot.reposo)} + ${x(pot.carga / 100)} × (${x(pot.max)} − ${x(pot.reposo)}) = ${x(pot.uso)} W`
        : `P_uso = ${x(pot.uso)} W (valor del catálogo o cargado por el usuario)`}
      . Reposo: {x(pot.reposo)} W. Apagado: {x(pot.apagado)} W.
    </>],
    ['Horas apagado por semana.', <>
      {HORAS_SEMANA} − {x(f.hUso, 1)} − {x(f.hReposo, 1)} = {x(f.hOff, 1)} h
      {f.excedeHoras && (
        <span className="ml-1 inline-flex items-center gap-1 font-medium text-destructive">
          <AlertTriangle className="h-3 w-3" /> las horas superan la semana, revisá el inventario
        </span>
      )}
    </>],
    ['Energía semanal de una unidad.', <>{x(pot.uso)} × {x(f.hUso, 1)} + {x(pot.reposo)} × {x(f.hReposo, 1)} + {x(pot.apagado)} × {x(f.hOff, 1)} = {x(f.whSemanaUnidad, 1)} Wh</>],
    [`Energía semanal de los ${f.cantidad} equipos.`, <>{f.cantidad} × {x(f.whSemanaUnidad, 1)} ÷ 1000 = {x(f.kWhSemanaIT, 3)} kWh</>],
    ['Energía mensual IT.', <>{x(f.kWhSemanaIT, 3)} × {x(SEMANAS_MES, 4)} = {x(f.kWhMesIT, 2)} kWh</>],
    ['Refrigeración y pérdidas.', f.enSala
      ? `${x(f.kWhMesIT, 2)} × (PUE ${x(f.pue)} − 1) = ${x(f.kWhRefrig, 2)} kWh`
      : 'El equipo está en la oficina: no se suma refrigeración (0 kWh).'],
    ['Energía mensual total.', <>{x(f.kWhMesIT, 2)} + {x(f.kWhRefrig, 2)} = <b className="text-foreground">{x(f.kWhMes, 2)} kWh</b></>],
    ['Costo.', <>{x(f.kWhMes, 2)} kWh × {x(settings.tarifaARS, 3)} $/kWh = <b className="text-foreground">{fmtARS(f.costoMes)}</b></>],
    ['Huella de carbono.', <>{x(f.kWhMes, 2)} kWh × {x(settings.factorEmision, 3)} kg CO₂/kWh = <b className="text-foreground">{x(f.co2Mes, 2)} kg CO₂</b></>],
  ];
  return (
    <details className="group overflow-hidden rounded-lg border bg-card shadow-sm print-break-avoid">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/40">
        <span className="flex items-center gap-2 font-semibold">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          {f.nombre}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">{x(f.kWhMes, 1)} kWh/mes · {fmtARS(f.costoMes)} · {x(f.co2Mes, 1)} kg CO₂</span>
      </summary>
      <ol className="space-y-2.5 border-t bg-muted/20 px-4 py-4">
        {steps.map(([title, body], i) => (
          <li key={i} className="flex gap-3 text-[13px]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">{i + 1}</span>
            <span className="text-muted-foreground"><b className="font-semibold text-foreground">{title}</b> {body}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export default function Calculations() {
  const { items, settings, calculo } = useData();
  const { filas, totales } = calculo;
  const recs = evaluarRecomendaciones(items, settings);
  const comb = escenarioCombinado(items, settings, recs.filter((r) => r.esAplicable).map((r) => r.id));

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Cálculos y fuentes"
        subtitle={<>Cada número del panel sale de las fórmulas de esta página, con los parámetros que tenés cargados en <Link className={LINK} to="/inventario">Inventario</Link>.</>}
      />

      <Section icon={SlidersHorizontal} title="1. Parámetros usados y su fuente">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Parámetro</TableHead><TableHead className="text-right">Valor actual</TableHead><TableHead className="min-w-[260px]">Origen</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Factor de emisión de la red eléctrica</TableCell>
                <TableCell className={NUM}>{fmt(settings.factorEmision, 3)} kg CO₂/kWh</TableCell>
                <TableCell className="text-muted-foreground">{FACTOR_EMISION.fuente} Valor de {FACTOR_EMISION.anio}. <Source href={FACTOR_EMISION.url} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tarifa de energía</TableCell>
                <TableCell className={NUM}>{fmt(settings.tarifaARS, 3)} $/kWh</TableCell>
                <TableCell className="text-muted-foreground">{TARIFA_EDENOR_T1G.fuente} Cargo variable por tramo: {TARIFA_EDENOR_T1G.tramos.map((t) => `${t.id} ${fmt(t.cargoVariable, 3)}`).join(', ')}. <Source href={TARIFA_EDENOR_T1G.url} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">PUE de la sala de equipos</TableCell>
                <TableCell className={NUM}>{fmt(settings.pue, 2)}</TableCell>
                <TableCell className="text-muted-foreground">{PUE.fuente} Armario: {PUE.closet.valor}. Sala: {PUE.sala.valor}. Mejorado: {PUE.mejorado}. <Source href={PUE.url} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Horas por semana / semanas por mes</TableCell>
                <TableCell className={NUM}>{HORAS_SEMANA} / {fmt(SEMANAS_MES, 4)}</TableCell>
                <TableCell className="text-muted-foreground">Semana de 7 × 24 h. Mes promedio = 52 ÷ 12 semanas.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section icon={FunctionSquare} title="2. Fórmulas">
        <Formula>{`horas apagado   = 168 − horas uso − horas reposo
kWh semana (IT) = cantidad × (P_uso × h_uso + P_reposo × h_reposo + P_apagado × h_apagado) ÷ 1000
kWh mes (IT)    = kWh semana × 52 ÷ 12
refrigeración   = kWh mes (IT) × (PUE − 1)        solo para equipos en sala de servidores
kWh mes total   = kWh mes (IT) + refrigeración
costo mes       = kWh mes total × tarifa ($/kWh)
CO₂ mes (kg)    = kWh mes total × factor de emisión (kg CO₂/kWh)
Servidores      : P_uso = P_reposo + carga% × (P_máx − P_reposo)`}</Formula>
        <Note>
          El PUE (Power Usage Effectiveness) es la energía total de la sala dividida por la energía de los equipos IT. Un PUE de 2,5 significa que por cada kWh que usan los equipos, la sala gasta 1,5 kWh más en refrigeración y pérdidas.
        </Note>
      </Section>

      <section>
        <SectionTitle icon={ListOrdered}>3. Cuenta paso a paso por equipo</SectionTitle>
        {filas.length ? (
          <div className="space-y-2">{filas.map((f) => <DetalleEquipo key={f.id} f={f} settings={settings} />)}</div>
        ) : (
          <div className="rounded-lg border-2 border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Sin equipos cargados.</div>
        )}
      </section>

      <Section icon={Sigma} title="4. Totales">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Equipo</TableHead><TableHead className="text-right">kWh IT/mes</TableHead><TableHead className="text-right">Refrigeración</TableHead><TableHead className="text-right">kWh total/mes</TableHead><TableHead className="text-right">Costo/mes</TableHead><TableHead className="text-right">kg CO₂/mes</TableHead></TableRow></TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.id}><TableCell className="font-medium">{f.nombre}</TableCell><TableCell className={NUM}>{fmt(f.kWhMesIT, 1)}</TableCell><TableCell className={NUM}>{fmt(f.kWhRefrig, 1)}</TableCell><TableCell className={NUM}>{fmt(f.kWhMes, 1)}</TableCell><TableCell className={NUM}>{fmtARS(f.costoMes)}</TableCell><TableCell className={NUM}>{fmt(f.co2Mes, 1)}</TableCell></TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow><TableCell>Total mensual</TableCell><TableCell className={NUM}>{fmt(totales.kWhMesIT, 1)}</TableCell><TableCell className={NUM}>{fmt(totales.kWhRefrig, 1)}</TableCell><TableCell className={NUM}>{fmt(totales.kWhMes, 1)}</TableCell><TableCell className={`${NUM} text-brand`}>{fmtARS(totales.costoMes)}</TableCell><TableCell className={NUM}>{fmt(totales.co2Mes, 1)}</TableCell></TableRow>
              <TableRow><TableCell>Total anual (× 12)</TableCell><TableCell className={NUM}>{fmt(totales.kWhMesIT * 12, 0)}</TableCell><TableCell className={NUM}>{fmt(totales.kWhRefrig * 12, 0)}</TableCell><TableCell className={NUM}>{fmt(totales.kWhAnio, 0)}</TableCell><TableCell className={`${NUM} text-brand`}>{fmtARS(totales.costoAnio)}</TableCell><TableCell className={NUM}>{fmt(totales.co2Anio, 0)}</TableCell></TableRow>
            </TableFooter>
          </Table>
        </div>
        <Note>PUE efectivo del conjunto: <b className="tabular-nums text-foreground">{fmt(totales.pueEfectivo, 2)}</b> (energía total ÷ energía de equipos IT).</Note>
      </Section>

      <Section icon={PiggyBank} title="5. Cómo se calcula el ahorro">
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Cada recomendación modifica una copia del inventario y se vuelve a ejecutar exactamente el mismo cálculo. El ahorro es la diferencia entre el resultado de hoy y el del escenario.
          Para el plan combinado, las medidas se aplican en orden, cada una sobre el resultado de la anterior.
        </p>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Medida</TableHead><TableHead className="min-w-[240px]">Cambio en el inventario</TableHead><TableHead className="text-right">Ahorro kWh/mes</TableHead><TableHead className="text-right">Ahorro $/mes</TableHead><TableHead className="text-right">Ahorro kg CO₂/mes</TableHead></TableRow></TableHeader>
            <TableBody>
              {recs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.titulo}</TableCell>
                  <TableCell className="text-muted-foreground">{r.supuesto}</TableCell>
                  {r.esAplicable ? (
                    <><TableCell className={NUM}>{fmt(r.ahorro.kWhMes, 1)}</TableCell><TableCell className={NUM}>{fmtARS(r.ahorro.costoMes)}</TableCell><TableCell className={NUM}>{fmt(r.ahorro.co2Mes, 1)}</TableCell></>
                  ) : (
                    <TableCell className="text-right text-xs text-muted-foreground" colSpan={3}>No aplica</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow><TableCell colSpan={2}>Plan combinado (en orden)</TableCell><TableCell className={NUM}>{fmt(comb.ahorro.kWhMes, 1)}</TableCell><TableCell className={`${NUM} text-brand`}>{fmtARS(comb.ahorro.costoMes)}</TableCell><TableCell className={NUM}>{fmt(comb.ahorro.co2Mes, 1)}</TableCell></TableRow>
            </TableFooter>
          </Table>
        </div>
      </Section>

      <Section icon={Database} title="6. Catálogo de potencias">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Equipo</TableHead><TableHead className="text-right">Uso / máx.</TableHead><TableHead className="text-right">Reposo</TableHead><TableHead className="text-right">Apagado</TableHead><TableHead className="min-w-[160px]">Rango publicado</TableHead><TableHead className="min-w-[200px]">Fuente</TableHead><TableHead>Confianza</TableHead></TableRow></TableHeader>
            <TableBody>
              {CATALOGO.filter((c) => c.id !== 'otro').map((c) => (
                <TableRow key={c.id}>
                  <TableCell><div className="font-medium">{c.nombre}</div><div className="text-[11px] text-muted-foreground">{CATEGORIAS[c.categoria]}</div></TableCell>
                  <TableCell className={NUM}>{c.potenciaMaxW ? `máx. ${c.potenciaMaxW} W` : `${c.potenciaUsoW} W`}</TableCell>
                  <TableCell className={NUM}>{c.potenciaReposoW} W</TableCell>
                  <TableCell className={NUM}>{c.potenciaApagadoW} W</TableCell>
                  <TableCell className="text-muted-foreground">{c.rango}</TableCell>
                  <TableCell className="text-muted-foreground">{c.fuente}</TableCell>
                  <TableCell><span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">{c.confianza}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section icon={TriangleAlert} title="7. Supuestos y límites">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            'Las potencias del catálogo son valores de referencia publicados. Para mayor precisión, reemplácelas por la etiqueta o la medición del equipo real (Inventario, Ajustar potencias).',
            'El costo incluye solo el cargo variable de energía. No incluye cargo fijo, impuestos ni cargos por potencia.',
            'El tramo de tarifa depende del consumo total del local; el consumo IT es solo una parte.',
            `El factor de emisión es un promedio anual de la red argentina (año ${FACTOR_EMISION.anio}). No distingue la hora del día.`,
            'La refrigeración se estima con el PUE típico de cada tipo de sala; no reemplaza la medición del consumo del aire acondicionado.',
            'El ahorro de cada medida es una estimación por simulación, no una garantía.',
            'Los datos de demostración pertenecen a una empresa ficticia.',
          ].map((t) => (
            <li key={t} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}</li>
          ))}
        </ul>
      </Section>

      <Section icon={BookOpen} title="8. Fuentes">
        <ol className="space-y-3">
          {FUENTES.map((s, i) => (
            <li key={s.id} className="flex gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
              <span className="min-w-0">
                <span className="text-foreground">{s.titulo}</span>{' '}
                <a className="break-all text-xs text-brand hover:underline" href={s.url} target="_blank" rel="noreferrer">{s.url}</a>
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
