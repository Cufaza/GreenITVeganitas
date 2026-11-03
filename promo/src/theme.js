import { loadFont as loadGeist } from '@remotion/google-fonts/Geist';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';

export const geist = loadGeist('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;
export const inter = loadInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;
export const playfair = loadPlayfair('italic', { weights: ['700'], subsets: ['latin'] }).fontFamily;

export const C = {
  bg: '#06080b',
  green: '#7BD389',
  greenDeep: '#2E7D32',
  greenMid: '#2E9B4A',
  orange: '#F39C12',
  text: '#F2F6F3',
  muted: 'rgba(235,242,237,0.62)',
  faint: 'rgba(235,242,237,0.38)',
  line: 'rgba(255,255,255,0.09)',
  surface: '#0c1116',
};
