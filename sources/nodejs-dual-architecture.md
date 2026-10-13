# Manual: Node.js Dual Architecture en Mac M1/M2 – ARM64 y x86_64 en paralelo

Mantener un Node.js arm64 y otro x86_64 (vía Rosetta) en el mismo Mac permite compilar dependencias nativas para ambas arquitecturas, pero es un flujo **legacy** que muere con Rosetta. Este manual describe el flujo clásico, sus límites y la alternativa moderna con gestores nativos.

> 🎯 **Nivel**: avanzado · **Requisitos**: Mac Apple Silicon; Rosetta 2 (macOS ≤ 27) · **Revisado**: octubre 2026

> ⚠️ **Obsoleto / en desuso (oct. 2026).** Ejecutar Node x86_64 con `arch -x86_64` o nvm bajo Rosetta es **legacy**. Apple solo mantiene Rosetta 2 hasta **macOS 27 (Golden Gate)**; desde **macOS 28 las apps Intel no arrancarán**. En 2026 lo recomendado es **Node arm64 nativo** gestionado con **fnm** o **mise**. Para dependencias nativas x86, usa contenedores o CI, no tu Mac. Ver [Manual de Node.js](./manual_nodejs.md).

## 🧭 Tabla de decisión: ¿necesito x86_64?

| Necesidad | Solución 2026 | Por qué |
|---|---|---|
| Desarrollo normal | Node arm64 con fnm/mise | Nativo, sin emulación |
| Dependencia nativa solo-x86 | Contenedor `linux/amd64` | No depende de Rosetta |
| Compilar un addon x86 para distribuir | CI (runner `macos-13`) | Reproducible y aislado |
| Ejecutar una app Node antigua Intel | Máquina Intel dedicada (≤ macOS 26) | Sin Rosetta en macOS 28 |
| Necesitas ambas arquitecturas a la vez | Dos instalaciones + aliases (temporal) | Solo hasta macOS 27 |

## ✅ 1. Camino recomendado: Node arm64 nativo

```bash
# fnm: gestor de versiones rápido (Rust, un solo binario)
brew install fnm
eval "$(fnm env --use-on-cd --shell zsh)"     # añadir esta línea a ~/.zshrc
fnm install --lts
fnm use --lts
node -p "process.arch"                        # → arm64
```

Alternativa todo-en-uno con mise:

```bash
brew install mise
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
mise use -g node@lts
node -p "process.arch"                        # → arm64
```

Ambos leen `.node-version` o `.nvmrc`, así que fijas la versión por proyecto sin tocar los ficheros de shell.

## 🧱 2. Flujo legacy: Node arm64 + x86_64 en paralelo

Solo si tienes una razón concreta y estás en macOS 27 o anterior.

```bash
# Ver la(s) arquitectura(s) del binario
file "$(which node)"         # Mach-O universal binary with 2 architectures | arm64 | x86_64

# Alternar arquitectura por comando
arch -arm64  /usr/local/bin/node -p "process.arch"   # arm64
arch -x86_64 /usr/local/bin/node -p "process.arch"   # x64
```

Configuración en `~/.zshrc`:

```bash
# Aliases explícitos por arquitectura (legacy)
alias node-arm='arch -arm64  /usr/local/bin/node'
alias node-x86='arch -x86_64 /usr/local/bin/node'
alias npm-arm='arch -arm64  /usr/local/bin/npm'
alias npm-x86='arch -x86_64 /usr/local/bin/npm'

# Diagnóstico rápido
node-arch-info() {
  echo "terminal: $(uname -m)"
  echo "node:     $(node -p "process.version + ' ' + process.arch")"
}
```

> 📌 **Estado**: `arch -x86_64` funciona en macOS 27; desaparece con Rosetta en macOS 28. A partir de ahí los aliases `*-x86` dejan de servir.

## 🧩 3. Dependencias nativas: el punto de dolor

Los addons nativos (`node-gyp`, `bcrypt`, `sharp`…) se compilan para una sola arquitectura. Mezclarlos en el mismo árbol de `node_modules` los rompe.

