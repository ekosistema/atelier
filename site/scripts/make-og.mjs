#!/usr/bin/env node
// Genera public/og.png (1200×630), la imagen para compartir en redes. Se ejecuta a mano cuando
// cambia la marca o las cifras; el PNG resultante se versiona. Usa `sharp` (ya instalado por Astro).
//   node scripts/make-og.mjs

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, paths } from '../src/data/catalog.mjs';
import { site } from '../src/data/site.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(here, '../public');
const manuals = JSON.parse(fs.readFileSync(path.resolve(here, '../src/data/manuals.json'), 'utf8')).length;

// Logotipo oficial de CeleroLab (variante para fondo oscuro), incrustado como imagen.
const logo = fs.readFileSync(path.join(pub, 'brand/celerolab-logo-on-dark.svg'));
const logoUri = `data:image/svg+xml;base64,${logo.toString('base64')}`;

// Logotipo de Atelier (variante para fondo oscuro).
const atelier = fs.readFileSync(path.resolve(here, '../src/assets/atelier-logo-on-dark.svg'));
const atelierUri = `data:image/svg+xml;base64,${atelier.toString('base64')}`;
const [, , vbW, vbH] = atelier.toString().match(/viewBox="([\d.\s]+)"/)[1].split(/\s+/).map(Number);
const atelierRatio = vbW / vbH;

const FONT ="Inter, 'Segoe UI', Arial, Helvetica, sans-serif";
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="a" cx="15%" cy="0%" r="75%"><stop offset="0" stop-color="#7c6cff" stop-opacity=".55"/><stop offset="1" stop-color="#7c6cff" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="95%" cy="25%" r="55%"><stop offset="0" stop-color="#22d3ee" stop-opacity=".28"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
    <linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#c7c0ff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
    <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#232739" stroke-width="1"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="#0b0d14"/>
  <rect width="1200" height="630" fill="url(#g)" opacity=".5"/>
  <rect width="1200" height="630" fill="url(#a)"/>
  <rect width="1200" height="630" fill="url(#b)"/>

  <image href="${atelierUri}" xlink:href="${atelierUri}" x="80" y="86" width="${Math.round(84 * atelierRatio)}" height="84"/>
  <text x="80" y="270" font-family="${FONT}" font-size="76" font-weight="800" fill="#f4f5fb">Domina tu entorno</text>
  <text x="80" y="354" font-family="${FONT}" font-size="76" font-weight="800" fill="#f4f5fb">de desarrollo, <tspan fill="url(#t)">paso a paso</tspan></text>
  <text x="80" y="420" font-family="${FONT}" font-size="30" fill="#b8bcd2">Manuales prácticos en español para terminal, Git, DevOps, IA y más.</text>

  <g font-family="${FONT}" font-size="26" fill="#8a8fab">
    <text x="80" y="520"><tspan font-weight="800" fill="#f4f5fb" font-size="40">${manuals}</tspan> manuales   ·   <tspan font-weight="800" fill="#f4f5fb" font-size="40">${paths.length}</tspan> rutas guiadas   ·   <tspan font-weight="800" fill="#f4f5fb" font-size="40">${categories.length}</tspan> áreas</text>
  </g>
  <image href="${logoUri}" xlink:href="${logoUri}" x="80" y="552" width="150" height="30"/>
</svg>`;

const out = path.join(pub, 'og.png');
await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(out);
console.log(`✔ ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
