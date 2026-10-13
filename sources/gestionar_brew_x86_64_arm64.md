# Homebrew x86_64 vs ARM64 – Gestión dual-arch en Mac Apple Silicon (legacy)

Mantener dos árboles de Homebrew (arm64 nativo en `/opt/homebrew` y x86_64 en `/usr/local`) permite instalar software Intel sin binario arm64, pero es un flujo **legacy** pensado para sobrevivir hasta el fin de Rosetta. Este manual explica cómo hacerlo sin romper el PATH y cómo migrar a arm64.

> 🎯 **Nivel**: avanzado · **Requisitos**: Mac Apple Silicon; Rosetta 2 (macOS ≤ 27) · **Revisado**: octubre 2026

> ⚠️ **Obsoleto / en desuso (oct. 2026).** El Homebrew x86_64 sobre Rosetta es un flujo legacy. Apple confirma que **Rosetta 2 solo sigue disponible hasta macOS 27 (Golden Gate)**; a partir de **macOS 28 (otoño 2027) las apps Intel no arrancarán** (salvo un subconjunto reducido de juegos antiguos). Homebrew ya no compila bottles nuevos para Intel y dejará de ejecutarse en Intel **en o después de septiembre de 2027**. Alternativa recomendada: **Homebrew arm64 nativo** y, solo cuando no exista binario arm64, contenedores `linux/amd64`, CI o una máquina Intel dedicada. Ver [Manual de Homebrew](./manual_brew.md).

## 🧭 ¿Tiene sentido hoy?

Solo en dos casos concretos:

1. Necesitas una herramienta que **solo se distribuye como binario x86_64** y no hay alternativa arm64.
2. Mantienes un proyecto antiguo que debes compilar contra librerías Intel.

Para todo lo demás, usa arm64 nativo. Tabla de decisión:

| Necesidad | Solución 2026 | Por qué |
|---|---|---|
| CLI sin binario arm64 | Contenedor `linux/amd64` (colima/Docker) | No depende de Rosetta |
| Dependencia nativa x86 en un build | CI con runner Intel (`macos-13`) | Reproducible, fuera de tu Mac |
| App Intel que debe seguir corriendo | Máquina Intel dedicada (≤ macOS 26) | Sin Rosetta en macOS 28 |
| Desarrollo normal | Homebrew arm64 nativo | Tier 1, bottles precompilados |

## ⚙️ 1. Verificar las dos instalaciones

```bash
# Qué brew está activo y su arquitectura
which brew
file "$(which brew)"            # → arm64 o x86_64

# Ambas rutas posibles
ls -la /opt/homebrew/bin/brew 2>/dev/null   # Apple Silicon nativo
ls -la /usr/local/bin/brew    2>/dev/null   # x86_64 (Rosetta)
```

## 🏗️ 2. Instalar el árbol x86_64 sin conflictos

```bash
# Requiere Rosetta 2: sudo softwareupdate --install-rosetta --agree-to-license
arch -x86_64 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Esto instala en `/usr/local` (prefijo Intel) mientras el arm64 permanece en `/opt/homebrew`. En macOS 27 el comando todavía funciona; en macOS 28 Rosetta ya no estará y no podrá ejecutarse.

## 🛣️ 3. Aliases para no romper el PATH

```bash
# ~/.zshrc: nunca pongas /usr/local/bin antes de /opt/homebrew/bin
alias brew-arm='/opt/homebrew/bin/brew'
alias brew-x86='arch -x86_64 /usr/local/bin/brew'

# El brew por defecto es el nativo arm64
eval "$(/opt/homebrew/bin/brew shellenv)"

# Comprobar el orden del PATH (arm64 primero)
echo "$PATH" | tr ':' '\n' | grep -n 'homebrew\|usr/local'
```

> 📌 **Estado**: `arch -arm64` y `arch -x86_64` funcionan en macOS 27. `arch -x86_64` desaparece con Rosetta en macOS 28.

## 🔎 4. Script de auditoría: binarios solo-Intel

Lista los ejecutables que **no tienen slice arm64** (los que dejarán de arrancar en macOS 28).

```bash
#!/bin/bash
# audit-intel-only.sh: lista binarios Mach-O sin slice arm64
# Uso: ./audit-intel-only.sh /usr/local/bin ~/bin

