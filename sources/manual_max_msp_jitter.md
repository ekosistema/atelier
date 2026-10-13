# 🎛️ Manual de Max/MSP y Jitter – Programación audiovisual en Cycling '74

Max es el entorno de programación visual de Cycling '74 para multimedia. **MSP** añade audio de tiempo real, **Jitter** vídeo/3D/matrices, y **gen~**, **RNBO** y **Max for Live** lo extienden hacia DSP compilado y Ableton Live. Los proyectos son *patches* (`.maxpat`).

> 🎯 **Nivel**: intermedio · **Requisitos**: licencia de Max 9 (perpetua o suscripción) · **Revisado**: octubre 2026

> 📌 **Estado.** La versión actual es **Max 9.1** (oct. 2025). **Max 8** queda como versión anterior: sigue usable, pero una licencia de Max 9 te permite autorizar también Max 7-8. Modelo de licencia: compra única (perpetua, ~399 $US) o suscripción con actualizaciones incluidas.

## 🧱 Estructura de Max

- **Max**: lógica, mensajes, control (objetos sin `~`).
- **MSP**: audio de tiempo real (objetos con `~`).
- **Jitter**: vídeo, 3D y matrices (`jit.*`).
- **gen~**, **RNBO**, **Max for Live (M4L)**: capas de DSP compilado y de integración con Ableton.

```text
bang  metro t  toggle  number  counter  message  → control fundamental
+  -  *  /  expr  select x  random n            → matemáticas y lógica
```

## 🎵 Objetos MSP (audio)

### Generación y buffer
```text
cycle~ f      → Oscilador senoidal (f Hz)
phasor~ f     → Diente de sierra 0..1
noise~        → Ruido blanco
buffer~ nombre → Zona de memoria/archivo de audio
```

### Procesamiento y salida
```text
*~  +~        → Suma/multiplicación de señal
biquad~       → Filtro biquad (bi/BW/peq/heq, etc.)
line~         → Rampas lineales para control
dac~  adc~    → Salida y entrada de audio
adsr~ a d s r → Envolvente ADSR
gain~  scope~ → Volumen y visualización de onda
```

### Poly, multicanal y DSP en código
```text
poly~ nombre numVoices     → Instancias polifónicas (polysynth~, polybuffer~)
mc.cycle~ mc.sinfo~ mc.amamix~  → Objetos SC multicanal (prefijo mc.)
gen~          → Editor de DSP compilado a rendimiento nativo
```
Dentro de `gen~` escribes el DSP con objetos (p. ej. `phasor → noise → history → sample_and_hold → outlet 1`).

## 🎹 MIDI

```text
notein  noteout    → Notas (pitch, velocity, channel)
ctlin   ctlout     → Controladores CC
bendin  bendout    → Pitch bend
midiin  midiout    → Bytes MIDI crudos
```

## 🧠 patching, pattr y node

- **patcher**: los patches se anidan con `[p nombre]` o `[patcher nombre]`; reutiliza código con **abstracciones** (`[nombre-archivo]`).
- **pattr / pattr**: `pattrstorage` guarda y difunde valores entre parámetros; `pattr` organiza el estado de un patch.
- **node**: objetos de datos y uniones (`dict`), ideales para estructurar datos complejos entre patchers/abstracciones.

## 🎛️ Max for Live (M4L)

Max for Live es Max dentro de Ableton Live: creas instrumentos, efectos MIDI/audio y dispositivos que viven en la cadena de dispositivos de una pista. Es la vía consolidada para **tiempo real** y **señal continua**. Se edita desde el propio Live (o con standalone Max y la pestaña M4L). Consulta el manual de Live Extensions para saber cuándo usar cada tecnología.

## 🚀 RNBO (exportar a C++/VST)

RNBO exporta patches **fuera de Max**: a plugin **VST3/AudioUnit**, a **Raspberry Pi**, a objeto **Max external**, a **Web (WASM)** y a **código C++** que integras en tu proyecto (p. ej. con JUCE). Va incluido en Max y se actualiza por el Max Package Manager (p. ej. RNBO 1.4.3).

```text
rnbo~                  → Objeto que contiene el patcher RNBO
# export sidebar → VST/AudioUnit, Raspberry Pi, Max External, Web, C++ Source
```
El “sonido en el patch” es el mismo código que exportas: lo que oyes en RNBO es lo que suena en el destino.

## 🎥 Jitter (vídeo / 3D / matrices)

### Matrices y vídeo
```text
jit.matrix   jit.pwindow   jit.window   jit.movie   jit.grab
jit.op       jit.brcosa    jit.rgb2luma  jit.rota    jit.xfade
```

### Efectos Jitter (Max 9.1 añade muchos)
```text
jit.fx.vhs  jit.fx.crt                → visuales retro (VHS / CRT)
jit.fx.ge.pattern  jit.fx.ge.lineinterp → geométricos
jit.fx.tiltshift  jit.fx.camera  jit.fx.cf.kuwahara → filtros de imagen
```

### 3D (OpenGL)
```text
jit.gl.render nombre     → Contexto OpenGL
jit.gl.gridshape         → Figuras 3D (esfera, cubo…)
jit.gl.texture videoplane → Texturas y planos de vídeo
jit.gl.camera             → Cámara 3D
```

## 🧩 Ejemplos rápidos

**A. Senoide simple**: `cycle~ 440` → `*~` → `dac~`, con un slider en el `*~` para volumen, y DSP activado (botón Audio On/Off).

**B. Vídeo con efecto**: `jit.movie` → `jit.brcosa` → `jit.pwindow` (previsualización) → `jit.window`.

**C. Escena 3D**: `jit.gl.render miRender` con `jit.gl.gridshape miRender @shape sphere`; controla posición/rotación con `rotatexyz`.

## ❓ FAQ

**❓ Diferencia entre objetos con `~` y sin `~`?**
➡ Con `~` procesan audio en tiempo real; sin `~`, control/mensajes.

**❓ Cómo activo/desactivo el DSP?**
➡ Botón **Audio On/Off** de la barra de herramientas.

**❓ Max/MSP vs Pure Data?**
➡ Pd es libre y ligero; Max es comercial, con interfaz más integrada, Jitter, RNBO y M4L para sobresalir en producto.

**❓ Vale la pena migrar de Max 8 a Max 9?**
➡ Con licencia de Max 9 puedes autorizar y seguir usando Max 7-8. Max 9.1 añade objetos ABL y muchos Jitter FX.

## 🔗 Enlaces

- [Cycling '74: página de Max](https://cycling74.com/products/max)
- [Documentación de Max 9](https://docs.cycling74.com/max)
- [RNBO](https://rnbo.cycling74.com/)
- [Tienda / licencias](https://cycling74.com/shop/max)

## 🧩 Ver también

- [Manual de Pure Data (Pd)](./manual_puredata.md)
- [Manual de Ableton Live Extensions SDK](./manual_ableton_extensions.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
