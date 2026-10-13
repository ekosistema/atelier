import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { categories, bySlug, absolute } from '../data/lib';
import { site as brand } from '../data/site.mjs';

// /llms-full.txt: el texto íntegro de todos los manuales (Markdown original de /sources),
// en el mismo orden que el menú, para que un LLM pueda ingerirlos de una vez.
export const GET: APIRoute = ({ site }) => {
  const sources = path.resolve(process.cwd(), '..', 'sources');
  const out: string[] = [
    `# ${brand.name}: texto completo de los manuales`,
    '',
    `> ${brand.name} es una colección de manuales en español creada y mantenida por CeleroLab (https://celerolab.com). Licencia MIT.`,
    '',
  ];
  for (const c of categories) {
    for (const s of c.slugs) {
      const m = bySlug.get(s);
      if (!m) continue;
      const raw = fs.readFileSync(path.join(sources, m.file), 'utf8').replace(/\r\n/g, '\n').trim();
      out.push('---', '', `Fuente: ${absolute(`/manuales/${m.slug}/`, site)}`, `Tema: ${c.title}`, '', raw, '');
    }
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
