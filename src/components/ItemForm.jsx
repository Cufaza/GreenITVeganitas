import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ChevronDown, Clock, Save, X } from 'lucide-react';
import { CATALOGO, CATALOGO_POR_ID } from '../data/catalog.js';
import { UBICACIONES, HORAS_SEMANA } from '../data/constants.js';
import Select from './ui/Select.jsx';
import { Button, Field, Input, cn, useModalAnimation } from './ui/UIComponents.jsx';
import { backdropClose } from './ui/backdropClose.js';

const POT = [
  ['potenciaUsoW', 'En uso (W)', 'potenciaUsoW'],
  ['potenciaReposoW', 'En reposo (W)', 'potenciaReposoW'],
  ['potenciaApagadoW', 'Apagado (W)', 'potenciaApagadoW'],
  ['potenciaMaxW', 'Máxima (W)', 'potenciaMaxW'],
];

const CATALOGO_OPTS = CATALOGO.map((c) => ({ value: c.id, label: c.nombre }));
const UBICACION_OPTS = Object.entries(UBICACIONES).map(([value, label]) => ({ value, label }));

/** Add / edit equipment modal. Mounts a fresh form on every open. */
export default function ItemForm({ open, item, onSave, onCancel }) {
  const { visible, overlayClass, modalClass } = useModalAnimation(open);
  const last = useRef(item);
  const session = useRef(0);
  const wasOpen = useRef(false);
  if (open) last.current = item; // keep content stable during the exit animation
  if (open && !wasOpen.current) session.current += 1; // fresh form state on every open, even mid-exit
  wasOpen.current = open;
  if (!visible) return null;
  return createPortal(
    <div className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm ${overlayClass}`} {...backdropClose(onCancel)}>
      <FormBody key={session.current} className={modalClass} item={last.current} onSave={onSave} onCancel={onCancel} />
    </div>,
    document.body,
  );
}

function FormBody({ className, item, onSave, onCancel }) {
  const first = item ? CATALOGO_POR_ID[item.catalogId] : CATALOGO[0];
  const [f, setF] = useState(
    item
      ? { ...item }
      : { catalogId: first.id, nombre: first.nombre, cantidad: 1, ...first.defaults },
  );
  const cat = CATALOGO_POR_ID[f.catalogId];
  const esServidor = cat.categoria === 'servidor';
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const cambiarTipo = (id) => {
    const c = CATALOGO_POR_ID[id];
    setF((p) => ({
      catalogId: id,
      id: p.id,
      cantidad: p.cantidad,
      nombre: !p.nombre || p.nombre === cat.nombre ? c.nombre : p.nombre,
      ...c.defaults,
    }));
  };

  const suma = Number(f.horasUso || 0) + Number(f.horasReposo || 0);
  const error = suma > HORAS_SEMANA ? `Las horas de uso y reposo suman ${suma}, y la semana tiene ${HORAS_SEMANA}.` : '';

  const submit = (e) => {
    e.preventDefault();
    if (error) return;
    const out = {
      ...f,
      cantidad: Number(f.cantidad),
      horasUso: Number(f.horasUso),
      horasReposo: Number(f.horasReposo),
      cargaPct: Number(f.cargaPct ?? 100),
    };
    for (const [k] of POT) {
      if (out[k] === '' || out[k] === undefined || out[k] === null) delete out[k];
      else out[k] = Number(out[k]);
    }
    onSave(out);
  };

  const hoursInvalid = !!error;

  return (
    <form
      onSubmit={submit}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-form-title"
      className={cn('flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-secondary/20 px-6 py-4">
        <div>
          <h2 id="item-form-title" className="text-xl font-bold tracking-tight">{item ? 'Editar equipo' : 'Agregar equipo'}</h2>
          <p className="text-xs text-muted-foreground">Las potencias se completan con valores de referencia del catálogo.</p>
        </div>
        <button type="button" aria-label="Cerrar" onClick={onCancel} className="rounded-full p-2 transition-colors hover:bg-secondary">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de equipo" htmlFor="f-tipo">
            <Select id="f-tipo" value={f.catalogId} onChange={cambiarTipo} options={CATALOGO_OPTS} />
          </Field>
          <Field label="Nombre o descripción" htmlFor="f-nombre">
            <Input id="f-nombre" required value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </Field>
          <Field label="Cantidad" htmlFor="f-cantidad">
            <Input id="f-cantidad" type="number" min="1" step="1" required className="tabular-nums" value={f.cantidad} onChange={(e) => set('cantidad', e.target.value)} />
          </Field>
          <Field label="Ubicación" htmlFor="f-ubicacion">
            <Select id="f-ubicacion" value={f.ubicacion} onChange={(v) => set('ubicacion', v)} options={UBICACION_OPTS} />
          </Field>
          <Field label="Horas por semana en uso" htmlFor="f-uso">
            <Input id="f-uso" type="number" min="0" max="168" step="0.5" required aria-invalid={hoursInvalid}
              className={cn('tabular-nums', hoursInvalid && 'border-destructive focus-visible:ring-destructive/30')}
              value={f.horasUso} onChange={(e) => set('horasUso', e.target.value)} />
          </Field>
          <Field label="Horas por semana encendido sin uso" htmlFor="f-reposo">
            <Input id="f-reposo" type="number" min="0" max="168" step="0.5" required aria-invalid={hoursInvalid}
              className={cn('tabular-nums', hoursInvalid && 'border-destructive focus-visible:ring-destructive/30')}
              value={f.horasReposo} onChange={(e) => set('horasReposo', e.target.value)} />
          </Field>
          {esServidor && (
            <Field label="Carga promedio de CPU (%)" htmlFor="f-carga">
              <Input id="f-carga" type="number" min="0" max="100" step="1" className="tabular-nums" value={f.cargaPct} onChange={(e) => set('cargaPct', e.target.value)} />
            </Field>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Horas apagado: <b className="tabular-nums text-foreground">{Math.max(0, HORAS_SEMANA - suma)} h</b> por semana (la semana tiene {HORAS_SEMANA} h).
        </p>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-r-md border-l-4 border-destructive bg-destructive/10 p-3 text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <details className="group rounded-lg border border-border/60 bg-secondary/20" open={cat.id === 'otro'}>
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-semibold">
            {cat.id === 'otro' ? 'Potencias del equipo (obligatorio)' : 'Ajustar potencias (opcional)'}
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 border-t border-border/60 px-4 pb-4 pt-3">
            <p className="text-xs text-muted-foreground">Origen del valor por defecto: {cat.fuente}. {cat.rango}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {POT.filter(([k]) => (k === 'potenciaMaxW' ? esServidor : true)).map(([k, label]) => (
                <Field key={k} label={label} htmlFor={`f-${k}`}>
                  <Input
                    id={`f-${k}`}
                    type="number" min="0" step="0.1"
                    className="tabular-nums"
                    value={f[k] ?? ''}
                    placeholder={cat[k] !== undefined ? String(cat[k]) : '0'}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </div>
        </details>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-2 border-t bg-muted/20 p-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="w-full min-w-[140px] sm:w-auto" disabled={!!error}>
          <Save className="h-4 w-4" /> Guardar
        </Button>
      </div>
    </form>
  );
}
