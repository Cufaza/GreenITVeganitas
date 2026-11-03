import DottedMap, { MAP_ASPECT, mapPos } from './DottedMap.jsx';
import { CtaError, PrimaryCta, SecondaryCta } from './ui.jsx';

// Buenos Aires
const PIN = mapPos(-58.4, -34.6);

export default function FinalCta({ cta }) {
  return (
    <section className="contact" id="empezar" aria-labelledby="final-title">
      <div className="contact-inner">
        <div className="contact-left">
          <span className="sec-eyebrow reveal">Probalo ahora</span>
          <h2 className="contact-title reveal d1" id="final-title">
            Medí tu consumo,
            <br />
            <em>reducí tu huella.</em>
          </h2>
          <p className="contact-sub reveal d2">
            Entrá a la demo con una empresa ficticia ya cargada y recorré el panel, el plan de ahorro y las cuentas paso a paso. Son 5 minutos y no hace falta registrarse.
          </p>

          <div className="contact-map reveal d3" aria-hidden="true" style={{ aspectRatio: MAP_ASPECT }}>
            <DottedMap />
            <div className="map-marker" style={PIN}>
              <div className="map-pin">Buenos Aires, Argentina</div>
              <div className="map-beam" />
              <div className="map-ground" />
            </div>
          </div>
        </div>

        <div className="contact-form cta-card reveal d1">
          <h3 className="cta-card-title">Empezá con la demostración</h3>
          <p className="cta-card-text">Datos de ejemplo de Estudio Contable Delta. Todo queda guardado solo en tu navegador.</p>
          <div className="cta-card-actions">
            <PrimaryCta cta={cta} className="contact-submit" />
            <SecondaryCta cta={cta} />
          </div>
          <CtaError cta={cta} />
          <ul className="cta-card-list">
            <li>Sin instalar nada ni comprar hardware.</li>
            <li>Fórmulas y fuentes visibles en cada cálculo.</li>
            <li>Prototipo académico: la empresa del caso es ficticia.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
