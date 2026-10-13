# Conventional Commits y SemVer – Mensajes de commit y versionado

Convención ligera para estructurar mensajes de commit con prefijos semánticos (feat, fix, docs, etc.). Permite generar changelogs automáticos y decidir la siguiente versión con SemVer.

> 🎯 **Nivel**: básico · **Requisitos**: Git y npm (Node.js) · **Revisado**: octubre 2026

## 📝 Formato de mensaje (spec v1.0.0)

```text
<tipo>(<ámbito opcional>): <descripción>

<cuerpo opcional>

<pie opcional>
```

### Tipos principales

| Tipo | Significado | Versión |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | minor |
| `fix` | Corrección de bug | patch |
| `BREAKING CHANGE` | Cambio incompatible (en pie o con `!`) | major |

### Tipos adicionales (recomendados por Angular)

| Tipo | Uso |
|------|-----|
| `docs` | Documentación |
| `style` | Formato, estilos (no afectan lógica) |
| `refactor` | Refactorización sin cambios funcionales |
| `perf` | Mejora de rendimiento |
| `test` | Tests |
| `build` | Sistema de build, dependencias |
| `ci` | CI/CD |
| `chore` | Mantenimiento, tareas internas |
| `revert` | Revertir un commit |

## 💡 Ejemplos

```text
feat: añadir login con OAuth

fix(cart): corregir cálculo de IVA en descuentos

feat(api)!: cambiar endpoint de /v1 a /v2

BREAKING CHANGE: la respuesta ya no incluye el campo "status"

docs: actualizar README con ejemplos de instalación

ci: añadir workflow de tests en GitHub Actions
```

## 🔄 SemVer 2.0.0

```text
MAJOR.MINOR.PATCH → 2.5.11
```

| Cambio | Incremento | Ejemplo |
|--------|-----------|---------|
| Breaking (incompatible) | MAJOR | 1.0.0 → 2.0.0 |
| Nueva funcionalidad (backward compatible) | MINOR | 1.0.0 → 1.1.0 |
| Bug fix (backward compatible) | PATCH | 1.0.0 → 1.0.1 |

### Pre-release y metadata

```text
1.0.0-alpha.1
1.0.0-beta.2
1.0.0-rc.1
2.0.0+build.20250101
```

## 🤖 Herramientas: lint de commits

```bash
# husky: hooks de Git (instalar como devDependency)
npm install --save-dev husky
npx husky init

# commitlint: valida mensajes contra la convención
npm install --save-dev @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
npx commitlint --from HEAD~1 --to HEAD   # pruebar el último mensaje
```

## 📦 Versionado y changelog automático

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `standard-version` está marcado como **deprecado en npm** (su mantenedor recomienda `release-please`). Alternativa recomendada: [release-please](https://github.com/googleapis/release-please).

| En su lugar | Qué hace | Ventaja | Manual |
|---|---|---|---|
| [release-please](https://github.com/googleapis/release-please) | Abre un PR de release desde los commits | Sin commits de release en tu historial | manual_conventional_commits.md |
| [semantic-release](https://semantic-release.gitbook.io/) | Versiona y publica automáticamente | Workflow de release completo (npm, GitHub, etc.) | manual_conventional_commits.md |
| [git-cliff](https://git-cliff.org/) | Genera CHANGELOG.md configurable | Escrito en Rust, rápido, plantillas Tera | manual_conventional_commits.md |

```bash
# git-cliff: generar CHANGELOG.md desde el historial (basado en Conventional Commits)
git-cliff -o CHANGELOG.md
```

## 📋 CHANGELOG generado

```markdown
# Changelog

## [2.1.0] - 2025-03-15
### Added
- feat: login con OAuth
- feat: exportar datos a CSV

### Fixed
- fix(cart): cálculo de IVA en descuentos

### Changed
- refactor: extraer validación a módulo separado
```

## ❓ FAQ

**❓ Cómo marcar un breaking change en el mensaje?**
➡ Añade `!` después del tipo: `feat(api)!: cambiar endpoint a /v2`, o `BREAKING CHANGE: ...` en el pie.

**❓ Debo usar Conventional Commits en proyectos personales?**
➡ No es obligatorio, pero ayuda a generar changelogs automáticos y a mantener un historial legible.

**❓ Qué herramienta de release elijo?**
➡ En GitHub: `release-please`. Con ecosistema de plugins de publicación: `semantic-release`. Solo changelog: `git-cliff`.

**❓ Qué hago si un commit mezcla varios cambios?**
➡ Idealmente un commit por cambio. Usa `git add -p` para commits atómicos.

## 🔗 Enlaces
- [Conventional Commits: spec v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
- [SemVer 2.0.0](https://semver.org/)
- [Angular commit guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [commitlint](https://commitlint.js.org/)
- [Keep a Changelog](https://keepachangelog.com/)

## 🧩 Ver también
- [Git: comandos esenciales](./manual_git.md)
- [Git avanzado](./manual_git_avanzado.md)
- [GitHub CLI (gh)](./manual_github_cli.md)
- [GitHub Actions](./manual_github_actions.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
