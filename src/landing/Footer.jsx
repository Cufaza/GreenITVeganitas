import { Link } from 'react-router-dom';
import { FUENTES } from '../data/constants.js';
import Logo from '../components/Logo.jsx';

const SRC = (id) => FUENTES.find((f) => f.id === id)?.url;

export default function Footer({ user }) {
  return (
    <footer>
      <div className="foot-inner">
        <div className="foot-brand">
          <a href="#inicio" className="foot-logo magnet" aria-label="GreenIT Calc, ir al inicio">
            <Logo light height={44} />
          </a>
          <p className="foot-blurb">Calculadora de consumo, costo y huella de carbono de la infraestructura IT de una PyME.</p>
        </div>
        <nav className="foot-col" aria-label="Producto">
          <h5>Producto</h5>
          <a href="#funcionalidades" className="magnet">Funcionalidades</a>
          <a href="#caso" className="magnet">Caso demo</a>
          <a href="#precios" className="magnet">Precios</a>
          <a href="#preguntas" className="magnet">Preguntas frecuentes</a>
          <Link to={user ? '/panel' : '/login'} className="magnet">{user ? 'Ir al panel' : 'Ingresar'}</Link>
        </nav>
        <nav className="foot-col" aria-label="Fuentes">
          <h5>Fuentes</h5>
          <a href={SRC('fe')} target="_blank" rel="noreferrer" className="magnet">SNIGEI-AR 2025</a>
          <a href={SRC('tarifa')} target="_blank" rel="noreferrer" className="magnet">Cuadro tarifario Edenor</a>
          <a href={SRC('pue')} target="_blank" rel="noreferrer" className="magnet">LBNL 2016</a>
          <a href="#transparencia" className="magnet">Fórmulas y parámetros</a>
        </nav>
        <div className="foot-col">
          <h5>Proyecto</h5>
          <p>Equipo 1 Veganitas</p>
          <p>Innovación y Emprendedorismo</p>
          <p>Ingeniería Informática</p>
          <p>Desafío 2: eficiencia energética y huella de carbono en infraestructura IT</p>
        </div>
      </div>
      <div className="foot-bottom">
        <span>
          Prototipo académico del Equipo 1 Veganitas. Es un prototipo con datos de demostración: la empresa del caso es ficticia y los precios son supuestos.
        </span>
        <span className="foot-vegan"><img src="/veganitas-logo.svg" alt="Veganitas" /></span>
      </div>
    </footer>
  );
}
