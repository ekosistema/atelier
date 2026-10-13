# ImageMagick – Procesamiento de imágenes desde CLI

Suite de procesamiento de imágenes desde terminal: redimensionar, convertir formatos, aplicar filtros, componer y procesar lotes enteros de forma programática. La v7 unifica todo bajo el mando `magick`.

> 🎯 **Nivel**: básico · **Requisitos**: terminal, una imagen de prueba · **Revisado**: octubre 2026

## 🔧 Instalación y versión

```bash
# macOS
brew install imagemagick

# Debian/Ubuntu
sudo apt install imagemagick

# Verificar (oct. 2026: serie estable 7.1.2.x; p. ej. 7.1.2-33)
magick -version
magick identify -list format | grep -E 'WEBP|AVIF|JXL|HEIC'   # qué formatos hay
```

> 📌 **Estado.** En la v7 el mando principal es **`magick`**. `convert`, `mogrify` e `identify` (de la v6) **siguen existiendo pero están en retirada**: emiten avisos y quedan solo por compatibilidad. En adelante usa `magick` / `magick identify` / `magick mogrify`.

## 📐 Redimensionar (geometría)

```bash
magick foto.jpg -resize 800x600 salida.jpg     # ajustar a 800x600 (mantiene aspecto)
magick foto.jpg -resize 800x600^ salida.jpg    # forzar relleno (puede recortar)
magick foto.jpg -resize 800x600> salida.jpg    # solo si es más grande
magick foto.jpg -resize 800x600< salida.jpg    # solo si es más pequeña
magick foto.jpg -resize 50% salida.jpg         # porcentaje
magick foto.jpg -adaptive-resize 800x600 salida.jpg   # muestreo adaptativo (nitidez)

# miniatura recortada al centro (thumbnail): muy común para avatares
magick foto.jpg -thumbnail 200x200^ -gravity center -extent 200x200 avatar.jpg
```

## 🔄 Convertir formatos

```bash
magick foto.png foto.jpg                  # PNG → JPG
magick foto.svg -resize 1200x foto.png    # SVG → PNG (rasteriza)
magick foto.heic foto.jpg                 # HEIC → JPG (requiere libheif)
magick foto.pdf -density 150 foto.jpg     # PDF → JPG (vía Ghostscript)

# Formatos modernos (soportados si se compilaron sus delegates)
magick foto.jpg -strip -quality 80 foto.webp      # WebP
magick foto.jpg -strip -quality 70 foto.avif      # AVIF (requiere libheif)
magick foto.jpg -strip -quality 80 foto.jxl       # JPEG XL (requiere libjxl)
```

> 🧪 **Alternativa moderna**: los formatos **AVIF** y **JPEG XL (JXL)** comprimen mucho mejor que JPEG/WebP en 2026. ImageMagick los lee/escribe **solo si** su build incluye `libheif` (AVIF) y `libjxl` (JXL); verifícalo con `magick -list format | grep JXL`. HTTP/2 y navegadores modernos aceptan ambos con fallback `<picture>`.

## 🎨 Calidad, metadatos y colores

```bash
magick foto.jpg -strip -quality 85 salida.jpg    # -strip elimina EXIF/ICC
magick foto.jpg -colorspace Gray gris.jpg        # escala de grises
magick foto.jpg -colorspace RGB -resize 50% -colorspace sRGB salida.jpg   # trabajar en linear
magick -define jpeg:extent=200kb logo.jpg logo_web.jpg   # ajustar hasta 200 KB
magick logo.png -define png:compression-level=9 logo.webp  # max compresión
```

## ✂️ Recortar y efectos

```bash
magick foto.jpg -crop 400x300+100+50 salida.jpg   # 400x300 desde x=100,y=50
magick foto.jpg -rotate 90 salida.jpg             # rotar 90°
magick foto.jpg -flip salida.jpg                  # voltear vertical
magick foto.jpg -flop salida.jpg                  # voltear horizontal
magick foto.jpg -blur 0x8 borroso.jpg             # desenfoque (radio x sigma)
magick foto.jpg -sharpen 0x5 nitido.jpg           # nitidez
magick foto.jpg -colorspace Gray -contrast-stretch 1%x1% auto.jpg
```

## 🏷️ Texto y marcas de agua

```bash
magick foto.jpg -font Arial -pointsize 36 \
  -fill white -gravity south -annotate +0+10 "© 2025" salida.jpg

# Marca de agua con transparencia (dissolve 50%)
magick foto.jpg logo.png -gravity center \
  -compose dissolve -define compose:args=50 -composite salida.jpg
```

## 🔁 Lotes con mogrify

```bash
# Mogrify MODIFICA en el acto (¡cuidado!). Guarda copias en un subdirectorio
mkdir -p reducidas
magick mogrify -path reducidas -resize 800x -quality 85 *.jpg

# Convertir todas las PNG a JPG en otra carpeta
magick mogrify -path ./jpg -format jpg *.png
```

