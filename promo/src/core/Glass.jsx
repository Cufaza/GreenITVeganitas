import React from 'react';

export const Glass = ({ radius = 20, glow = false, blur = 0, style, children }) => (
  <div
    style={{
      position: 'relative',
      background: 'rgba(255,255,255,0.045)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: radius,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12)${glow ? ', 0 0 60px rgba(123,211,137,0.16), 0 12px 40px rgba(0,0,0,0.35)' : ', 0 12px 40px rgba(0,0,0,0.3)'}`,
      backdropFilter: blur ? `blur(${blur}px)` : undefined,
      WebkitBackdropFilter: blur ? `blur(${blur}px)` : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);
