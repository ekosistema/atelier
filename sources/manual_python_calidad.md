# Calidad del código Python – Lint, tipos, tests y pre-commit

Este manual reúne el ecosistema moderno para mantener un proyecto Python limpio en 2026: formateo y lint con Ruff, chequeo de tipos con mypy/pyright, tests con pytest y hooks con pre-commit, todo integrable con uv.

> 🎯 **Nivel**: intermedio · **Requisitos**: Python 3.12+ y [uv](./manual_uv.md) recomendado · **Revisado**: octubre 2026

## 🔍 Ruff: lint + formato (sustituye flake8/black/isort)

[Ruff](https://docs.astral.sh/ruff/) es un linter y formateador escrito en Rust, ~10-100x más rápido que flake8/Black, con más de 900 reglas. La versión actual es **0.16.x** (oct. 2026) y es de licencia **MIT**. Sustituye a flake8, Black, isort, pydocstyle, pyupgrade y autoflake en una sola herramienta.

```bash
uv tool install ruff            # instalacion global aislada
uvx ruff check .                # lint de todo el arbol sin instalar nada
ruff check src/ --fix           # aplicar autocorrecciones
ruff format ./src/              # formateo (drop-in compatible con Black)

# configuracion por defecto en pyproject.toml:
#   [tool.ruff]  target-version = "py312"
#   [tool.ruff.lint]  select = ["E", "F", "I", "B", "UP", "S", "RUF"]
```

> ⚠️ **Obsoleto / sustituible (oct. 2026)**: flake8, Black e isort están en modo mantenimiento y se pueden reemplazar por Ruff, que integra sus funcionalidades. Matiz sobre **pylint**: sus reglas y plugins no se cubren del todo en Ruff; si las necesitas, mantén pylint en paralelo.

| En su lugar | Ventaja | Manual |
|---|---|---|
| [Ruff](https://docs.astral.sh/ruff/) | Un solo binario: lint + format + import sort, 10-100x más rápido | manual_python_calidad.md |
| [basedpyright](https://docs.basedpyright.com/) | Chequeo de tipos más riguroso que mypy en proyectos grandes | |

## 🧪 Chequeo de tipos: mypy frente a pyright

- **mypy**: el comprobador clásico (python.org tiene su propio chequeo). Estable, con muchos plugins.
- **pyright**: el de Microsoft, con mejor inferencia y narrowing de tipos; más rápido en proyectos grandes (está escrito en TypeScript, no en Python).

```bash
uv add --dev mypy              # o: uv run mypy
mypy src/ --strict             # configuracion estricta
uvx pyright                    # via uvx, sin instalacion
```

> 📌 **Recomendación.** Empieza con mypy por su ecosistema de plugins; en proyectos grandes valora pyright/basedpyright por su rendimiento y análisis. En VS Code, el Pylance de Microsoft usa pyright internamente.

## 🧪 pytest: fixtures, parametrización y cobertura

```bash
uv add --dev pytest pytest-cov
uv run pytest                     # ejecuta todos los test_*.py
uv run pytest -k "api"            # filtra por nombre
uv run pytest --cov=src --cov-report=term-missing   # cobertura por fichero
```

```python
# tests/test_calculadora.py
import pytest
from calculadora import suma

@pytest.fixture
def numeros():
    return [1, 2, 3]              # fixture reutilizable por varios tests

@pytest.mark.parametrize("a,b,esperado", [(1, 1, 2), (2, 3, 5), (-1, 1, 0)])
def test_suma(a, b, esperado):
    assert suma(a, b) == esperado  # parametriza el mismo test con casos

def test_usando_fixture(numeros):
    assert suma(*numeros) == 6
```

## 🔒 pre-commit: hooks en cada commit

[pre-commit](https://pre-commit.com/) ejecuta lint/format/tests en cada commit para no dejar pasar errores.

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.16.3               # version de ruff a usar
    hooks:
      - id: ruff               # lint
      - id: ruff-format        # formato
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
```

```bash
uv tool install pre-commit     # o: uv add --dev pre-commit
pre-commit install             # activa los hooks en el repo
pre-commit run --all-files     # ejecuta todos los hooks una vez
```

## 🚀 Integración con uv

Con uv, lint, tipos y tests corren en el mismo entorno sin gestores extra:

```bash
uv run ruff check . && uv run ruff format --check .
uv run mypy src/
uv run pytest
```

También puedes ejecutar los checks en CI con la misma versión exacta que declara `uv.lock`:

```bash
uv sync --frozen         # instala exactamente lo del lock (falla si cambia)
uv run pytest
```

## ⚠️ tox frente a nox

`tox` (declarativo, vía `tox.ini`) y `nox` (sesiones en Python, más flexible) ejecutan tests en varias matrices de Python. Ambos siguen vigentes, pero con `uv` la matriz de intérpretes se simplifica:

```bash
# tox.ini clasico
[tox]
envlist = py312, py313

# con uv en CI, alterna versiones sin tox:
uv run --python 3.12 pytest
uv run --python 3.13 pytest
```

> 📌 **Estado**: tox y nox siguen siendo opciones válidas para proyectos que prueban múltiples versiones; `uv` reduce el número de herramientas necesarias y puede cubrir la matrix por sí solo.

## ❓ FAQ

**❓ ¿Necesito ahora flake8, Black y isort a la vez?**
➡ No: Ruff cubre los tres. Instala solo Ruff y configura `[tool.ruff.lint] select = ["E","F","I","B"]`.

**❓ ¿Mypy o pyright?**
➡ Mypy para empezar (más plugins); pyright para rendimiento y mejor análisis en código grande (VS Code Pylance lo usa).

**❓ ¿Cómo fijo la cobertura mínima?**
➡ Añade `[tool.coverage.run] fail_under = 80` en `pyproject.toml` o `--cov-fail-under=80`.

**❓ ¿Por qué pre-commit cambia mis ficheros?**
➡ Es el objetivo: los hooks corrigen formato antes del commit. Configura `args = [--fix]` en ruff-check para autocorrección.

## 🔗 Enlaces

- [Ruff: documentación](https://docs.astral.sh/ruff/)
- [Block de Ruff v0.16 (Astral)](https://astral.sh/blog/ruff-v0.16.0)
- [mypy](https://mypy.readthedocs.io/)
- [pyright (Microsoft)](https://github.com/microsoft/pyright)
- [basedpyright](https://docs.basedpyright.com/)
- [pytest](https://docs.pytest.org/)
- [pytest-cov](https://pytest-cov.readthedocs.io/)
- [pre-commit](https://pre-commit.com/)
- [nox](https://nox.thea.codes/)
- [tox](https://tox.wiki/)

## 🧩 Ver también

- [uv: gestor de proyectos Python](./manual_uv.md)
- [pip y PyInstaller](./manual_pip_pyinstaller.md)
- [Conda: entornos](./manual_conda_entornos.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
