import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './styles/variables.css';
import './styles/cursor.css';
import './styles/navbar.css';
import './styles/hero.css';
import './styles/proof.css';
import './styles/layout.css';
import './styles/cases.css';
import './styles/sections.css';
import './styles/animations.css';
import './styles/problem.css';
import './styles/services.css';
import './styles/greenit.css';
import { useAuth } from '../context/AuthContext.jsx';
import Cursor from './Cursor.jsx';
import Nav from './Nav.jsx';
import Hero from './Hero.jsx';
import Proof from './Proof.jsx';
import Problem from './Problem.jsx';
import Features from './Features.jsx';
import Case from './Case.jsx';
import Ods from './Ods.jsx';
import Transparency from './Transparency.jsx';
import Pricing from './Pricing.jsx';
import Faq from './Faq.jsx';
import FinalCta from './FinalCta.jsx';
import Footer from './Footer.jsx';
import { useReveal } from './ui.jsx';

const FONTS = 'https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&family=Playfair+Display:ital,wght@0,400..800;1,400..800&display=swap';
const BG = '#07080a';
// Anchors land this many px below the top edge (Lenis reads it from scroll-padding-top; it also covers native navigation)
const ANCHOR_TOP = 96;

export default function Landing() {
  const { user, loading, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  const lenisRef = useRef(null);

  const startDemo = useCallback(async () => {
    if (loading) return; // a stored session may still be restoring
    setBusy(true);
    setError('');
    try {
      await loginDemo();
      navigate('/panel');
    } catch (e) {
      setError(e?.message || 'No pudimos abrir la demo. Probá de nuevo.');
      setBusy(false);
    }
  }, [loading, loginDemo, navigate]);
  const cta = { user, loading, busy, error, startDemo };

  // Landing-only page setup: fonts, dark canvas behind overscroll, anchor offset. All undone on unmount.
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS;
    document.head.appendChild(link);
    const html = document.documentElement;
    const prev = [html.style.background, document.body.style.background, html.style.scrollPaddingTop];
    html.style.background = BG;
    document.body.style.background = BG;
    html.style.scrollPaddingTop = `${ANCHOR_TOP}px`;
    return () => {
      link.remove();
      [html.style.background, document.body.style.background, html.style.scrollPaddingTop] = prev;
    };
  }, []);

  // Smooth scroll (Lenis, same setup as sumar-web), disabled under prefers-reduced-motion; destroyed on unmount.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)) });
    lenisRef.current = lenis;
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Opened with a hash (/#precios): the section did not exist when the browser tried to scroll, so do it once mounted
  useEffect(() => {
    let target = null;
    try {
      target = window.location.hash.length > 1 ? document.querySelector(window.location.hash) : null;
    } catch {
      target = null;
    }
    if (!target) return undefined;
    const raf = requestAnimationFrame(() => {
      if (lenisRef.current) lenisRef.current.scrollTo(target, { immediate: true, force: true });
      else target.scrollIntoView();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useReveal(rootRef);

  const onMenuChange = useCallback((open) => {
    if (open) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, []);

  // Anchor links: with Lenis active, scroll through it (scroll-padding-top covers the native case)
  const onClick = (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    const href = a?.getAttribute('href');
    if (!href || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    window.history.replaceState(null, '', href);
    const lenis = lenisRef.current;
    if (lenis) {
      // The mobile menu stops Lenis while open; its links close the menu and scroll in the same click
      lenis.start();
      lenis.scrollTo(target, {
        force: true,
        // Content above may settle while we travel (reveals, mocks): correct once if we landed off target
        onComplete: () => {
          if (Math.abs(target.getBoundingClientRect().top - ANCHOR_TOP) > 6) lenis.scrollTo(target, { immediate: true, force: true });
        },
      });
    } else {
      target.scrollIntoView();
    }
    // Move focus to the target so keyboard users (skip link, nav) continue from there
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };

  return (
    <div className="landing" ref={rootRef} onClick={onClick}>
      <div className="grain" aria-hidden="true" />
      <Cursor rootRef={rootRef} />
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <Nav cta={cta} onMenuChange={onMenuChange} />
      <main id="contenido">
        <Hero cta={cta} />
        <Proof />
        <Problem />
        <Features />
        <Case />
        <Ods />
        <Transparency />
        <Pricing />
        <Faq />
        <FinalCta cta={cta} />
      </main>
      <Footer user={user} />
    </div>
  );
}
