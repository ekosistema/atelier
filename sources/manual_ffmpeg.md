# ffmpeg – Procesamiento de audio y video desde CLI

Herramienta multimedia desde CLI para convertir formatos, cortar, unir, escalar, extraer audio, aplicar filtros y transmitir en streaming. Aporta además `ffprobe` para inspeccionar medios.

> 🎯 **Nivel**: básico · **Requisitos**: terminal, un fichero de video de prueba · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Instalación y versión](#-instalación-y-versión)
- [Conversión y códecs de video](#-conversión-y-códecs-de-video)
- [Audio y remux sin recodificar](#-audio-y-remux-sin-recodificar)
- [Cortar de forma precisa (-ss)](#️-cortar-de-forma-precisa--ss)
- [Escalar y filtros de video](#-escalar-y-filtros-de-video)
- [Extraer audio/frames y hacer GIF](#️-extraer-audioframes-y-hacer-gif)
- [Concatenar: demuxer vs filter](#-concatenar-demuxer-vs-filter)
- [Streaming HLS/DASH](#-streaming-hlsdash)
- [Selección de streams con -map](#-selección-de-streams-con--map)
- [Aceleración por hardware (macOS)](#-aceleración-por-hardware-macos)
- [Publicar para web: faststart](#-publicar-para-web-faststart)
- [Inspección con ffprobe](#-inspección-con-ffprobe)
- [Alternativas](#-alternativas)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 Instalación y versión

```bash
# macOS
brew install ffmpeg

# Debian/Ubuntu
sudo apt install ffmpeg

# Verificar (oct. 2026: últimos estables 8.x/9.x; el 9.0 ("Lei") es la serie nueva)
ffmpeg -version
ffmpeg -encoders | grep -E 'libx264|libx265|libsvtav1|aac|opus'
```

## 🔄 Conversión y códecs de video

```bash
ffmpeg -i video.mkv video.mp4                 # cambiar contenedor (recodifica)
ffmpeg -i video.webm -c:v libx264 video.mp4   # WebM/VP9 o AV1 → H.264

# H.264 (universal): CRF bajo = mejor calidad
ffmpeg -i video.mkv -c:v libx264 -crf 23 -preset medium video.mp4

# H.265/HEVC (mejor compresión, menos compatible)
ffmpeg -i video.mkv -c:v libx265 -crf 28 video.mp4

# AV1 con SVT-AV1 (la mejor ratio calidad/tamaño en 2026)
ffmpeg -i video.mkv -c:v libsvtav1 -crf 30 -preset 6 video.mkv
```

| Códec | Uso habitual | Nota (oct. 2026) |
|---|---|---|
| `libx264` | H.264, máxima compatibilidad | sigue siendo el estándar web |
| `libx265` | H.265/HEVC, ~50% menos tamaño | menos compatible que H.264 |
| `libsvtav1` | AV1, mejor compresión | moderno; empareja con `Opus` |

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: para entregas web evita códecs antiguos:
> - `-c:v libxvid` (MPEG-4 Part 2/Xvid) y `-c:v mpeg2video` ofrecen mucha peor calidad/tamaño que H.264/AV1.
> - `libvpx-vp8` quedó superado por `libvpx-vp9` y sobre todo por AV1.
> - `-c:a libfaac` **ya no existe** en ffmpeg (se eliminó del proyecto); usa el codificador AAC nativo `-c:a aac`.
>
> | En su lugar | Ventaja |
> |---|---|
> | `-c:v libx264` / `libsvtav1` | misma o mejor calidad con mucho menos bitrate |
> | `-c:a aac` | AAC nativo incluido, sin dependencias externas |

## 🔊 Audio y remux sin recodificar

```bash
# Extraer solo audio (recodifica a AAC)
ffmpeg -i video.mp4 -vn -c:a aac -b:a 192k audio.m4a

# Remux: copia los streams SIN RECODIFICAR (rápido, sin pérdida)
ffmpeg -i video.mkv -c copy video.mp4

# Reemplazar la pista de audio con otra, copiando el video tal cual
ffmpeg -i video.mp4 -i audio.musica.m4a -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac salida.mp4

# Audio Opus (streaming) y normalización
ffmpeg -i audio.flac -c:a libopus -b:a 128k audio.opus
ffmpeg -i audio.m4a -af loudnorm=I=-16:LRA=11:TP=-1.5 normalizado.m4a
```

## ✂️ Cortar de forma precisa (-ss)

```bash
# Rápido: busca el keyframe más cercano, puede vender 1-2 frames imprecisos
ffmpeg -ss 00:01:30 -t 60 -i video.mp4 -c copy clip.mp4

# Preciso: -ss DESPUÉS de -i, fuerza recodificar (more exacto)
ffmpeg -i video.mp4 -ss 00:01:30 -t 60 -c:v libx264 -crf 23 clip.mp4

# Cortar hasta el final
ffmpeg -i video.mp4 -ss 00:05:00 -c copy final.mp4
```

> 📌 **Estado**: con `-c copy` el corte es *frame-accurate* solo en keyframes. Para cortes exactos recodifica o usa un segmentador por capítulos.

## 📐 Escalar y filtros de video

```bash
ffmpeg -i video.mp4 -vf scale=1280:720 salida.mp4     # tamaño exacto
ffmpeg -i video.mp4 -vf scale=-2:720 salida.mp4       # alto fijo, ancho par (-2)
ffmpeg -i video.mp4 -vf "fps=24,crop=800:600:100:50"  # fps + recorte en cadena
ffmpeg -i bg.mp4 -i logo.png -filter_complex "overlay=10:10" salida.mp4  # overlay
ffmpeg -i video.mp4 -vf "subtitles=sub.srt" salida.mp4  # quemar subtítulos

# Recortar a mitad manteniendo proporción y paridad para codecs YUV
ffmpeg -i video.mp4 -vf "scale=iw/2:-2,crop=trunc(iw/2)*2:trunc(ih/2)*2" salida.mp4
```

## 🖼️ Extraer audio/frames y hacer GIF

```bash
# Un frame por segundo → PNG numerados
ffmpeg -i video.mp4 -vf fps=1 frames/frame_%04d.png

# Frame concreto en el segundo 10
ffmpeg -ss 00:00:10 -i video.mp4 -vframes 1 captura.png

# GIF de 10 fps, ancho 640
ffmpeg -i video.mp4 -vf "fps=10,scale=640:-1" salida.gif
```

## 🔀 Concatenar: demuxer vs filter

```bash
# Concat demuxer: solo si TODOS los fragmentos tienen MISMOS códecs y params
# lista.txt:
#   file 'part1.mp4'
#   file 'part2.mp4'
ffmpeg -f concat -safe 0 -i lista.txt -c copy unido.mp4

# Concat filter: recodifica, sirve aunque difieran resolución/fps
ffmpeg -i part1.mp4 -i part2.mp4 -filter_complex \
  "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" unido.mp4
```

## 📡 Streaming HLS/DASH

```bash
# HLS: segmentos .ts + playlist .m3u8, listo para servir por HTTP
ffmpeg -i video.mkv -c:v libx264 -crf 23 -c:a aac -f hls \
  -hls_time 6 -hls_list_size 0 "out/stream.m3u8"

# DASH: MPEG-DASH con segmentos fragmentados
ffmpeg -i video.mkv -c:v libx264 -c:a aac -f dash out/manifest.mpd
```

## 🧲 Selección de streams con -map

```bash
# -map elige QUÉ streams salen (sin -map, ffmpeg elige "los mejores")
ffmpeg -i video.mkv -map 0:v:0 -map 0:a:1 salida.mp4   # video #0 + audio #1
ffmpeg -i video.mp4 -map 0:v -map 0:a -map 0:s salida.mkv   # incluir subtítulos

# -vn / -an / -sn descartan video / audio / subtítulos
ffmpeg -i video.mp4 -an -c:v copy solo_video.mp4
```

## 🚀 Aceleración por hardware (macOS)

```bash
# VideoToolbox en Intel/Apple Silicon (encoder h264_videotoolbox)
ffmpeg -i video.mkv -c:v h264_videotoolbox -b:v 5M -allow_sw 1 salida.mp4
# Nota: para transcodificar en bucle con hardware usas -hwaccel
#   seguido de los decoders disponibles en tu plataforma (videotoolbox, cuda…).
```

## 🧰 Publicar para web: faststart

```bash
# -movflags +faststart coloca el índice moov al inicio (streaming en navegador)
ffmpeg -i video.mkv -c:v libx264 -crf 23 -movflags +faststart salida.mp4
```

## 🔬 Inspección con ffprobe

```bash
ffprobe video.mp4                        # metadatos completos
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 video.mp4   # solo duración
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height \
  -of csv=p=0 video.mp4                  # códec y resolución del video
```

## 🔁 Alternativas

| En su lugar | Ventaja |
|---|---|
| [Av1an](https://github.com/rust-av/Av1an) | Codificación AV1/VP9 por chunks (múltiples núcleos) |
| [SVT-AV1](https://gitlab.com/AOMediaCodec/SVT-AV1) | El encoder AV1 de referencia, escalable a VOD/real-time |
| [HandBrake](https://handbrake.fr/) | GUI multiplataforma para conversión |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Descarga de streams y lo encaja con ffmpeg |
| [LosslessCut](https://losslesscut.app/) | Edición sin recodificar (GUI sobre ffmpeg) |

## ❓ FAQ

**❓ ¿Cómo reduzco el tamaño sin perder mucha calidad?**
➡ Pasa a `libx265` o `libsvtav1` (AV1) con un CRF razonable (28-32); AV1 ~ahorra 30-50% frente a H.264 a calidad comparable.

**❓ Diferencia entre `-c copy` y recodificar?**
➡ `-c copy` copia el stream sin tocar datos (rápido, sin pérdida, pero no cambia códecs). Recodificar cambia códec/parámetros (lento, permite ajustar calidad y tamaño).

**❓ ¿Cómo acelero la conversión?**
➡ Con el encodificador: `-preset ultrafast` (más rápido, peor compresión) o `-preset veryslow` (lo contrario). En AV1/SVT-AV1 ajusta `-preset` (0=lento/calidad, 8=rápido).

**❓ Mi video no tiene audio (o viceversa)?**
➡ Usa `-an` para descartar audio y `-vn` para descartar video. Para elegir streams exactos usa `-map`.

**❓ ¿Por qué ffmpeg se niega a sobrescribir salida?**
➡ Falta `-y` (sobrescribir) o el contenedor no admite el códec elegido. Prueba cambio de extensión (`.mkv` en vez de `.mp4`).

## 🔗 Enlaces
- [ffmpeg: Descargas y versiones](https://ffmpeg.org/download.html)
- [Documentación oficial](https://ffmpeg.org/documentation.html)
- [ffmpeg Wiki (HLS, concat, streaming)](https://trac.ffmpeg.org/wiki)
- [SVT-AV1 (GitLab AOMediaCodec)](https://gitlab.com/AOMediaCodec/SVT-AV1)
- [Av1an](https://github.com/rust-av/Av1an) · [HandBrake](https://handbrake.fr/) · [yt-dlp](https://github.com/yt-dlp/yt-dlp) · [LosslessCut](https://losslesscut.app/)

## 🧩 Ver también
- [Expresiones regulares](./manual_regex.md): filtrar nombres y listas de medios
- [ImageMagick](./manual_imagemagick.md): procesar frames/imágenes fuera de video
- [curl y HTTP](./manual_curl_http.md): servir/descargar los streams publicados
- [Comandos Linux](./cheatsheet_comandos_linux.md): tuberías con ffmpeg/ffprobe

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
