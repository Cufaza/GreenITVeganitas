import React, { createContext, useContext } from 'react';
import { useCurrentFrame } from 'remotion';

// Scenes live inside <Sequence> (local frame). Everything is animated from the GLOBAL
// frame so camera poses and UI state stay continuous across scene overlaps.
const Ctx = createContext(0);
export const GlobalFrame = ({ children }) => {
  const f = useCurrentFrame();
  return <Ctx.Provider value={f}>{children}</Ctx.Provider>;
};
export const useGF = () => useContext(Ctx);
