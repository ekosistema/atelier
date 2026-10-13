# Editores de terminal – Vim y Nano

Editores de texto para trabajar directamente en servidores o en sesiones SSH. Vim/Nvim son editores modales con enorme potencia; Nano es simple e intuitivo, ideal para ediciones rápidas.

> 🎯 **Nivel**: básico/intermedio · **Requisitos**: Vim 9.2 (feb 2026) o Neovim 0.12 (estable) · **Revisado**: octubre 2026

## 🏷️ Estado actual: Vim, Neovim y `vi` clásico

> ⚠️ **Obsoleto (oct. 2026)**: el **`vi` clásico** de los sistemas heredados queda superado por **Vim** (`vim`) o **Neovim** (`nvim`). Prefiere estos últimos; `vi` sin características modernas solo existe por compatibilidad en sistemas mínimos.

- **Vim** 9.2 (feb 2026): evolución de Bram Moolenaar; scripting Vim9, bloques de texto, LSP vía plugins.
- **Neovim** 0.12 (estable): fork moderno enfocado en Lua, árbol de sintaxis (tree-sitter) y **LSP integrado** (`:help lsp`).

## 🔤 Modos

| Modo | Tecla | Descripción |
|------|-------|-------------|
| Normal | `Esc` | Navegación y comandos (por defecto) |
| Inserción | `i` / `a` | Escribir texto (antes / después del cursor) |
| Visual | `v` | Seleccionar texto (línea: `V`, bloque: `Ctrl+V`) |
| Comando | `:` | Ejecutar comandos (`:w`, `:q`, `:g/…`) |

En Neovim puedes ejecutar Lua directamente con `:lua`, `:luafile` y en `init.lua`.

## 🧭 Movimientos y operadores

```text
h j k l        ← ↓ ↑ →   (movimiento básico)
w / b           palabra siguiente / anterior
0 / $           inicio / fin de línea
gg / G          inicio / fin del archivo
Ctrl+d / u      media página abajo / arriba

# Operadores + text-objects: la clave de la potencia modal
dw              borrar palabra           da        borrar AROUND (las palabras encerradas)
cw              cambiar palabra          ci"       cambiar dentro de las comillas
diw             borrar palabra interior
dap             borrar párrafo alrededor
ci(             cambiar dentro de paréntesis
```

El patrón es `[operador][cantidad][objeto]`: `ciw`, `d2w`, `yiw` (copy in word).

## 📋 Registros y macros

```text
"ayy            copiar línea al registro a
"ap             pegar contenido del registro a
"*yy / "*p       copiar/pegar desde el portapapeles del sistema (en GUI/terminales con soporte)

# Macros: grabar, repetir, ejecutar
qa              empezar a grabar en registro a
...acciones...
q               parar de grabar
@a              ejecutar macro a
7@a             ejecutar 7 veces
qA              grabar añadiendo al registro a
```

Las macros resuelven tareas repetitivas sobre columnas o bloques mejor que la sustitución cuando hay lógica por fila.

## 🧮 Búsqueda, sustitución y `:g/`

```vim
/patrón         buscar hacia adelante        n / N → siguiente / anterior
:%s/foo/bar/gc   sustituir todo con confirmación
:5,20s/foo/bar/g   sustituir solo en el rango 5-20
:g/^#/d          eliminar todas las líneas que empiezan por #
:g/TODO/t$       mover las líneas con TODO al final
:v/patrón/d      eliminar todas las líneas que NO coinciden
```

`:g/patrón/comando` es la herramienta de edición masiva que no existe en nano.

## 🪟 Splits, buffers y pestañas

```vim
:sp archivo2    split horizontal    Ctrl+w s / Ctrl+w v
:vsp archivo2   split vertical      Ctrl+w w → siguiente panel
:enew           abrir buffer vacío
:bnext / :bprev / :ls   buffers
:tabnew         pestaña nueva       gt / gT  para saltar
```

## ⚙️ vimrc mínimo moderno

