# Makefile – Automatización de tareas con GNU Make

Make es un sistema de construcción basado en reglas y dependencias: define objetivos (targets) para compilar, testear, limpiar y desplegar de forma reproducible. Este manual cubre GNU Make 4.4.1 (feb 2023), la referencia del ecosistema.

> 🎯 **Nivel**: intermedio · **Requisitos**: `make` instalado (GNU) · **Revisado**: octubre 2026

## 📝 Sintaxis básica y variables

```makefile
# Bloque: <target>: <dependencias>
#   <comando>      <- ¡obligatorio con TABULACIÓN, no espacios!

.PHONY: clean build            # targets que no son ficheros (evita conflictos si existe un archivo llamado "clean")

APP_NAME := mi-app             # := evalúa de inmediato
BUILD_DIR ?= dist              # ?= usa el valor solo si aún no está definido
```

Diferencia clave de variables:
- `=` → expansión perezosa: se evalúa en el momento de usarse (y puede depender del estado final).
- `:=` → expansión inmediata: se evalúa en el punto de definición. Prefiera `:=` salvo que necesites recursión deliberada.
- `?=` define con valor por defecto no destructivo.

## 📦 Ejemplo: proyecto Python

```makefile
.PHONY: all test clean install

PY := python
APP := mi-app

all: test                # target por defecto (el primero)

test:
	python -m pytest tests/

install:
	$(PY) -m pip install -r requirements.txt

clean:
	rm -rf __pycache__ .pytest_cache dist

# Variables automáticas: $@ target, $< primera dep, $^ todas las deps, $? las más recientes
%.json: %.yaml
	python -c "import json,sys,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))" $< > $@
```

## 🔁 Funciones, `$(shell …)`, `include` y dependencias automáticas

```makefile
SRCS := $(wildcard src/*.c)          # expande un glob
OBJS := $(SRCS:.c=.o)                # sustituye la extensión
VERSION := $(shell git describe --tag)   # capturar salida de un comando

# Traer reglas desde otro makefile
include config.mk
-include local.mk                     # "-" ignora si el fichero no existe

# Dependencias automáticas para C/C++ (genera los .d usados por include)
CFLAGS += -MMD -MP
-include $(OBJS:.o=.d)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
```

Ventaja real de Make frente a scripts: **solo reconstruye lo necesario** comparando timestamps de ficheros.

## ⚡ Paralelismo y opciones

```makefile
# En la línea de comandos
make -j8                  # hasta 8 jobs en paralelo
make -n / make --dry-run  # imprimir los comandos sin ejecutarlos (ensayo)
make -C subdir            # ejecutar en otro directorio
```

```makefile
# En el propio makefile
.NOTPARALLEL:             # fuerza ejecución en serie (cuando -j rompe el orden)
.ONESHELL:                # cada target se ejecuta en UNA shell (útil con bucles/condicionales)
export PATH := /opt/bin:$(PATH)    # heredar variable a las recetas
```

`.ONESHELL` evita el clásico fallo de "cada línea de la receta es una subshell distinta", sobre todo con `cd` o variables dentro del target. Usa `make -n` como ensayo seco antes de cambios arriesgados.

## 🧱 ¿Make sigue siendo la herramienta correcta?

Make brilla para **compilar** (C/C++, dependencias de ficheros) y para Makefiles ya existentes en proyectos open source. Para **automatizar tareas** en lenguajes interpretados o entornos de proyecto, hoy existen opciones más directas:

| En su lugar | Ventaja | Manual |
|---|---|---|
| [just](https://just.systems) | Recetas con argumentos, sin `.PHONY`, cross-platform (1.58.0, ago 2026) | |
| [Task (go-task)](https://taskfile.dev) | YAML declarativo, dependencias entre tasks (v3.54.0, oct 2026) | |
| [Ninja](https://ninja-build.org) | Construcciones muy rápidas; Makefile lo genera (Meson/CMake) (1.13, 2026) | |
| `npm scripts` / `uv run` | Tareas del proyecto con el gestor ya presente (task runner idiomático) | |

### Tabla de decisión

| Caso de uso | Recomendación |
|---|---|
| Compilar código nativo / C / C++ | Make o Ninja (generado por CMake/Meson) |
| Automatizar scripts del repo (lint, test, deploy) sin ficheros de salida | just o Task |
| Monorepo TypeScript/Node con tooling de npm | `npm scripts` |
| Proyecto Python con `uv` | `uv run` / scripts de `pyproject.toml` |

## ❓ FAQ

**❓ Diferencia entre `=` y `:=`?**
➡ `=` es perezosa (se evalúa al usarse, puede depender del estado final); `:=` es inmediata. Usa `:=` salvo que quieras recursión deliberada.

**❓ Error "missing separator"?**
➡ Las líneas de comando de un target deben empezar con **tabulación**, no con espacios.

**❓ Cómo ignorar el error de un comando?**
➡ Antepón `-`: `-rm -rf build/`.

**❓ Cuándo conviene cambiarse a just o Task?**
➡ Cuando tus targets son solo tareas (sin compilación por dependencias de ficheros) y quieres argumentos, sintaxis más clara o que funcione igual en Windows.

## 🔗 Enlaces
- [GNU Make manual](https://www.gnu.org/software/make/manual/make.html)
- [just: command runner](https://just.systems/man/en/)
- [Task (go-task)](https://taskfile.dev)
- [Ninja build](https://ninja-build.org)

## 🧩 Ver también
- [Bash Scripting](./manual_bash_scripting.md)
- [Docker Compose](./manual_docker_compose.md)
- [Git](./manual_git.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
