# Node.js – Runtime de JavaScript en el servidor

Entorno de ejecución de JavaScript fuera del navegador, basado en el motor V8. Se usa para APIs, herramientas de línea de comandos, scripts de build y aplicaciones de red.

> 🎯 **Nivel**: intermedio · **Requisitos**: terminal, nociones de JavaScript · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Instalación y gestores de versión](#-instalación-y-gestores-de-versión)
- [Política de releases y versiones LTS](#️-política-de-releases-y-versiones-lts)
- [npm y `package.json`](#-npm-y-packagejson)
- [Desarrollo y scripts](#-desarrollo-y-scripts)
- [Gestión reproducible: `npm ci`, workspaces y pnpm](#-gestión-reproducible-npm-ci-workspaces-y-pnpm)
- [Test runner nativo (`node:test`)](#-test-runner-nativo-nodetest)
- [Permisos (`--permission`)](#-permisos---permission)
- [ESM vs CommonJS](#-esm-vs-commonjs)
- [Alternativas modernas: Bun y Deno](#-alternativas-modernas-bun-y-deno)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 Instalación y gestores de versión

Instala siempre desde la web oficial o con un gestor de versiones; evita el paquete del sistema (suele ir desfasado).

```bash
# macOS / Linux con gestor de versiones (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
source ~/.bashrc          # recarga la shell para cargar nvm

# Instalar y fijar una versión por proyecto (.nvmrc)
nvm install 24
nvm use 24
echo "24" > .nvmrc        # fija la versión para este repo
nvm use                   # lee .nvmrc automáticamente

node -v                   # versión activa
```

### `fnm` y `mise` (alternativas más rápidas y multiplataforma)

```bash
# fnm: escrito en Rust, lee .nvmrc y .node-version, funciona en Windows/macOS/Linux
brew install fnm && eval "$(fnm env)"
fnm install 24 && fnm use 24

# mise: gestiona varios runtimes (Node, Python, Ruby...) con un solo fichero mise.toml
mise use node@24
```

> 📌 **Estado**: `nvm` solo funciona en macOS/Linux (en Windows existe el fork `nvm-windows`). Para equipos mixtos o CI, `fnm` o `mise` son más cómodos: misma sintaxis de ficheros (`.nvmrc`/`.node-version`) y arranque más rápido.

## 🗂️ Política de releases y versiones LTS

Node.js publica una rama mayor cada seis meses (abril y octubre). Las pares pasan a **LTS**; las impares quedan **EOL** a los seis meses. Estado a octubre 2026 ([fuente oficial](https://nodejs.org/en/about/previous-releases)):

| Versión | Estado | Fin de vida |
|---|---|---|
| v26.10.0 | Current (pasa a LTS el 28 oct. 2026) | abril 2029 |
| v24.21.0 (Krypton) | Active LTS | abril 2028 |
| v22.23.3 (Jod) | Maintenance LTS | abril 2027 |
| v25 · v23 · v21 · v20 y anteriores | EOL | |

> 📌 **Estado**: A partir de **Node.js 27** el ciclo pasa a ser **anual**: cada versión mayor tendrá fase Alpha (6 meses) y Current (6 meses), y **todas** serán LTS (30 meses de soporte). Node 26 es la última entrega con el modelo antiguo.

```bash
# En CI fija la versión explícitamente, no confíes en la del runner:
#   uses: actions/setup-node@v4
#   with: { node-version: '24', cache: 'npm' }
```

## 📦 npm y `package.json`

`npm` se instala junto con Node (npm 11 en Node 24/26) y gestiona dependencias y scripts.

```bash
npm init -y              # crea package.json con valores por defecto
npm install express      # dependencia de producción
npm install -D vitest    # dependencia de desarrollo
npm uninstall express
npm outdated             # ver dependencias desactualizadas
npm audit                # vulnerabilidades conocidas
npm audit fix            # aplica parches compatibles
```

`package.json` clave:

```json
{
  "name": "mi-app",
  "type": "module",                       // ESM por defecto (".cjs" para CommonJS)
  "engines": { "node": ">=22" },          // versión mínima soportada
  "exports": {                            // API pública del paquete
    ".": "./src/index.js",
    "./utils": "./src/utils.js"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "node --test"
  }
}
```

- `"type": "module"` → los `.js` se tratan como ESM; usa `.cjs` para CommonJS.
- `exports` es la forma moderna de exponer subrutas (sustituye a `main` para consumidores).

## ⚡ Desarrollo y scripts

```bash
npm run dev                 # ejecuta el script "dev" de package.json
npm run                     # lista todos los scripts disponibles
node --watch src/index.js   # reinicia al guardar (integrado)
node --watch-path=./src server.js
```

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `nodemon` para recarga en desarrollo. Alternativa moderna: `node --watch`, integrado en Node.

## 📦 Gestión reproducible: `npm ci`, workspaces y pnpm

```bash
npm ci                   # instalación limpia desde package-lock.json (CI): rápida y reproducible
npm install              # desarrollo local; actualiza el lockfile si hace falta
```

- `npm ci` borra `node_modules` y respeta el lockfile exacto. **Úsalo siempre en CI.**
- `package-lock.json` **debe commitearse**.

Monorepos con **workspaces** (nativo de npm):

```json
{ "workspaces": ["packages/*"] }
```

```bash
npm install                     # instala y enlaza todos los workspaces
npm run build -w packages/web   # ejecuta un script en un workspace concreto
```

Alternativa de gestor: **pnpm** (enlaces duros, ahorra disco, estricto con dependencias fantasma).

```bash
corepack enable          # activa los shims de pnpm/yarn según el campo "packageManager"
```

> 📌 **Estado**: **corepack** dejó de distribuirse con Node a partir de **v25**. Sigue mantenido, pero hay que instalarlo aparte (`npm install -g corepack`) y añadir ese paso en CI/Docker.

## 🧪 Test runner nativo (`node:test`)

Node incluye runner y aserciones sin dependencias externas (estable desde v20).

```javascript
// test/suma.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('suma', () => {
  assert.equal(2 + 2, 4);
});
```

```bash
node --test              # descubre y ejecuta los ficheros *.test.js
node --test --watch      # modo observación
node --test --experimental-test-coverage   # cobertura
```

## 🔐 Permisos (`--permission`)

Modelo de permisos para restringir acceso a ficheros, red, procesos e hijos.

```bash
node --permission --allow-fs-read=./data server.js   # deniega todo salvo lo permitido
node --permission --allow-net=api.example.com app.js
```

> 📌 **Estado.** El modelo `--permission` es **experimental**: útil para endurecer scripts no confiables, pero revisa la compatibilidad antes de depender de él.

## 🧩 ESM vs CommonJS

```javascript
// ESM (recomendado): import/export, top-level await, "type": "module"
import { readFile } from 'node:fs/promises';
export const suma = (a, b) => a + b;

// CommonJS (heredado): require/module.exports, fichero .cjs
const fs = require('node:fs');
module.exports = { suma: (a, b) => a + b };
```

- ESM es el estándar actual; CJS sigue soportado para interoperar con paquetes antiguos.
- Importa siempre módulos internos con prefijo `node:` (`node:fs`, `node:path`).
- `import.meta.url` sustituye a `__dirname`/`__filename` en ESM.

## 🦕 Alternativas modernas: Bun y Deno

Bun y Deno son runtimes alternativos con foco en velocidad, herramientas integradas y seguridad. Comparación honesta (versiones verificadas a oct. 2026):

| Runtime | Versión | Fortaleza | Límite |
|---|---|---|---|
| [Bun](https://bun.com/) | 1.4.2 (sep. 2026) | Gestor + runtime + test + bundler en uno; muy rápido; compatibilidad Node alta | Se reescribió a Rust en 1.4; ecosistema de addons nativos menor |
| [Deno](https://deno.com/) | 2.9.7 (2026) | Seguro por defecto (permisos), TypeScript nativo, web APIs | Compatibilidad Node buena pero no total; menos paquetes nativos |

```bash
# Bun: instala dependencias y ejecuta con el mismo package.json
bun install
bun run src/index.js
bun test

# Deno: ejecuta con permisos explícitos
deno run --allow-net server.ts
deno test
```

> 🧪 **Alternativa moderna.** En proyectos Node existentes el cambio rara vez compensa. Considera Bun/Deno si priorizas arranque en frío, herramientas integradas o un modelo de permisos estricto.

## ❓ FAQ

**❓ ¿`npm install` o `npm ci`?**
➡ Local: `npm install`. En CI y contenedores: `npm ci` (respeta el lockfile y es reproducible).

**❓ ¿Cómo migro a la LTS nueva sin reinstalar todo?**
➡ `nvm install --reinstall-packages-from=current lts/*` reinstala los paquetes globales en la nueva LTS.

**❓ ¿Qué es `node_modules` y debo commitearlo?**
➡ Carpeta de dependencias. **No** se commitea: se regenera desde `package-lock.json`.

**❓ ¿ESM o CommonJS para un proyecto nuevo?**
➡ ESM (`"type": "module"`). Es el estándar y permite `import` y `await` de nivel superior.

**❓ ¿Necesito `nodemon`?**
➡ No: `node --watch` cubre la recarga en desarrollo sin dependencias externas.

## 🔗 Enlaces

- [Node.js: web oficial](https://nodejs.org/)
- [Node.js: calendario de releases](https://nodejs.org/en/about/previous-releases)
- [Documentación de Node.js](https://nodejs.org/docs/latest/api/)
- [Documentación de npm](https://docs.npmjs.com/)
- [fnm (Fast Node Manager)](https://github.com/Schniz/fnm)
- [mise (gestor de runtimes)](https://mise.jdx.dev/)
- [Bun](https://bun.com/) · [Deno](https://deno.com/)

## 🧩 Ver también

- [Manual de curl y HTTP](./manual_curl_http.md)
- [Manual de Nginx](./manual_nginx.md)
- [Manual de SQL](./manual_sql.md)
- [Manual de Makefile](./manual_makefile.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
