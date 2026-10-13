# 🍺 Manual de Uso de Homebrew (brew) – Gestor de paquetes en macOS y Linux

Homebrew instala y mantiene software de línea de comandos y aplicaciones gráficas en macOS y Linux. Este manual cubre los comandos esenciales, los dos prefijos de instalación en macOS, `brew bundle`, servicios y el estado real de soporte de la versión 7.0.0 (septiembre de 2026).

> 🎯 **Nivel**: básico · **Requisitos**: macOS 11+ o Linux; Xcode CLT para compilar desde fuente · **Revisado**: octubre 2026

> 📌 **Estado (oct. 2026).** Homebrew 7.0.0 (13 sept. 2026) exige **macOS 11 o superior**: Catalina 10.15 y anteriores ya no arrancan `brew`. Los *bottles* y el instalador `.pkg` solo se publican desde **macOS Sequoia 15**. Los Macs Intel pasan a **Tier 3**: sin CI ni bottles nuevos, con retirada prevista **en o después de septiembre de 2027**. En Intel, la migración recomendada es [MacPorts](https://www.macports.org/).

## 📋 Tabla de Contenidos
- [1. Instalación](#-1-instalación)
- [2. Prefijos y arquitecturas](#-2-prefijos-y-arquitecturas)
- [3. Buscar e instalar paquetes](#-3-buscar-e-instalar-paquetes)
- [4. Actualizar y desinstalar](#️-4-actualizar-y-desinstalar)
- [5. Mantenimiento](#-5-mantenimiento)
- [6. `brew bundle` y Brewfile](#-6-brew-bundle-y-brewfile)
- [7. Servicios](#️-7-servicios)
- [8. Listados y auditoría](#-8-listados-y-auditoría)
- [9. Seguridad en 7.0](#-9-seguridad-en-70)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 1. Instalación

```bash
# Instalador oficial (script). Instala en el prefijo por defecto de tu arquitectura
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Añadir brew al PATH en zsh (el instalador lo sugiere al terminar)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile   # Apple Silicon
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile       # macOS Intel
eval "$(/opt/homebrew/bin/brew shellenv)"

# Comprobar versión e instalación
brew --version
brew config
```

Datos verificados de la 7.0.0:
- El instalador `.pkg` es **solo Apple Silicon** y requiere macOS Sequoia 15 o superior.
- macOS 10.15 (Catalina) y anteriores no ejecutan Homebrew en absoluto.
- Incorpora `brew install --dry-run` para previsualizar qué hará una instalación.

---

## 📦 2. Prefijos y arquitecturas

| Plataforma | Prefijo por defecto | Tier (sept. 2026) |
|---|---|---|
| Apple Silicon | `/opt/homebrew` | Tier 1 en macOS 27, 26 y 15 |
| macOS Intel x86_64 | `/usr/local` | Tier 3 |
| Linux | `/home/linuxbrew/.linuxbrew` | Tier 1 en Ubuntu / imagen Docker |

```bash
# Ver dónde está instalado brew y su arquitectura
which brew                     # /opt/homebrew/bin/brew o /usr/local/bin/brew
file "$(which brew)"           # Mach-O 64-bit executable arm64 | x86_64
brew --prefix                  # ruta del prefijo activo
```

> 🧪 **Alternativa moderna.** En un Mac Intel no instales Homebrew nuevo: usa [MacPorts](https://www.macports.org/) 2.12.6, que mantiene soporte x86_64 en macOS Tahoe 26 y anteriores.

---

## 🔍 3. Buscar e instalar paquetes

```bash
brew search nombre            # busca fórmulas y casks
brew info nombre              # descripción, versión, dependencias y requisitos de arquitectura
brew install nombre           # instala una fórmula (CLI)
brew install --cask nombre    # instala una app gráfica (.app)
brew install --formula nombre # fuerza el modo fórmula
brew install --dry-run nombre # (7.0) previsualiza sin instalar
```

### Fórmula vs cask

```bash
# Fórmula: software de línea de comandos o librería
brew install jq

# Cask: aplicación gráfica con instalador propio
brew install --cask visual-studio-code

# Ver solo un tipo
brew list --formula
brew list --cask
```

> ⚠️ **Obsoleto / en desuso (oct. 2026).** Desde la 5.0.0 (nov. 2025) los casks sin firma de código están deprecados; Homebrew desactiva los casks de `homebrew-cask` que no pasan las comprobaciones de Gatekeeper. Instala solo casks con firma y notarización válidas.

---

## ⬆️ 4. Actualizar y desinstalar

```bash
brew update                    # actualiza definiciones y el propio Homebrew
brew outdated                  # lista lo que está desactualizado
brew upgrade                   # actualiza todos los paquetes
brew upgrade nombre            # actualiza uno
brew reinstall nombre          # reinstala
brew uninstall nombre          # desinstala
brew uninstall --cask nombre   # desinstala una app gráfica

brew pin nombre                # fija la versión (no se actualizará)
brew unpin nombre              # libera el pin
```

---

## 🧹 5. Mantenimiento

```bash
brew doctor                    # diagnostica problemas de configuración
brew cleanup                   # borra versiones antiguas y cachés
brew cleanup --prune=all       # incluye todo lo descargado
brew autoremove                # elimina dependencias huérfanas
brew --cache                   # muestra la carpeta de caché
```

En 7.0 `brew cleanup` escanea la caché una sola vez, por lo que es más rápido en instalaciones grandes.

---

## 🍺 6. `brew bundle` y Brewfile

Un `Brewfile` describe todo un entorno en un fichero reproducible.

```bash
brew bundle dump               # genera Brewfile con lo instalado
brew bundle                    # instala todo lo del Brewfile
brew bundle check              # comprueba qué falta sin instalar
brew bundle cleanup            # desinstala lo que no está en el Brewfile
```

Ejemplo de `Brewfile`:

```ruby
tap "homebrew/bundle"

brew "git"
brew "node"
brew "fnm"
cask "visual-studio-code"
cask "docker"
mas "Xcode", id: 497799835     # apps del Mac App Store (requiere la fórmula mas)
```

En 7.0 `brew bundle` también restaura herramientas de lenguaje desde `Cargo` (git o rutas locales) y `uv` con `source:`.

---

## 🛠️ 7. Servicios

```bash
brew services list             # lista servicios y estado
brew services start nombre     # arranca y marca arranque al login
brew services stop nombre      # detiene
brew services restart nombre   # reinicia
brew services run nombre       # arranca sin persistencia
```

Comportamiento en 7.0:
- Los servicios leen overrides persistentes de `$HOMEBREW_USER_CONFIG_HOME/services/<formula>.env`.
- Los servicios nuevos se registran con la etiqueta `sh.brew.<formula>` en macOS.

---

## 📑 8. Listados y auditoría

```bash
brew list                      # fórmulas instaladas
brew list --cask               # casks instalados
brew list --versions           # con sus versiones
brew list --no-installed-on-request  # solo dependencias (7.0)
brew deps nombre               # dependencias de un paquete
brew uses --installed nombre   # qué instalado depende de él
brew info --sizes              # tamaños de fórmulas y casks
```

### Taps

```bash
brew tap                       # lista taps añadidos
brew tap usuario/repo          # añade un tap
brew untap usuario/repo        # elimina un tap
brew tap-info --installed      # detalle de los taps instalados
```

La instalación desde un tap de terceros está sujeta al mecanismo *tap trust* (desde la 6.0.0). Homebrew 7.0 verifica atestaciones en taps de terceros compatibles.

---

## 🔒 9. Seguridad en 7.0

- Sandboxea operaciones de fórmulas y casks y bloquea las lecturas del directorio personal durante las compilaciones.
- Incluye base de datos de avisos de seguridad y comprobaciones de vulnerabilidades integradas.
- Genera SBOM con identificadores upstream (PyPI, npm, Cargo).

---

## ❓ FAQ

**❓ ¿Dónde se instalan los paquetes?**
➡ En `/opt/homebrew/Cellar` (Apple Silicon) o `/usr/local/Cellar` (Intel macOS).

**❓ ¿Diferencia entre fórmula y cask?**
➡ Fórmula = software CLI o librería; cask = aplicación gráfica `.app` con instalador propio.

**❓ ¿Cómo exporto mis paquetes a otra máquina?**
➡ `brew bundle dump` genera un `Brewfile`; en la otra máquina, `brew bundle`.

**❓ ¿Homebrew sigue funcionando en Macs Intel?**
➡ Sí, pero en Tier 3, sin bottles nuevos y con retirada prevista en o después de septiembre de 2027. Migra a MacPorts.

**❓ Estoy en macOS Catalina, ¿puedo usar brew?**
➡ No. Homebrew 7.0 requiere macOS 11 (Big Sur) o superior.

**❓ ¿Hay interfaz gráfica?**
➡ Sí, la app nativa de Homebrew (BrewUI, 0.4.1) para macOS, introducida en 7.0.

---

## 🔗 Enlaces
- [Homebrew: web oficial](https://brew.sh/)
- [Documentación](https://docs.brew.sh/)
- [Homebrew 7.0.0 (13 sept. 2026)](https://brew.sh/2026/09/13/homebrew-7.0.0/)
- [Tiers de soporte](https://docs.brew.sh/Support-Tiers)
- [Instalación](https://docs.brew.sh/Installation)
- [Fórmulas y casks disponibles](https://formulae.brew.sh/)
- [App nativa BrewUI](https://github.com/Homebrew/brewui)
- [MacPorts (alternativa en Intel)](https://www.macports.org/)

## 🧩 Ver también
- [Homebrew x86_64 vs ARM64](./gestionar_brew_x86_64_arm64.md)
- [Manual de entornos Conda](./manual_conda_entornos.md)
- [Manual de Node.js](./manual_nodejs.md)
- [Docker Compose](./manual_docker_compose.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
