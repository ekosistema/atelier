import manualsJson from './manuals.json';
import { categories, paths } from './catalog.mjs';

export type Manual = (typeof manualsJson)[number];
export type Route = (typeof paths)[number];
export type Category = (typeof categories)[number];

export const manuals: Manual[] = manualsJson;
export const bySlug = new Map(manuals.map((m) => [m.slug, m]));
export { categories, paths };

export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (slug: string) => `${base}/manuales/${slug}/`;
export const routeHref = (id: string) => `${base}/rutas/${id}/`;

/** Rutas de aprendizaje que incluyen un manual (puede ser ninguna, una o varias). */
export const routesOf = (slug: string): Route[] => paths.filter((p) => p.steps.includes(slug));
export const categoryOf = (slug: string): Category | undefined => categories.find((c) => c.slugs.includes(slug));

/** URL absoluta de una ruta interna (para JSON-LD, llms.txt, sitemap…). */
export const absolute = (pathname: string, site: URL | string | undefined) =>
  new URL(`${base}${pathname}`, site ?? 'http://localhost:4321').href;

/** "básico-intermedio" → "basico" (se colorea por el primer nivel). */
export const levelKey = (level: string) => {
  if (/^bás/.test(level)) return 'basico';
  if (/^interm/.test(level)) return 'intermedio';
  if (/^avanz/.test(level)) return 'avanzado';
  return 'otro';
};

/** Primera letra en mayúscula ("básico" → "Básico") para mostrar niveles. */
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Enlace a celerolab.com con UTM (convención de CeleroLab); `content` identifica el emplazamiento. */
export const celeroUrl = (content: string) =>
  `https://celerolab.com/?utm_source=atelier&utm_medium=referral&utm_campaign=campana_general&utm_content=${content}`;
