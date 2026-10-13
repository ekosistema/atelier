#!/usr/bin/env node
// Sincroniza ../sources y ../README.md con el contenido de Starlight.
// - No modifica nada fuera de site/. Todo lo generado está en .gitignore.
// - Convierte cada manual: frontmatter, cabecera de metadatos, enlaces internos, quita la TOC manual
//   (Starlight genera la suya) y deja las anclas intactas (mismo algoritmo github-slugger).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, paths, slugOf } from '../src/data/catalog.mjs';
import { site as brand } from '../src/data/site.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, '..');
const ROOT = path.resolve(SITE, '..');
const SOURCES = path.join(ROOT, 'sources');
const DOCS = path.join(SITE, 'src/content/docs');
const BASE = (process.env.SITE_BASE ?? '').replace(/\/$/, '');
const REPO = process.env.REPO_URL ?? brand.repo;

const fileBySlug = new Map();
for (const f of fs.readdirSync(SOURCES).filter((f) => f.endsWith('.md'))) fileBySlug.set(slugOf(f), f);

const categoryOf = new Map();
for (const c of categories) for (const s of c.slugs) categoryOf.set(s, c.id);

// --- Validación del catálogo ------------------------------------------------------------
const warn = (m) => console.warn(`⚠️  ${m}`);
for (const c of categories) for (const s of c.slugs) if (!fileBySlug.has(s)) warn(`categoría ${c.id}: no existe el manual "${s}"`);
for (const p of paths) for (const s of p.steps) if (!fileBySlug.has(s)) warn(`ruta ${p.id}: no existe el manual "${s}"`);
for (const s of fileBySlug.keys()) if (!categoryOf.has(s)) warn(`"${s}" no está en ninguna categoría del catálogo`);

// --- Utilidades -------------------------------------------------------------------------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const plain = (s) =>
  s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');

