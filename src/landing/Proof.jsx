// Real data sources and frameworks the calculator is built on, in sumar's logo-marquee strip. They are sources, not clients.
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
const items = [...SOURCES, ...SOURCES];

export default function Proof() {
  return (
    <section className="proof" aria-labelledby="proof-label">
      <p className="proof-label" id="proof-label">Fuentes y marcos en los que se apoya el cálculo</p>
      <div className="proof-mask">
        <ul className="proof-track">
          {items.map(([name, desc], i) => (
            <li key={i} className="proof-item" aria-hidden={i >= SOURCES.length || undefined}>
              <b>{name}</b>
              <span>{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
