# 🎨 Hoja de Referencia – Nodos más usados en TouchDesigner

TouchDesigner (Derivative) es un entorno de desarrollo visual en tiempo real para vídeo, instalaciones y directo. Organiza sus nodos en **familias**: **TOP** (imágenes/vídeo), **CHOP** (señales), **SOP** (geometría), **DAT** (datos/lógica), **COMP** (componentes) y **MAT** (materiales).

> 🎯 **Nivel**: intermedio · **Requisitos**: licencia Non-Commercial (gratis) o Commercial/Pro para uso remunerado · **Revisado**: octubre 2026

> 📌 **Estado**: TouchDesigner publica builds por año: el build oficial vigente es **2025.32820** (mayo 2026). Licencias: **Non-Commercial** (gratis, uso personal/educativo/valoración, sin remunerar), **Educational**, **Commercial** y **Pro**.

## 🖼️ TOPs (Texture Operators: imágenes y vídeo)

- **Movie File In TOP** → cargar/reproducir vídeos o imágenes.
- **Noise TOP** → patrones procedurales.
- **Transform TOP** → escalar, rotar, mover.
- **Composite TOP** → combinar varias imágenes (add, multiply, over…).
- **Level TOP** → brillo, contraste, gamma.
- **Blur TOP** → desenfoque.
- **Feedback TOP** → retroalimentación visual (efectos de eco).
- **Out TOP** → salida de vídeo a pantalla/ventana.

## 📈 CHOPs (Channel Operators: señales y datos temporales)

- **Constant CHOP** → valores constantes.
- **LFO CHOP** → oscilador de baja frecuencia (seno, diente, etc.).
- **Noise CHOP** → valores aleatorios/ruidosos.
- **Math CHOP** → escalar, normalizar, invertir, combinar canales.
- **Merge CHOP** → unir varios CHOPs en uno.
- **Keyboard In / Mouse In CHOP** → entradas de teclado y ratón.
- **Audio Device In CHOP** → capturar audio en tiempo real.
- **Out CHOP** → salida de canales.

## 🕹️ SOPs (Surface Operators: geometría 3D)

- **Sphere / Box / Grid SOP** → primitivas geométricas.
- **Noise SOP** → deformar geometría con ruido.
- **Merge SOP** → combinar varias geometrías.
- **Transform SOP** → escalar, mover, rotar.
- **Out SOP** → salida de geometría.

## 📊 DATs (Data Operators: datos y scripts)

- **Table DAT** → gestionar datos en tabla.
- **Text DAT** → código Python o scripts.
- **Execute DAT** → ejecutar Python ante eventos (frame start, change…).
- **Select DAT** → seleccionar filas/columnas de otra tabla.
- **Out DAT** → salida de datos.

## 🧩 COMPs (Components: interfaces y sistemas)

- **Container / Base COMP** → contenedores para UI o lógica.
- **Geometry COMP** → contener geometría 3D.
- **Camera COMP / Light COMP** → cámara y luces.
- **Render TOP** (dentro de un COMP) → renderizar la escena 3D.
- **Panel COMPs (Button, Slider, Knob)** → interfaces interactivas.

## 🎨 MATs (Material Operators: materiales)

- **Phong MAT** → material con reflexión especular (superficies con brillo).
- **Constant MAT** → color uniforme sin sombreado.
- **BRDF MAT** → material PBR realista.
- **Texture MAT** → aplica una textura (TOP) sobre la geometría.

## ⏱️ Timelines y *Perform*

- **Timeline / Time COMP** → control de reproducción, loops y multi-cámaras.
- **Perform** es el clásico modo de presentación: pantalla limpia, sin UI de edición; puedes recargar cambios desde Perform con atajos (`Alt+P`).
- Usa **Clock CHOP** o `absTime.seconds` (Python) para sincronizar con el tiempo absoluto del sistema.

## 🗺️ Vídeo mapping y sincronía

- **Video Device Out TOP** → resoluciones de salida y *mapping*.
- **Transform TOP** con `warp`/perspectiva para proyectar sobre superficies.
- Sincroniza con **NTP/`absTime`** o con **Art-Net/sACN** para mediación con iluminación; envía **OSC** para arrancar el show.

## 🐍 Python en TouchDesigner

Todo TD es programable con Python 3 (vía `Execute DAT`, `Text DAT` o la ventana `Python`):

```python
# operador por nombre y cambio de un parámetro
op('noise1').par.amp = 0.5

# tiempo absoluto del frame
print(me.time.seconds)          # dentro de un nodo 'me'
print(absTime.seconds)          # tiempo global del proyecto
```

## 📡 Señales / OSC para directo

Patrón típico para mandar/recepcionar OSC hacia software de audio o luz:

```text
OSC In DAT (puerto de escucha)
   └→ CHOP (oscin) → valores de control → TOPs/COMPs
OSC Out (oscout CHOP) ← canales de parámetros ← CHOPs de control
```

**Ejemplo**: `Audio Device In CHOP` → `Math CHOP` (normaliza) → conectas la salida al brillo de un `Level TOP`; y un `LFO CHOP` modula el `Transform TOP` para girar la imagen al ritmo.

## ❓ FAQ

**❓ Qué diferencia hay entre TOP, CHOP, SOP, DAT, COMP y MAT?**
➡ TOP = imágenes/vídeo · CHOP = señales/control en el tiempo · SOP = geometría 3D · DAT = datos/lógica · COMP = contenedores/UI · MAT = materiales.

**❓ Cómo conecto audio a efectos visuales?**
➡ `Audio Device In CHOP` → `Math CHOP` (normaliza) → parámetro (p. ej. brillo en `Level TOP`).

**❓ Puedo trabajar con TouchDesigner gratis?**
➡ Sí, con licencia **Non-Commercial** para uso personal/educativo sin compensar. Cualquier trabajo remunerado exige Commercial o Pro.

**❓ Cómo mando datos a Ableton Live o a un sintetizador?**
➡ Con **OSC**: `OSC In/Out DAT` + `oscin`/`oscout` CHOP, o MIDI. Ver también el manual de Live Extensions SDK.

## 🔗 Enlaces

- [TouchDesigner (Derivative)](https://derivative.ca/)
- [Wiki oficial TouchDesigner](https://docs.derivative.ca/)
- [Licencias](https://docs.derivative.ca/Licensing)
- [Foro de la comunidad](https://forum.derivative.ca/)

## 🧩 Ver también

- [Manual de Ableton Live Extensions SDK](./manual_ableton_extensions.md)
- [Manual de Max/MSP y Jitter](./manual_max_msp_jitter.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
