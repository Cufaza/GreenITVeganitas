import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import WattiChat from './services/WattiChat.jsx';
import HowTimeline from './services/HowTimeline.jsx';
import AnalyticsMini from './services/AnalyticsMini.jsx';
import FormulaPreview from './services/FormulaPreview.jsx';

const CARDS = [
  {
    id: 'watti',
    title: 'Watti, tu asistente de energía.',
    desc: 'Preguntale cuánto consumís o qué medida conviene primero, y responde con tus números. En esta versión son respuestas predefinidas, sin IA real.',
    visual: <WattiChat />,
  },
  {
    id: 'como-funciona',
    title: 'De tus equipos al plan de ahorro.',
    desc: 'Cinco minutos: cargás los equipos, calculamos con datos reales de Argentina y aplicás las medidas ordenadas por impacto.',
    visual: <HowTimeline />,
  },
  {
    id: 'panel',
    title: 'Un panel con tus números.',
    desc: 'kWh, costo y CO₂ por mes y por año, separando lo que usan los equipos de lo que se va en refrigeración.',
    visual: <AnalyticsMini />,
  },
  {
    id: 'calculos',
    title: 'Cada cuenta, a la vista.',
    desc: 'Las fórmulas son visibles y cada parámetro trae su fuente. Nada de cajas negras: todo se puede revisar y editar.',
    visual: <FormulaPreview />,
  },
];

function BentoCard({ card, delay = 0 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-6%' });

  return (
    <motion.article
      ref={ref}
      id={card.id}
      className="bento-card"
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bento-visual">{card.visual}</div>
      <div className="bento-card-foot">
        <h3 className="bento-foot-title">{card.title}</h3>
        <p className="bento-foot-desc">{card.desc}</p>
      </div>
    </motion.article>
  );
}

export default function Features() {
  return (
    <section className="bento-section" id="funcionalidades" aria-labelledby="func-title">
      <div className="bento-glow" aria-hidden="true" />

      <div className="bento-head">
        <span className="sec-eyebrow reveal">Funcionalidades</span>
        <h2 className="bento-section-title reveal d1" id="func-title">
          Todo lo que necesitás para
          <br />
          <em>medir y ahorrar.</em>
        </h2>
        <p className="bento-lead reveal d2">Los números de estas tarjetas se calculan en vivo con el caso de demostración, igual que dentro de la herramienta.</p>
      </div>

      <div className="bento-grid">
        {CARDS.map((card, i) => <BentoCard key={card.id} card={card} delay={i * 0.07} />)}
      </div>
    </section>
  );
}
