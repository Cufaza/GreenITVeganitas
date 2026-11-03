import { Check, Info } from 'lucide-react';
import { cx } from './ui.jsx';

const PLANS = [
  {
    name: 'Gratuito',
    price: 'USD 0',
    desc: 'Para empezar a medir.',
    items: ['Cálculo básico de consumo, costo y huella', 'Inventario de equipos', 'Fórmulas y fuentes visibles'],
  },
  {
    name: 'Pro',
    price: 'USD 19',
    unit: '/mes',
    desc: 'Para hacer seguimiento del ahorro.',
    items: ['Todo lo del plan Gratuito', 'Seguimiento mes a mes', 'Reportes', 'Recomendaciones avanzadas'],
    hl: true,
  },
  {
    name: 'Empresa',
    price: 'A consultar',
    desc: 'Para organizaciones con más de una sede.',
    items: ['Todo lo del plan Pro', 'Varias sedes', 'Varios usuarios'],
  },
  {
    name: 'Servicio puntual',
    price: 'A consultar',
    desc: 'Lo hacemos con vos.',
    items: ['Auditoría de tu infraestructura IT', 'Implementación de las medidas del plan'],
  },
];

export default function Pricing() {
  return (
    <section className="g-section" id="precios" aria-labelledby="precios-title">
      <div className="bento-glow" aria-hidden="true" />
      <div className="bento-head">
        <span className="sec-eyebrow reveal">Planes y precios</span>
        <h2 className="bento-section-title reveal d1" id="precios-title">
          Empezás gratis,
          <br />
          <em>crecés cuando lo necesites.</em>
        </h2>
        <p className="bento-lead reveal d2">Cuatro formas de usar GreenIT Calc, de la medición básica al servicio con acompañamiento.</p>
      </div>

      <div className="price-grid">
        {PLANS.map((p, i) => (
          <article key={p.name} className={cx('price-card reveal', `d${(i % 4) + 1}`, p.hl && 'hl')}>
            {p.hl && <span className="price-badge">Plan destacado</span>}
            <h3 className="price-name">{p.name}</h3>
            <p className="price-amount">{p.price}{p.unit && <small>{p.unit}</small>}</p>
            <p className="price-desc">{p.desc}</p>
            <ul className="price-list">
              {p.items.map((t) => <li key={t}><Check aria-hidden="true" />{t}</li>)}
            </ul>
          </article>
        ))}
      </div>

      <p className="price-note reveal" role="note">
        <Info aria-hidden="true" />
        <span>Precios supuestos del equipo, a validar. Hoy todo es un prototipo académico: no se cobra nada.</span>
      </p>
    </section>
  );
}
