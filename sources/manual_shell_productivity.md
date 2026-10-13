# Productividad en Shell – Trucos del día a día

Trucos y técnicas para ser más eficiente en la terminal: historial, readline, .inputrc, alias, pushd/popd, prompt moderno y herramientas complementarias (fzf, atuin, direnv, zoxide, broot, tmux).

> 🎯 **Nivel**: intermedio · **Requisitos**: bash o zsh; herramientas extra instaladas con tu gestor de paquetes · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos

- [Búsqueda en historial](#-búsqueda-en-historial)
- [readline y `.inputrc`](#️-readline-y-inputrc)
- [Atajos de historial (bash)](#-atajos-de-historial-bash)
- [Trucos cotidianos](#-trucos-cotidianos)
- [pushd / popd: pila de directorios](#-pushd--popd-pila-de-directorios)
- [Alias y funciones](#-alias-y-funciones)
- [Prompt moderno (starship)](#-prompt-moderno-starship)
- [direnv, zoxide y broot](#-direnv-zoxide-y-broot)
- [Shells alternativos: zsh y fish](#-shells-alternativos-zsh-y-fish)
- [tmux: sesiones persistentes](#-tmux-sesiones-persistentes)
- [Paralelismo en CLI](#-paralelismo-en-cli)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔍 Búsqueda en historial

```bash
# Búsqueda inversa nativa (bash/zsh): Ctrl+R, escribe, Ctrl+R de nuevo
# para más coincidencias
```

> ⚠️ **En desuso (oct. 2026)**: `history | grep <texto>` busca en el historial *volcado en pantalla* sin filtrar bien y sin autocompletar. Alternativa recomendada: **fzf** (búsqueda fuzzy en Ctrl+R) o **atuin** (historial sincronizado, cifrado y con búsqueda fuzzy/sql).

```bash
# fzf: reemplaza Ctrl+R por búsqueda fuzzy interactiva
fzf --history                       # busca en el historial de shell
# en ~/.bashrc: source /usr/share/fzf/key-bindings.bash  → Ctrl+R fzf

# atuin: historial local/remoto con búsqueda y estadísticas
atuin search docker run             # búsqueda SQL/fuzzy
atuin stats                         # qué comandos usas más
```

## ⌨️ readline y `.inputrc`

`readline` gobierna la edición en bash. Configúralo en `~/.inputrc`:

```bash
# ~/.inputrc: sobreescribe por defecto y añade atajos útiles
set editing-mode vi          # modos vi (o emacs)
set show-all-if-ambiguous on # tabulador completa aunque haya ambigüedad
set menu-complete-display-prefix on
"\\C-p": history-search-backward   # Ctrl+P busca hacia atrás en el historial
```

## 🚀 Atajos de historial (bash)

```bash
!!                    # repetir el último comando
sudo !!               # repetir el último con sudo
!$                    # último argumento del comando anterior
!$:r                  # último argumento sin extensión
!:2                   # segundo argumento del comando anterior
!vi                   # último comando que empezaba con "vi"
^foo^bar              # repetir el último reemplazando foo por bar
history               # listar el historial
```

```bash
# Control del historial (variables en ~/.bashrc)
export HISTCONTROL=ignoredups:erasedups   # sin duplicados consecutivos
export HISTSIZE=10000 && export HISTFILESIZE=20000
shopt -s histappend                       # no pises el historial al salir
```

## 📋 Trucos cotidianos

```bash
mkdir carpeta && cd !$      # crea y entra (usa el último argumento)
mkdir -p proyectos/{web,api,cli}   # llaves: crea 3 carpetas
touch {a,b,c}.txt                 # crea 3 archivos
cp archivo.{txt,md}               # copia archivo.txt → archivo.md
mv log.{old,new}                  # renombra log.old → log.new

# Redirecciones
comando |& less          # stdout+stderr juntos en less (bash 4+)
comando &> /dev/null     # silenciar todo
```

## 🔄 pushd / popd: pila de directorios

```bash
pushd /var/log         # guarda la ubicación actual y cambia
pushd /etc             # suma otra entrada a la pila
dirs -v                # muestra la pila numerada (0 = actual)
popd                    # vuelve a la anterior y la elimina de la pila
cd +2                   # salta al tercero de la pila (índice 2)
```

## ⚡ Alias y funciones

```bash
# ~/.bashrc o ~/.zshrc
alias ll='ls -lah --color=auto'
alias la='ls -A'
alias ..='cd ..'
alias gs='git status'
alias grep='grep --color=auto'
alias timestamp='date +%s'

# Funciones: más lógica que un alias simple
mkcd() { mkdir -p "$1" && cd "$1"; }
gitignore() { curl -sL "https://www.toptal.com/developers/gitignore/api/$1" -o .gitignore; }
```

## 🎨 Prompt moderno (starship)

Starship es un prompt rápido para cualquier shell, configurado con un solo fichero TOML.

```bash
# Instala y activa (inicializa en .bashrc/.zshrc)
curl -sS https://starship.rs/install.sh | sh
eval "$(starship init bash)"    # en ~/.bashrc

# Configuración (~/.config/starship.toml)
# add_newline = false
# [git_branch] · show_symbol = true
```

## 📁 direnv, zoxide y broot

```bash
# direnv: carga variables por directorio (al entrar a la carpeta)
direnv allow .            # en el directorio con un .envrc
# .envrc: export DATABASE_URL=postgres://user:pass@localhost/db

# zoxide: cd "inteligente" (frecuencia y recurrencia)
z proyectos               # salta a tu directorio más usado
zi                        # en modo interactivo

# broot: navegador de árbol interactivo con búsqueda instantánea
broot                     # navega, encuentra y selecciona ficheros
```

## 🐚 Shells alternativos: zsh y fish

```bash
# zsh + framework (zinit/oh-my-zsh) y plugins útiles
# Ejemplos de plugins: zsh-autosuggestions, zsh-syntax-highlighting, fzf-tab
brew install zsh zsh-autosuggestions   # Homebrew; igual apt/dnf/pacman
chsh -s /usr/bin/zsh                    # hacer zsh tu shell por defecto

# fish: autosugerencias y resaltado integrados de serie (no 100% POSIX)
brew install fish
fish                                     # línea interactiva con sugerencias
```

## 🪟 tmux: sesiones persistentes

```bash
tmux new -s trabajo     # nueva sesión nombrada
tmux ls                 # listar sesiones
tmux attach -t trabajo  # reconectar (la sesión sigue si se pierde la SSH)
```

Atajos dentro de tmux (prefix `Ctrl-b`):

```text
Ctrl-b c        # nueva ventana
Ctrl-b ,        # renombrar ventana
Ctrl-b %        # divider vertical
Ctrl-b "        # divider horizontal
Ctrl-b d        # desgajar (detach), la sesión sigue viva
Ctrl-b [        # modo scroll/copy (q para salir)
```

## 🚀 Paralelismo en CLI

```bash
# xargs con -P: N procesos en paralelo
cat urls.txt | xargs -P 8 -I {} curl -s -o /dev/null -w "%{http_code} {}\n" {}

# GNU parallel: batching, logs y reinicios
seq 1 100 | parallel -j 8 python script.py {}
parallel --bar -j4 convert img_{}.png out_{}.jpg ::: 1 2 3 4   # con barra de progreso
```

## ❓ FAQ

**❓ ¿Cómo evito escribir siempre `sudo`?**
➡ `sudo -s` (shell como root) o `sudo -i` (login shell). Úsalo con moderación.

**❓ ¿Repetir el último comando cambiando un parámetro?**
➡ `^viejo^nuevo`, p. ej. `^foo^bar` reemplaza en el comando anterior.

**❓ ¿Dónde están mis alias y funciones?**
➡ Revisa `~/.bashrc` (o `~/.zshrc`), y `which <comando>` te dice si es alias, función o binario.

**❓ ¿Por qué se pierde el historial al abrir otra pestaña?**
➡ Añade `shopt -s histappend` y sube `HISTSIZE`. En tmux presiste si no cierras la sesión.

**❓ ¿Ctrl+R no busca bien comandos parecidos?**
➡ Prefiere fzf (mejor fuzzy) o atuin (búsqueda SQL y cifrada). Ver sección anterior.

## 🔗 Enlaces

- [Bash Hackers Wiki](https://wiki.bash-hackers.org/)
- [fzf: GitHub](https://github.com/junegunn/fzf)
- [atuin: GitHub](https://github.com/atuinsh/atuin)
- [starship](https://starship.rs/)
- [direnv: GitHub](https://github.com/direnv/direnv)
- [zoxide: GitHub](https://github.com/ajeetdsouza/zoxide)
- [broot: GitHub](https://github.com/Canop/broot)
- [GNU parallel](https://www.gnu.org/software/parallel/)
- [tmux: GitHub](https://github.com/tmux/tmux)

## 🧩 Ver también

- [Cheat Sheet de comandos Linux](./cheatsheet_comandos_linux.md)
- [Manual de Bash scripting](./manual_bash_scripting.md)
- [Manual de tmux](./manual_tmux.md)
- [Manual de Vim/Nano](./manual_vim_nano.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
