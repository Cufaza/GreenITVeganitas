import { Check, ExternalLink } from 'lucide-react';
import { FACTOR_EMISION, FUENTES, PUE, TARIFA_EDENOR_T1G } from '../data/constants.js';
import { fmt } from '../lib/format.js';
import { IEA } from './demo.js';

const urlDe = (id) => FUENTES.find((f) => f.id === id)?.url;

const ROWS = [
  {
    name: 'Factor de emisión de la red eléctrica',
    value: `${fmt(FACTOR_EMISION.valor, 3)} kg CO₂/kWh (${FACTOR_EMISION.anio})`,
    src: 'SNIGEI-AR 2025, Tabla 5 (Subsecretaría de Ambiente de la Nación)',
    url: urlDe('fe'),
  },
  {
    name: 'Tarifa de energía, Edenor T1-G',
    value: `${TARIFA_EDENOR_T1G.tramos.map((t) => `${t.id} ${fmt(t.cargoVariable, 3)}`).join(' · ')} $/kWh`,
    src: `Cuadro tarifario ${TARIFA_EDENOR_T1G.vigencia} (ENRE). Solo el cargo variable de energía.`,
    url: urlDe('tarifa'),
  },
  {
    name: 'PUE (refrigeración y pérdidas)',
    value: `${fmt(PUE.closet.valor, 1)} armario · ${fmt(PUE.sala.valor, 1)} sala · ${fmt(PUE.mejorado, 1)} mejorado`,
    src: 'LBNL, 2016. United States Data Center Energy Usage Report',
    url: urlDe('pue'),
  },
  {
    name: 'Consumo de un servidor ocioso',
    value: '≈44% de su potencia máxima',
    src: 'LBNL, 2016',
    url: urlDe('pue'),
  },
  {
    name: 'Uso de energía de los centros de datos',
    value: '1 a 1,3% de la electricidad mundial (240 a 340 TWh)',
    src: `Agencia Internacional de la Energía (IEA), ${IEA.titulo.replace('IEA, ', '')}`,
    url: IEA.url,
  },
];

// Same formulas as the in-app "Cálculos" page: [text, kind] with kind c = comment, k = result, undefined = plain
const FORMULAS = [
  ['horas apagado   = 168 − horas uso − horas reposo'],
  ['kWh semana (IT) = cantidad × (P_uso × h_uso'],
  ['                  + P_reposo × h_reposo'],
  ['                  + P_apagado × h_apagado) ÷ 1000'],
  ['kWh mes (IT)    = kWh semana × 52 ÷ 12'],
  ['refrigeración   = kWh mes (IT) × (PUE − 1)', 'solo en sala'],
  ['kWh mes total   = kWh mes (IT) + refrigeración'],
  ['costo mes       = kWh mes total × tarifa ($/kWh)'],
  ['CO₂ mes (kg)    = kWh mes total × factor de emisión'],
  ['Servidores      : P_uso = P_reposo'],
  ['                  + carga% × (P_máx − P_reposo)'],
];

const CHECKS = [
  'Fórmulas visibles, con la cuenta paso a paso de cada equipo.',
  'Parámetros con su fuente: tarifa, factor de emisión, PUE.',
  'Son estimaciones con valores de referencia, no mediciones: podés cargar la potencia real de cada equipo.',
];

export default function Transparency() {
  return (
    <section className="block" id="transparencia" aria-labelledby="transp-title">
      <div className="g-split">
        <div>
          <span className="sec-eyebrow reveal">Transparencia</span>
          <h2 className="g-title reveal d1" id="transp-title">Cada número tiene <em>su cuenta y su fuente.</em></h2>
          <p className="g-lead reveal d2">No hay cajas negras: las fórmulas son públicas, los parámetros salen de fuentes que podés abrir y todo se puede editar.</p>
          <ul className="g-checks reveal d3">
            {CHECKS.map((t) => (
              <li key={t}><Check aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="g-editor reveal d2">
          <div className="dev-tabs" aria-hidden="true">
            <div className="dev-dots"><span className="dev-dot-r" /><span className="dev-dot-y" /><span className="dev-dot-g" /></div>
            <div className="dev-tab dev-tab--active">formulas.txt</div>
            <div className="dev-tab">Cálculos</div>
          </div>
          <pre className="g-code" tabIndex={0} aria-label="Fórmulas de cálculo">
            {FORMULAS.map(([t, note]) => (
              <span key={t} className="g-code-line">
                {t}
                {note && <span className="g-code-note">{`   // ${note}`}</span>}
              </span>
            ))}
          </pre>
        </div>
      </div>

      <div className="g-table-wrap reveal d1">
        <table className="g-table stack">
          <caption>Parámetros y fuentes</caption>
          <thead><tr><th scope="col">Parámetro</th><th scope="col">Valor</th><th scope="col">Fuente</th></tr></thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name}>
                <th scope="row">{r.name}</th>
                <td data-label="Valor">{r.value}</td>
                <td data-label="Fuente">
                  {r.src}
                  {r.url && (
                    <>
                      {' '}
                      <a href={r.url} target="_blank" rel="noreferrer" className="g-src-link">
                        Ver fuente<ExternalLink aria-hidden="true" />
                      </a>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
