import type { APIRoute } from 'astro';
import { categories, paths, bySlug, manuals, absolute } from '../data/lib';
import { site as brand } from '../data/site.mjs';

// /llms.txt: índice en Markdown para asistentes de IA (formato de llmstxt.org).
export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => absolute(p, site);
  const lines: string[] = [
    `# ${brand.name}: ${brand.tagline}`,
    '',
    `> ${brand.name} es una colección de ${manuals.length} manuales y hojas de referencia en español sobre terminal, Git, Python, desarrollo web, contenedores, DevOps, seguridad, IA y herramientas creativas. Cada manual indica su nivel, requisitos, fecha de revisión, versión vigente de la herramienta y su alternativa moderna. Creada y mantenida por CeleroLab (https://celerolab.com). Licencia MIT.`,
    '',
    '## Rutas de aprendizaje',
    '',
    ...paths.map((p) => `- [${p.title}](${u(`/rutas/${p.id}/`)}): ${p.goal} (${p.steps.length} manuales; para: ${p.audience})`),
    '',
  ];

  for (const c of categories) {
    lines.push(`## ${c.title}`, '', c.blurb, '');
    for (const s of c.slugs) {
      const m = bySlug.get(s);
      if (m) lines.push(`- [${m.title}](${u(`/manuales/${m.slug}/`)}): ${m.tagline || m.description} (nivel ${m.level}, revisado ${m.reviewed})`);
    }
    lines.push('');
  }

  lines.push(
    '## Opcional',
    '',
    `- [Estado del software](${u('/estado/')}): tecnologías obsoletas, archivadas o con cambios de licencia y su alternativa recomendada`,
    `- [Texto completo de los manuales](${u('/llms-full.txt')}): todos los manuales en un único fichero de texto`,
    `- [Repositorio](${brand.repo}): código fuente y contribuciones`,
    '- [CeleroLab](https://celerolab.com): autores de la colección',
    ''
  );

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
