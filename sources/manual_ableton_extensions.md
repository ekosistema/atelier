# Manual de Ableton Live Extensions SDK – Herramientas propias en Live Suite

Las **Extensions** de Ableton Live (SDK oficial) te permiten crear herramientas propias (en **JavaScript/TypeScript** con **Node.js**) que interactúan con tu Live Set: manipular pistas, clips, MIDI, dispositivos y tempo. Se disparan desde el menú contextual y ejecutan una tarea puntual. Están en **beta pública** y solo disponibles en **Live 12 Suite** 12.4.5 o superior.

> 🎯 **Nivel**: intermedio-avanzado · **Requisitos**: Live 12 Suite (12.4.5+), Node.js ≥ 24.16.0 LTS, acceso al programa beta (Centercode) · **Revisado**: octubre 2026

> 📌 **Estado.** El Extensions SDK es una **beta pública** ligada a **Live 12.4.5** (beta). No funciona en versiones anteriores ni en **Live Standard, Intro o Lite** (solo **Suite**). El SDK en sí es gratuito.

## ⚠️ Aclaración importante

El Extensions SDK usa **JavaScript/TypeScript + Node.js**, **no Python ni pip**. Es el mismo stack que controlan bien los asistentes de IA (el SDK está pensado para escribirse con ayuda de IA si sabes describir la tarea). Para audio en tiempo real y procesamiento de señal se usa **Max for Live**, no Extensions (ver abajo).

## 🔧 Qué hace y qué no hace una Extension

Una Extension lee tu Set completo (pistas, clips, estructura) y puede **reescribirlo**. Úsala para tareas discretas y finitas:

- Transformar MIDI (transponer, girar notas…).
- Analizar estructura y automatizar tareas repetitivas.
- Generar patrones generativos, conectar servicios externos.

**No sirve** para tiempo real ni señal continua: ni efectos de audio, ni síntesis, ni transformación MIDI en vivo, ni procesado durante la reproducción. Eso es territorio de **Max for Live** (o de la Scripting API de los Remote Scripts, un camino más antiguo y poco documentado para hardware).

## 🚀 Requisitos e instalación

Necesitas entrar en el programa beta de Ableton (Centercode) y tener la beta de Live 12.4.5 Suite:

```bash
# 1. Apúntate al programa beta: ableton.com/beta  (Centercode)
# 2. Instala la beta de Live 12.4.5 Suite.
# 3. Descarga el Extensions SDK y su documentación desde Centercode.
# 4. Instala Node.js (LTS):  https://nodejs.org/en/download  (v24.16.0 o superior)

node --version   # comprueba la versión de Node instalada
```

El SDK ocupa menos de 5 MB y no requiere claves ni registro extra.

## 📁 Estructura de un proyecto de Extension

El SDK viene con plantillas y ejemplos. Un proyecto típico incluye:

```text
mi-extension/
├─ package.json        # definición, scripts (start, build/export) y dependencias
├─ tsconfig.json       # configuración de TypeScript
└─ src/
   └─ index.ts         # lógica de la Extension (contexto, comandos, acciones de menú)
```

Con `npm start` arrancas una **sesión de desarrollo** que conecta la Extension a Live; así pruebas en vivo y recargas con `Ctrl+C` + `npm start` de nuevo. Al terminar, exportas el paquete para instalarlo en Live.

## ✍️ Ejemplo mínimo (tempo)

Basado en el tutorial oficial de Ableton. En `src/index.ts`:

```typescript
// Cambia el tempo del Live Set cuando ganas el foco
// (context = objeto de API que te da el SDK en cada sesión)
export default async ({ context }) => {
  context.application.song.tempo = 165;          // BPM
  console.log('Tempo ahora:', context.application.song.tempo);
};
```

Para añadir un comando al menú contextual de un **clip MIDI**, usas la API de UI/commands del contexto:

```typescript
// Registra una acción en el menú contextual de clips MIDI
context.ui.registerContextMenuAction({
  scope: 'MIDI clip',
  title: 'Desplazar notas',
  id: 'mi.desplazar-notas'
});

// y su manejador: recibe el handle del objeto pulsado
context.commands.registerCommand('mi.desplazar-notas', async (handle) => {
  const clip = await context.getObjectFromHandle(handle, /* tipo */);
  // transforma clip.notes...
});
```

> Estos nombres (`context.application.song`, `context.ui`, `context.commands`, `getObjectFromHandle`) siguen los ejemplos oficiales del SDK. La API completa está en la documentación que se descarga junto al SDK.

## 🎛️ Usar una Extension en Live

1. Instala la Extension en **Settings → Extensions** de Live.
2. Haz clic derecho sobre un elemento del Set (p. ej. un clip MIDI o una pista).
3. En el menú contextual verás la Extension (si es válida para ese elemento).
4. Al elegirla, aparece un pop-up con sus parámetros; al confirmar, se ejecuta una vez, aplica el cambio y termina.

Una Extension instalada está disponible en **cualquier Set** de Live Suite 12.4.5+.

## 🔐 Seguridad y macOS

Las Extensions corren sobre la plataforma **Node.js**, que es un framework separado y potente fuera de Live. Como con cualquier software descargado, **instala solo Extensiones de fuentes en las que confíes** (elijo de la comunidad vía Discord o repositorios oficiales). En macOS aplican las protecciones habituales de Gatekeeper/notarización para el runtime de Node del que depende la Extension; valida la procedencia antes de ejecutar.

## 🧩 Extensions vs Max for Live vs Scripting API

| En su lugar | Ventaja | Cuándo |
|---|---|---|
| **Extensions (JS/TS)** | Lee y reescribe el Set, fácil con IA, sin compilar | Tareas de estructura/datos/MIDI puntuales |
| **Max for Live** | Tiempo real, síntesis, efectos y chains de dispositivos | Instrumentos, efectos, señal continua, performance |
| **Scripting API Python (Remote Scripts)** | Controla hardware y transporte desde Python | Caminos de integración de hardware, poco documentado |

**Regla**: ¿es una tarea discreta sobre el Set (estructura, MIDI, datos)? → **Extensions**. ¿Es tiempo real o efecto de audio? → **M4L**. Max for Live **no** va a ser sustituido por Extensions: están diseñadas para complementarse.

## ❓ FAQ

**❓ Extensions funcionan en Live 11?**
➡ No. Requieren **Live 12 Suite 12.4.5** (beta) o superior.

**❓ Necesito saber Python para el SDK?**
➡ No. El SDK es **JavaScript/TypeScript** sobre **Node.js**.

**❓ Puedo hacer un sintetizador o efecto de audio con Extensions?**
➡ No. Para eso usa **Max for Live**.

**❓ Dónde comparto y encuentro Extensiones?**
➡ En el servidor **Discord de Ableton** (canales #extensions, #extensions-gallery) y en la documentación del SDK.

## 🔗 Enlaces

- [Página oficial de Extensions](https://www.ableton.com/en/live/extensions/)
- [Extras SDK: documentación](https://ableton.github.io/extensions-sdk)
- [FAQ de Ableton Extensions](https://help.ableton.com/hc/en-us/articles/27303428331420-Ableton-Extensions-FAQ)
- [Max for Live](https://www.ableton.com/live/max-for-live/)

## 🧩 Ver también

- [Manual de Max/MSP y Jitter](./manual_max_msp_jitter.md)
- [Manual de Pure Data (Pd)](./manual_puredata.md)
- [Manual de TouchDesigner](./referencia_touchdesigner.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
