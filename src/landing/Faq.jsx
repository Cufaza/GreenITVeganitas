import { ChevronDown } from 'lucide-react';

const FAQ = [
  ['¿Qué mide GreenIT Calc?', 'El consumo eléctrico (kWh), el costo y la huella de carbono (kg de CO₂) de tu infraestructura IT: PCs, monitores, notebooks, servidores y red. En la sala de servidores suma además lo que se va en refrigeración.'],
  ['¿De dónde salen los datos?', 'Los parámetros son públicos: la tarifa de Edenor T1-G, el factor de emisión de la red argentina (SNIGEI-AR 2025) y el PUE y el consumo de servidores del informe LBNL 2016. Las potencias de PCs y monitores son valores de referencia de estudios publicados. Todo está en la sección Cálculos, con su fuente.'],
  ['¿Hay que instalar algo o comprar hardware?', 'No. Cargás tus equipos y las horas de uso a mano; no hay agentes, medidores ni sensores.'],
  ['¿Dónde quedan mis datos?', 'En esta versión de demostración, solo en tu navegador (localStorage). No se envían a ningún servidor y las cuentas son simuladas, así que no las uses con datos sensibles.'],
  ['¿Es exacto?', 'Es una estimación con valores de referencia, no una medición. Para acercarte a la realidad podés cargar la potencia real de cada equipo, tu tarifa y tu PUE.'],
  ['¿Sirve si mi distribuidora no es Edenor?', 'Sí. La tarifa viene precargada con Edenor T1-G, pero podés cargar el valor de tu distribuidora a mano.'],
  ['¿Cuánto cuesta?', 'La demostración es gratuita. Los planes de la sección de precios son supuestos del equipo y todavía están por validarse.'],
];

export default function Faq() {
  return (
    <section className="block tests-section faq-section" id="preguntas" aria-labelledby="faq-title">
      <div className="tests-head">
        <span className="sec-eyebrow reveal">Preguntas frecuentes</span>
        <h2 className="tests-title reveal d1" id="faq-title">
          Lo que nos suelen
          <br />
          <em>preguntar.</em>
        </h2>
      </div>
      <div className="faq-list reveal d2">
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq-item">
            <summary>{q}<ChevronDown aria-hidden="true" /></summary>
            <div className="faq-answer"><p>{a}</p></div>
          </details>
        ))}
      </div>
    </section>
  );
}
