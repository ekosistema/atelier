# pip y PyInstaller – Instalación de dependencias y empaquetado

pip es el instalador de paquetes que acompaña a Python; PyInstaller empaqueta aplicaciones Python en ejecutables independientes. Este manual cubre el flujo actual (entornos virtuales, `pyproject.toml`) y las alternativas modernas.

> 🎯 **Nivel**: básico · **Requisitos**: Python 3.12+ · **Revisado**: octubre 2026

> ⚠️ **`external-managed-environment` (PEP 668, desde 2023).** Las distribuciones de sistema y Homebrew marcan su Python como *gestionado externamente*: `pip install` fuera de un entorno virtual falla a propósito. Instala siempre en un `venv` o usa `pipx` para herramientas.

## 🐍 pip y entornos virtuales

La versión actual de pip es la **26.x** (26.1.2, mayo 2026); requiere Python 3.9+.

```bash
python --version
python -m pip --version            # pip 26.x, siempre invocado con -m
python -m venv .venv               # crea entorno virtual (no uses --system-site-packages)
source .venv/bin/activate          # macOS/Linux (Windows: .venv\Scripts\activate)
python -m pip install requests     # instalacion aislada en .venv
python -m pip install "requests==2.32.3"
python -m pip install --upgrade requests
python -m pip uninstall requests
python -m pip list                 # paquetes instalados en el entorno
```

> 🧪 **Alternativa moderna**: [uv](./manual_uv.md) reemplaza `pip`, `pip-tools` y `virtualenv` con una sola herramienta 10-100x más rápida, sin cambiar tu flujo (`uv pip install`).

## 📄 requirements.txt frente a pyproject.toml

- `requirements.txt`: para fijar versiones de despliegue (`.in` → `.txt` con pip-tools).
- `pyproject.toml`: la forma estándar (PEP 621) para declarar dependencias del paquete y herramientas; la recomienda PyPA.

```bash
# pip-tools: workflow clásico de lock de requisitos
python -m pip install pip-tools
pip-compile requirements.in --output-file requirements.txt   # genera el lock
pip-sync                          # sincroniza .venv con requirements.txt
```

## 🧩 pipx: instalar aplicaciones y CLI

`pipx` aísla cada aplicación en su propio entorno y la añade al `PATH`.

```bash
python -m pip install pipx
pipx install ruff                 # instala la CLI sin contaminar tu Python
pipx run pycowsay hola            # ejecuta una app puntual sin instalarla
pipx list && pipx uninstall ruff
```

## 📦 PyInstaller 6

PyInstaller empaqueta tu script y todas sus dependencias en un ejecutable. La serie actual es **6.x** (6.22.2, ago. 2026) y soporta Python 3.8-3.15.

```bash
python -m pip install pyinstaller

pyinstaller mi_script.py          # genera dist/, build/ y mi_script.spec
pyinstaller --onefile mi_script.py            # un unico ejecutable
pyinstaller --onefile --windowed mi_app.py    # sin consola (GUI)
pyinstaller --name MiProg --icon=icono.ico --onefile mi_app.py
pyinstaller mi_app.spec           # recompila usando el spec editado
```

### Dependencias ocultas y datos extra (spec)

Los imports dinámicos no siempre se detectan; decláralos en el `.spec`:

```python
# mi_app.spec (bloque Analysis)
a = Analysis(['mi_app.py'],
             datas=[('assets', 'assets')],        # recursos que empaquetar
             hiddenimports=['pkg_resources', 'tarfile'])
```

```bash
pyinstaller --onefile --hidden-import=module mi_script.py   # atajo via CLI
```

PyInstaller **no es un cross-compiler**: genera el ejecutable para el SO/arquitectura donde se ejecuta. Pruébalo siempre en una máquina limpia.

## 🍎 macOS: .app/.dmg, firma y notarización

Para distribuir a otros equipos en macOS el ejecutable debe estar firmado y notarizado por Apple (Gatekeeper). PyInstaller solo empaqueta; la firma la haces con `codesign` y la notarización con `notarytool`.

```bash
pyinstaller --onefile --windowed --name MiApp mi_app.py
codesign --force --deep --sign "Developer ID Application: ..." dist/MiApp.app
dmgbuild ...
xcrun notarytool submit dist/MiApp.dmg --keychain-profile "notarizacion" --wait
```

