import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { CATALOGO } from '../data/catalog.js';
import { CATEGORIAS, FACTOR_EMISION, FUENTES, HORAS_SEMANA, PUE, SEMANAS_MES, TARIFA_EDENOR_T1G } from '../data/constants.js';
import { evaluarRecomendaciones, escenarioCombinado } from '../lib/calc.js';
import { fmt, fmtARS } from '../lib/format.js';

const Formula = ({ children }) => <pre className="formula">{children}</pre>;

function DetalleEquipo({ f, settings }) {
  const { pot } = f;
  const x = (v, d = 2) => fmt(v, d);
  return (
    <details className="card detail">
      <summary>
        <strong>{f.nombre}</strong>
        <span>{x(f.kWhMes, 1)} kWh/mes · {fmtARS(f.costoMes)} · {x(f.co2Mes, 1)} kg CO₂</span>
      </summary>
      <ol className="steps">
        <li>
          <b>Potencia en uso.</b>{' '}
          {pot.interpolado
            ? `P_uso = P_reposo + carga × (P_máx − P_reposo) = ${x(pot.reposo)} + ${x(pot.carga / 100)} × (${x(pot.max)} − ${x(pot.reposo)}) = ${x(pot.uso)} W`
            : `P_uso = ${x(pot.uso)} W (valor del catálogo o cargado por el usuario)`}
          . Reposo: {x(pot.reposo)} W. Apagado: {x(pot.apagado)} W.
        </li>
        <li>
          <b>Horas apagado por semana.</b> {HORAS_SEMANA} − {x(f.hUso, 1)} − {x(f.hReposo, 1)} = {x(f.hOff, 1)} h
          {f.excedeHoras && <span className="error"> (las horas superan la semana, revisá el inventario)</span>}
        </li>
        <li>
          <b>Energía semanal de una unidad.</b> {x(pot.uso)} × {x(f.hUso, 1)} + {x(pot.reposo)} × {x(f.hReposo, 1)} + {x(pot.apagado)} × {x(f.hOff, 1)} = {x(f.whSemanaUnidad, 1)} Wh
        </li>
        <li>
          <b>Energía semanal de los {f.cantidad} equipos.</b> {f.cantidad} × {x(f.whSemanaUnidad, 1)} ÷ 1000 = {x(f.kWhSemanaIT, 3)} kWh
        </li>
        <li>
          <b>Energía mensual IT.</b> {x(f.kWhSemanaIT, 3)} × {x(SEMANAS_MES, 4)} = {x(f.kWhMesIT, 2)} kWh
        </li>
        <li>
          <b>Refrigeración y pérdidas.</b>{' '}
          {f.enSala
            ? `${x(f.kWhMesIT, 2)} × (PUE ${x(f.pue)} − 1) = ${x(f.kWhRefrig, 2)} kWh`
            : 'El equipo está en la oficina: no se suma refrigeración (0 kWh).'}
        </li>
        <li><b>Energía mensual total.</b> {x(f.kWhMesIT, 2)} + {x(f.kWhRefrig, 2)} = <b>{x(f.kWhMes, 2)} kWh</b></li>
        <li><b>Costo.</b> {x(f.kWhMes, 2)} kWh × {x(settings.tarifaARS, 3)} $/kWh = <b>{fmtARS(f.costoMes)}</b></li>
        <li><b>Huella de carbono.</b> {x(f.kWhMes, 2)} kWh × {x(settings.factorEmision, 3)} kg CO₂/kWh = <b>{x(f.co2Mes, 2)} kg CO₂</b></li>
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
    <>
      <header className="page-head">
        <h1>Cálculos y fuentes</h1>
        <p>Cada número del panel sale de las fórmulas de esta página, con los parámetros que tenés cargados en <Link to="/inventario">Inventario</Link>.</p>
      </header>

      <section className="card">
        <h2>1. Parámetros usados y su fuente</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Parámetro</th><th className="num">Valor actual</th><th>Origen</th></tr></thead>
            <tbody>
              <tr>
                <td>Factor de emisión de la red eléctrica</td>
                <td className="num">{fmt(settings.factorEmision, 3)} kg CO₂/kWh</td>
                <td>{FACTOR_EMISION.fuente} Valor de {FACTOR_EMISION.anio}. <a href={FACTOR_EMISION.url} target="_blank" rel="noreferrer">Ver fuente</a></td>
              </tr>
              <tr>
                <td>Tarifa de energía</td>
                <td className="num">{fmt(settings.tarifaARS, 3)} $/kWh</td>
                <td>{TARIFA_EDENOR_T1G.fuente} Cargo variable por tramo: {TARIFA_EDENOR_T1G.tramos.map((t) => `${t.id} ${fmt(t.cargoVariable, 3)}`).join(', ')}. <a href={TARIFA_EDENOR_T1G.url} target="_blank" rel="noreferrer">Ver fuente</a></td>
              </tr>
              <tr>
                <td>PUE de la sala de equipos</td>
                <td className="num">{fmt(settings.pue, 2)}</td>
                <td>{PUE.fuente} Armario: {PUE.closet.valor}. Sala: {PUE.sala.valor}. Mejorado: {PUE.mejorado}. <a href={PUE.url} target="_blank" rel="noreferrer">Ver fuente</a></td>
              </tr>
              <tr>
                <td>Horas por semana / semanas por mes</td>
                <td className="num">{HORAS_SEMANA} / {fmt(SEMANAS_MES, 4)}</td>
                <td>Semana de 7 × 24 h. Mes promedio = 52 ÷ 12 semanas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>2. Fórmulas</h2>
        <Formula>{`horas apagado   = 168 − horas uso − horas reposo
kWh semana (IT) = cantidad × (P_uso × h_uso + P_reposo × h_reposo + P_apagado × h_apagado) ÷ 1000
kWh mes (IT)    = kWh semana × 52 ÷ 12
refrigeración   = kWh mes (IT) × (PUE − 1)        solo para equipos en sala de servidores
kWh mes total   = kWh mes (IT) + refrigeración
costo mes       = kWh mes total × tarifa ($/kWh)
CO₂ mes (kg)    = kWh mes total × factor de emisión (kg CO₂/kWh)
Servidores      : P_uso = P_reposo + carga% × (P_máx − P_reposo)`}</Formula>
        <p className="hint">
          El PUE (Power Usage Effectiveness) es la energía total de la sala dividida por la energía de los equipos IT. Un PUE de 2,5 significa que por cada kWh que usan los equipos, la sala gasta 1,5 kWh más en refrigeración y pérdidas.
        </p>
      </section>

      <section>
        <h2 className="section-title">3. Cuenta paso a paso por equipo</h2>
        {filas.length ? filas.map((f) => <DetalleEquipo key={f.id} f={f} settings={settings} />) : <p className="card hint">Sin equipos cargados.</p>}
      </section>

      <section className="card">
        <h2>4. Totales</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Equipo</th><th className="num">kWh IT/mes</th><th className="num">Refrigeración</th><th className="num">kWh total/mes</th><th className="num">Costo/mes</th><th className="num">kg CO₂/mes</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}><td>{f.nombre}</td><td className="num">{fmt(f.kWhMesIT, 1)}</td><td className="num">{fmt(f.kWhRefrig, 1)}</td><td className="num">{fmt(f.kWhMes, 1)}</td><td className="num">{fmtARS(f.costoMes)}</td><td className="num">{fmt(f.co2Mes, 1)}</td></tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td>Total mensual</td><td className="num">{fmt(totales.kWhMesIT, 1)}</td><td className="num">{fmt(totales.kWhRefrig, 1)}</td><td className="num">{fmt(totales.kWhMes, 1)}</td><td className="num">{fmtARS(totales.costoMes)}</td><td className="num">{fmt(totales.co2Mes, 1)}</td></tr>
              <tr><td>Total anual (× 12)</td><td className="num">{fmt(totales.kWhMesIT * 12, 0)}</td><td className="num">{fmt(totales.kWhRefrig * 12, 0)}</td><td className="num">{fmt(totales.kWhAnio, 0)}</td><td className="num">{fmtARS(totales.costoAnio)}</td><td className="num">{fmt(totales.co2Anio, 0)}</td></tr>
            </tfoot>
          </table>
        </div>
        <p className="hint">PUE efectivo del conjunto: {fmt(totales.pueEfectivo, 2)} (energía total ÷ energía de equipos IT).</p>
      </section>

      <section className="card">
        <h2>5. Cómo se calcula el ahorro</h2>
        <p>
          Cada recomendación modifica una copia del inventario y se vuelve a ejecutar exactamente el mismo cálculo. El ahorro es la diferencia entre el resultado de hoy y el del escenario.
          Para el plan combinado, las medidas se aplican en orden, cada una sobre el resultado de la anterior.
        </p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Medida</th><th>Cambio en el inventario</th><th className="num">Ahorro kWh/mes</th><th className="num">Ahorro $/mes</th><th className="num">Ahorro kg CO₂/mes</th></tr></thead>
            <tbody>
              {recs.map((r) => (
                <tr key={r.id}>
                  <td>{r.titulo}</td>
                  <td>{r.supuesto}</td>
                  {r.esAplicable ? (
                    <><td className="num">{fmt(r.ahorro.kWhMes, 1)}</td><td className="num">{fmtARS(r.ahorro.costoMes)}</td><td className="num">{fmt(r.ahorro.co2Mes, 1)}</td></>
                  ) : (
                    <td className="num hint" colSpan="3">No aplica</td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan="2">Plan combinado (en orden)</td><td className="num">{fmt(comb.ahorro.kWhMes, 1)}</td><td className="num">{fmtARS(comb.ahorro.costoMes)}</td><td className="num">{fmt(comb.ahorro.co2Mes, 1)}</td></tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>6. Catálogo de potencias</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Equipo</th><th className="num">Uso / máx.</th><th className="num">Reposo</th><th className="num">Apagado</th><th>Rango publicado</th><th>Fuente</th><th>Confianza</th></tr></thead>
            <tbody>
              {CATALOGO.filter((c) => c.id !== 'otro').map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}<div className="hint">{CATEGORIAS[c.categoria]}</div></td>
                  <td className="num">{c.potenciaMaxW ? `máx. ${c.potenciaMaxW} W` : `${c.potenciaUsoW} W`}</td>
                  <td className="num">{c.potenciaReposoW} W</td>
                  <td className="num">{c.potenciaApagadoW} W</td>
                  <td>{c.rango}</td>
                  <td>{c.fuente}</td>
                  <td>{c.confianza}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>7. Supuestos y límites</h2>
        <ul className="plain">
          <li>Las potencias del catálogo son valores de referencia publicados. Para mayor precisión, reemplácelas por la etiqueta o la medición del equipo real (Inventario, Ajustar potencias).</li>
          <li>El costo incluye solo el cargo variable de energía. No incluye cargo fijo, impuestos ni cargos por potencia.</li>
          <li>El tramo de tarifa depende del consumo total del local; el consumo IT es solo una parte.</li>
          <li>El factor de emisión es un promedio anual de la red argentina (año {FACTOR_EMISION.anio}). No distingue la hora del día.</li>
          <li>La refrigeración se estima con el PUE típico de cada tipo de sala; no reemplaza la medición del consumo del aire acondicionado.</li>
          <li>El ahorro de cada medida es una estimación por simulación, no una garantía.</li>
          <li>Los datos de demostración pertenecen a una empresa ficticia.</li>
        </ul>
      </section>

      <section className="card">
        <h2>8. Fuentes</h2>
        <ol className="plain">
          {FUENTES.map((s) => (
            <li key={s.id}>{s.titulo} <a href={s.url} target="_blank" rel="noreferrer">{s.url}</a></li>
          ))}
        </ol>
      </section>
    </>
  );
}
