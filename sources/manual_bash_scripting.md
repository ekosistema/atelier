# Bash Scripting – Fundamentos para scripting en shell

Bash es el intérprete de comandos por defecto en la mayoría de distribuciones Linux y el lenguaje nativo para automatizar tareas en terminal. Este manual cubre bash 5.3 (mayo 2025) con técnicas modernas y seguras de scripting.

> 🎯 **Nivel**: intermedio · **Requisitos**: bash instalado en Linux/macOS/WSL · **Revisado**: octubre 2026

## 🛡️ Esqueleto seguro (`set -euo pipefail`)

Añade estas opciones al inicio de cada script para fallar rápido en lugar de seguir con errores ocultos:

```bash
#!/usr/bin/env bash
set -euo pipefail   # -e: salir al primer error | -u: error si var sin definir | pipefail: el pipe falla si falla cualquier etapa

# Trampa común: con set -e, un comando "fallido" dentro de un if/while NO aborta
if ! comando_maybe_falla; then
    echo "el comando falló pero seguimos" >&2
fi
```

Pitfalls clave de `set -e`:
- No protege frente a todo: un fallo dentro de `$(comando)` en una asignación suele pasarse por alto.
- `pipefail` hace que `cmd1 | cmd2` devuelva el código del comando que falló, no el del último. Útil con `ejecutable 2>&1 | tee log`.

## 🔤 Variables, parámetros y arrays

```bash
NOMBRE="Juan"                       # asignación (sin espacios alrededor de =)
echo "${NOMBRE:-desconocido}"       # ${var:-x}: usa x si var está vacía o sin definir
echo "${NOMBRE:=default}"           # ${var:=x}: además asigna el valor por defecto
FRUTAS=("manzana" "pera" "uva")
echo "${FRUTAS[@]}"                 # todos los elementos
echo "${#FRUTAS[@]}"                # número de elementos
FRUTAS+=("naranja")                 # añadir elemento
```

En bash 4+ existen arrays asociativos (`declare -A`). Usa siempre comillas: `"${arr[@]}"`. Sin comillas, los elementos con espacios se rompen en varias palabras.

## 🎟️ Parámetros posicionales: `$@` vs `$*`

```bash
for arg in "$@"; do   # correcto: cada argumento se conserva entero, incluso con espacios
    echo "$arg"
done

for arg in $*; do     # mal: "hola mundo" se parte en dos argumentos
    echo "$arg"
done
```

Regla: usa siempre `"$@"` entre comillas. `$*` une todos los argumentos en un único string y solo es útil cuando quieres forzar ese comportamiento con `IFS`.

## 🧵 Sustitución de comandos y process substitution

```bash
FECHA=$(date +%Y-%m-%d)          # capturar la salida de un comando en una variable
ARCHIVOS=(*.txt)                 # listar ficheros con globbing en array, no con ls

# Process substitution: pasar la salida de un comando como si fuera un fichero
diff <(sort f1.txt) <(sort f2.txt)

# El caso de uso más habitual: bucle con stdin de un comando
while IFS= read -r linea; do
    echo "-> $linea"
done < <(grep ERROR app.log)
```

## 🔀 Condicionales: `[[ ]]` vs `[ ]`

```bash
if [[ -f "$FICHERO" ]]; then      # [[ ]] es builtin de bash: más potente y sin ambigüedades
    echo "existe"
fi

[[ "$NOMBRE" == *.txt ]] && echo "termina en .txt"   # == admite globbing
[[ "hola" =~ ^h ]] && echo "regex"                    # =~ para expresiones regulares

# [ ] es POSIX (sh): necesita comillas y no soporta =~ ni globbing
[ "$NOMBRE" = "Juan" ] && echo "clásico"
```

Prefiere `[[ ]]` en scripts bash; `[ ]` solo si necesitas portabilidad con `sh`/dash.

## 📜 Bucles y lectura de ficheros

```bash
for f in *.txt; do
    echo "Procesando $f"
done

# Leer línea a línea: SIEMPRE con read -r para no interpretar backslashes
while IFS= read -r linea; do
    echo "-> $linea"
done < datos.txt
```

