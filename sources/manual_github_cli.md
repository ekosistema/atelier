# GitHub CLI – Operar GitHub desde el terminal

`gh` (GitHub CLI) es la herramienta oficial de línea de comandos para GitHub: issues, pull requests, releases, gists y la API de GitHub sin salir del terminal.

> 🎯 **Nivel**: básico · **Requisitos**: GitHub CLI instalado (v2.101) · **Revisado**: octubre 2026

## 🔑 Autenticación

```bash
gh auth login                 # iniciar sesión (navegador o token)
gh auth status                # ver estado de autenticación
gh auth token                 # imprimir el token usado
gh auth logout                # cerrar sesión
```

## 📦 Comandos de repositorio

```bash
gh repo create mi-proyecto --public --clone     # crear repo y clonar
gh repo clone <propietario>/<repo>              # clonar (mantiene remotos)
gh repo view <propietario>/<repo>               # ver detalles y URL
gh repo fork <repo> --clone                     # fork y clonar
```

## 🔀 Pull requests

```bash
gh pr create --base main --title "feat: login" --body "Descripción"   # abrir PR
gh pr create --draft                                  # PR en borrador
gh pr checkout 123                                   # cambiar a una PR existente (crea rama)
gh pr view 123                                       # ver PR
gh pr diff 123                                       # ver el diff
gh pr review 123 --approve                           # aprobar
gh pr review 123 --comment --body "Comentario"       # comentar
gh pr checks 123                                     # ver estado de los checks de CI
gh pr merge 123 --squash --delete-branch             # fusionar y limpiar rama
```

## 🐛 Issues

```bash
gh issue create --title "Bug: login" --body "Repro..." --label bug
gh issue list --label bug --assignee @me
gh issue view 42
gh issue close 42 --reason completed
gh issue comment 42 --body "Corregido en #50"
```

## 🚀 Releases

```bash
gh release create v1.0.0 dist/app.zip --title "v1.0.0" --notes "Cambios: ver CHANGELOG"
gh release view v1.0.0
gh release list --limit 10
gh release download v1.0.0 --pattern "*.deb"   # descargar artefactos
```

## 🧩 Gists

```bash
gh gist create script.py --public          # crear gist
gh gist list                                # listar los propios
gh gist view <id>
gh gist edit <id> --add script2.py
```

## 📊 Flujos de Actions y API

```bash
gh run watch                                # seguir la ejecución del workflow actual en tiempo real
gh run list --branch main --limit 10        # listar ejecuciones recientes
gh run download <run-id> --dir ./artifacts  # descargar artefactos

# gh api: acceso directo a la API REST de GitHub
gh api repos/octocat/hello-world            # GET de un repo
gh api /repos/{owner}/{repo}/pulls?state=open   # listar PRs abiertos (JSON)
gh api user -q .login                       # filtrar con jq (--jq equivale a -q)
```

## 🧩 Extensiones e instalación

```bash
gh extension install <propietario>/<ext>    # instalar extensión comunitaria
gh extension list                           # ver extensiones instaladas

# Instalación de gh
# macOS: brew install gh · Debian/Ubuntu: repos oficiales · Windows: winget install GitHub.cli
```

## 🤖 GitHub CLI en CI (GH_TOKEN)

`gh` usa la variable de entorno `GH_TOKEN` para autenticarse sin pasos interactivos:
en GitHub Actions ya viene con el token `GITHUB_TOKEN`.

```yaml
# .github/workflows/release.yml
steps:
  - uses: actions/checkout@v4
  - name: Publicar release
    run: gh release create v1.0.0 dist/app.zip
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## ❓ FAQ

**❓ `gh` autentica también mis pulsos de `git push`?**
➡ Con `gh auth login` (y `gh auth setup-git`) GitHub CLI configura el credencial helper para HTTP para todo Git.

**❓ Puedo usar `gh` sin instalar nada en CI?**
➡ GitHub Actions ya incluye `gh`; para otros CI instálalo o usa su binario.

**❓ Qué hay de GitLab?**
➡ `gh` es específico de GitHub. GitLab tiene `glab` (CLI similar, no está en esta colección).

## 🔗 Enlaces
- [GitHub CLI: cli.github.com](https://cli.github.com/)
- [Manual oficial de gh](https://cli.github.com/manual/)
- [Documentación gh auth login](https://cli.github.com/manual/gh_auth_login)
- [GitHub Docs: quickstart](https://docs.github.com/en/github-cli/github-cli/quickstart)

## 🧩 Ver también
- [Git: comandos esenciales](./manual_git.md)
- [Git avanzado](./manual_git_avanzado.md)
- [GitHub Actions](./manual_github_actions.md)
- [Conventional Commits y SemVer](./manual_conventional_commits.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
