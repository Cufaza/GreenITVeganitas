import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { SecondaryCta, cx } from './ui.jsx';

export const NAV_LINKS = [
  ['Funcionalidades', '#funcionalidades'],
  ['Cómo funciona', '#como-funciona'],
  ['Caso demo', '#caso'],
  ['Precios', '#precios'],
  ['Preguntas', '#preguntas'],
];

function NavCta({ cta, className, onDone }) {
  if (cta.user) return <Link to="/panel" className={className} onClick={onDone}>Ir al panel</Link>;
  return (
    <button type="button" className={className} onClick={() => { onDone?.(); cta.startDemo(); }} disabled={cta.busy || cta.loading}>
      {cta.busy && <Loader2 className="spin" aria-hidden="true" />} Probar la demo
    </button>
  );
}

export default function Nav({ cta, onMenuChange }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef(null);
  const firstLinkRef = useRef(null);

  // rAF-throttled scroll listener (same as sumar's Navbar)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 40);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Body scroll lock + Escape while the mobile menu is open
  useEffect(() => {
    onMenuChange?.(open);
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstLinkRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onMenuChange]);

  // The overlay only exists under 860px: close it if the viewport grows
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 861px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <nav className={cx('nav', scrolled && 'scrolled', open && 'menu-open')} aria-label="Principal">
        <div className="nav-inner">
          <a href="#inicio" className="brand magnet" aria-label="GreenIT Calc, ir al inicio" onClick={close}>
            <Logo light height={40} />
          </a>
          <div className="nav-links">
            {NAV_LINKS.map(([label, href]) => <a key={href} href={href} className="magnet">{label}</a>)}
          </div>
          <div className="nav-actions">
            <SecondaryCta cta={cta} className="nav-login magnet" />
            <NavCta cta={cta} className="nav-cta magnet" />
          </div>
          <button
            ref={burgerRef}
            type="button"
            className={cx('nav-burger', open && 'is-open')}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Cerrar el menú' : 'Abrir el menú'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={cx('nav-menu', open && 'is-open')} aria-hidden={!open}>
        <div className="nav-menu-inner">
          {NAV_LINKS.map(([label, href], i) => (
            <a key={href} ref={i === 0 ? firstLinkRef : null} href={href} className="nav-menu-link" onClick={close}>{label}</a>
          ))}
          <NavCta cta={cta} className="nav-menu-cta" onDone={close} />
          {!cta.user && <Link to="/login" className="nav-menu-login" onClick={close}>Ingresar</Link>}
        </div>
      </div>
    </>
  );
}
