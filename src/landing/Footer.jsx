import { Link } from 'react-router-dom';
import { FUENTES } from '../data/constants.js';
import Logo from '../components/Logo.jsx';

const SRC = (id) => FUENTES.find((f) => f.id === id)?.url;

export default function Footer({ user }) {
  return (
    <footer className="l-footer">
      <div className="l-container">
        <div className="l-footer-grid">
          <div>
            <Logo light height={38} />
            <p className="l-footer-blurb">Calculadora de consumo, costo y huella de carbono de la infraestructura IT de una PyME.</p>
          </div>
          <nav aria-label="Producto">
            <h4>Producto</h4>
            <ul>
              <li><a href="#funcionalidades">Funcionalidades</a></li>
              <li><a href="#caso">Caso demo</a></li>
              <li><a href="#precios">Precios</a></li>
              <li><a href="#preguntas">Preguntas frecuentes</a></li>
              <li><Link to={user ? '/panel' : '/login'}>{user ? 'Ir al panel' : 'Ingresar'}</Link></li>
            </ul>
          </nav>
          <nav aria-label="Fuentes">
            <h4>Fuentes</h4>
            <ul>
              <li><a href={SRC('fe')} target="_blank" rel="noreferrer">SNIGEI-AR 2025</a></li>
              <li><a href={SRC('tarifa')} target="_blank" rel="noreferrer">Cuadro tarifario Edenor</a></li>
              <li><a href={SRC('pue')} target="_blank" rel="noreferrer">LBNL 2016</a></li>
              <li><a href="#transparencia">Fórmulas y parámetros</a></li>
            </ul>
          </nav>
          <div>
            <h4>Proyecto</h4>
            <ul>
              <li>Equipo 1 Veganitas</li>
              <li>Innovación y Emprendedorismo</li>
              <li>Ingeniería Informática</li>
              <li>Desafío 2: eficiencia energética y huella de carbono en infraestructura IT</li>
            </ul>
          </div>
        </div>
        <div className="l-footer-bar">
          <p>
            Prototipo académico del Equipo 1 Veganitas · Innovación y Emprendedorismo · Ingeniería Informática · Desafío 2: eficiencia energética y huella de carbono en infraestructura IT.
            Es un prototipo con datos de demostración: la empresa del caso es ficticia y los precios son supuestos.
          </p>
          <span className="l-vegan"><img src="/veganitas-logo.svg" alt="Veganitas" /></span>
        </div>
      </div>
    </footer>
  );
}
