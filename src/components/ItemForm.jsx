import { useState } from 'react';
import { CATALOGO, CATALOGO_POR_ID } from '../data/catalog.js';
import { UBICACIONES, HORAS_SEMANA } from '../data/constants.js';

const POT = [
  ['potenciaUsoW', 'En uso (W)', 'potenciaUsoW'],
  ['potenciaReposoW', 'En reposo (W)', 'potenciaReposoW'],
  ['potenciaApagadoW', 'Apagado (W)', 'potenciaApagadoW'],
  ['potenciaMaxW', 'Máxima (W)', 'potenciaMaxW'],
];

export default function ItemForm({ item, onSave, onCancel }) {
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

  return (
    <div className="modal-bg" onClick={onCancel}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{item ? 'Editar equipo' : 'Agregar equipo'}</h2>
        <div className="grid2">
          <label>Tipo de equipo
            <select value={f.catalogId} onChange={(e) => cambiarTipo(e.target.value)}>
              {CATALOGO.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label>Nombre o descripción
            <input required value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </label>
          <label>Cantidad
            <input type="number" min="1" step="1" required value={f.cantidad} onChange={(e) => set('cantidad', e.target.value)} />
          </label>
          <label>Ubicación
            <select value={f.ubicacion} onChange={(e) => set('ubicacion', e.target.value)}>
              {Object.entries(UBICACIONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Horas por semana en uso
            <input type="number" min="0" max="168" step="0.5" required value={f.horasUso} onChange={(e) => set('horasUso', e.target.value)} />
          </label>
          <label>Horas por semana encendido sin uso
            <input type="number" min="0" max="168" step="0.5" required value={f.horasReposo} onChange={(e) => set('horasReposo', e.target.value)} />
          </label>
          {esServidor && (
            <label>Carga promedio de CPU (%)
              <input type="number" min="0" max="100" step="1" value={f.cargaPct} onChange={(e) => set('cargaPct', e.target.value)} />
            </label>
          )}
        </div>
        <p className="hint">Horas apagado: {Math.max(0, HORAS_SEMANA - suma)} h por semana (la semana tiene {HORAS_SEMANA} h).</p>
        {error && <p className="error">{error}</p>}
        <details className="adv" open={cat.id === 'otro'}>
          <summary>{cat.id === 'otro' ? 'Potencias del equipo (obligatorio)' : 'Ajustar potencias (opcional)'}</summary>
          <p className="hint">Origen del valor por defecto: {cat.fuente}. {cat.rango}</p>
          <div className="grid2">
            {POT.filter(([k]) => (k === 'potenciaMaxW' ? esServidor : true)).map(([k, label]) => (
              <label key={k}>{label}
                <input
                  type="number" min="0" step="0.1"
                  value={f[k] ?? ''}
                  placeholder={cat[k] !== undefined ? String(cat[k]) : '0'}
                  onChange={(e) => set(k, e.target.value)}
                />
              </label>
            ))}
          </div>
        </details>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn" disabled={!!error}>Guardar</button>
        </div>
      </form>
    </div>
  );
}