`read -r` es obligatorio: sin `-r`, un `\` en la entrada se usa como indicador de continuación de línea.

## 🧯 Funciones, códigos de salida y trap/cleanup

```bash
saludar() {
    local nombre="$1"            # local evita contaminar variables globales
    echo "Hola, $nombre"
}
saludar "María" || exit 1        # una función devuelve el código del último comando

# Códigos de salida: 0 = éxito, cualquier otro = error
mi_funcion() { return 42; }

cleanup() { rm -rf "$tmpdir"; echo "limpieza hecha" >&2; }
tmpdir=$(mktemp -d)              # directorio temporal seguro y único
trap cleanup EXIT                # EXIT se ejecuta siempre al salir, incluso en error
trap 'echo "interrumpido"' INT   # INT: Ctrl+C
```

`mktemp` evita carreras de ficheros temporales y el clásico fallo de escalada de `/tmp`. Evita a toda costa `rm -rf /tmp/$$`.

## 🧮 Opciones de línea de comandos con `getopts` y aquí-docs

```bash
usage() { echo "uso: $0 [-v] [-o salida] fichero"; exit 1; }

while getopts ":vo:" opt; do
    case "$opt" in
        v) VERBOSO=1 ;;
        o) SALIDA="$OPTARG" ;;
        *) usage ;;
    esac
done
shift $((OPTIND - 1))

# Aquí-doc (<<) para generar texto con expansión de variables
cat <<EOF > "$SALIDA"
Config generada el $(date)
usuario: $USER
EOF

# Aquí-string (<<<): pasa un string directamente al stdin de un comando
grep ERROR <<< "$log"
```

El `<<EOF` interpreta variables y sustituciones; `<<'EOF'` las deja literales, algo útil para generar código u otros scripts.

## 🚨 Portabilidad: `sh`/dash vs bash y bash 3.2 en macOS

- **`#!/bin/sh` ≠ bash**: en Debian/Ubuntu `sh` enlaza a **dash**, mucho más estricto. Si usas `[[ ]]`, arrays o `local`, la shebang debe ser `#!/usr/bin/env bash` o `#!/bin/bash`.
- **macOS**: el `/bin/bash` del sistema es **3.2.57**, congelado por licencia GPLv2 (sin arrays asociativos ni `readarray`, no lo reconocerá si usas mapfile). El shell por defecto es `zsh` desde Catalina (10.15). Para scripts con features nuevas instala un bash moderno (`brew install bash`) y usa `#!/opt/homebrew/bin/bash` en Apple Silicon.
- Para máximo alcance, escribe scripts **POSIX** con `#!/bin/sh` y evita bashismos.

## 🔍 Calidad: ShellCheck y shfmt

```bash
shellcheck script.sh     # linter: detecta bugs y malas prácticas (v0.11.0, ago 2025)
shfmt -w script.sh       # formateador de shell de mvdan/sh (v3.12, jul 2025)

# Ejecuta ambos antes de desplegar scripts
shellcheck -x mi_script.sh && shfmt -l mi_script.sh
```

ShellCheck es el estándar de facto para scripts; cada aviso lleva un ID (p. ej. SC2086) documentado en su wiki.

## ❓ FAQ

**❓ `set -e` no aborta cuando falla un comando en un pipe?**
➡ `pipefail` hace que el pipe devuelva el código del primer comando que falle; sin él solo se propaga el del último.

**❓ Diferencia práctica entre `${var:-x}` y `${var:=x}`?**
➡ `:-` usa el valor por defecto sin modificarlo; `:=` además asigna ese valor a la variable.

**❓ Por qué debo citar siempre `"${array[@]}"`?**
➡ Sin comillas, cada elemento se vuelve a partir por espacios; con comillas, cada elemento se conserva como un único argumento.

## 🔗 Enlaces
- [Bash Reference Manual (GNU, 5.3)](https://www.gnu.org/software/bash/manual/bash.html)
- [ShellCheck: linter](https://www.shellcheck.net/)
- [shfmt: formateador (mvdan/sh)](https://github.com/mvdan/sh)
- [Bash Hackers Wiki](https://wiki.bash-hackers.org/)
- [Explain Shell](https://explainshell.com/)

## 🧩 Ver también
- [Productividad en Shell](./manual_shell_productivity.md)
- [Expresiones regulares](./manual_regex.md)
- [sed y awk](./manual_sed_awk.md)
- [cron](./manual_cron.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
