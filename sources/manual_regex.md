# Expresiones Regulares (Regex) – Motores, sintaxis y errores comunes

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: la sintaxis **BRE** (Basic Regular Expressions) de GNU `grep`/`sed` solo se mantiene aquí como referencia histórica. Para búsquedas nuevas usa `grep -E`, `grep -P` o, mejor, [ripgrep](https://github.com/BurntSushi/ripgrep).

Patrones de búsqueda, extracción y manipulación de texto. Las expresiones regulares alimentan `grep`, `sed`, `awk`, `ripgrep`, el `re` de Python y el RegExp de JavaScript. Este manual compara los **motores** y sus diferencias reales, porque un patrón que funciona en un sitio puede fallar o cambiar de significado en otro.

> 🎯 **Nivel**: intermedio · **Requisitos**: terminal y algo de experiencia con patrones · **Revisado**: octubre 2026

## 🧠 Motores y qué herramienta usa cada uno

| Motor | Dialecto | Herramientas que lo usan | Notas |
|---|---|---|---|
| **BRE** | POSIX básico | `grep` (sin opción), `sed` (por defecto) | `\( \)`, `\{ \}`, `\+`, `\?` requieren escape |
| **ERE** | POSIX extendido | `grep -E`, `sed -E`, `awk` | `()` `{}` `+` `?` funcionan sin escape |
| **PCRE2** | Perl-compatible | `grep -P` (GNU), `ripgrep -P`, Java, C# | El más completo: lookaround, backrefs, recursion |
| **RE2** | Subconjunto de PCRE | paquete `regexp` de **Go** | Sin backrefs ni lookaround (tiempo lineal garantizado) |
| **regex de Rust** | Subconjunto Perl | **ripgrep** (por defecto) | Sin backrefs/lookaround; `-P` activa PCRE2 |
| **Python `re`** | Perl-compatible | Python | Backrefs y lookaround sí; no recursion |
| **JavaScript RegExp** | ECMAScript | navegadores, Node.js | Lookbehind desde ES2018 |

> 📌 **Estado**: `PCRE1` (api vieja, serie 8.x) quedó **EOL** en su 8.45; el proyecto solo mantiene **PCRE2**, que en octubre de 2026 está en la serie **10.4x** (última 10.49, sep. 2026). Los binarios modernos (`grep -P`, `ripgrep -P`) usan PCRE2.

### 🧪 Alternativa moderna
- **Para buscar en ficheros y repos**: [ripgrep](https://github.com/BurntSushi/ripgrep) (15.2.0, jul. 2026). Respeta `.gitignore`, salta binarios, es mucho más rápido que `grep -r` y evita los fallos de las regex en BRE.
- **Para probar y depurar patrones**: [regex101](https://regex101.com/) y [debuggex](https://www.debuggex.com/) permiten elegir dialecto (PCRE2, Python, JavaScript, Go/RE2) y ver el árbol de coincidencia.
- **Para compatibilidad de producción**: si tu código va en Go, asume **RE2** y no uses lookaround ni backrefs.

## 🔧 Sintaxis básica

| Patrón | Significado | Disponible en |
|---|---|---|
| `.` | Cualquier carácter (excepto salto de línea) | todos |
| `^` / `$` | Inicio / fin de línea | todos |
| `\d` | Dígito (`[0-9]`) | PCRE2, JS*, RE2, Rust |
| `\w` | Carácter de palabra | PCRE2, JS*, RE2, Rust |
| `\s` | Espacio en blanco | PCRE2, JS*, RE2, Rust |
| `\b` | Límite de palabra | PCRE2, JS*, RE2, Rust (**solo ASCII**) |
| `*` `+` `?` `{n,m}` | Repeticiones | PCRE2/ERE sin escape; BRE con escape |
| `[abc]` / `[^abc]` | Conjunto / negación | todos |
| `(a\|b)` | Alternativa | ERE/PCRE2/Rust sin escape; BRE `\(a\|b\)` |
| `(re)` | Grupo de captura | ERE/PCRE2/JS/Rust; BRE `\(re\)` |
| `(?:re)` | Grupo no capturante | PCRE2, JS, Rust, RE2 |
| `(?<nombre>re)` | Grupo con nombre | PCRE2, JS, Python, .NET |
| `\1` | Retroreferencia (backref) | PCRE2, Python y JS (**no** RE2 ni Rust) |
| `(?=re)` / `(?<=re)` | Lookahead / lookbehind | PCRE2, Python y JS (**no** RE2 ni Rust) |
| `(?i)` | Modificador embebido (case-insensitive) | PCRE2, Python, JS |

\* `\d`, `\w`, `\s`, `\b` en JS son **ASCII** por defecto; con el flag `u` y clases Unicode (p. ej. `\p{L}`) amplían a Unicode.

## ⚖️ BRE frente a ERE (y por qué se usa cada uno)

```bash
# BRE (obsoleto): las metas 'raras' van escapadas
grep 'a\(bc\)\+' fichero.txt         # 'a' seguido de 'bc' 1+ veces (escapes!)

# ERE (recomendado): '()', '+', '?', '{}' sin escape
grep -E 'a(bc)+' fichero.txt         # mismo patrón sin escapes

# PCRE2: añade lookaround, backrefs y \d
grep -P '\b\d{4}-\d{2}-\d{2}\b' fichero.txt   # fecha YYYY-MM-DD
```

> 🧪 **Alternativa moderna**: en scripts nuevos evita `grep` y `sed` con sintaxis BRE heredada. `rg` (ripgrep) usa por defecto el dialecto Perl de la crate `regex` de Rust y necesita `rg -P` solo cuando quieres lookaround o backrefs:
> ```bash
> rg '\b\d{3}-\d{4}\b' src/           # dialecto Perl, sin escapes heredados
> rg -P '(?<=:)\s*\d+' config.yml     # lookbehind requiere PCRE2
> ```

## 🔍 Avidez: greedy frente a lazy

```bash
# Greedy (por defecto): captura lo MÁXIMO posible
# En 'a1b a2b', .*  captura '1b a2'
echo 'a1b a2b' | grep -oE 'a.*b'

# Lazy (perezoso): añade '?': captura lo MÍNIMO posible
echo 'a1b a2b' | grep -oE 'a.*?b'     # → a1b
```

Los cuantificadores perezosos `*?` `+?` `??` `{n,m}?` existen en PCRE2, Python, JS y RE2, pero **no** en POSIX ERE puro (`grep -E` de varias plataformas no lo soporta).

## 🌍 Clases Unicode y `\b`

```bash
# Clases Unicode (requiere PCRE2 o el flag 'u' de JS)
grep -P '\p{L}+'   textos.txt        # cualquier letra de cualquier idioma
grep -P '\p{Greek}+' textos.txt      # solo letras griegas

# \b es ASCII en casi todo: cuenta como 'palabra' solo [A-Za-z0-9_]
grep -P '(?<!\p{L})(\p{L}+)(?!\p{L})' textos.txt   # frontera de palabra real
```

> ⚠️ **`\b` no es portable.** En RE2, Rust y JS (sin `u`) es solo *ASCII word boundary*: `\b` no detecta el límite entre `é` y una letra, ni entre caracteres CJK. En POSIX ERE `\b` directamente no existe (GNU usa `\<`/`\>`).

## 👥 Grupos con nombre y modificadores

```regex
# Python: grupo con nombre y modificador embebido
(?i) (?P<year>\d{4})-(?P<month>\d{2})   # accede con m.group('year')

# PCRE2 / ripgrep -P: sintaxis (?<nombre>...)
rg -P '(?<mes>\d{2})/(?<dia>\d{2})' log.txt

# Modificadores embebidos: (?i) ignorecase, (?m) multiline,
#   (?s) dotall (. incluye \n), (?x) whitespace/comment
(?i)hola           # case-insensitive a partir de aquí
(?i:token)         # solo en este grupo
```

## 🧊 RE2 y el motor de Rust: sin backtracking

**RE2** (el motor del paquete `regexp` de Go) y la crate **regex de Rust** eligen **no** implementar backreferences ni look-around: la única forma de garantizar que un patrón arbitrario no explote en tiempo exponencial ("catastrophic backtracking") es no usar backtracking. Consecuencias:

```go
// Go: patrón con backref o lookaround NO compila (error de Parse)
re, err := regexp.Compile(`(a|b)*c`)     // OK: sin \1 ni (?=...)
// Un patrón tipo `(a|ab)\1` devuelve un error en tiempo de ejecución.
```

- **No disponible en RE2/Rust**: `(?=re)`, `(?!re)`, `(?<=re)`, `(?<!re)`, `\1`…`\9`, `(?>re)` (atómico), condicionales `(?(cond)…)`, recursion `(?R)`.
- **Qué se gana**: tiempo lineal; un ataque ReDoS no puede bloquear el servicio.
- **Qué herramientas usan RE2 en la práctica**: el paquete `regexp` de Go (y por tanto Terraform o Grafana cuando validan con Go). ripgrep en ausencia de `-P` aplica la crate Rust, con **la misma filosofía**; `rg -P` activa PCRE2 y recupera lookaround/backrefs.

## 🧨 Errores comunes y cómo evitarlos

| Error | Síntoma | Arreglo |
|---|---|---|
| Escapes de BRE que ya no son necesarios | `grep '\+45'` no encuentra nada (trata `\+` literal) | usa `grep -E '45\+'` |
| `\d` en POSIX ERE | en `grep -E` y `awk` no coincide dígitos | `[0-9]` o `grep -P '\d'` |
| Cuantificador greedy alcanza de más | `<a href=...>` captura más de lo esperado | `.*?` lazy o restringe clase `[^"]*` |
| `*` cuenta como "0 o más" | `ab*` no exige la b (es opcional) | `ab?` si quieres 1 ocurrencia |
| No escapar `.` | `a.b` también casea con `axb` | `a\.b` |
| Lookaround en RE2/Rust | error de parseo en Go | reescribe sin lookaround |
| Backtracking exponencial | un 1KB de entrada tarda minutos (ReDoS) | clase excluyente + `^...$`, no `(.*)*` |
| `$` sin opción multiline | no coincide al final de cada línea | `(?m)$` o procesa línea a línea |
| Olvidar comillar el patrón en shell | `$` y `\` que el shell interpreta | comillas simples `'...'` en torno al patrón |

## ❓ FAQ

**❓ ¿Cuál es la diferencia entre BRE y ERE?**
➡ En **BRE** los metas `() + ? {}` van escapados; en **ERE** no. GNU `grep` usa BRE por defecto y ERE con `-E`. Para algo nuevo usa `-E` o `rg`.

**❓ ¿Puedo usar `(?i)` en todos los motores?**
➡ No. Es válido en PCRE2, Python y JavaScript, pero **no** en ERE/POSIX (`grep -E` no lo entiende: ahí usa `grep -i`).

**❓ ¿`\w` y `\b` distinguen tildes y eñes?**
➡ Por defecto no (ASCII). En PCRE2 usa `\p{L}`; en JS usa flag `u`; en RE2/Rust `\b` sigue siendo ASCII.

**❓ ¿Por qué mi patrón de PCRE2 falla en ripgrep normal?**
➡ Porque ripgrep por defecto usa el motor de Rust (sin lookaround/backrefs). Añade `-P` para activar PCRE2.

## 🔗 Enlaces
- [PCRE (Sitio oficial + docs)](https://www.pcre.org/) · [pcre2 en GitHub](https://github.com/PCRE2Project/pcre2)
- [Syntax de RE2 (Google)](https://github.com/google/re2/wiki/syntax)
- [ripgrep (BurntSushi)](https://github.com/BurntSushi/ripgrep)
- [regex101: tester interactivo multilenguaje](https://regex101.com/)
- [debuggex: diagrama de regex](https://www.debuggex.com/)
- [Regexr](https://regexr.com/)

## 🧩 Ver también
- [sed y awk](./manual_sed_awk.md): dónde heredan regex en el día a día
- [curl y HTTP](./manual_curl_http.md): filtrar respuestas JSON con `grep`/`jq`
- [ffmpeg](./manual_ffmpeg.md): filtrar streams y nombres de salida con regex
- [Comandos Linux](./cheatsheet_comandos_linux.md): `grep` entre comandos frecuentes

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
