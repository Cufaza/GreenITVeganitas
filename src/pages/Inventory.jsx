import { useState } from 'react';
import { Info, Leaf, MapPin, Pencil, Plus, Server, SlidersHorizontal, Trash2, Zap } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import ItemForm from '../components/ItemForm.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Select from '../components/ui/Select.jsx';
import {
  Button, Card, CardContent, EmptyState, Field, Input, PageHeader, SectionTitle,
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '../components/ui/UIComponents.jsx';
import { CATEGORIAS, FACTOR_EMISION, PUE, TARIFA_EDENOR_T1G, UBICACIONES } from '../data/constants.js';
import { categoriaDe } from '../lib/calc.js';
import { fmt, fmtARS } from '../lib/format.js';

const NUM = 'text-right tabular-nums whitespace-nowrap';

export default function Inventory() {
  const { items, settings, calculo, addItem, updateItem, removeItem, updateSettings, resetDemo, clearAll } = useData();
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [confirmClear, setConfirmClear] = useState(false);
  const filas = Object.fromEntries(calculo.filas.map((f) => [f.id, f]));

  const cambiarTramo = (id) => {
    const t = TARIFA_EDENOR_T1G.tramos.find((x) => x.id === id);
    updateSettings({ tarifaTramo: id, ...(t ? { tarifaARS: t.cargoVariable } : {}) });
  };
  const cambiarSala = (tipo) => updateSettings({ tipoSala: tipo, ...(PUE[tipo] ? { pue: PUE[tipo].valor } : {}) });

  const tramoOpts = [
    ...TARIFA_EDENOR_T1G.tramos.map((t) => ({ value: t.id, label: `${t.id}: ${t.rango}` })),
    { value: 'otra', label: 'Otra distribuidora (manual)' },
  ];
  const salaOpts = [
    { value: 'closet', label: `${PUE.closet.etiqueta} (PUE ${PUE.closet.valor})` },
    { value: 'sala', label: `${PUE.sala.etiqueta} (PUE ${PUE.sala.valor})` },
    { value: 'otra', label: 'Valor propio' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Inventario y parámetros" subtitle="Cargá tus equipos. Los resultados se recalculan al instante." />

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={SlidersHorizontal}>Parámetros</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Empresa" htmlFor="p-empresa">
              <Input id="p-empresa" value={settings.empresa} onChange={(e) => updateSettings({ empresa: e.target.value })} />
            </Field>
            <Field label="Tramo de tarifa (Edenor T1-G)" htmlFor="p-tramo">
              <Select id="p-tramo" value={settings.tarifaTramo} onChange={cambiarTramo} options={tramoOpts} />
            </Field>
            <Field label="Tarifa ($/kWh)" htmlFor="p-tarifa">
              <Input id="p-tarifa" type="number" min="0" step="0.001" className="tabular-nums" value={settings.tarifaARS} onChange={(e) => updateSettings({ tarifaARS: Number(e.target.value), tarifaTramo: 'otra' })} />
            </Field>
            <Field label="Factor de emisión (kg CO₂/kWh)" htmlFor="p-factor">
              <Input id="p-factor" type="number" min="0" step="0.001" className="tabular-nums" value={settings.factorEmision} onChange={(e) => updateSettings({ factorEmision: Number(e.target.value) })} />
            </Field>
            <Field label="Sala de equipos" htmlFor="p-sala">
              <Select id="p-sala" value={settings.tipoSala} onChange={cambiarSala} options={salaOpts} />
            </Field>
            <Field label="PUE" htmlFor="p-pue">
              <Input id="p-pue" type="number" min="1" step="0.05" className="tabular-nums" value={settings.pue} onChange={(e) => updateSettings({ pue: Number(e.target.value), tipoSala: 'otra' })} />
            </Field>
          </div>
          <div className="mt-4 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Valores iniciales: factor {FACTOR_EMISION.valor} ({FACTOR_EMISION.anio}, Subsecretaría de Ambiente) y tarifa Edenor {TARIFA_EDENOR_T1G.vigencia}.
              El tramo de la tarifa depende del consumo total del local, no solo del IT. Fuentes completas en Cálculos.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-brand" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Equipos</h2>
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-brand">{items.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetDemo}><Leaf className="h-3.5 w-3.5 text-brand" /><span className="hidden sm:inline">Cargar ejemplo de demo</span><span className="sm:hidden">Demo</span></Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmClear(true)}><Trash2 className="h-3.5 w-3.5" /> Vaciar</Button>
            <Button size="sm" onClick={() => setEditing('new')}><Plus className="h-3.5 w-3.5" /> Agregar equipo</Button>
          </div>
        </div>

        {!items.length ? (
          <EmptyState icon={Server} title="Sin equipos cargados" actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Agregar equipo</Button>}>
            Agregá tus PCs, monitores, servidores y equipos de red, o cargá el ejemplo de demo.
          </EmptyState>
        ) : (
          <>
            {/* Mobile: one card per item */}
            <div className="space-y-2 md:hidden">
              {items.map((i) => {
                const f = filas[i.id];
                return (
                  <div key={i.id} className="rounded-lg border bg-card p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{i.nombre}</p>
                        <p className="text-[11px] text-muted-foreground">{CATEGORIAS[categoriaDe(i)]} · ×{i.cantidad}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Editar ${i.nombre}`} onClick={() => setEditing(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Quitar ${i.nombre}`} onClick={() => removeItem(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{UBICACIONES[i.ubicacion]}</span>
                      <span>Uso {fmt(i.horasUso, 1)} h · Reposo {fmt(i.horasReposo, 1)} h</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-2">
                      <Metric label="kWh/mes" value={fmt(f.kWhMes, 1)} />
                      <Metric label="Costo/mes" value={fmtARS(f.costoMes)} />
                      <Metric label="kg CO₂/mes" value={fmt(f.co2Mes, 1)} />
                    </div>
                  </div>
                );
              })}
              <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3">
                <Metric label="Total kWh" value={fmt(calculo.totales.kWhMes, 1)} strong />
                <Metric label="Total costo" value={fmtARS(calculo.totales.costoMes)} strong />
                <Metric label="Total CO₂" value={fmt(calculo.totales.co2Mes, 1)} strong />
              </div>
            </div>

            {/* Desktop: table */}
            <Card className="hidden overflow-hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="hidden text-right xl:table-cell">Uso h/sem</TableHead>
                    <TableHead className="hidden text-right xl:table-cell">Reposo h/sem</TableHead>
                    <TableHead className="text-right">kWh/mes</TableHead>
                    <TableHead className="text-right">Costo/mes</TableHead>
                    <TableHead className="text-right">kg CO₂/mes</TableHead>
                    <TableHead className="w-24"><span className="sr-only">Acciones</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => {
                    const f = filas[i.id];
                    return (
                      <TableRow key={i.id}>
                        <TableCell>
                          <div className="font-medium">{i.nombre}</div>
                          <div className="text-[11px] text-muted-foreground">{CATEGORIAS[categoriaDe(i)]}<span className="lg:hidden"> · {UBICACIONES[i.ubicacion]}</span></div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{UBICACIONES[i.ubicacion]}</TableCell>
                        <TableCell className={NUM}>{i.cantidad}</TableCell>
                        <TableCell className={`hidden xl:table-cell ${NUM}`}>{fmt(i.horasUso, 1)}</TableCell>
                        <TableCell className={`hidden xl:table-cell ${NUM}`}>{fmt(i.horasReposo, 1)}</TableCell>
                        <TableCell className={NUM}>{fmt(f.kWhMes, 1)}</TableCell>
                        <TableCell className={NUM}>{fmtARS(f.costoMes)}</TableCell>
                        <TableCell className={NUM}>{fmt(f.co2Mes, 1)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Editar" aria-label={`Editar ${i.nombre}`} onClick={() => setEditing(i)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Quitar" aria-label={`Quitar ${i.nombre}`} onClick={() => removeItem(i.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="hidden lg:table-cell"><span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-brand" />Total</span></TableCell>
                    <TableCell className="lg:hidden">Total</TableCell>
                    <TableCell />
                    <TableCell colSpan={2} className="hidden xl:table-cell" />
                    <TableCell className={NUM}>{fmt(calculo.totales.kWhMes, 1)}</TableCell>
                    <TableCell className={`${NUM} text-brand`}>{fmtARS(calculo.totales.costoMes)}</TableCell>
                    <TableCell className={NUM}>{fmt(calculo.totales.co2Mes, 1)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </Card>
          </>
        )}
      </div>

      <ItemForm
        open={!!editing}
        item={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={(it) => {
          editing === 'new' ? addItem(it) : updateItem(it);
          setEditing(null);
        }}
      />
      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAll}
        variant="danger"
        title="¿Borrar todos los equipos?"
        description="Se eliminan todos los equipos y los parámetros vuelven a sus valores iniciales. Se conserva el nombre de la empresa."
        confirmText="Vaciar inventario"
      />
    </div>
  );
}

const Metric = ({ label, value, strong }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`truncate text-sm tabular-nums ${strong ? 'font-bold' : 'font-medium'}`}>{value}</p>
  </div>
);
