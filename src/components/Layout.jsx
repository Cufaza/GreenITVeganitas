import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import Logo from './Logo.jsx';

const links = [
  ['/', 'Panel'],
  ['/inventario', 'Inventario'],
  ['/plan', 'Plan de ahorro'],
  ['/calculos', 'Cálculos'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { ready } = useData();
  return (
    <div className="app">
      <aside className="sidebar no-print">
        <Logo height={44} />
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {user.demo && <span className="badge">Datos de demostración</span>}
          <div className="user-mail">{user.email}</div>
          <button className="btn btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">{ready ? <Outlet /> : <div className="splash">Cargando datos…</div>}</main>
    </div>
  );
}
