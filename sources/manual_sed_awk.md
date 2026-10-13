# sed y awk – Edición de flujos y procesamiento de texto

Herramientas clásicas de Unix para procesar texto desde la terminal. sed edita flujos línea a línea con expresiones regulares; awk procesa datos estructurados por columnas. Siguen siendo el estándar en entornos mínimos y en pipelines rápidos.

> 🎯 **Nivel**: intermedio · **Requisitos**: GNU sed y gawk 5.4.1 (jul 2026) · **Revisado**: octubre 2026

## 🔪 sed: stream editor

## 🔧 Uso básico

```bash
sed 's/foo/bar/' fich.txt            # reemplazar primera ocurrencia por línea
sed 's/foo/bar/g' fich.txt           # reemplazar todas (global)
sed 's/foo/bar/i' fich.txt           # ignorar mayúsculas
sed '2s/foo/bar/' fich.txt           # sustituir solo en la línea 2
```

## 📍 Direccionamiento

```bash
sed -n '5p' fich.txt                 # imprimir solo la línea 5
sed -n '10,20p' fich.txt             # líneas 10 a 20
sed -n '/error/p' app.log            # líneas que contienen "error"
sed '/debug/d' fich.txt              # eliminar líneas con "debug"
sed '1,5d' fich.txt                  # eliminar líneas 1 a 5
```

## ✏️ Edición en el sitio: portabilidad GNU vs BSD/macOS

```bash
# GNU sed (Linux)
sed -i 's/foo/bar/g' fich.txt            # modifica el archivo directamente
sed -i.bak 's/foo/bar/g' fich.txt        # además deja una copia .bak

# BSD sed (macOS): -i SIEMPRE exige un sufijo inmediato (puede ser vacío)
sed -i '' 's/foo/bar/g' fich.txt

# Portátil (ambos): crear un temporal y renombrar
sed 's/foo/bar/g' fich.txt > fich.tmp && mv fich.tmp fich.txt
```

El cambio de sintaxis `-i` entre GNU y BSD es la diferencia más traicionera al mover scripts entre Linux y macOS.

## 🔗 Capturar grupos con `-E`

```bash
# -E habilita expresiones regulares extendidas (en GNU y BSD)
echo "Juan <juan@ej.com>" | sed -E 's/(.*) <(.*)>/\2, \1/'
# → juan@ej.com, Juan

sed -E 's/^([a-z]+):/\1 →/' /etc/passwd    # referencias a grupo con \1
```

## 🧹 Ejemplos prácticos

```bash
sed '/^$/d' fich.txt                # eliminar líneas vacías
sed '/^#/d' archivo.conf            # eliminar comentarios
sed 's/[[:space:]]*$//' fich.txt    # quitar espacios al final de línea
sed 's/<[^>]*>//g' pagina.html      # limpiar etiquetas HTML
```

## 🔢 awk: Procesamiento por columnas y patrones

## 📖 Uso básico y separadores (FS/OFS/RS)

```bash
awk '{print $1}' fich.txt           # primera columna (siempre $1)
awk '{print $NF}' fich.txt          # última columna
awk -F ',' '{print $1, $3}' datos.csv           # -F cambia el separador de entrada (FS)
awk -F ':' '{print $1}' /etc/passwd
awk 'BEGIN {FS="|"; OFS="<-" } {print $1, $2}' datos.psv   # FS entrada, OFS salida
awk 'BEGIN {RS=""; FS="\n"} {print $1}' parrafos.txt       # RS divide por párrafos
```

Regla mental: `FS` separa la entrada en campos (`$1`, `$2`…), `OFS` une la salida, `RS` separa registros. `printf` de awk controla el formato exacto.

## 🔍 Filtrado con patrones y bloques BEGIN/END

```bash
awk '/error/' app.log                   # líneas que contienen "error"
awk '$3 > 100' datos.txt                # tercera columna mayor que 100
awk '$1 == "ERROR" {print $2, $NF}' log.txt
awk 'NR > 1 {print}' fich.csv           # saltar la cabecera
awk 'BEGIN {print "inicio"} {total += $3} END {print total}' datos.txt   # acumular y total
```

`BEGIN` corre antes de la primera línea; `END` después de la última. Sirve para cabeceras, sumas y resumen final de informes.

## 🧮 Operaciones, arrays y features de gawk 5.x

