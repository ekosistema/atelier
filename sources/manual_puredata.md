# 🎛️ Manual de Pure Data (Pd) – Programación visual para audio y multimedia

Pure Data (Pd) es un lenguaje de programación visual de código abierto creado por Miller Puckette (1996) para audio, música y multimedia en tiempo real. Conectas objetos en un *patch* (`.pd`) y el audio circula por cables de señal; es el hermano libre de Max/MSP.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: instalar Pd Vanilla (0.56.x) · **Revisado**: octubre 2026

> ⚠️ **Obsoleto (oct. 2026)**: **Pd-extended** está abandonado (último lanzamiento, 2013). Alternativas recomendadas: Pd **Vanilla** + externals vía *deken*, **Purr Data** o **plugdata**.

## 🥣 Sabores de Pd y cuál elegir

| Sabor | Qué es | Cuándo usarlo |
|---|---|---|
| [Pd Vanilla](https://msp.ucsd.edu/software.html) | Distribución oficial de Miller Puckette, sin librerías preinstaladas | Sistema de referencia; hoy (oct. 2026) en la serie **0.56.x** estable, con 0.57 en pruebas |
| Purr Data | Herencia de Pd-L2Ork, GUI HTML5, librerías externas incluidas | Todo-en-uno, dinámica de laptop-orchestra |
| [plugdata](https://plugdata.org/) | Basado en pd-vanilla con GUI moderna; funciona como **plugin VST3/AU/LV2/CLAP** o app | Instrumentos/efectos dentro de un DAW; incluye ELSE y Cyclone |

**Conclusión práctica**: instala Pd Vanilla y añade librerías con *deken* (`Help → Find externals`). Reserva plugdata cuando quieras cargar Pd dentro de tu DAW.

## 🔧 Instalación

```bash
# macOS (Homebrew)
brew install pure-data

# Debian / Ubuntu
sudo apt update && sudo apt install puredata

# Windows: descarga el instalador desde puredata.info/downloads/pure-data
pd -version        # comprueba la versión instalada (0.56.x)
```

## 📂 Conceptos básicos

- **Patch**: archivo visual `.pd` donde colocas y conectas objetos.
- **Objeto**: bloque funcional (`osc~`, `dac~`, `metro`). Los terminados en `~` trabajan con señal de audio en tiempo real; el resto maneja mensajes y control.
- **Bang**: disparador que activa la salida de un objeto.
- **GUI**: controles gráficos (sliders, toggles, number boxes).

## 🔊 Objetos de audio

```text
osc~ f          → Oscilador senoidal (f frecuencia en Hz)
noise~          → Ruido blanco
phasor~ f       → Diente de sierra 0..1
+~  *~  -~  /~  → Operaciones aritméticas sobre señales
dac~            → Salida de audio (par izquierda/derecha)
adc~            → Entrada de audio
line~ / vline~  → Rampas de control (evitan clics)
delwrite~ / delread~ → Línea de retardo (delay) por señal
```
Para **reverb** (`freeverb~`) y filtros usa *ELSE*, *Cyclone* o *zexy* desde *deken*: Pd Vanilla no trae reverberación de serie.

## 🎹 MIDI

```text
notein   noteout    → Notas (pitch, velocity, channel)
ctlin    ctlout     → Controladores CC
bendin   bendout    → Pitch bend
pgmin    pgmout     → Cambio de programa
midiin   midiout    → Bytes MIDI crudos
```

## 🔢 Control, lógica y matemáticas

```text
metro t     → Metrónomo (t en ms)
random n    → Entero aleatorio entre 0 y n-1
select x    → Dispara un bang al recibir el valor x
+  -  *  /  → Aritmética de mensajes
loadbang    → Ejecuta un mensaje al abrir el patch
print       → Imprime en la consola de Pd
```

## 📦 Externals y abstracciones

- **Externals**: librerías compiladas que amplían Pd. Se instalan desde `Help → Find externals` (deken) o añadiendo la ruta en `Preferences → Path`.
- Las librerías de Pd-extended (p. ej. Cyclone, miXed) siguen disponibles en deken como paquetes **v00-extended**.
- **Abstracciones**: patches `.pd` guardados en disco y reutilizables como objetos (crea una carpeta y añádela al `Path`).
- **Subpatches**: `[pd nombre]`, embebido dentro del mismo archivo `.pd`.

## 🖼️ GEM (gráficos y vídeo en tiempo real)

GEM aporta gráficos 3D y procesamiento de imagen dentro del patch:

```text
gemwin              → Ventana OpenGL de salida
gemhead             → Cabecera del grafo de escena
sphere  cube  square → Primitivas geométricas
rotateXYZ  translateXYZ  scaleXYZ → Transformaciones
pix_video           → Captura de cámara
pix_texture         → Texturizar con imágenes/vídeo
```
GEM sigue funcionando pero su desarrollo es lento; hoy para visuales pulidos se suele combinar Pd con TouchDesigner o VVVV vía OSC en lugar de GEM.

## 🥧 Pd en Raspberry Pi / embedded

```text
# Pd corre de forma nativa en Raspberry Pi OS (armv7/arm64)
sudo apt install puredata

# libpd: embebe el motor de Pd en tu propia app (C/C++, Python, etc.)
```
`libpd` es la vía estándar para meter Pd en hardware propio o apps (también es la base de plugdata). Consumo bajo, ideal para instalaciones embebidas controladas por OSC/MIDI.

## 🎵 Ejemplo mínimo: senoide con control

1. Crea `osc~ 440`, conéctalos a `*~ 0` y de ahí a `dac~`.
2. Crea un `metro 500` → `random 500` → `+ 60` para lanzar notas aleatorias.
3. Añade un `hslider` conectado a `*~` para el volumen.
4. Activa el DSP: `Media → DSP On` (`Ctrl+.` en Windows/Linux, `Cmd+.` en macOS). Sin DSP no oirás nada.

## ❓ FAQ

**❓ No escucho sonido en Pd**
➡ Comprueba `Media → DSP On` y `Media → Audio Settings` (dispositivo correcto).

**❓ Diferencia entre objetos con `~` y sin `~`?**
➡ Con `~` procesan audio en tiempo real; sin `~`, mensajes y control a velocidad de bloque.

**❓ Dónde consigo reverb o filtros que no están en Vanilla?**
➡ En `Help → Find externals` instala librerías (`freeverb~`, ELSE, Cyclone, zexy).

**❓ Pd-extended todavía sirve?**
➡ No te apoyes en él: está abandonado (2013). Usa Vanilla + deken, Purr Data o plugdata.

## 🔗 Enlaces

- [Pure Data: sitio de Miller Puckette (descargas oficiales)](https://msp.ucsd.edu/software.html)
- [Pure Data: sitio de la comunidad](https://puredata.info/)
- [plugdata: Pd como plugin de DAW](https://plugdata.org/)
- [deken: buscador de externals](https://deken.puredata.info/)

## 🧩 Ver también

- [Manual de Max/MSP y Jitter](./manual_max_msp_jitter.md)
- [Manual de Ableton Live Extensions SDK](./manual_ableton_extensions.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
