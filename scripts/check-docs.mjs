#!/usr/bin/env node
// Comprobaciones de calidad de la colección (sin dependencias; requiere Node 18+).
//
//   node scripts/check-docs.mjs            → solo informa (código de salida 1 si hay errores)
//   node scripts/check-docs.mjs --fix-toc  → además regenera las tablas de contenidos
//
// Comprueba:
//   1. Enlaces internos a ficheros y anclas (README y sources/).
//   2. Cada sources/*.md está enlazado desde el README.
//   3. Cabecera de metadatos ("Nivel", "Revisado") en cada manual.
//   4. Bloques de código sin cerrar.
//   5. Tabla de contenidos presente y con anclas válidas en manuales de más de 200 líneas.
//   6. Caracteres CJK perdidos en el texto.
//   7. Guion largo (U+2014), prohibido por la guía de estilo en español.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SOURCES = path.join(ROOT, 'sources');
const FIX_TOC = process.argv.includes('--fix-toc');
const TOC_MIN_LINES = 200;
const TOC_TITLE = '## 📋 Tabla de Contenidos';

// Anclas al estilo GitHub: minúsculas, se conservan letras, números, marcas (selector de emoji),
// espacios, guiones y guiones bajos; el espacio se convierte en guion. El emoji inicial
// desaparece pero deja el guion (## 🔧 Instalación → #-instalación).
const slugify = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\p{M} _-]/gu, '').replace(/ /g, '-');

const errors = [];
const warnings = [];
const err = (f, msg) => errors.push(`${f}: ${msg}`);
const warn = (f, msg) => warnings.push(`${f}: ${msg}`);

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const read = (p) => fs.readFileSync(p, 'utf8');
const files = [path.join(ROOT, 'README.md'), ...fs.readdirSync(SOURCES).filter((f) => f.endsWith('.md')).sort().map((f) => path.join(SOURCES, f))];

/** Devuelve las líneas con una marca de si están dentro de un bloque de código. */
function parse(text) {
  let fence = false;
  return text.replace(/\r\n/g, '\n').split('\n').map((line) => {
    const isFence = /^```/.test(line);
    if (isFence) fence = !fence;
    return { line, code: fence || isFence };
  });
}

function anchorsOf(parsed) {
  const seen = {};
  const set = new Set();
  for (const { line, code } of parsed) {
    const m = !code && line.match(/^#{1,6} (.*)/);
    if (!m) continue;
    const s = slugify(m[1]);
    const n = seen[s] ?? 0;
    seen[s] = n + 1;
    set.add(n ? `${s}-${n}` : s);
  }
  return set;
}

const docs = new Map(files.map((f) => [f, parse(read(f))]));
const anchors = new Map([...docs].map(([f, p]) => [f, anchorsOf(p)]));

// 1. Enlaces internos
for (const [f, parsed] of docs) {
  for (const { line, code } of parsed) {
    if (code) continue;
    for (const m of line.matchAll(/\]\(([^)\s]+)\)/g)) {
      const u = m[1];
      if (/^(https?:|mailto:)/.test(u)) continue;
      const [p, a] = u.split('#');
      const target = p ? path.resolve(path.dirname(f), p) : f;
      if (!fs.existsSync(target)) {
        err(rel(f), `enlace a fichero inexistente: ${u}`);
        continue;
      }
      if (a && anchors.has(target) && !anchors.get(target).has(a)) err(rel(f), `ancla inexistente: ${u}`);
    }
  }
}

// 2. Manuales huérfanos
const readme = read(path.join(ROOT, 'README.md'));
for (const f of files.slice(1)) {
  if (!readme.includes(`./sources/${path.basename(f)}`)) err(rel(f), 'no está enlazado desde el README');
}

for (const f of files.slice(1)) {
  const parsed = docs.get(f);
  const text = parsed.map((x) => x.line).join('\n');

  // 3. Metadatos
  const head = parsed.slice(0, 15).map((x) => x.line).join('\n');
  if (!/\*\*Nivel\*\*/.test(head)) err(rel(f), 'falta "Nivel" en la cabecera');
  if (!/\*\*Revisado\*\*: [a-záéíóú]+ \d{4}/i.test(head)) err(rel(f), 'falta "Revisado: mes año" en la cabecera');

  // 4. Bloques sin cerrar
  if (parsed.filter((x) => /^```/.test(x.line)).length % 2) err(rel(f), 'bloque de código sin cerrar');

  // 6. CJK
  if (/[぀-ヿ㐀-鿿]/.test(text)) err(rel(f), 'contiene caracteres CJK');

  // 7. Guion largo (U+2014): la guía de estilo en español lo prohíbe (usa comas, dos puntos o punto).
  text.split('\n').forEach((l, i) => {
    if (l.includes('—')) err(`${rel(f)}:${i + 1}`, 'contiene un guion largo (—): usa comas, dos puntos o punto');
  });

  // 5. Tabla de contenidos
  if (parsed.length > TOC_MIN_LINES) checkToc(f, parsed);
}

function checkToc(f, parsed) {
  const lines = parsed.map((x) => x.line);
  const heads = [];
  parsed.forEach(({ line, code }, i) => {
    if (!code && /^## /.test(line)) heads.push({ i, text: line.slice(3) });
  });
  const tocIdx = heads.findIndex((h) => /Tabla de Contenidos/i.test(h.text));
  const others = heads.filter((_, k) => k !== tocIdx);
  const seen = {};
  const items = others.map((h) => {
    let s = slugify(h.text);
    const n = seen[s] ?? 0;
    seen[s] = n + 1;
    if (n) s += `-${n}`;
    const label = h.text.replace(/^[^\p{L}\p{N}`]+/u, '').replace(/^\p{M}+/u, '').trim();
    return `- [${label}](#${s})`;
  });

  let needsFix = false;
  if (tocIdx < 0) {
    needsFix = true;
    err(rel(f), `más de ${TOC_MIN_LINES} líneas y sin tabla de contenidos`);
  } else {
    const start = heads[tocIdx].i;
    const end = heads[tocIdx + 1]?.i ?? lines.length;
    const current = lines.slice(start + 1, end).filter((l) => l.startsWith('- ['));
    if (current.join('\n') !== items.join('\n')) {
      needsFix = true;
      warn(rel(f), 'la tabla de contenidos no coincide con los encabezados actuales');
    }
  }

  if (FIX_TOC && needsFix) {
    if (tocIdx < 0) {
      if (others[0]) lines.splice(others[0].i, 0, TOC_TITLE, ...items, '');
    } else {
      const start = heads[tocIdx].i;
      const end = heads[tocIdx + 1]?.i ?? lines.length;
      lines.splice(start + 1, end - start - 1, '', ...items, '');
    }
    const original = read(f);
    fs.writeFileSync(f, lines.join(original.includes('\r\n') ? '\r\n' : '\n'));
    console.log(`TOC regenerada: ${rel(f)}`);
  }
}

for (const w of warnings) console.log(`aviso  ${w}`);
for (const e of errors) console.log(`ERROR  ${e}`);
console.log(`\n${files.length} ficheros revisados: ${errors.length} errores, ${warnings.length} avisos`);
process.exit(errors.length && !FIX_TOC ? 1 : 0);