> ⚠️ **Mogrify modifica el fichero original** si no usas `-path`. Prueba siempre en una copia.

## 📊 Comparar y montar

```bash
# compare: métricas pixel a pixel entre dos imágenes
magick compare -metric AE original.jpg nueva.jpg diff.png

# montage: composición en cuadrícula (correcto, no arrastra)
magick montage f1.jpg f2.jpg f3.jpg -tile 3x1 -geometry +2+2 mosaico.jpg

# Tabla de contacto de un PDF
magick montage doc-*.png -tile 2x -geometry +4+4 hoja.pdf
```

## 🛡️ Seguridad (ImageTragick y policy.xml)

> 📌 **Estado**: ImageMagick es **"todo permitido salvo que se niegue"**: procesa formatos que delegan en programas externos (PDF→Ghostscript, URL/HTTPS→wget…). El bug **ImageTragick (CVE-2016-3714)** permitía ejecución de código remoto por inyección en esos delegates. En servidores/web públicas **configura `policy.xml`** para restringir coders y recursos:

```xml
<policymap>
  <!-- solo imágenes web-safe, y niega los coders peligrosos -->
  <policy domain="coder" rights="none" pattern="MVG" />
  <policy domain="coder" rights="none" pattern="MSL" />
  <policy domain="coder" rights="none" pattern="URL" />
  <policy domain="coder" rights="none" pattern="HTTPS" />
  <policy domain="resource" name="memory" value="256MiB" />
  <policy domain="resource" name="disk" value="1GiB" />
</policymap>
```

```bash
# Verificar qué policies están activas (Windows/macOS/Linux difieren en la ruta)
magick identify -list policy | grep -A2 'pattern: PDF'
```

> 🧪 **Alternativa moderna**: para builds, servidores y grandes volúmenes, [libvips](https://libvips.org/) es mucho más rápido y usa ~20x menos RAM al procesar imágenes por "chunks" en vez de cargarlas enteras. [sharp](https://github.com/lovell/sharp) expone libvips desde Node.js.

## 📋 Qué usar para qué

| Necesidad | Herramienta |
|---|---|
| Redimensionar/convertir rápido y con poca RAM | [vips](https://libvips.org/) (`vips resize`, `vips webpsave`) |
| Optimizar WebP | `cwebp` (de [libwebp](https://developers.google.com/speed/webp)) |
| Optimizar AVIF | `avifenc` (de [libavif](https://github.com/AOMediaCodec/libavif)) |
| Optimizar PNG | [oxipng](https://github.com/shssoichiro/oxipng) |
| **macOS nativo** (sin instalar nada) | `sips -z 800 600 foto.jpg` |
| CLI completa tipo ImageMagick (fork) | [GraphicsMagick](https://www.graphicsmagick.org/) (`gm convert`) |
| Nodo de producción (Streaming API) | [sharp](https://github.com/lovell/sharp) (Node) |

## ❓ FAQ

**❓ Diferencia entre `magick`, `convert` y `mogrify`?**
➡ `magick` es el mando unificado de la v7. `convert` (v6) y `mogrify` producen avisos y están en retirada. `mogrify` modifica el original; usa `-path` para escribir copias sin tocar el original.

**❓ ¿Cómo mantengo la calidad al reducir tamaño?**
➡ Añade `-quality 90-95` y, si vas a publicar, `-strip` para quitar metadatos. WebP/AVIF dan mejor calidad a igual tamaño que JPG.

**❓ ¿Por qué me da "Security policy … not allowed"?**
➡ Tu `policy.xml` niega el coder/formato (p. ej. PDF o HTTPS). Amplía el patrón en la policy o reelimina la línea que lo bloquea; nunca deshabilites por completo la policy en producción.

**❓ ¿ImageMagick v6 o v7?**
➡ Usa **v7** (`magick`). v6 solo se mantiene con parches de seguridad y sus comandos clásicos (`convert`, `identify`, `mogrify`) están desaconsejados.

## 🔗 Enlaces
- [ImageMagick: Herramientas CLI](https://imagemagick.org/script/command-line-tools.php)
- [Security Policy oficial (policy.xml)](https://imagemagick.org/script/security-policy.php)
- [ImageMagick Usage examples](https://imagemagick.org/Usage/)
- [libvips](https://libvips.org/) · [sharp (Node)](https://github.com/lovell/sharp)
- [oxipng](https://github.com/shssoichiro/oxipng) · [libwebp/cwebp](https://developers.google.com/speed/webp) · [GraphicsMagick](https://www.graphicsmagick.org/)

## 🧩 Ver también
- [ffmpeg](./manual_ffmpeg.md): extraer frames de video o GIF, generación de imágenes
- [Expresiones regulares](./manual_regex.md): filtrar listados de imágenes en scripts
- [Comandos Linux](./cheatsheet_comandos_linux.md): bucles `for` para lotes con sips/magick

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
