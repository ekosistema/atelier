# jq – Procesar JSON desde terminal

Procesador de JSON desde terminal. Permite filtrar, transformar y formatear datos JSON con sintaxis de tuberías similar a Unix; esencial para trabajar con APIs REST (`curl api… | jq '…'`).

> 🎯 **Nivel**: básico · **Requisitos**: terminal, JSON básico · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Instalación](#-instalación)
- [Leer y formatear JSON](#-leer-y-formatear-json)
- [Filtrar campos](#-filtrar-campos)
- [Arrays](#-arrays)
- [Transformaciones](#️-transformaciones)
- [Variables y argumentos (scripting)](#-variables-y-argumentos-scripting)
- [Formatos de salida: -r, @csv, @tsv, @base64](#-formatos-de-salida--r-csv-tsv-base64)
- [slurp y --stream para ficheros enormes](#---slurp-y---stream-para-ficheros-enormes)
- [Actualizar valores en el documento (`|=`)](#️-actualizar-valores-en-el-documento-)
- [Manejo de errores: try/catch y `//`](#-manejo-de-errores-trycatch-y-)
- [Ejemplos prácticos con APIs](#-ejemplos-prácticos-con-apis)
- [Errores típicos de jq](#-errores-típicos-de-jq)
- [Alternativas y herramientas complementarias](#-alternativas-y-herramientas-complementarias)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 Instalación

```bash
# macOS
brew install jq

# Debian/Ubuntu
sudo apt install jq

# Verificar (oct. 2026: la serie estable es 1.8.2, jun. 2026)
jq --version
```

## 📖 Leer y formatear JSON

```bash
jq . data.json                          # formatear con colores (pretty print)
curl -s https://api.github.com/repos/jqlang/jq | jq .   # API → JSON bonito
jq -c . data.json                       # compacto: un solo JSON en una línea
```

## 🔍 Filtrar campos

```bash
jq '.name' data.json                    # valor de una clave
jq '.name, .version' data.json          # múltiples campos en filas separadas
jq '{nombre: .name, ver: .version}' data.json   # reestructurar objeto
jq '.user.email' data.json              # acceso anidado
jq '.user?.email // "anonimo"' data.json  # ? anula si falta .user; // valor por defecto
```

## 📦 Arrays

```bash
jq '.[]' data.json                      # cada elemento del array
jq '.[0]' data.json                     # primer elemento
jq '.[] | .name' data.json              # campo de cada elemento
jq '.[:3]' data.json                    # primeros 3 (slicing)
jq '.[] | select(.age > 30)' data.json  # filtrar elementos
```

## 🛠️ Transformaciones

```bash
jq 'map({nombre: .name, edad: .age})'                     # mapear todos
jq 'group_by(.city) | map({city: .[0].city, count: length})'  # agrupar y contar
jq 'sort_by(.age) | reverse'                              # ordenar y voltear
jq 'unique'                                               # valores únicos
jq 'length'                                               # nº de elementos de array/objeto
jq 'to_entries'                                           # objeto → [{key,value}]
jq 'from_entries'                                         # y vuelta
```

### reduce: acumular valores

```bash
# Sumar el precio de todos los productos
jq 'reduce .items[].price as $p (0; . + $p)' data.json

# Construir un objeto a partir de una lista
jq 'reduce .[] as $i ({}; .[$i.nombre] = $i.valor)' data.json
```

## 💾 Variables y argumentos (scripting)

```bash
# Pasar valores desde el shell SIN interpolarlos dentro del filtro
jq --arg nombre "Ana" 'select(.user == $nombre)' users.json
jq --argjson max 10 '.[] | select(.price <= $max)' products.json

# Comilla bien: todo el filtro entre comillas simples '...' para que
# el shell no expanda $max ni los caracteres del filtro
```

## 📤 Formatos de salida: -r, @csv, @tsv, @base64

```bash
jq -r '.name' data.json                # raw: sin comillas (texto plano)
jq -r '.[] | "\(.name): \(.email)"' users.json   # interpolación con \( )

# Tabular CSV/TSV respetando comas y saltos dentro de los valores
jq -r '.[] | [.name, .email] | @csv' users.json > usuarios.csv
jq -r '.[] | [.id, .nombre] | @tsv'   data.json

# Y a la inversa: decodificar base64 (viene de @base64 al codificar)
jq -r '.[].blob | @base64d' data.json
```

## 📉 --slurp y --stream para ficheros enormes

```bash
# --slurp / -s: agrupar todo el input en un array (útil para NDJSON en una fila)
cat logs.ndjson | jq -s 'map(.level)' 

# --stream: procesa un JSON gigantesco en trozos sin cargarlo entero en RAM
jq --stream 'select(.[0][0] == "usuarios") | .[1]' datos_grandes.json
```

## ✍️ Actualizar valores en el documento (`|=`)

```bash
# Subir un 10% el precio de todos los productos
jq '.items[] |= (.price = (.price * 1.10 | round))' data.json

# Añadir o sobrescribir un campo
jq '.total |= (.items | map(.price) | add)' data.json

# Eliminar un campo del documento
jq 'del(.secreto)' data.json

# Combinado: actualizar la lista y borrar un campo interno
jq '.items[] |= (del(.password))' data.json
```

## 🧱 Manejo de errores: try/catch y `//`

```bash
jq 'try .a.b[0] catch "no-encontrado"' data.json   # error → cadena
jq '.precio // 0' data.json                        # null/ausente → 0
jq 'paths' data.json                               # lista de todas las rutas del árbol
jq '. | keys' data.json                            # claves del objeto raíz
```

## 🔎 Ejemplos prácticos con APIs

```bash
# Extraer URLs de releases de GitHub (licencia MIT del repo de ejemplo)
curl -s https://api.github.com/repos/jqlang/jq/releases/latest | \
  jq -r '.assets[] | "\(.name)\t\(.size)\t\(.browser_download_url)"'

# Contar estrellas de un repo
curl -s https://api.github.com/repos/jqlang/jq | jq '.stargazers_count'

# Issues abiertos: título + usuario
curl -s "https://api.github.com/repos/jqlang/jq/issues?state=open" | \
  jq '.[] | {title, user: .user.login}'
```

## 🚩 Errores típicos de jq

```bash
# 1) Filtro SIN comillas: el shell expande $ y rompe el patrón
jq .items[0].price data.json           # ❌ el shell interpreta [ ] y manejamos mal
jq '.items[0].price' data.json         # ✅ filtro entre comillas simples

# 2) Entrada que no es UTF-8: jq falla con 'null' o rompe caracteres
iconv -f ISO-8859-1 -t UTF-8 fichero.txt | jq '...'   # convertir ANTES

# 3) Confundir .[] (desempaquetar) con . (dejar el array)
```

## 🔁 Alternativas y herramientas complementarias

| En su lugar | Ventaja | Manual |
|---|---|---|
| [gojq](https://github.com/itchyny/gojq) | Implementación en Go, más rápido y estricto con algunos constructos | manual_jq.md |
| [jaq](https://github.com/01mf02/jaq) | Escrito en Rust, gana varios benchmarks frente a jq 1.8 | |
| [yq](https://github.com/mikefarah/yq) | Misma sintaxis que jq para YAML, XML, TOML | manual_jq.md |
| [dasel](https://github.com/TomWright/dasel) | Un solo selector para JSON, YAML, TOML, XML, CSV, HCL, INI | |
| [fx](https://fx.wtf/) | Visor/explorador TUI interactivo de JSON | |
| [jless](https://jless.io/) | Visor JSON tipo `less` (macOS y Linux) | |

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: el dominio histórico `jqlang.github.io/jq` se usa solo para el manual antiguo; el proyecto oficial vive ahora en **jqlang.org** (home). jq **1.7.x** queda como soporte previo: la serie actual es **1.8.x**.

## ❓ FAQ

**❓ ¿Cómo hago que la salida sea válida para otro comando (texto vs JSON)?**
➡ `-r` (raw) da texto plano sin comillas. `-c` (compact) da un solo JSON en una línea, listo para pipelines.

**❓ ¿Cómo leo de un fichero sin `cat`?**
➡ `jq '.' archivo.json`: directamente, sin cat.

**❓ Error "jq: error: syntax error"?**
➡ Revisa las comillas: el filtro va entre comillas simples `'...'`, y dentro usa `"` para strings; así el shell no interpreta `$`, `\` ni los corchetes.

**❓ ¿Por qué jq me devuelve `null` para un campo que sí existe?**
➡ Suele ser acceso con clave incorrecta o entrada no-UTF-8. Prueba `jq '. | keys'` para ver las claves reales antes de acceder.

## 🔗 Enlaces
- [jq Manual oficial (1.8)](https://jqlang.org/manual/)
- [Descargas de jq (jqlang.org)](https://jqlang.org/download/)
- [jq play (sandbox online)](https://jqplay.org/)
- [gojq (itchyny)](https://github.com/itchyny/gojq) · [jaq (01mf02)](https://github.com/01mf02/jaq)
- [yq (mikefarah)](https://github.com/mikefarah/yq) · [dasel](https://github.com/TomWright/dasel)
- [fx](https://fx.wtf/) · [jless](https://jless.io/)

## 🧩 Ver también
- [curl y HTTP](./manual_curl_http.md): obtener el JSON que luego filtra jq
- [Expresiones regulares](./manual_regex.md): para filtrar texto plano con `grep`/`rg`
- [PostgreSQL](./manual_postgresql.md): procesar JSON de la base con jq
- [Comandos Linux](./cheatsheet_comandos_linux.md): pipelines con jq

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