```vim
" ~/.vimrc  (Vim): mínimo imprescindible
set number numberwidth=2          " números de línea
set relativenumber                " números relativos (movimiento eficiente)
syntax on
set mouse=a                       " ratón activo
set tabstop=4 shiftwidth=4 expandtab
set autoindent
set hidden                        " buffers sin guardar al pasar de archivo
set signcolumn=yes
" El comando :LspInfo y el LSP integrado corresponden a Neovim (ver sección siguiente)
```

En Neovim, la configuración moderna va en `~/.config/nvim/init.lua` (Lua), no en vimscript.

## 🚀 Productividad: LazyVim, kickstart.nvim y LSP

- **LazyVim** y **Lazy.nvim**: distribuciones/gestores de plugins que montan Neovim con LSP, autocompletado y tree-sitter casi listos para usar.
- **kickstart.nvim**: plantilla mínima (un solo `init.lua`) para empezar desde cero.
- **LSP**: Neovim trae cliente LSP integrado. Con un servidor instalado (p. ej. `lua-language-server`, `pyright`, `ts_ls`), desde dentro: `:LspInfo` muestra el estado y `:lua vim.lsp.buf.hover()` da la definición.

```lua
-- ~/.config/nvim/init.lua (extracto)
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.mouse = "a"
-- require("lspconfig").pyright.setup{}   -- con nvim-lspconfig
```

## ⚡ nano: edición rápida

```text
^G   ayuda            ^X   salir (pregunta si guardar)
^O   guardar          ^W   buscar            ^\   buscar y reemplazar
^K   cortar línea     ^U   pegar             ^C   posición del cursor
^_   ir a línea número   M-A  seleccionar texto
```

Arranca con `nano archivo` o `nano -l archivo` (números de línea). Suficiente para tocar configs al vuelo; sin sintaxis potente, buffers ni macros.

## 🧭 Alternativas modernas

| En su lugar | Ventaja | Notas |
|---|---|---|
| [Helix](https://helix-editor.com) | Edición modal con selección previa y LSP integrado, cero configuración (25.01) | Curva de aprendizaje si vienes de Vim |
| [micro](https://micro-editor.github.io) | Nano con esteroides: mouse, splits, temas, atajos intuitivos (2.0.15, dic 2025) | Gran opción para migrar desde nano |
| [Zed](https://zed.dev) | Editor gráfico moderno, muy rápido, LSP incorporado (multiplataforma) | Fuera del terminal |

> 📌 **Estado**: **vim-plug** sigue mantenido (últimos commits 2026, último tag 0.14.0 en 2024) pero sus releases van por detrás de la rama. Para Neovim actual prefiere **Lazy.nvim** o el gestor integrado **vim.pack**; para Vim clásico, `vim-plug` sigue siendo válido. Revisa el estado de mantenimiento de cualquier plugin antes de adoptarlo.

## ❓ FAQ

**❓ Vim o Neovim?**
➡ Si dominas vimscript o trabajas en sistemas mínimos, Vim. Si empiezas o quieres LSP/tree-sitter fuera de la caja, Neovim.

**❓ Cómo salir de Vim?**
➡ `Esc` → `:q!` (sin guardar) o `:wq` (guardando). En nano, `Ctrl+X` pregunta al salir.

**❓ No recuerdo los atajos. Qué hago?**
➡ `:help user-manual` en Vim, o `:Tutor` en Neovim (tutorial interactivo). Para depurar tu configuración, `:scriptnames` y `:set verbose`.

## 🔗 Enlaces
- [Vim official](https://www.vim.org/docs.php)
- [Neovim](https://neovim.io)
- [Nano official](https://www.nano-editor.org/)
- [kickstart.nvim](https://github.com/nvim-lua/kickstart.nvim)
- [LazyVim](https://www.lazyvim.org)

## 🧩 Ver también
- [tmux](./manual_tmux.md)
- [Bash Scripting](./manual_bash_scripting.md)
- [Expresiones regulares](./manual_regex.md)
- [sed y awk](./manual_sed_awk.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
