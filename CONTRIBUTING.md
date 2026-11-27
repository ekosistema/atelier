# Guía de contribución

¡Gracias por querer mejorar Atelier! Este repositorio es una colección de manuales y cheatsheets en **español** (Markdown) y el sitio web que los publica (`site/`). No hay aplicación que compilar: contribuir es, sobre todo, editar documentación.

Al participar aceptas cumplir el [Código de conducta](./CODE_OF_CONDUCT.md). Las contribuciones se publican bajo la [licencia MIT](./LICENSE) del proyecto.

## Formas de contribuir

- **Corregir un error**: dato desactualizado, enlace roto, comando que no funciona, errata. Abre un [issue](https://github.com/ekosistema/atelier/issues/new/choose) o envía directamente un Pull Request.
- **Actualizar un manual**: versiones, fin de vida, cambios de licencia o alternativas modernas.
- **Proponer un manual nuevo**: abre antes un issue para comprobar que encaja y que nadie lo está haciendo.
- **Mejorar el sitio** (`site/`): accesibilidad, diseño, rendimiento. Lee antes [`site/DESIGN.md`](./site/DESIGN.md).

Para dudas generales, usa un issue; para vulnerabilidades, sigue la [política de seguridad](./SECURITY.md).

## Cómo enviar un cambio

1. Haz un fork y crea una rama desde `main` (`docs/tema`, `fix/descripcion`).
2. Aplica tus cambios siguiendo las convenciones de abajo.
3. Ejecuta el comprobador y corrige lo que señale:

   ```bash
   node scripts/check-docs.mjs            # enlaces, anclas, cabeceras, bloques de código, TOC...
   node scripts/check-docs.mjs --fix-toc  # además regenera las tablas de contenidos
   ```

   Requiere Node 18 o posterior y no instala dependencias.
4. Si tocas `site/`, comprueba que compila: `cd site && npm install && npm run build`.
5. Haz commits siguiendo [Conventional Commits](./sources/manual_conventional_commits.md) en español (`docs: …`, `fix: …`, `feat(site): …`).
6. Abre el Pull Request rellenando la plantilla.

## Convenciones de los manuales

- Parte de [`templates/plantilla_manual.md`](./templates/plantilla_manual.md) y cópiala a `sources/manual_<tema>.md`.
- Título `# Tecnología – descripción corta`, párrafo introductorio y línea de metadatos con **Nivel**, **Requisitos** y **Revisado** (el comprobador exige los dos primeros campos).
- Secciones con `## <emoji> Título` y bloques de código con lenguaje y comentarios explicativos.
- Indica el **estado vigente** de la herramienta (versión, obsolescencia) y su **alternativa moderna**.
- **Verifica los datos en la fuente oficial** (versiones, fechas de fin de vida, licencias) y cita el enlace. Si no puedes comprobar algo, no lo afirmes.
- La fecha **Revisado** solo se cambia cuando has revisado de verdad el contenido de ese manual.
- Los manuales de más de ~200 líneas llevan `## 📋 Tabla de Contenidos`; regenérala con `--fix-toc` en lugar de escribirla a mano.
- Escribe en español neutro, claro y directo.

## Mantener el README sincronizado

Al añadir, renombrar o eliminar un manual en `sources/`:

1. Añade o actualiza su entrada en la sección temática del [README](./README.md) (`- [Título](./sources/fichero.md) → descripción`).
2. Actualiza la ruta de aprendizaje o la tabla «Estado del software» si les afecta.
3. Usa siempre enlaces relativos (`./sources/...`).

## Revisión

Un mantenedor revisará tu Pull Request y puede pedirte cambios o fuentes. Las discusiones deben ser respetuosas y centrarse en el contenido. Los PR deben pasar el comprobador de documentación antes de fusionarse.
