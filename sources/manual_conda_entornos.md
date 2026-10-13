# Conda – Gestión de entornos y paquetes

Conda es un gestor de paquetes y entornos multiplataforma (licencia BSD, open source), muy usado en ciencia de datos e IA. Con `conda env create -f environment.yml` obtienes entornos reproducibles para cualquier lenguaje, no solo Python.

> 🎯 **Nivel**: básico · **Requisitos**: Miniforge o Miniconda instalados · **Revisado**: octubre 2026

> ⚠️ **Canales `default` con condiciones comerciales (oct. 2026).** Los canales `default` de Anaconda (`main`, `r`, `msys2`, `anaconda`) están sujetos a los términos de servicio de Anaconda para uso comercial. conda en sí es libre para todos, y los canales de la comunidad (como `conda-forge`) también los son. Para evitar problemas usa [Miniforge](https://github.com/conda-forge/miniforge), que ya viene configurado con `conda-forge`. Alternativas modernas: [uv](./manual_uv.md) y [pixi](https://pixi.prefix.dev/latest/).

## 🔧 Instalación

La versión actual de conda es la **26.x** (26.9, oct. 2026). No la instales como paquete pip: da una experiencia rota; usa el instalador oficial.

```bash
# Miniforge: instalador que trae conda-forge por defecto (recomendado)
curl -L -O https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
bash Miniforge3-Linux-x86_64.sh          # macOS: descarga el .sh de tu arquitectura

conda --version                            # 26.9.x
conda update conda                         # actualiza conda
```

## 🌍 Entornos globales y por proyecto

```bash
conda create --name mi_env python=3.12     # entorno con nombre (global a conda)
conda create --prefix ./env python=3.12    # entorno local al proyecto (recomendado)
conda env list                             # lista entornos y marca el activo (*)
conda activate mi_env                      # activa por nombre (o `conda activate ./env`)
conda deactivate                           # desactiva el entorno
conda remove --name mi_env --all           # elimina entorno completo
```

### Instalar paquetes y canales

```bash
conda install numpy pandas                 # instala en el entorno activo
conda install -c conda-forge opencv        # especifica el canal en la instalacion
conda install -c conda-forge --override-channels opencv  # solo ese canal
conda config --add channels conda-forge    # conda-forge como canal prioritario
conda config --set channel_priority strict # evita mezclar versiones de canales
conda update numpy
```

## 📄 Entornos reproducibles

El resolutor por defecto de conda es **libmamba** desde conda 23.10 (oct. 2023), mucho más rápido que el clásico.

```bash
conda env export > environment.yml           # exporta entorno a YAML con versiones
conda env create -f environment.yml          # crea entorno desde el YAML
conda env update -f environment.yml --prune  # actualiza y elimina lo sobrante
conda run -n mi_env python script.py         # ejecuta dentro del entorno sin activarlo
```

### Lock files con conda-lock

`conda env export` no fija el hash exacto de cada paquete. Para reproducibilidad total usa [conda-lock](https://conda.github.io/conda-lock/):

```bash
conda-lock -f environment.yml                # genera conda-lock.yml para todas las plataformas
conda-lock render                            # convierte el lock en environment.yml exacto
conda create -n mi_env --file conda-lock.yml # crea el entorno desde el lock
```

`conda-lock` genera el mismo lock para varias plataformas, por lo que no depende de tu sistema.

## 🚀 Alternativas modernas

conda es pesado y su ecosistema ha perdido terreno frente a opciones más rápidas:

| En su lugar | Qué es | Ventaja | Manual |
|---|---|---|---|
| [uv](./manual_uv.md) | Gestor de proyectos Python | 10-100x más rápido, lockfile integrado, instalador único | manual_uv.md |
| [pixi](https://pixi.prefix.dev/latest/) | Gestor moderno basado en conda | Lockfiles, tareas y conda + PyPI en un solo comando | |
| [micromamba](https://mamba.readthedocs.io/) | `mamba` como ejecutable estático | Sin entorno `base`, ideal para CI y Docker | |
| [mamba](https://github.com/mamba-org/mamba) | `conda` reimplementado en C++ | Mismo CLI, resolución con libsolv (muy rápido) | |

```bash
# micromamba: ejecutable autocontenido
brew install micromamba                      # macOS
micromamba create -n mi_env python=3.12
micromamba run -n mi_env python -V

# mamba: instalable dentro de un entorno conda
conda install mamba -c conda-forge
mamba create -n mi_env python=3.12           # misma sintaxis que conda, mas rapido

# pixi: reproductible, con lockfile y tareas propias
curl -fsSL https://pixi.sh/install.sh | sh
pixi init mi_proyecto && cd mi_proyecto
pixi add python numpy
pixi run python -c "import numpy; print(numpy.__version__)"
```

Para proyectos nuevos de Python puro, [uv](./manual_uv.md) es hoy la opción más cómoda y rápida.

## ❓ FAQ

**❓ ¿Qué entorno está activo?**
➡ `conda env list` marca con `*` el activo; su nombre o ruta aparece entre paréntesis en el prompt.

**❓ ¿Diferencia entre `--name` y `--prefix`?**
➡ `--name` guarda el entorno en la carpeta global de conda; `--prefix` lo crea en una ruta local, ideal para guardarlo dentro del proyecto y versionarlo.

**❓ ¿Puedo usar `pip` dentro de un entorno conda?**
➡ Sí, pero intenta primero `conda install`; si el paquete solo está en PyPI, usa `pip install` en el entorno activo.

**❓ ¿Cómo clono un entorno?**
➡ `conda create --name copia --clone mi_env`.

**❓ ¿Por qué `conda-forge` y no `default`?**
➡ Los canales `default` tienen condiciones comerciales de Anaconda; `conda-forge` es de la comunidad, libre y con paquetes más actualizados.

**❓ ¿Cómo limpio el caché o paquetes huérfanos?**
➡ `conda clean --all` limpia el caché; los paquetes los revisas con `conda list` y los quitas con `conda remove`.

## 🔗 Enlaces

- [Documentación oficial de conda](https://docs.conda.io/projects/conda/en/latest/)
- [Guía: gestionar entornos](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html)
- [Release notes de conda](https://docs.conda.io/projects/conda/en/latest/release-notes.html)
- [Miniforge (instalador con conda-forge)](https://github.com/conda-forge/miniforge)
- [conda-lock](https://conda.github.io/conda-lock/)
- [Mamba y Micromamba (docs)](https://mamba.readthedocs.io/)
- [Pixi: documentación](https://pixi.prefix.dev/latest/)
- [Anaconda Terms of Service](https://www.anaconda.com/legal/terms/terms-of-service)
- [Anaconda: ToS para academia y research](https://www.anaconda.com/blog/update-on-anacondas-terms-of-service-for-academia-and-research)

## 🧩 Ver también

- [uv: gestor de entornos y proyectos](./manual_uv.md)
- [pyenv: múltiples versiones de Python](./manual_pyenv.md)
- [pip y PyInstaller: empaquetado](./manual_pip_pyinstaller.md)
- [Calidad del código Python](./manual_python_calidad.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
