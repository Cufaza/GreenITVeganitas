import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Calculator, FlaskConical, LayoutDashboard, LogOut, Menu, PiggyBank, Server, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import Logo from './Logo.jsx';
import Loader from './ui/Loader.jsx';
import WattiWidget from './watti/WattiWidget.jsx';
import { Button, cn, useModalAnimation } from './ui/UIComponents.jsx';

const links = [
  { to: '/panel', label: 'Panel', icon: LayoutDashboard },
  { to: '/inventario', label: 'Inventario', icon: Server },
  { to: '/plan', label: 'Plan de ahorro', icon: PiggyBank },
  { to: '/calculos', label: 'Cálculos', icon: Calculator },
];

function Nav({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) => cn(
            'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all',
            isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserFooter({ user, logout }) {
  return (
    <div className="space-y-3 border-t pt-4">
      {user.demo && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
          <FlaskConical className="h-3 w-3" /> Datos de demostración
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <Avatar email={user.email} />
        <span className="min-w-0 truncate text-xs text-muted-foreground" title={user.email}>{user.email}</span>
      </div>
      <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={logout}>
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </Button>
    </div>
  );
}

const Avatar = ({ email }) => (
  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
    {(email || '?').charAt(0).toUpperCase()}
  </div>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const { ready } = useData();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useModalAnimation(menuOpen);
  const current = links.find((l) => pathname.startsWith(l.to));

  return (
    <div className="flex h-screen bg-background text-foreground print:block print:h-auto">
      {/* Desktop sidebar */}
      <aside className="z-20 hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex print:hidden">
        <div className="flex h-12 items-center px-2"><Logo height={36} /></div>
        <div className="mt-6 flex-1"><Nav /></div>
        <UserFooter user={user} logout={logout} />
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden print:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" aria-label="Abrir menú" onClick={() => setMenuOpen(true)} className="rounded-md p-1.5 hover:bg-accent">
            <Menu className="h-6 w-6" />
          </button>
          <span className="truncate text-lg font-bold">{current?.label ?? 'GreenIT Calc'}</span>
        </div>
        <Avatar email={user.email} />
      </header>

      {/* Mobile drawer */}
      {drawer.visible && (
        <div className="fixed inset-0 z-40 md:hidden print:hidden">
          <div className={cn('absolute inset-0 bg-black/60 backdrop-blur-sm', drawer.overlayClass)} onClick={() => setMenuOpen(false)} />
          <div className={cn('absolute left-0 top-0 flex h-full w-[280px] max-w-[85vw] flex-col border-r bg-card p-4 shadow-2xl', drawer.modalClass === 'modal-exit' ? 'drawer-exit-left' : 'drawer-enter-left')}>
            <div className="flex h-12 items-center justify-between px-2">
              <Logo height={32} />
              <button type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex-1"><Nav onNavigate={() => setMenuOpen(false)} /></div>
            <UserFooter user={user} logout={logout} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mt-16 flex-1 overflow-auto bg-secondary/30 p-3 sm:p-4 md:mt-0 md:p-8 print:mt-0 print:overflow-visible print:bg-transparent print:p-0">
        <div className="mx-auto w-full max-w-6xl">
          {ready ? <Outlet /> : <div className="flex items-center justify-center py-24"><Loader size="lg" text="Cargando datos…" /></div>}
        </div>
      </main>

      {ready && <WattiWidget />}
    </div>
  );
}