```bash
# Error típico
# Error: dlopen(...): mach-o file, but is an incompatible architecture

# Reconstruir para la arquitectura del Node activo
npm rebuild                       # con Node arm64 → addons arm64
npm rebuild --arch=x64            # addon x86_64 (legacy, sobre Rosetta)
```

Regla práctica: **un `node_modules` por arquitectura**. Si compilas para las dos, usa directorios o contenedores separados, nunca el mismo árbol.

## 🐳 4. Alternativa moderna: contenedores y CI

```bash
# Compilar y ejecutar con Node Linux x86_64 sin depender de Rosetta
brew install colima docker
colima start
docker run --rm -it --platform linux/amd64 -v "$PWD":/app -w /app node:24 \
  sh -c "npm ci && npm run build"
```

En CI, fija la arquitectura del runner:

```yaml
# .github/workflows/build.yml
jobs:
  build-x86:
    runs-on: macos-13        # runner Intel (retirada prevista en otoño de 2027)
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build

  build-arm:
    runs-on: macos-14        # runner Apple Silicon
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
```

## 🔎 5. Diagnóstico

```bash
# Arquitectura de la terminal y de Node
uname -m
node -p "process.platform + ' ' + process.arch + ' ' + process.version"

# ¿Tiene slice arm64 este binario?
lipo -archs "$(which node)"

# ¿Hay binarios solo-Intel en el proyecto?
find . -path ./node_modules -prune -o -type f -perm -111 -print 2>/dev/null \
  | while read -r f; do
      file "$f" | grep -q 'Mach-O' && echo "$(lipo -archs "$f" 2>/dev/null) $f"
    done
```

## ✅ 6. Checklist de migración a arm64

- [ ] Instala fnm o mise y una versión LTS de Node arm64.
- [ ] Elimina de `.zshrc` los aliases `*-x86` y las llamadas a `arch -x86_64`.
- [ ] Borra `node_modules` y reinstala con `npm ci` en arm64.
- [ ] Recompila addons nativos: `npm rebuild`.
- [ ] Mueve a contenedor o CI lo que necesite x86.
- [ ] Sustituye el nvm bajo Rosetta por fnm/mise nativo.
- [ ] Verifica: `node -p "process.arch"` → `arm64`.

## ❓ FAQ

**❓ ¿Node universal o dos instalaciones?**
➡ Los binarios oficiales de [nodejs.org](https://nodejs.org/) para macOS son arm64 o x64. Si necesitas ambos, instala cada uno en su ruta y alterna: es el flujo legacy.

**❓ ¿Por qué `npm install` falla con "incompatible architecture"?**
➡ El `node_modules` se compiló para la otra arquitectura. Borra `node_modules` y usa `npm ci` con el Node correcto.

**❓ ¿Puedo seguir usando nvm sobre Rosetta?**
➡ Sí, pero es frágil y legacy. Usa fnm o mise con Node arm64 nativo.

**❓ ¿Y si mi app solo funciona en x86?**
➡ Contenedor `linux/amd64` o máquina Intel dedicada. En macOS 28 no habrá emulación.

**❓ ¿fnm o mise?**
➡ fnm si solo gestionas Node; mise si además quieres Python, Go, etc., en un único `mise.toml`.

## 🔗 Enlaces
- [Node.js: web oficial](https://nodejs.org/)
- [fnm: Fast Node Manager](https://github.com/Schniz/fnm)
- [mise-en-place](https://mise.jdx.dev/)
- [nvm](https://github.com/nvm-sh/nvm)
- [Apple: usar apps Intel en Mac Apple Silicon](https://support.apple.com/en-us/102527)
- [Apple: About the Rosetta translation environment](https://developer.apple.com/documentation/apple-silicon/about-the-rosetta-translation-environment)
- [Colima (contenedores en macOS)](https://github.com/abiosoft/colima)

## 🧩 Ver también
- [Manual de Node.js](./manual_nodejs.md)
- [Manual de Homebrew](./manual_brew.md)
- [Docker Compose](./manual_docker_compose.md)
- [GitHub Actions](./manual_github_actions.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
