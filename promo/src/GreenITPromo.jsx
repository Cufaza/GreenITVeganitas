import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { GlobalFrame } from './core/frame.jsx';
import { Background } from './core/Background.jsx';
import { Intro } from './scenes/Intro.jsx';
import { Reveal, Feature, Outro } from './scenes/Scenes.jsx';
import { SCENES } from './timeline.js';

const seq = (s) => ({ from: s.from, durationInFrames: s.to - s.from });

export const GreenITPromo = () => (
  <GlobalFrame>
    <AbsoluteFill style={{ background: '#06080b' }}>
      <Background layer="back" />
      <Sequence {...seq(SCENES.intro)}><Intro /></Sequence>
      <Sequence {...seq(SCENES.reveal)}><Reveal /></Sequence>
      <Sequence {...seq(SCENES.feature)}><Feature /></Sequence>
      <Sequence {...seq(SCENES.outro)}><Outro /></Sequence>
      <Background layer="front" />
    </AbsoluteFill>
  </GlobalFrame>
);
