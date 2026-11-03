import React from 'react';
import { Img, staticFile } from 'remotion';
import { useGF } from '../core/frame.jsx';
import { Stagger } from '../core/Stagger.jsx';
import { hoverAmount } from '../core/cursorModel.js';
import { T } from '../timeline.js';
import { inter, geist, C } from '../theme.js';
import { COMPANY } from '../data.js';
import { MOCK, SIDEBAR_W, TOPBAR_H, NAV } from './layout.js';
import { Icon, prog, lerp } from './ui.jsx';

const NAV_IDS = ['panel', 'inventario', 'plan', 'calculos'];
const NAV_TARGET = ['nav-panel', 'nav-inventario', 'nav-plan', 'nav-calculos'];

const NavItem = ({ i, active, f }) => {
  const h = hoverAmount(NAV_TARGET[i], f);
  return (
    <Stagger start={T.navStart} i={i} delay={10} x={-34} y={0} scale={0.92}>
      <div
        style={{
          position: 'absolute', left: 15, top: 160 + i * 60 - 150, width: 230, height: 52, borderRadius: 14, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', boxSizing: 'border-box',
          fontFamily: inter, fontSize: 21, fontWeight: active > 0.5 ? 600 : 500,
          color: active > 0.5 ? C.green : `rgba(235,242,237,${lerp(0.66, 0.95, h)})`,
          background: active > 0.01 ? `rgba(123,211,137,${0.14 * active})` : `rgba(255,255,255,${0.075 * h})`,
          boxShadow: active > 0.01 ? `inset 0 0 0 1px rgba(123,211,137,${0.3 * active}), 0 0 30px rgba(123,211,137,${0.12 * active})` : 'none',
        }}
      >
        <Icon name={NAV_IDS[i]} size={26} />
        {NAV[i]}
      </div>
    </Stagger>
  );
};

/** Dark recreation of the app chrome: sidebar (logo + nav) and topbar. Pages render as children. */
export const AppShell = ({ title, children }) => {
  const f = useGF();
  const shellIn = prog(f, 180, 230);
  const planActive = prog(f, T.pageSwitch, T.pageSwitch + 10);
  return (
    <div
      style={{
        position: 'relative', width: MOCK.w, height: MOCK.h, borderRadius: 30, overflow: 'hidden',
        background: 'linear-gradient(160deg,#0d1319 0%,#090d11 60%,#080b0e 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 120px rgba(46,125,50,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
        opacity: shellIn,
        fontFamily: inter,
      }}
    >
      {/* sidebar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_W, background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <Stagger start={T.sidebarIn} x={-60} y={0} scale={1} style={{ position: 'absolute', left: 0, top: 0, width: SIDEBAR_W, height: MOCK.h }}>
          <Img src={staticFile('logo-greenit-calc-light.svg')} style={{ position: 'absolute', left: 30, top: 38, width: 200, height: 50 }} />
          <div style={{ position: 'absolute', left: 0, top: 150 }}>
            {NAV.map((_, i) => (
              <NavItem key={i} i={i} f={f} active={i === 0 ? 1 - planActive : i === 2 ? planActive : 0} />
            ))}
          </div>
          <div style={{ position: 'absolute', left: 24, bottom: 28, right: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#2E7D32,#7BD389)', display: 'grid', placeItems: 'center', fontFamily: geist, fontWeight: 700, fontSize: 20, color: '#06130a' }}>ED</div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 19, fontWeight: 600, color: C.text }}>{COMPANY}</div>
              <div style={{ fontSize: 16, color: C.faint }}>Empresa de demo</div>
            </div>
          </div>
        </Stagger>
      </div>
      {/* topbar */}
      <Stagger start={T.sidebarIn + 16} y={-24} scale={1} style={{ position: 'absolute', left: SIDEBAR_W, right: 0, top: 0, height: TOPBAR_H }}>
        <div style={{ height: TOPBAR_H, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px' }}>
          <div style={{ fontFamily: geist, fontWeight: 600, fontSize: 30, color: C.text }}>{title(f)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 18, color: C.green, border: '1px solid rgba(123,211,137,0.35)', background: 'rgba(123,211,137,0.08)', borderRadius: 999, padding: '6px 16px' }}>Modo demo</div>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.09)' }} />
          </div>
        </div>
      </Stagger>
      {children}
    </div>
  );
};