set -u
roots=("$@")
[ ${#roots[@]} -eq 0 ] && roots=("/opt/homebrew/bin" "/usr/local/bin")

for dir in "${roots[@]}"; do
  [ -d "$dir" ] || continue
  while read -r bin; do
    file "$bin" | grep -q 'Mach-O' || continue        # solo Mach-O reales
    archs=$(lipo -archs "$bin" 2>/dev/null)
    case "$archs" in
      *arm64*) ;;                                     # tiene arm64: OK
      "") ;;                                          # lipo no aplicable
      *) printf '%s\t%s\n' "$archs" "$bin" ;;         # solo x86_64 → riesgo
    esac
  done < <(find "$dir" -maxdepth 3 -type f -perm -111 2>/dev/null)
done | sort -u
```

Guardar y ejecutar:

```bash
chmod +x audit-intel-only.sh
./audit-intel-only.sh /usr/local/bin | tee solo-intel.txt
wc -l solo-intel.txt
```

Cada línea de `solo-intel.txt` es un binario que no funcionará en macOS 28 sin reemplazo nativo.

## ✅ 5. Checklist de migración a arm64

- [ ] Ejecuta el script de auditoría y revisa `solo-intel.txt`.
- [ ] Sustituye cada herramienta solo-Intel por su versión arm64 (`brew-arm install` o binario oficial arm64).
- [ ] Reinstala intérpretes y gestores (Node, Python, conda) de forma nativa arm64.
- [ ] Recompila dependencias nativas: `npm rebuild`, `pip install --force-reinstall`, `cargo build`.
- [ ] Limpia `.zshrc`/`.zprofile`: elimina aliases `*-x86` y llamadas a `arch -x86_64`.
- [ ] Mueve a contenedores `linux/amd64` lo que dependa de librerías Intel.
- [ ] Configura CI con runners arm64 (`macos-14` o superior).
- [ ] Cuando ya no lo necesites: `sudo rm -rf /usr/local/Homebrew /usr/local/Cellar`.
- [ ] Verifica con `brew-arm doctor` y `file "$(which <herramienta>)"`.

## 🛠️ 6. Gestión diaria (mientras siga vivo)

```bash
brew-arm update && brew-arm upgrade     # árbol arm64
brew-x86 update && brew-x86 upgrade     # árbol x86_64
brew-arm cleanup                        # limpia cachés arm64
brew-x86 cleanup                        # limpia cachés x86_64
```

## ❓ FAQ

**❓ ¿Puedo tener la misma app en las dos arquitecturas?**
➡ Sí, cada árbol tiene su propio `Cellar`, pero es innecesario salvo por los dos casos de arriba.

**❓ ¿Por qué falla una herramienta instalada con `brew-arm`?**
➡ Si solo existe como binario o dependencia Intel, instálala por el árbol x86 o busca una alternativa arm64.

**❓ ¿Debo actualizar el árbol x86_64?**
➡ Solo si lo sigues necesitando. No recibirá bottles nuevos: algunas actualizaciones compilarán desde fuente o fallarán.

**❓ ¿Qué pasa con mis proyectos al actualizar a macOS 28?**
➡ Las dependencias Intel dejarán de ejecutarse. Completa el checklist de migración antes de actualizar.

**❓ ¿Hay alternativa a Rosetta para ejecutar código x86?**
➡ Para contenedores, una VM con QEMU/colima puede emular x86_64 con más coste. Para apps de escritorio no hay sustituto oficial.

## 🔗 Enlaces
- [Homebrew: web oficial](https://brew.sh/)
- [Tiers de soporte de Homebrew](https://docs.brew.sh/Support-Tiers)
- [Apple: usar apps Intel en Mac Apple Silicon](https://support.apple.com/en-us/102527)
- [Apple: About the Rosetta translation environment](https://developer.apple.com/documentation/apple-silicon/about-the-rosetta-translation-environment)
- [MacPorts](https://www.macports.org/)
- [Colima (contenedores en macOS)](https://github.com/abiosoft/colima)

## 🧩 Ver también
- [Manual de Homebrew](./manual_brew.md)
- [Conda x86_64 en Apple Silicon](./environment_conda_x86_64.md)
- [Firma y notarización](./manual_firma_notarizacion.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
