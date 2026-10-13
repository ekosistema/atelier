# Git – Control de versiones distribuido

Sistema de control de versiones distribuido que registra cada cambio en archivos y coordina el trabajo de múltiples desarrolladores. Con él puedes ramificar, fusionar, deshacer errores y colaborar sin servidor central.

> 🎯 **Nivel**: básico · **Requisitos**: Git instalado (v2.56 disponible sep. 2026) · **Revisado**: octubre 2026

## 🔧 Configuración inicial

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
git config --global init.defaultBranch main    # rama por defecto en nuevos repos
git config --global pull.ff only               # pull solo con fast-forward (seguro)
git config --global rerere.enabled true        # reutiliza resoluciones de conflictos
```

### Alias útiles

```bash
git config --global alias.lg  "log --oneline --graph --all --decorate"
git config --global alias.co  "checkout"
git config --global alias.br  "branch"
git config --global alias.st  "status -sb"
git config --global alias.unstage "restore --staged"
```

## 🆕 Crear y clonar repositorios

```bash
git init                    # iniciar repo local
git clone <url>             # clonar repo remoto
git clone --depth 1 <url>   # clonar superficial (solo último commit)
git clone --filter=blob:none <url>   # sin blobs (más ligero en monorepos)
```

## 📝 Commits básicos

```bash
git status                # ver estado del working tree
git diff                  # cambios sin staging
git diff --staged         # cambios en staging
git add <archivo>         # añadir a staging
git add -p                # añadir por fragmentos (hunks)
git commit -m "mensaje"   # crear commit
git commit --amend -m "nuevo"  # corregir último commit (no si ya se subió)
```

## 🌿 Ramas: `git switch` (moderno) y `checkout`

Desde Git 2.23 (2019) el comando sobrecargado `checkout` se dividió en dos:
`git switch` para ramas y `git restore` para archivos. Ambos conviven; usa los nuevos.

```bash
git switch <nombre>        # cambiar de rama (antiguo: git checkout <nombre>)
git switch -c <nombre>     # crear rama y cambiarse  (antiguo: git checkout -b)
git switch -               # volver a la rama anterior
git branch <nombre>        # crear rama sin cambiarse
git branch -d <nombre>     # eliminar rama fusionada  (-D fuerza)
git merge <rama>           # fusionar rama en la actual
```

## 🔄 Remotos y `pull`

```bash
git remote -v                  # ver remotos
git remote add origin <url>    # añadir remoto
git push origin <rama>         # subir rama
git push -u origin <rama>      # subir y fijar upstream
git fetch                      # traer cambios sin fusionar
git pull --rebase              # reubicar commits locales sobre el remoto
```

> 📌 **Estado**: desde Git 2.27, `git pull` con ramas divergentes y sin estrategia configurada muestra advertencia (o falla desde 2.34). Configura en todos tus repos `pull.ff only` y apáñatelas con `rebase`/`merge` explícitos en cada `pull`.

## 📜 Historial y culpabilidad

```bash
git log --oneline             # historial resumido
git log --oneline --graph     # historial con árbol de ramas
git log -p                    # historial con diffs
git log -S "texto"            # commits que añadieron/eliminaron "texto"
git blame <archivo>           # autor de cada línea
```

## ↩️ Deshacer cambios

```bash
git restore <archivo>            # descartar cambios del working tree
git restore --staged <archivo>   # sacar de staging
git reset --soft HEAD~1          # deshacer commit, mantener cambios
git reset --hard HEAD~1          # deshacer commit y cambios (¡peligro!)
git revert <commit>              # revertir con un nuevo commit (seguro para compartir)
git stash                        # guardar cambios temporalmente
git stash pop                    # recuperar los últimos cambios guardados
git stash list                   # ver stashes
```

> ⚠️ **Reescribir historia** (`reset --hard`, `rebase -i`, `amend`): solo en commits locales. Reescribir historia ya publicada obliga a `--force` y rompe el trabajo de quien la haya clonado. Para cambios publicados usa `git revert` o un `git switch` a otra rama.

## ✍️ Firmar commits (GPG o SSH)

```bash
# Firmado con GPG
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true
git commit -S -m "mensaje firmado"

# Firmado con tu clave SSH existente (Git ≥ 2.34 y OpenSSH ≥ 8.2)
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git commit -S -m "firmado con SSH"
git config --global tag.gpgsign true   # firmar tags por defecto
```

## 🏷️ Tags

```bash
git tag v1.0.0              # tag ligero
git tag -a v1.0.0 -m "msg"  # tag anotado
git push origin v1.0.0      # subir tag
git push --tags             # subir todos los tags
git tag -d v1.0.0           # eliminar tag local
```

## ⚙️ Git maintenance

`git maintenance` (Git ≥ 2.30) ejecuta en segundo plano tareas que aceleran el repo
(empaquetado, reducción de fases, `gc`). Ideal para repos grandes.

```bash
git maintenance start                     # registrar trabajos automáticos en segundo plano
git maintenance run --task=gc             # ejecutar tareas puntuales
git maintenance stop                      # detener los trabajos automáticos
git config maintenance.auto false         # desactivar el registro automático
```

## 🧩 Worktrees: varias ramas a la vez

`git worktree` permite abrir varias ramas en paralelo sin `stash` ni cambios de directorio.

```bash
git worktree add ../rama-fix fix-branch   # clonar rama en otra carpeta
git worktree list                         # ver worktrees activos
git worktree remove ../rama-fix           # eliminar worktree
```

## 🔁 rerere: reutilizar conflicto resuelto

`rerere` ("reuse recorded resolution") recuerda cómo resolviste un conflicto y lo reaplica
automáticamente en rebases/merges repetidos. Se activa una vez por repo (o global).

```bash
git config --global rerere.enabled true   # activar en todos los repos
# A partir de aquí, Git graba tus resoluciones; no requiere más comandos.
```

## ❓ FAQ

**❓ Diferencia entre `git switch` y `git checkout`?**
➡ `switch` solo trabaja con ramas; `checkout` también y quedó desaconsejado para ramas. Ambos siguen funcionando.

**❓ Cómo ignorar archivos?**
➡ Crea un `.gitignore` y lista patrones:

```gitignore
node_modules/
.env
*.log
```

**❓ Cómo deshacer un `git add`?**
➡ `git restore --staged <archivo>`

**❓ Puedo firmar commits sin GPG?**
➡ Sí, con tu clave SSH: `git config --global gpg.format ssh` y `user.signingkey` apuntando a tu `.pub`.

**❓ Cómo contribuir a un proyecto open source?**
➡ Fork → clone → rama → commits → push → Pull Request (ver manual de [`gh`](./manual_github_cli.md)).

## 🔗 Enlaces
- [Git oficial](https://git-scm.com/)
- [Pro Git book (gratuito)](https://git-scm.com/book/es/v2)
- [Documentación git-switch](https://git-scm.com/docs/git-switch)
- [Documentación git-maintenance](https://git-scm.com/docs/git-maintenance)

## 🧩 Ver también
- [Git avanzado](./manual_git_avanzado.md)
- [Conventional Commits y SemVer](./manual_conventional_commits.md)
- [GitHub CLI (gh)](./manual_github_cli.md)
- [GitHub Actions](./manual_github_actions.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
