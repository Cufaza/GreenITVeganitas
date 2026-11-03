import React from 'react';
import { useGF } from '../core/frame.jsx';
import { Cursor } from '../core/Cursor.jsx';
import { AppShell } from '../mock/AppShell.jsx';
import { PanelMock } from '../mock/PanelMock.jsx';
import { PlanMock } from '../mock/PlanMock.jsx';
import { WattiMock } from '../mock/WattiMock.jsx';
import { prog } from '../mock/ui.jsx';
import { T } from '../timeline.js';

/** The whole mockup world. Pure function of the global frame, so any scene can render it. */
export const AppWorld = () => {
  const f = useGF();
  const out = prog(f, T.pageSwitch - 2, T.pageSwitch + 14);
  return (
    <AppShell title={(fr) => (fr >= T.pageSwitch ? 'Plan de ahorro' : 'Panel')}>
      {out < 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, transform: `translate3d(${-40 * out}px, 0, 0)` }}>
          <PanelMock />
        </div>
      )}
      {f >= T.pageSwitch - 2 && <PlanMock />}
      <WattiMock />
      <Cursor />
    </AppShell>
  );
};
