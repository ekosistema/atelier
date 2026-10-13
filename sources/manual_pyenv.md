# pyenv – Múltiples versiones de Python en el mismo sistema

pyenv instala y alterna entre varias versiones de Python sin tocar las de sistema, mediante *shims* en tu `PATH`. Con el plugin pyenv-virtualenv añade además entornos virtuales ligados a cada versión.

> 🎯 **Nivel**: básico · **Requisitos**: Linux o macOS (Windows: usar WSL o pyenv-win) · **Revisado**: octubre 2026

## 🔧 Instalación

```bash
# macOS (Homebrew)
brew install pyenv
brew install pyenv-virtualenv        # plugin de entornos virtuales

# Linux/macOS sin Homebrew
curl https://pyenv.run | bash
```

Añade al final de `~/.zshrc` (o `~/.bashrc`) e inicia una sesión nueva:

```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
```

> 🧪 **Alternativa moderna**: [uv](./manual_uv.md) y [mise](https://mise.jdx.dev/lang/python.html) gestionan versiones de Python con menos piezas móviles. `uv` también crea entornos y descarga intérpretes de forma aislada.

## 🐍 Gestión de versiones

```bash
pyenv install -l                     # lista todas las versiones disponibles
pyenv install 3.12                      # instala una version concreta
pyenv versions                         # versiones instaladas (el * es la activa)
pyenv global 3.12                      # por defecto en todo el sistema
pyenv local 3.11                       # solo este directorio (crea .python-version)
pyenv shell 3.10                       # solo la sesion actual (bash/zsh)
pyenv version                          # version activa ahora
pyenv uninstall 3.12
```

El fichero `.python-version` (creado por `pyenv local`) permite fijar la versión por proyecto y versionarla con git.

Los *shims* son pequeños ejecutables en `~/.pyenv/shims/` con los nombres `python`, `pip` y `python3`; interponen el `PATH` y redirigen al intérprete elegido según `global`, `local` o `shell`.

> 📌 **Estado**: pyenv sigue mantenido y es la opción clásica, pero instalas Python binario de CPython y solo gestionas versiones del intérprete (no paquetes). Para un flujo completo de proyecto, `uv` es hoy más simple.

## 🗂️ pyenv-virtualenv

Entornos aislados por versión de Python:

```bash
pyenv virtualenv 3.12 mi_entorno      # crea entorno con la version indicada
pyenv activate mi_entorno             # activa el entorno
pyenv deactivate                      # desactiva
pyenv virtualenvs                     # lista entornos
pyenv uninstall mi_entorno            # elimina el entorno virtual
```

## 🚀 Alternativas modernas

| En su lugar | Qué es | Ventaja | Manual |
|---|---|---|---|
| [uv python](./manual_uv.md) | Descarga y gestiona intérpretes | Sin shims, más rápido, integrado con `uv run` | manual_uv.md |
| [mise](https://mise.jdx.dev/) | Gestor de versiones de herramientas | Python, Node, Rust… en un solo CLI con `mise.toml` | |

```bash
# uv: instala versiones y fija la del proyecto
uv python install 3.12 3.13
uv python pin 3.12                    # escribe .python-version

# mise: mismo objetivo, multilenguaje
mise install python@3.14
mise use -g python@3.14               # por defecto global
```

## ⚠️ Estado de rye

**rye ya no se desarrolla.** Astral (los autores de uv) lo ha absorbido: el repositorio quedó archivado y su documentación recomienda migrar a **uv**, que soporta casi todas sus funciones. Reemplaza cualquier proyecto `[tool.rye]` por `[tool.uv]` en `pyproject.toml` y `rye run` por `uv run`.

> ⚠️ **Obsoleto (oct. 2026)**: rye dejó de desarrollarse en feb. de 2025 y su repo fue archivado. Sustituido por [uv](./manual_uv.md).

## ❓ FAQ

**❓ pyenv no cambia la versión tras instalarlo.**
➡ Comprueba que `eval "$(pyenv init -)"` está en tu rc y que `pyenv.shims` aparece en tu `PATH` (`which python` debe apuntar a `~/.pyenv/shims/python`).

**❓ Diferencia entre `global`, `local` y `shell`?**
➡ `global` = todo el sistema; `local` = un directorio (escribe `.python-version`); `shell` = solo la sesión actual.

**❓ ¿pyenv y conda se pueden usar juntos?**
➡ Sí; uno gestiona versiones del intérprete y el otro entornos/paquetes. Aun así, hoy es más ágil usar solo uv.

**❓ ¿Cómo se actualiza pyenv?**
```bash
brew upgrade pyenv pyenv-virtualenv          # macOS
cd ~/.pyenv && git pull                      # instalado con el instalador
```

**❓ ¿Dónde se guardan las versiones instaladas?**
➡ En `~/.pyenv/versions/`.

## 🔗 Enlaces

- [Repositorio oficial de pyenv](https://github.com/pyenv/pyenv)
- [pyenv-virtualenv](https://github.com/pyenv/pyenv-virtualenv)
- [pyenv-win (Windows)](https://github.com/pyenv-win/pyenv-win)
- [Guía de instalación de pyenv](https://github.com/pyenv/pyenv#installation)
- [mise: Python](https://mise.jdx.dev/lang/python.html)
- [uv: Python versions](https://docs.astral.sh/uv/guides/install-python/)
- [Rye: documentación (migración a uv)](https://rye.astral.sh/guide/uv)

## 🧩 Ver también

- [uv: gestor de proyectos Python](./manual_uv.md)
- [Conda: entornos](./manual_conda_entornos.md)
- [pip y PyInstaller](./manual_pip_pyinstaller.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
