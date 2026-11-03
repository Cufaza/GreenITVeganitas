# GreenIT Calc promo video (Remotion)

45 s, 1920x1080, 60 fps. Self-contained package: the app (`../src`) is only imported read-only for the real numbers
(`demoData`, `calcTotales`, `evaluarRecomendaciones`, `escenarioCombinado`, formatters, Watti's `responder`).

```
npm install
npm run studio                                    # preview
npx remotion still src/index.js GreenITPromo out/stills/f1380.png --frame=1380
npm run render                                    # out/greenit-promo.mp4 (includes the soundtrack)
npm run music                                     # regenerate public/soundtrack.wav
```

## Timing: one source of truth

Every key frame (scene boundaries, logo hit, camera whooshes, each cursor click, "Aplicar plan", Watti open,
chip click, answer start, outro whoosh, CTA) lives in `src/timeline.js`. The scenes and the music generator both
read it. Change a frame there, run `npm run music`, and the audio re-syncs. Tempo is 100 BPM (36 frames per beat);
keep big hits on the grid when you can.

## Soundtrack

`scripts/make-music.mjs` is an original, deterministic, dependency-free synth (oscillators + ADSR, filtered noise,
ping-pong delay, Freeverb-style reverb, sidechain-style pumping, soft-clip master). It writes
`public/soundtrack.wav` (48 kHz, 16-bit stereo, exactly 45.000 s), normalises it to -14 LUFS integrated with a
true-peak limiter (<= -1 dBTP) and prints an onset report (`out/music-report.json`).

```
node scripts/make-music.mjs --lufs=-14 --tp=-1 --levels
```

Remotion's bundled ffmpeg has no `ebur128` filter (it is built with a minimal filter set), so the script measures
BS.1770-4 itself. Cross-check with the bundled `loudnorm` filter:

```
npx remotion ffmpeg -i public/soundtrack.wav -af loudnorm=I=-14:TP=-1:print_format=json -f null -
```

### Using a licensed track instead

1. Drop your file (wav/mp3/m4a) in `promo/public/`.
2. In `src/GreenITPromo.jsx` change the single constant `SOUNDTRACK` to its file name.

Cursor-click ticks, whooshes and chimes are part of the generated track, so a licensed track will not have them;
if you want them, keep both: add a second `<Audio>` with a `volume` prop.
