import { Check, Info } from 'lucide-react';
import { Reveal, SectionHead, cx } from './ui.jsx';

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
    <section className="l-section cv" id="precios" aria-labelledby="precios-title">
      <div className="l-container">
        <SectionHead
          id="precios-title"
          center
          eyebrow="Planes y precios"
          title={<>Empezás gratis, <em>crecés cuando lo necesites.</em></>}
          lead="Cuatro formas de usar GreenIT Calc, de la medición básica al servicio con acompañamiento."
        />
        <div className="l-plans">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} d={i % 4}>
              <div className={cx('l-plan-card', p.hl && 'hl')} style={{ height: '100%' }}>
                {p.hl && <span className="l-badge">Plan destacado</span>}
                <h3 className="l-plan-name">{p.name}</h3>
                <p className="l-plan-price">{p.price}{p.unit && <small> {p.unit}</small>}</p>
                <p className="l-plan-desc">{p.desc}</p>
                <ul className="l-plan-list">
                  {p.items.map((t) => <li key={t}><Check aria-hidden="true" />{t}</li>)}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="l-note" role="note">
          <Info aria-hidden="true" />
          <p>Precios supuestos del equipo, a validar. Hoy todo es un prototipo académico: no se cobra nada.</p>
        </Reveal>
      </div>
    </section>
  );
}
