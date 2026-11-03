import React from 'react';
import { spring, useVideoConfig } from 'remotion';
import { useGF } from './frame.jsx';

export const SPRING = { damping: 13, stiffness: 120, mass: 0.7 };

/** Entrance progress for item `i`: spring({frame - start - i*delay}). */
export const useEntrance = (start, i = 0, delay = 8, config = SPRING) => {
  const frame = useGF();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - start - i * delay, fps, config });
};

/** Spring entrance by index: opacity + y (+ optional x, scale). At rest the transform is identity. */
export const Stagger = ({ start, i = 0, delay = 8, y = 28, x = 0, scale = 0.94, config, style, children }) => {
  const p = useEntrance(start, i, delay, config);
  const o = Math.min(1, Math.max(0, p * 1.6));
  return (
    <div
      style={{
        opacity: o,
        transform: `translate3d(${(1 - p) * x}px, ${(1 - p) * y}px, 0) scale(${scale + (1 - scale) * p})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