function rewriteLinks(line) {
  // [manual_kubectl.md](./manual_kubectl.md) → [kubectl](…): el texto del enlace es un nombre de fichero.
  line = line.replace(/\[(`?)([\w.-]+\.md)\1\]\(/g, (m, _t, name) => (titleByFile.has(name) ? `[${titleByFile.get(name)}](` : m));
  return line.replace(/\]\((\.{1,2}\/[^)\s]+)\)/g, (m, href) => {
    const [target, hash = ''] = href.split('#');
    const anchor = hash ? `#${hash}` : '';
    const name = path.basename(target);
    if (name === 'README.md') return hash === '-estado-del-software-octubre-2026' ? `](${BASE}/estado/)` : `](${BASE}/)`;
    if (target.endsWith('.md') && fileBySlug.has(slugOf(name))) return `](${BASE}/manuales/${slugOf(name)}/${anchor})`;
    const rel = path.posix.normalize(path.posix.join(target.startsWith('../') ? '' : 'sources', target.replace(/^\.\.\//, '')));
    return `](${REPO}/blob/main/${rel}${anchor})`;
  });
}

// Lenguajes de bloques de código que Shiki no conoce → el más parecido (evita avisos en el build).
const LANG_ALIAS = { cron: 'bash', gitignore: 'bash', tmux: 'bash', alloy: 'hcl', promql: 'txt', logql: 'txt', traceql: 'txt' };

function transformBody(lines) {
  const out = [];
  let inFence = false;
  for (const line of lines) {
    const fence = line.match(/^(\s*(?:```|~~~))(\w+)(.*)$/);
    if (/^\s*(```|~~~)/.test(line)) {
      const opening = !inFence;
      inFence = !inFence;
      out.push(opening && fence && LANG_ALIAS[fence[2]] ? `${fence[1]}${LANG_ALIAS[fence[2]]}${fence[3]}` : line);
      continue;
    }
    out.push(inFence ? line : rewriteLinks(line));
  }
  return out;
}

function stripToc(lines) {
  const i = lines.findIndex((l) => /^##\s+📋\s+Tabla de Contenidos/.test(l));
  if (i === -1) return lines;
  let j = i + 1;
  while (j < lines.length && !/^##\s/.test(lines[j])) j++;
  return [...lines.slice(0, i), ...lines.slice(j)];
}

const fm = (obj) =>
  '---\n' +
  Object.entries(obj)
    .map(([k, v]) =>
      typeof v === 'object' ? `${k}:\n${Object.entries(v).map(([a, b]) => `  ${a}: ${JSON.stringify(b)}`).join('\n')}` : `${k}: ${JSON.stringify(v)}`)
    .join('\n') +
  '\n---\n';

// Los títulos de página, menú, migas y datos estructurados van sin el emoji inicial del H1.
const stripEmoji = (s) => s.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim();

// Título limpio de cada manual por nombre de fichero (para sustituir enlaces cuyo texto es "manual_x.md").
const titleByFile = new Map();
for (const f of fileBySlug.values()) {
  const h1 = fs.readFileSync(path.join(SOURCES, f), 'utf8').match(/^# (.+)$/m)?.[1] ?? f;
  titleByFile.set(f, stripEmoji(h1.split(/\s+[–—-]\s+/)[0]));
}

// "octubre 2026" → "2026-10" (ISO 8601 parcial, válido para schema.org dateModified). Vacío si no se reconoce.
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const isoMonth = (s) => {
  const m = s.toLowerCase().match(/([a-záéíóú]+)\s+(\d{4})/);
  const i = m ? MONTHS.indexOf(m[1]) : -1;
  return i === -1 ? '' : `${m[2]}-${String(i + 1).padStart(2, '0')}`;
};

// --- Manuales ---------------------------------------------------------------------------
fs.rmSync(path.join(DOCS, 'manuales'), { recursive: true, force: true });
fs.rmSync(path.join(DOCS, 'rutas'), { recursive: true, force: true });
fs.mkdirSync(path.join(DOCS, 'manuales'), { recursive: true });
fs.mkdirSync(path.join(DOCS, 'rutas'), { recursive: true });

const manuals = [];
for (const [slug, file] of fileBySlug) {
  const raw = fs.readFileSync(path.join(SOURCES, file), 'utf8').replace(/\r\n/g, '\n');
  let lines = raw.split('\n');
  const h1 = lines.findIndex((l) => /^# /.test(l));
  const h1Text = lines[h1].replace(/^# /, '').trim();
  const [name, ...rest] = h1Text.split(/\s+[–—-]\s+/);
  const title = stripEmoji(rest.length ? name.trim() : h1Text);
  const tagline = rest.join(' – ').trim();
  lines.splice(h1, 1);
  while (lines[h1] === '') lines.splice(h1, 1);

  // Descripción: primer párrafo tras el H1.
  const para = [];
  for (const l of lines) {
    if (!l.trim()) { if (para.length) break; continue; }
    if (/^(#|>|```|\||- )/.test(l)) break;
    para.push(l.trim());
  }
  const description = clip(plain(para.join(' ')), 170) || tagline;

  // Cabecera de metadatos → chips.
  let level = '', requires = '', reviewed = '';
  const metaIdx = lines.findIndex((l) => /^> 🎯 \*\*Nivel\*\*/.test(l));
  const words = raw.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 210));
  if (metaIdx !== -1) {
    const m = lines[metaIdx].match(/\*\*Nivel\*\*:\s*(.*?)\s*·\s*\*\*Requisitos\*\*:\s*(.*?)\s*·\s*\*\*Revisado\*\*:\s*(.*)$/);
    if (m) [, level, requires, reviewed] = m;
    const chips = [
      `<span class="chip chip-level" data-level="${esc(level.toLowerCase())}">${esc(level)}</span>`,
      `<span class="chip"><b>Requisitos</b> ${inline(requires)}</span>`,
      `<span class="chip"><b>Revisado</b> ${esc(reviewed)}</span>`,
      `<span class="chip"><b>Lectura</b> ~${minutes} min</span>`,
    ].join('');
    lines.splice(metaIdx, 1, `<div class="manual-meta">${chips}</div>`);
  }

  lines = stripToc(lines);
  const body = transformBody(lines).join('\n').replace(/\n{3,}/g, '\n\n').trim()
    // El pie "Parte de la Colección… por CeleroLab" del README sobra: el sitio ya tiene su propio pie con créditos.
    .replace(/\n+---\s*\n+\*Parte de la \[[^\]]*\]\([^)]*\)[^\n]*\*\s*$/, '') + '\n';

  const front = fm({
    title,
    description,
    editUrl: `${REPO}/edit/main/sources/${file}`,
    sidebar: { label: title },
  });
  fs.writeFileSync(path.join(DOCS, 'manuales', `${slug}.md`), front + '\n' + (tagline ? `<p class="manual-tagline">${esc(tagline)}</p>\n\n` : '') + body);

  manuals.push({
    slug, file, title, tagline, description, level: level.toLowerCase(), requires: plain(requires),
    reviewed, reviewedISO: isoMonth(reviewed), minutes, category: categoryOf.get(slug) ?? null,
  });
}
fs.writeFileSync(path.join(SITE, 'src/data/manuals.json'), JSON.stringify(manuals, null, 2));

fs.writeFileSync(
  path.join(DOCS, 'manuales', 'index.mdx'),
  `${fm({
    title: 'Índice de manuales',
    description: 'Todos los manuales y cheatsheets, por tema y nivel.',
    sidebar: { label: 'Índice de manuales' },
    tableOfContents: false,
    editUrl: false,
  })}
import ManualIndex from '../../../components/ManualIndex.astro';

<ManualIndex />
`
);

// --- Rutas de aprendizaje ---------------------------------------------------------------
paths.forEach((p, i) => {
  const body = `${fm({
    title: p.title,
    description: p.goal,
    sidebar: { label: p.short, order: i + 1 },
    tableOfContents: false,
    editUrl: false,
  })}
import RouteTimeline from '../../../components/RouteTimeline.astro';

<RouteTimeline id="${p.id}" />
`;
  fs.writeFileSync(path.join(DOCS, 'rutas', `${p.id}.mdx`), body);
});

fs.writeFileSync(
  path.join(DOCS, 'rutas', 'index.mdx'),
  `${fm({
    title: 'Rutas de aprendizaje',
    description: 'Itinerarios que encadenan los manuales por orden de utilidad.',
    sidebar: { label: 'Todas las rutas', order: 0 },
    tableOfContents: false,
    editUrl: false,
  })}
import RouteCards from '../../../components/RouteCards.astro';

¿No sabes por dónde empezar? Elige la ruta que encaje con tu situación. Cada una encadena los manuales en el orden en que más sentido tiene leerlos, y puedes **marcar tu progreso**: se guarda solo en tu navegador.

<RouteCards />
`
);

// --- Estado del software (extraído del README) ------------------------------------------
{
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').replace(/\r\n/g, '\n').split('\n');
  const start = readme.findIndex((l) => /^##\s+🧹\s+Estado del software/.test(l));
  let end = readme.findIndex((l, i) => i > start && /^---\s*$/.test(l));
  if (end === -1) end = readme.length;
  const section = readme.slice(start + 1, end);
  const body = transformBody(section).join('\n').trim();
  const heading = readme[start].replace(/^##\s+🧹\s+/, '');
  const out = `${fm({
    title: 'Estado del software',
    description: 'Qué tecnologías están obsoletas, archivadas o han cambiado de licencia, y qué usar en su lugar.',
    editUrl: `${REPO}/edit/main/README.md`,
    sidebar: { label: 'Estado del software', hidden: true },
  })}
<p class="manual-tagline">${esc(heading)}</p>

${body}
`;
  fs.writeFileSync(path.join(DOCS, 'estado.md'), out);
}

console.log(`✔ ${manuals.length} manuales · ${paths.length} rutas · estado sincronizados`);
