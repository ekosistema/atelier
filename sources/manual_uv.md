# uv – Gestor de dependencias, entornos y proyectos Python

uv es un gestor de proyectos y paquetes Python escrito en Rust por [Astral](https://astral.sh), pensado para sustituir a `pip`, `pip-tools`, `pipx`, `poetry`, `pyenv` y `virtualenv` con una sola herramienta. Hasta 10-100x más rápido que `pip`, con lockfile propio.

> 🎯 **Nivel**: básico · **Requisitos**: sin dependencias previas (binario autocontenido) · **Revisado**: octubre 2026

uv es **MIT o Apache-2.0** (a tu elección) y está estabilizado para producción. La versión actual es ~0.13.x (oct. 2026), con releases frecuentes.

## 🔧 Instalación

```bash
# Standalone (recomendado): binario autocontenido, sin Python ni Rust
curl -LsSf https://astral.sh/uv/install.sh | sh        # macOS/Linux
# Windows (PowerShell):
#   irm https://astral.sh/uv/install.ps1 | iex

uv self update                        # se actualiza a si mismo (instalador standalone)

# Otras vias
brew install uv                       # macOS (Homebrew)
python -m pip install uv              # via pip
pipx install uv                       # via pipx
winget install --id=astral-sh.uv -e   # Windows (WinGet)
```

## 🐍 Versionado de Python

uv descarga y gestiona intérpretes de Python sin que tengas que instalarlos a mano (sustituye a pyenv):

```bash
uv python install 3.12 3.13 3.14       # instala varias versiones a la vez
uv python list                        # versiones instaladas y disponibles
uv python pin 3.12                    # fija la version: escribe .python-version
uv run --python 3.11 python -V        # ejecuta con un intérprete concreto
```

## 🗂️ Proyectos (workflow central)

```bash
uv init mi_proyecto && cd mi_proyecto   # crea pyproject.toml, src/ y .gitignore
uv add requests                          # añade dependencia y resuelve
uv add --dev ruff pytest                 # dependencias de desarrollo
uv remove requests
uv sync                                  # crea/actualiza .venv desde el lock
uv lock                                  # regenera uv.lock (resolución universal)
uv run python script.py                  # ejecuta dentro del entorno del proyecto
uv run ruff check                        # ejecuta cualquier binario del proyecto
```

`uv sync` crea y cubre por completo el `.venv`; `uv run` activa el entorno automáticamente sin `source`.

## 📄 pyproject.toml + uv.lock

Las dependencias se declaran en el estándar `pyproject.toml` (PEP 621); `uv.lock` (generado por `uv lock`) es el **lockfile universal** que fija versiones y hashes para todas las plataformas.

```toml
# pyproject.toml: ejemplo
[project]
name = "mi_proyecto"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["requests>=2.32"]

[dependency-groups]
dev = ["ruff", "pytest"]               # sustituye a dev-dependencies
```

> 📌 **Recomendación**: versiona siempre `pyproject.toml` y `uv.lock`. `uv.lock` garantiza que todo el equipo y CI instalen exactamente lo mismo.

## 💻 Interfaz pip-compatible

Puedes migrar de a poco sin cambiar el flujo con el subcomando `uv pip` (compatible con `pip`, `pip-tools` y `virtualenv`):

```bash
uv venv                                  # crea .venv
uv pip install requests                  # instala en el .venv activo
uv pip compile requirements.in --output-file requirements.txt --universal
uv pip sync requirements.txt             # alinea el entorno con el lock
```

> ⚠️ **Nota**: `uv pip` funciona *dentro* de un entorno activado. Para la gestión de proyecto usa preferiblemente `uv add`/`uv sync`.

## 🧰 Herramientas CLI (sustituye pipx)

```bash
uvx pycowsay hola                        # ejecuta una app en un entorno efimero
uv tool install ruff                     # instala de forma global y aislada
uv tool list
uv tool uninstall ruff
```

## 🏢 Workspaces

uv orquesta varios paquetes en un monorepo de forma sencilla:

```bash
uv init --package paquete_a              # crea un paquete publicable
# en pyproject.toml de la raiz:  [tool.uv.workspace]  members = ["paquete_a", "paquete_b"]
uv add --workspace paquete_a requests    # dependencia compartida del workspace
```

## 🚚 Migración desde requirements.txt y Poetry

| Origen | Comando uv equivalente |
|---|---|
| `pip install -r requirements.txt` | `uv pip install -r requirements.txt` |
| `pip-tools` (`pip-compile`/`pip-sync`) | `uv pip compile` / `uv pip sync` |
| Poetry (`poetry add`, `poetry lock`) | `uv add`, `uv lock` (uv puede importar `poetry.lock`) |
| `pipx install` | `uv tool install` |

> 📌 **Nota**: uv importa `requirements.txt` (con `uv add -r requirements.txt`) y `poetry.lock` automáticamente, y lee la configuración de `[tool.uv]` en lugar de `[tool.poetry]`.

## ⚖️ Comparativa honesta

| Aspecto | uv | pip | Poetry | PDM | Conda |
|---|---|---|---|---|---|
| Velocidad de resolución | Muy alta (Rust) | Media | Media-baja | Media | Media (libmamba) |
| Lockfile universal | ✅ `uv.lock` | ❌ (manejo manual / pip-tools) | ✅ | ✅ | ❌ (usa conda-lock aparte) |
| Gestión de intérpretes | ✅ `uv python` | ❌ | Parcial | Parcial | ✅ |
| Paquetes binarios (C) | Solo PyPI | Solo PyPI | Solo PyPI | Solo PyPI | ✅ multi-ecosistema |
| Licencia | MIT/Apache-2.0 | MIT | MIT | MIT | BSD |

**Cuándo NO usar uv**: si necesitas los paquetes binarios del ecosistema conda (OpenCV, CUDA, R), ahí gana [conda](./manual_conda_entornos.md). Pero el punto fuerte de uv es su velocidad y simplicidad.

## ❓ FAQ

**❓ ¿Necesito Python para instalar uv?**
➡ No: el instalador descarga un binario autocontenido. `uv` además puede instalar Python por ti.

**❓ ¿Qué es `uvx`?**
➡ Es un alias de `uv tool run`: ejecuta una herramienta en un entorno efímero sin instalarla, ideal para probar CLIs.

**❓ ¿Cómo activo el `.venv` de uv?**
➡ No hace falta: `uv run` lo activa en cada ejecución. Si quieres activarlo a mano: `source .venv/bin/activate`.

**❓ ¿Puedo usar uv y conda juntos?**
➡ Sí; uv gestiona PyPI y conda los paquetes binarios. Se complementan en proyectos mixtos.

**❓ ¿Cómo actualizo uv?**
➡ `uv self update` (instalador standalone) o actualiza con tu gestor (`brew upgrade uv`, `pipx upgrade uv`).

## 🔗 Enlaces

- [Documentación de uv](https://docs.astral.sh/uv/)
- [Instalación de uv](https://docs.astral.sh/uv/getting-started/installation/)
- [Guía de proyectos uv](https://docs.astral.sh/uv/guides/projects/)
- [Guía de instalación de Python con uv](https://docs.astral.sh/uv/guides/install-python/)
- [Guía de herramientas (pipx/uvx)](https://docs.astral.sh/uv/guides/tools/)
- [Repositorio y benchmarks de uv](https://github.com/astral-sh/uv)
- [Rye → migración a uv](https://rye.astral.sh/guide/uv)

## 🧩 Ver también

- [pip y PyInstaller](./manual_pip_pyinstaller.md)
- [Conda: entornos](./manual_conda_entornos.md)
- [pyenv: versiones de Python](./manual_pyenv.md)
- [Calidad del código Python](./manual_python_calidad.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
