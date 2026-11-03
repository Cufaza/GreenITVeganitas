import { Reveal } from './ui.jsx';

// Real data sources and frameworks the calculator is built on. These are sources, not clients.
const SOURCES = [
  ['IEA', 'Agencia Internacional de la Energía'],
  ['LBNL 2016', 'US Data Center Energy Usage Report'],
  ['SNIGEI-AR 2025', 'Factores de emisión de Argentina'],
  ['Edenor T1-G', 'Cuadro tarifario de abril de 2026'],
  ['ODS 7', 'Energía asequible y no contaminante'],
  ['ODS 9', 'Industria, innovación e infraestructura'],
  ['ODS 12', 'Producción y consumo responsables'],
  ['ODS 13', 'Acción por el clima'],
];

const Set = ({ hidden }) => (
  <ul className="l-marquee-set" aria-hidden={hidden || undefined}>
    {SOURCES.map(([name, desc]) => (
      <li key={name} className="l-source-pill"><i aria-hidden="true" /><b>{name}</b> {desc}</li>
    ))}
  </ul>
);

export default function Proof() {
  return (
    <section className="l-proof" aria-labelledby="proof-title">
      <Reveal as="p" className="l-proof-label" id="proof-title">Fuentes y marcos en los que se apoya el cálculo</Reveal>
      <div className="l-marquee">
        <div className="l-marquee-track">
          <Set />
          <Set hidden />
        </div>
      </div>
    </section>
  );
}
