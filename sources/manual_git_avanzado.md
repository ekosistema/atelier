# Git avanzado – Operaciones quirúrgicas

Comandos quirúrgicos de Git para situaciones complejas: reescribir historial con rebase interactivo, recuperar commits perdidos con reflog, encontrar bugs con bisect y abrir varias ramas a la vez con worktrees.

> 🎯 **Nivel**: avanzado · **Requisitos**: saber `add`, `commit`, `push`, `pull`, `branch`, `merge` · **Revisado**: octubre 2026

## 🧪 Rebase interactivo

```bash
git rebase -i HEAD~5              # reordenar, fusionar, editar últimos 5 commits
git rebase -i main                # reubicar rama actual sobre main, commit a commit
```

Comandos dentro del editor:
- `pick`: mantener commit
- `reword`: cambiar mensaje
- `squash`: fusionar con el anterior (unir mensajes)
- `fixup`: fusionar descartando mensaje
- `drop`: eliminar commit

> ⚠️ No rebasees commits ya subidos si otros trabajan sobre ellos.

## 🔍 Reflog: el salvavidas

```bash
git reflog                        # historial de todo lo que hizo HEAD
git reflog --all                  # incluye ramas, stash, etc.
git reset --hard HEAD@{2}         # volver a un estado anterior del reflog
git branch rama-salvada <hash>    # recrear una rama borrada desde su commit
```

Si borraste una rama, hiciste `reset --hard` o perdiste commits, el reflog los conserva.

## 🐛 Bisect: encontrar el commit que rompió algo

```bash
git bisect start                  # iniciar búsqueda binaria
git bisect bad                    # commit actual está roto
git bisect good v1.0.0            # esta versión funcionaba bien
# Git te lleva a commits intermedios: prueba y marca good/bad
git bisect reset                  # salir del modo bisect
```

### Automatizar con `git bisect run`

Pasa un comando que devuelva estado 0 (bien) o distinto de 0 (mal):

```bash
git bisect start HEAD v1.0.0
git bisect run npm test           # ejecuta los tests en cada candidato
```

## 🍒 Cherry-pick: traer commits específicos

```bash
git cherry-pick abc1234           # aplicar commit en la rama actual
git cherry-pick abc1234..def5678  # rango de commits
git cherry-pick -n abc1234        # traer cambios sin commitear (-n = no commit)
```

## 🌳 Worktree: varias ramas en paralelo

```bash
git worktree add ../rama-fix fix-branch    # clonar rama en otra carpeta
git worktree add -b hotfix main ../hotfix  # nueva rama desde main
git worktree list                          # ver worktrees activos
git worktree remove ../rama-fix            # eliminar worktree
```

Útil para revisar una PR o hacer un hotfix sin tocar tu directorio de trabajo.

## 🧹 Sparse-checkout: un subconjunto del árbol

Reduce el working tree a las rutas que necesitas. Útil en monorepos gigantes.

```bash
git sparse-checkout init --cone   # activar modo "cono" (el recomendado)
git sparse-checkout set apps/web  # incluir solo apps/web
git sparse-checkout list          # ver rutas incluidas
git sparse-checkout disable       # volver al árbol completo
```

## 📦 Submódulos vs subtree

Ambos importan código externo, con filosofías distintas.

| Estrategia | Qué hace | Uso típico |
|---|---|---|
| `submodule` | Guarda una referencia a un commit exacto de otro repo | Dependencias controladas, versionado estricto |
| `subtree` | Crea una copia del código dentro de tu árbol | Vendoring, código que quieres editar y aportar de vuelta |

```bash
# submódulo
git submodule add https://github.com/user/lib.git libs/lib
git clone --recurse-submodules <url>
git submodule update --init --recursive

# subtree
git subtree add --prefix=libs/lib https://github.com/user/lib.git main
git subtree pull --prefix=libs/lib main
```

## ↔️ Range-diff: comparar dos rangos de commits

Examina qué cambió entre dos versiones de una serie de commits, útil tras un rebase.

```bash
git range-diff main~3..main topic~3..topic
# Muestra cómo evolucionó cada commit, con los diffs de cada uno.
```

## 🔍 Blame: culpabilidad a fondo

```bash
git blame -w <archivo>            # ignorar cambios de whitespace
git blame -C <archivo>            # seguir líneas movidas/copiadas entre archivos
git blame -w -C -C <archivo>      # detección más agresiva de movimientos
```

## 🧹 Reescribir historia a gran escala

Para borrar un archivo de todo el historial, Git recomienda `git filter-repo`
(mantenido y mucho más rápido y seguro).

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `git filter-branch` tiene numerosas trampas conocidas que pueden corromper el historial reescrito, y el proyecto añade advertencias al ejecutarlo. `BFG Repo-Cleaner` tampoco recibe mantenimiento. Alternativa recomendada: [git-filter-repo](https://github.com/newren/git-filter-repo).

```bash
# Instalar: pip install git-filter-repo
git filter-repo --path archivo-secreto.env --invert-paths   # eliminar un archivo
git filter-repo --path src/ --invert-paths                  # eliminar un directorio
# Trabaja sobre un CLON; no lo ejecutes donde compartas historia.
```

## ❓ FAQ

**❓ Cómo deshacer un `git rebase` que salió mal?**
➡ `git rebase --abort`: vuelve al estado anterior al rebase.

**❓ Cómo recuperar una rama que borré?**
➡ `git reflog` → encuentra el último commit → `git branch rama-recuperada <hash>`.

**❓ Diferencia entre `reset`, `revert` y `restore`?**
➡ `reset` mueve HEAD (reescribe historia). `revert` crea un nuevo commit que deshace cambios (seguro para compartir). `restore` descarta cambios del working tree.

**❓ Cómo reutilizar resoluciones de conflictos repetidas?**
➡ Activa `rerere`: `git config --global rerere.enabled true` (ver manual básico).

**❓ `filter-repo` exige un clon limpio?**
➡ Sí, devuelve un error si hay remotos; clona con `--no-origin` o añade `--force`.

## 🔗 Enlaces
- [Pro Git: Rewriting History](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)
- [git-filter-repo (GitHub)](https://github.com/newren/git-filter-repo)
- [Oh Shit, Git!: escenarios de rescate](https://ohshitgit.com/)
- [Learn Git Branching (interactivo)](https://learngitbranching.js.org/)

## 🧩 Ver también
- [Git: comandos esenciales](./manual_git.md)
- [Conventional Commits y SemVer](./manual_conventional_commits.md)
- [GitHub CLI (gh)](./manual_github_cli.md)
- [GitHub Actions](./manual_github_actions.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
