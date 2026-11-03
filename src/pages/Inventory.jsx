import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import ItemForm from '../components/ItemForm.jsx';
import { CATEGORIAS, FACTOR_EMISION, PUE, TARIFA_EDENOR_T1G, UBICACIONES } from '../data/constants.js';
import { categoriaDe } from '../lib/calc.js';
import { fmt, fmtARS } from '../lib/format.js';

export default function Inventory() {
  const { items, settings, calculo, addItem, updateItem, removeItem, updateSettings, resetDemo, clearAll } = useData();
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const filas = Object.fromEntries(calculo.filas.map((f) => [f.id, f]));

  const cambiarTramo = (id) => {
    const t = TARIFA_EDENOR_T1G.tramos.find((x) => x.id === id);
    updateSettings({ tarifaTramo: id, ...(t ? { tarifaARS: t.cargoVariable } : {}) });
  };
  const cambiarSala = (tipo) => updateSettings({ tipoSala: tipo, ...(PUE[tipo] ? { pue: PUE[tipo].valor } : {}) });

  return (
    <>
      <header className="page-head">
        <h1>Inventario y parámetros</h1>
        <p>Cargá tus equipos. Los resultados se recalculan al instante.</p>
      </header>

      <section className="card">
        <h2>Parámetros</h2>
        <div className="grid3">
          <label>Empresa
            <input value={settings.empresa} onChange={(e) => updateSettings({ empresa: e.target.value })} />
          </label>
          <label>Tramo de tarifa (Edenor T1-G)
            <select value={settings.tarifaTramo} onChange={(e) => cambiarTramo(e.target.value)}>
              {TARIFA_EDENOR_T1G.tramos.map((t) => <option key={t.id} value={t.id}>{t.id}: {t.rango}</option>)}
              <option value="otra">Otra distribuidora (manual)</option>
            </select>
          </label>
          <label>Tarifa ($/kWh)
            <input type="number" min="0" step="0.001" value={settings.tarifaARS} onChange={(e) => updateSettings({ tarifaARS: Number(e.target.value), tarifaTramo: 'otra' })} />
          </label>
          <label>Factor de emisión (kg CO₂/kWh)
            <input type="number" min="0" step="0.001" value={settings.factorEmision} onChange={(e) => updateSettings({ factorEmision: Number(e.target.value) })} />
          </label>
          <label>Sala de equipos
            <select value={settings.tipoSala} onChange={(e) => cambiarSala(e.target.value)}>
              <option value="closet">{PUE.closet.etiqueta} (PUE {PUE.closet.valor})</option>
              <option value="sala">{PUE.sala.etiqueta} (PUE {PUE.sala.valor})</option>
              <option value="otra">Valor propio</option>
            </select>
          </label>
          <label>PUE
            <input type="number" min="1" step="0.05" value={settings.pue} onChange={(e) => updateSettings({ pue: Number(e.target.value), tipoSala: 'otra' })} />
          </label>
        </div>
        <p className="hint">
          Valores iniciales: factor {FACTOR_EMISION.valor} ({FACTOR_EMISION.anio}, Subsecretaría de Ambiente) y tarifa Edenor {TARIFA_EDENOR_T1G.vigencia}.
          El tramo de la tarifa depende del consumo total del local, no solo del IT. Fuentes completas en Cálculos.
        </p>
      </section>

      <section className="card">
        <div className="row-between">
          <h2>Equipos ({items.length})</h2>
          <div className="actions">
            <button className="btn btn-ghost" onClick={resetDemo}>Cargar ejemplo de demo</button>
            <button className="btn btn-ghost" onClick={() => window.confirm('¿Borrar todos los equipos?') && clearAll()}>Vaciar</button>
            <button className="btn" onClick={() => setEditing('new')}>Agregar equipo</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipo</th><th>Tipo</th><th>Ubicación</th><th className="num">Cant.</th>
                <th className="num">Uso h/sem</th><th className="num">Reposo h/sem</th>
                <th className="num">kWh/mes</th><th className="num">Costo/mes</th><th className="num">kg CO₂/mes</th><th />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const f = filas[i.id];
                return (
                  <tr key={i.id}>
                    <td>{i.nombre}</td>
                    <td>{CATEGORIAS[categoriaDe(i)]}</td>
                    <td>{UBICACIONES[i.ubicacion]}</td>
                    <td className="num">{i.cantidad}</td>
                    <td className="num">{fmt(i.horasUso, 1)}</td>
                    <td className="num">{fmt(i.horasReposo, 1)}</td>
                    <td className="num">{fmt(f.kWhMes, 1)}</td>
                    <td className="num">{fmtARS(f.costoMes)}</td>
                    <td className="num">{fmt(f.co2Mes, 1)}</td>
                    <td className="row-actions">
                      <button className="link" onClick={() => setEditing(i)}>Editar</button>
                      <button className="link danger" onClick={() => removeItem(i.id)}>Quitar</button>
                    </td>
                  </tr>
                );
              })}
              {!items.length && <tr><td colSpan="10" className="center hint">Sin equipos cargados.</td></tr>}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="6">Total</td>
                  <td className="num">{fmt(calculo.totales.kWhMes, 1)}</td>
                  <td className="num">{fmtARS(calculo.totales.costoMes)}</td>
                  <td className="num">{fmt(calculo.totales.co2Mes, 1)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {editing && (
        <ItemForm
          item={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={(it) => {
            editing === 'new' ? addItem(it) : updateItem(it);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
