import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { categories } from './src/data/catalog.mjs';
import { site as brand } from './src/data/site.mjs';

// SITE_URL / SITE_BASE se fijan en el workflow de despliegue (dominio propio → base vacía).
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const base = process.env.SITE_BASE || undefined;
const repo = process.env.REPO_URL ?? brand.repo;
const abs = (p) => new URL(`${base ?? ''}${p}`, site).href;

export default defineConfig({
  site,
  base,
  // Navegación casi instantánea: precarga la página al pasar el ratón / enfocar un enlace.
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    starlight({
      title: brand.name,
      description: brand.description,
      defaultLocale: 'root',
      locales: { root: { label: 'Español', lang: 'es' } },
      favicon: '/favicon.svg',
      logo: {
        light: './src/assets/atelier-logo-on-light.svg',
        dark: './src/assets/atelier-logo-on-dark.svg',
        alt: brand.name,
        replacesTitle: true,
      },
      social: [{ icon: 'github', label: 'GitHub', href: repo }],
      lastUpdated: false,
      credits: false,
      // Sin marco de "terminal" (los tres puntos) en los bloques bash/sh: menos ruido, más código.
      expressiveCode: { defaultProps: { frame: 'code' } },
      customCss: [
        '@fontsource-variable/inter',
        '@fontsource-variable/jetbrains-mono',
        './src/styles/custom.css',
      ],
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: abs('/og.png') } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: `${brand.name}: ${brand.tagline.toLowerCase()}, en español` } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: brand.name } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: abs('/og.png') } },
        { tag: 'meta', attrs: { name: 'author', content: brand.author } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0b0d14' } },
        { tag: 'link', attrs: { rel: 'alternate', type: 'text/plain', href: abs('/llms.txt'), title: 'llms.txt' } },
      ],
      components: {
        Head: './src/components/Head.astro',
        PageTitle: './src/components/PageTitle.astro',
        Pagination: './src/components/Pagination.astro',
        Footer: './src/components/Footer.astro',
        SocialIcons: './src/components/SocialIcons.astro',
      },
      // Menú: un enlace al índice, las rutas (orden de aprendizaje) y los manuales por tema
      // (de lo básico a lo especializado). Los grupos se despliegan solos al entrar en uno de sus manuales.
      // "Estado del software" no está aquí a propósito: vive en el pie de página.
      sidebar: [
        { label: 'Índice de manuales', link: '/manuales/' },
        { label: 'Rutas de aprendizaje', items: [{ autogenerate: { directory: 'rutas' } }] },
        {
          label: 'Manuales por tema',
          items: categories.map((c) => ({
            label: c.title,
            collapsed: true,
            items: c.slugs.map((s) => ({ slug: `manuales/${s}` })),
          })),
        },
      ],
    }),
  ],
});
