import { manuals, paths } from './lib';

// Preguntas frecuentes de la portada. Se muestran en HTML visible y se reutilizan como
// FAQPage (JSON-LD), así que las respuestas son texto plano y deben ser ciertas y citables.
export const faq = [
  {
    q: '¿Qué es Atelier?',
    a: `Atelier es una colección de ${manuals.length} manuales y cheatsheets en español sobre terminal, Git, Python, desarrollo web, contenedores, DevOps, seguridad, inteligencia artificial y herramientas creativas. La mantiene CeleroLab y se distribuye con licencia MIT.`,
  },
  {
    q: '¿Para quién está pensada?',
    a: 'Para quien empieza en desarrollo y para quien ya programa y necesita una referencia fiable. Cada manual declara su nivel (básico, intermedio o avanzado) y sus requisitos previos al principio de la página.',
  },
  {
    q: '¿Por dónde empiezo?',
    a: `Elige una de las ${paths.length} rutas de aprendizaje. Si estás empezando, la ruta «De cero a desarrollador con tooling» encadena los manuales en orden: Git, Bash, Docker, bases de datos y herramientas de línea de comandos.`,
  },
  {
    q: '¿Qué tan actualizados están los manuales?',
    a: 'Se revisaron entre octubre y noviembre de 2026. Cada manual muestra su fecha de revisión, indica la versión vigente de la herramienta y señala qué está obsoleto y cuál es la alternativa moderna, por ejemplo uv frente a pyenv u OpenTofu frente a Terraform.',
  },
  {
    q: '¿Puedo usar y compartir el contenido?',
    a: 'Sí. El contenido se distribuye con licencia MIT: puedes copiarlo, adaptarlo y redistribuirlo conservando el aviso de licencia.',
  },
  {
    q: '¿Cómo propongo una corrección?',
    a: 'Abre un issue o un pull request en el repositorio de GitHub. Los datos de versiones, fechas de fin de vida y licencias se verifican contra fuentes oficiales antes de publicarse.',
  },
];