> 📌 **Estado.** La firma con Developer ID es obligatoria para distribuir fuera de la App Store; sin notarización Gatekeeper bloquea la descarga. Mira el manual de firma de este repo para el flujo completo.

## ⚠️ Herramientas obsoletas / problemáticas

- **`easy_install`**: eliminado del ecosistema moderno; usa `pip`.
- **`python setup.py install`**: en desuso desde hace años; usa `pip install -e .` (PEP 517/660).
- **`pip install --user`**: sustituido por `venv`/`pipx`; mezcla dependencias y da problemas de permisos con Python de Homebrew.

> ⚠️ **Obsoleto (oct. 2026)**: `easy_install`, `setup.py install` y el flujo `pip install --user` están desaconsejados. Alternativa: [uv](./manual_uv.md) o `venv` + `pip compile`/`pip-sync`.

## 🚀 Alternativas de empaquetado

| En su lugar | Qué es | Ventaja | Manual |
|---|---|---|---|
| [Nuitka](https://nuitka.net/) | Compilador de Python a C | Ejecutables más rápidos y difíciles de descompilar (4.1.x) | |
| [Briefcase (BeeWare)](https://beeware.org/docs/briefcase) | Empaquetado multiplataforma | Paquetes .app/DMG, MSI, Flatpak, iOS y Android desde `pyproject.toml` | |
| [uv tool](./manual_uv.md) | Instala/ejecuta apps aisladas | Reemplaza pipx; `uvx` para ejecución efímera | manual_uv.md |
| [pex](https://docs.pex-tool.org/) | Ejecutables `.pex` (PEP 441) | Un fichero = entorno de ejecución; Apache-2.0 | |
| [shiv](https://github.com/linkedin/shiv) | Zipapp autocontenidos | CLI ligera con dependencias incluidas | |

## ❓ FAQ

**❓ ¿Por qué `pip install` falla con `externally-managed-environment`?**
➡ El Python del sistema o de Homebrew está gestionado externamente (PEP 668) y bloquea la instalación global. Crea un `venv` con `python -m venv .venv` y activa el entorno.

**❓ Mi ejecutable pesa demasiado.**
➡ Usa `--onefile`, elimina dependencias innecesarias y revisa los `excludes` en el `.spec`.

**❓ Funciona con `python app.py` pero falla al empaquetar.**
➡ Busca imports dinámicos: decláralos con `--hidden-import` o en `hiddenimports` del `.spec`.

**❓ ¿Cómo añado imágenes, JSON o plantillas?**
➡ Añádelas en `datas=[('origen','destino')]` del `.spec`; no las pongas solo junto al script.

**❓ ¿PyInstaller funciona en otras plataformas?**
➡ No: debes generar el ejecutable en cada SO/arquitectura de destino (no es cross-compiler).

**❓ ¿Por qué el antivirus marca mi exe (Windows)?**
➡ Los ejecutables sin firmar generan falsos positivos; firma el binario y evita `--windowed` salvo que sea necesario.

## 🔗 Enlaces

- [Documentación oficial de pip](https://pip.pypa.io/en/stable/)
- [PEP 668: entornos gestionados externamente](https://peps.python.org/pep-0668/)
- [pipx](https://pipx.pypa.io/stable/)
- [pip-tools](https://github.com/jazzband/pip-tools)
- [PyInstaller: documentación](https://pyinstaller.org/en/stable/)
- [PyInstaller: changelog](https://pyinstaller.org/en/latest/CHANGES.html)
- [Nuitka](https://nuitka.net/)
- [Briefcase (BeeWare)](https://beeware.org/docs/briefcase)
- [Pex](https://docs.pex-tool.org/)
- [shiv](https://github.com/linkedin/shiv)
- [guía de empaquetado de PyPA](https://packaging.python.org/)

## 🧩 Ver también

- [uv: gestor de dependencias y proyectos](./manual_uv.md)
- [Calidad del código Python](./manual_python_calidad.md)
- [Firma y notarización en macOS](./manual_firma_notarizacion.md)
- [Conda: entornos](./manual_conda_entornos.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