```bash
awk '{sum += $3} END {print sum}' datos.txt          # suma
awk '{sum += $3; n++} END {print sum/n}' datos.txt   # promedio
awk 'NR > 1 {printf "%s: %.2f\n", $1, $2*1.21}' ventas.csv   # aplicar IVA con formato

# Agrupar con arrays asociativos
awk '{c[$1]++} END {for (k in c) print k, c[k]}' log.txt

# gawk añade gensub() (sustitución global conservando el resto) y arrays
# multidimensionales REALES (en mawk/busybox son arrays planos a menudo simulados)
awk '{print gensub(/([0-9]+)/, "[\\1]", "g")}' fich.txt
awk 'BEGIN {a[1,2]="x"; print a[1,2]}'            # a[1,2] funciona como índice real en gawk
```

El awk POSIX clásico y los compatibles (mawk, busybox awk) tienen limitaciones: sin `gensub()`, sin arrays 2D reales y con menos funciones de cadena. **gawk 5.4** (GNU) es el recomendado para scripts serios.

## ⚠️ sed/awk minificados

> 📌 **Estado (oct. 2026)**: **mawk** y el **awk de busybox** son compatibles con el POSIX básico pero **sin `gensub()`, arrays reales ni buena cobertura de Unicode**. Para scripts complejos usa **gawk** (`gawk` en Debian/Ubuntu enlaza por defecto; verifica con `awk --version`).

## 🧪 Alternativas modernas: ¿"sed/awk" o herramienta dedicada?

| En su lugar | Ventaja | Manual |
|---|---|---|
| [sd](https://github.com/chmln/sd) | Reemplazo intuitivo de sed en búsqueda/reemplazo; sintaxis regex de Python/JS y modo literal (v1.0, 2023) | |
| [choose](https://github.com/theryangeary/choose) | Recorte de columnas rápido y legible, índice negativo estilo Python (v1.3.7) | |
| perl one-liners | Regex potente y sin las trampas de `-i` de sed; `perl -pi -e 's/old/new/g' fich` | |
| [Miller (mlr)](https://miller.readthedocs.io) | Procesa **CSV/JSON/TSV con cabeceras** de forma robusta (v6.21.0). El mejor ajuste para datos estructurados | |

| Tarea | Herramienta recomendada |
|---|---|
| Sustitución simple en fichero único | sed (`-i`) o sd |
| Recortar columnas de un `ps`/log plano | awk o choose |
| CSV/JSON/TSV real con cabeceras, join, agrupar | Miller (`mlr`) |
| Transformación de datos compleja o informes | awk (gawk) o un lenguaje (Python) |
| Regex compleja con capturas y lookaheads | perl one-liner |

La regla general: en un entorno mínimos, sed/awk siempre funcionan; en tu equipo de desarrollo, herramientas modernas reducen errores.

## ❓ FAQ

**❓ sed o awk para cada caso?**
➡ sed: sustituciones y edición por líneas. awk: columnas, operaciones numéricas, agrupación e informes estructurados.

**❓ `$0`, `$1`, `NF`, `NR`?**
➡ `$0` = la línea completa, `$1` = primer campo, `NF` = número de campos, `NR` = número de registro/línea procesado.

**❓ Mi `sed -i` falla en macOS?**
➡ En BSD sed `-i` exige sufijo: `sed -i '' 's/a/b/g' fich`. Para multi-plataforma genera un temporal y renombra.

**❓ Cuándo pasarme de awk a Miller?**
➡ Cuando los datos tengan cabeceras (CSV/JSON) y necesites join, agrupar por clave o conversión de formato; awk sufre con comillas y escapes de CSV.

## 🔗 Enlaces
- [GNU sed manual](https://www.gnu.org/software/sed/manual/sed.html)
- [GNU awk (gawk) manual](https://www.gnu.org/software/gawk/manual/gawk.html)
- [sed one-liners](https://sed.sourceforge.io/sed1line.txt)
- [Miller (mlr)](https://miller.readthedocs.io)
- [sd: sed alternativo](https://github.com/chmln/sd)

## 🧩 Ver también
- [Bash Scripting](./manual_bash_scripting.md)
- [Expresiones regulares](./manual_regex.md)
- [Productividad en Shell](./manual_shell_productivity.md)
- [Vim y Nano](./manual_vim_nano.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
