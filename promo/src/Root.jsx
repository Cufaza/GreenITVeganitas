import React from 'react';
import { Composition } from 'remotion';
import { GreenITPromo } from './GreenITPromo.jsx';
import { FPS, WIDTH, HEIGHT, DURATION } from './timeline.js';

export const Root = () => (
  <Composition id="GreenITPromo" component={GreenITPromo} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={DURATION} />
);
