# Conda x86_64 en Mac Apple Silicon – Crear entornos osx-64 (legacy)

Crear un entorno conda con arquitectura x86_64 en un Mac Apple Silicon se hace con `CONDA_SUBDIR=osx-64`. Es un workaround **legacy** que depende de Rosetta 2 y dejará de funcionar con macOS 28. Este manual explica cuándo usarlo, cómo hacerlo bien y cuál es la alternativa nativa.

> 🎯 **Nivel**: intermedio · **Requisitos**: Miniforge/Minconda o Anaconda; Rosetta 2 (macOS ≤ 27) · **Revisado**: octubre 2026

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `CONDA_SUBDIR=osx-64` es un **workaround legacy**. Apple solo garantiza Rosetta 2 hasta **macOS 27 (Golden Gate)**; desde **macOS 28 las apps Intel no arrancarán**, por lo que un entorno osx-64 sin recompilar quedará inservible. Lo recomendado en 2026 es **conda nativo arm64** (`osx-arm64`). Alternativa moderna si de verdad necesitas x86: contenedores `linux/amd64` (colima/Docker) o builds multiplataforma en CI. Ver [Manual de entornos Conda](./manual_conda_entornos.md).

## 🧭 ¿Cuándo (y cuándo no) usar osx-64

| Necesidad | Solución 2026 |
|---|---|
| Trabajar con paquetes de conda-forge | Entorno `osx-arm64` nativo |
| Librería sin build arm64 (caso raro hoy) | Contenedor `linux/amd64` (colima) |
| Generar artefactos x86_64 para distribuir | CI (runner Intel o `cibuildwheel`) |
| Reproducir un entorno histórico osx-64 | Temporal, solo hasta macOS 27 |

> 📌 **Estado.** Los entornos osx-64 siguen siendo válidos **mientras Rosetta esté presente**. En cuanto migres a macOS 28, planifica su reemplazo arm64.

## 🛠️ Prerrequisitos

```bash
# Rosetta 2 (solo necesario para osx-64; ya no se instala de forma implícita)
sudo softwareupdate --install-rosetta --agree-to-license

# Verificar la arquitectura del shell activo
uname -m        # arm64 = nativo; x86_64 = bajo Rosetta
arch            # arm64 | i386
```

Parte de una instalación **base arm64** (nativa), por ejemplo Miniforge para Apple Silicon:

```bash
# Instalador arm64 (nombre real del paquete de Miniforge)
bash Miniforge3-MacOSX-arm64.sh -b -p "$HOME/miniforge3"
"$HOME/miniforge3/bin/conda" --version
```

## 🧱 Crear el entorno osx-64

```bash
# 1) Crear con el subdir x86_64
CONDA_SUBDIR=osx-64 conda create -n mi_app_x86 python=3.12 -y

# 2) Fijar el subdir de forma permanente para ese entorno
conda activate mi_app_x86
conda config --env --set subdir osx-64

# 3) Instalar dependencias (siempre con el entorno activado)
conda install -c conda-forge numpy pandas scipy -y
```

> 📌 **Estado.** Si no fijas el subdir, conda volverá a `osx-arm64` y mezclará arquitecturas en el mismo entorno. El paso 2 es obligatorio tras crear el entorno.

Verificación:

```bash
python -c "import platform; print(platform.machine())"   # → x86_64
conda info | grep -E 'platform|subdir'                   # → osx-64
```

## 📦 Alternativa moderna para dependencias x86

Cuando el objetivo es *ejecutar* código x86 (lo más habitual), un contenedor es más limpio que Rosetta y no caduca con macOS:

```bash
# Runtime de contenedores en macOS + cliente docker
brew install colima docker
colima start

# Python x86_64 dentro de un contenedor linux/amd64
docker run --rm --platform linux/amd64 python:3.12 \
  python -c "import platform; print(platform.machine())"   # → x86_64
```

Para publicar wheels x86_64, hazlo en CI aunque estés en arm64.

## 🔎 Script de diagnóstico

```bash
#!/bin/bash
# verify-conda-arch.sh: comprueba la arquitectura real de un entorno conda
set -u
env_name="${1:-base}"

echo "== Entorno: $env_name =="
conda run -n "$env_name" python -c \
  "import platform,sys; print('machine:', platform.machine()); print('python:', sys.version.split()[0])"
conda run -n "$env_name" conda info | grep -E 'platform|subdir' || true

echo "-- Paquetes marcados osx-64 --"
conda list -n "$env_name" | grep -E 'osx-64' || echo "ninguno (todo arm64)"
```

```bash
chmod +x verify-conda-arch.sh
./verify-conda-arch.sh mi_app_x86
```

## ✅ Checklist de migración a arm64

- [ ] Crea el entorno equivalente nativo: `conda create -n mi_app python=3.12 -c conda-forge`.
- [ ] Exporta el entorno osx-64: `conda env export -n mi_app_x86 > env_x86.yml`.
- [ ] Reinstala en arm64: `conda env create -n mi_app -f env_x86.yml` y revisa el resultado.
- [ ] Ejecuta la suite de tests con el intérprete arm64.
- [ ] Sustituye paquetes sin build arm64 por alternativas de conda-forge o contenedor.
- [ ] Elimina el entorno legacy: `conda env remove -n mi_app_x86`.
- [ ] Retira Rosetta si ya no usas nada x86 (el soporte termina con macOS 28).

## ❓ FAQ

**❓ ¿Sigue funcionando `CONDA_SUBDIR=osx-64` en 2026?**
➡ Sí, en macOS 27 y anteriores con Rosetta instalado. Deja de ser viable cuando Rosetta desaparezca con macOS 28.

**❓ ¿Por qué conda mezcla arquitecturas?**
➡ Porque no fijaste el subdir del entorno. Ejecuta `conda config --env --set subdir osx-64` tras crearlo.

**❓ ¿Necesito una terminal en modo Rosetta?**
➡ No es obligatorio si fijas el subdir, pero la forma más segura sigue siendo activar el entorno antes de instalar paquetes.

**❓ ¿Cuál es la alternativa nativa?**
➡ Entornos `osx-arm64` con Miniforge. Si el problema es código Linux x86, contenedores `linux/amd64`.

**❓ ¿Y para generar wheels x86_64?**
➡ En CI (runner Intel o `cibuildwheel` con plataforma macosx_x86_64), no en tu Mac.

## 🔗 Enlaces
- [Conda: especificar plataforma destino de un entorno](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#specifying-a-different-target-platform-for-an-environment)
- [conda-forge (canales osx-64 y osx-arm64)](https://conda.anaconda.org/conda-forge/osx-arm64)
- [Miniforge (instaladores arm64)](https://github.com/conda-forge/miniforge)
- [Apple: usar apps Intel en Mac Apple Silicon](https://support.apple.com/en-us/102527)
- [Colima (contenedores en macOS)](https://github.com/abiosoft/colima)

## 🧩 Ver también
- [Manual de entornos Conda](./manual_conda_entornos.md)
- [Manual de Homebrew](./manual_brew.md)
- [Homebrew x86_64 vs ARM64](./gestionar_brew_x86_64_arm64.md)
- [Docker Compose](./manual_docker_compose.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
