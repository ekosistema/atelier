#!/usr/bin/env node
// Genera el logotipo de Atelier (src/assets/atelier-logo-on-{dark,light}.svg) y el icono (public/favicon.svg).
//   npm run logo
//
// Icono: un engranaje (construir, desarrollar) con una «A» de dos trazos en forma de caret `^` y un
// cursor suelto como travesaño. Logotipo: «ATELIER» en Barlow Bold, mayúsculas con tracking amplio
// (rotulación industrial, seria), convertido a trazados SVG: no depende de ninguna fuente instalada.
//
// Para cambiar el diseño, edita este fichero y vuelve a ejecutarlo (luego `npm run og`).

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const opentype = require('opentype.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, '..');

// ── Parámetros de diseño ───────────────────────────────────────────────────────
const NAME = 'ATELIER';
const FONT_FILE = path.join(site, 'node_modules/@fontsource/barlow/files/barlow-latin-700-normal.woff');
const CAP_HEIGHT = 40;      // altura de las mayúsculas en unidades del lienzo
const TRACKING = 150;       // espaciado entre letras (milésimas de em)
const ICON = 72;            // lado del icono
const GAP = 22;             // separación icono ↔ palabra
const PAD_Y = 6;            // margen vertical del lienzo
const TEETH = 8;

const THEMES = {
  dark:  { text: '#f4f5fb', from: '#7c6cff', to: '#22d3ee' },
  light: { text: '#0f1222', from: '#5b45f0', to: '#0891b2' },
};

// ── Engranaje ──────────────────────────────────────────────────────────────────
function gearPath(cx, cy, R, r, teeth, tipHalf, rootHalf) {
  const f = (n) => +n.toFixed(2);
  const pt = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  const step = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const p1 = pt(r, a - rootHalf), p2 = pt(R, a - tipHalf), p3 = pt(R, a + tipHalf), p4 = pt(r, a + rootHalf);
    const next = pt(r, a + step - rootHalf);
    d += `${i ? 'L' : 'M'}${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}L${f(p3[0])} ${f(p3[1])}L${f(p4[0])} ${f(p4[1])}`;
    d += `A${r} ${r} 0 0 1 ${f(next[0])} ${f(next[1])}`;
  }
  return d + 'Z';
}

// ── Palabra ────────────────────────────────────────────────────────────────────
const buf = fs.readFileSync(FONT_FILE);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const capRatio = (font.tables.os2?.sCapHeight ?? font.unitsPerEm * 0.7) / font.unitsPerEm;
const fontSize = CAP_HEIGHT / capRatio;
const baseline = PAD_Y + ICON / 2 + CAP_HEIGHT / 2;                 // centrada con el icono
const textX = ICON + GAP;
const wordPath = font.getPath(NAME, textX, baseline, fontSize, { tracking: TRACKING });
const bb = wordPath.getBoundingBox();
const width = Math.ceil(bb.x2 + 4);                                  // sin margen derecho extra
const height = ICON + PAD_Y * 2;
// Trazado construido a mano (comandos absolutos, 2 decimales): no depende de cómo serialice cada versión de opentype.js.
const n2 = (v) => +v.toFixed(2);
const wordD = wordPath.commands
  .map((c) => {
    switch (c.type) {
      case 'M': case 'L': return `${c.type}${n2(c.x)} ${n2(c.y)}`;
      case 'C': return `C${n2(c.x1)} ${n2(c.y1)} ${n2(c.x2)} ${n2(c.y2)} ${n2(c.x)} ${n2(c.y)}`;
      case 'Q': return `Q${n2(c.x1)} ${n2(c.y1)} ${n2(c.x)} ${n2(c.y)}`;
      default: return 'Z';
    }
  })
  .join('');

// ── Icono ──────────────────────────────────────────────────────────────────────
const c = ICON / 2;
const gear = gearPath(c, c, 34, 27.5, TEETH, 0.17, 0.27);
const icon = (t, id) => `
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.from}"/><stop offset="1" stop-color="${t.to}"/></linearGradient></defs>
  <path d="${gear}" fill="url(#${id})" stroke="url(#${id})" stroke-width="2.5" stroke-linejoin="round"/>
  <g fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><path d="M36 21.5 26.5 46M36 21.5 45.5 46"/></g>
  <rect x="30.5" y="40.5" width="11" height="5" rx="2.5" fill="#fff"/>`;

const logo = (t) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t"><title id="t">Atelier</title><g transform="translate(0 ${PAD_Y})">${icon(t, 'g')}</g><path d="${wordD}" fill="${t.text}"/></svg>\n`;
const mark = (t) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON} ${ICON}" role="img" aria-labelledby="t"><title id="t">Atelier</title>${icon(t, 'g')}</svg>\n`;

fs.writeFileSync(path.join(site, 'src/assets/atelier-logo-on-dark.svg'), logo(THEMES.dark));
fs.writeFileSync(path.join(site, 'src/assets/atelier-logo-on-light.svg'), logo(THEMES.light));
fs.writeFileSync(path.join(site, 'public/favicon.svg'), mark(THEMES.dark));
console.log(`✔ logotipo ${width}×${height} · icono ${ICON}×${ICON} (fuente ${path.basename(FONT_FILE)})`);
