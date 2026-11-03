import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { PrimaryCta, SecondaryCta, cx } from './ui.jsx';

export const NAV_LINKS = [
  ['Cómo funciona', '#como-funciona'],
  ['Funcionalidades', '#funcionalidades'],
  ['Caso demo', '#caso'],
  ['Precios', '#precios'],
  ['Preguntas', '#preguntas'],
];

export default function Nav({ cta, onMenuChange }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef(null);
  const firstLinkRef = useRef(null);

  // rAF-throttled scroll listener
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

  // The menu is display:none under 900px wide only through the burger; close it if the viewport grows.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
    <header className={cx('l-nav', scrolled && 'is-scrolled')}>
      <div className="l-container l-nav-in">
        <a href="#top" className="l-logo" aria-label="GreenIT Calc, ir al inicio"><Logo light height={44} /></a>
        <nav className="l-links" aria-label="Secciones">
          {NAV_LINKS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="l-nav-cta">
          <SecondaryCta cta={cta} />
          {cta.user ? (
            <Link to="/panel" className="l-pill">Ir al panel</Link>
          ) : (
            <button type="button" className="l-pill" onClick={cta.startDemo} disabled={cta.busy || cta.loading}>
              {cta.busy && <Loader2 className="l-spin" aria-hidden="true" />} Probar la demo
            </button>
          )}
        </div>
        <button
          ref={burgerRef}
          type="button"
          className="l-burger"
          aria-expanded={open}
          aria-controls="l-menu"
          aria-label={open ? 'Cerrar el menú' : 'Abrir el menú'}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span />
        </button>
      </div>
    </header>

      <div id="l-menu" className={cx('l-menu', open && 'is-open')} aria-hidden={!open}>
        {NAV_LINKS.map(([label, href], i) => (
          <a
            key={href}
            ref={i === 0 ? firstLinkRef : null}
            href={href}
            className="l-menu-link"
            style={{ transitionDelay: open ? `${0.12 + i * 0.07}s` : '0s' }}
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}
        <div className="l-menu-cta" onClick={() => setOpen(false)}>
          <PrimaryCta cta={cta} />
          <SecondaryCta cta={cta} />
        </div>
      </div>
    </>
  );
}
