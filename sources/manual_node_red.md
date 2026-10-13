# Node-RED – Programación visual de flujos con Node.js

Entorno de programación visual sobre Node.js para conectar dispositivos, APIs y servicios mediante flujos de nodos. Muy usado en IoT y automatización de casa/industria.

> 🎯 **Nivel**: intermedio · **Requisitos**: Node.js 22.9+ (recomendado 24) · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Versión y requisitos](#-versión-y-requisitos)
- [Instalación](#-instalación)
- [Conceptos](#-conceptos)
- [Contexto: node / flow / global](#-contexto-node--flow--global)
- [Nodos core](#-nodos-core)
- [HTTP, MQTT y WebSocket](#-http-mqtt-y-websocket)
- [Function node](#-function-node)
- [Subflows](#-subflows)
- [settings.js](#️-settingsjs)
- [Proyectos (Git)](#️-proyectos-git)
- [Dashboard: clásico vs 2.0](#-dashboard-clásico-vs-20)
- [Despliegue con Docker](#-despliegue-con-docker)
- [Seguridad](#-seguridad)
- [Producción y alternativas](#-producción-y-alternativas)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 📌 Versión y requisitos

- **Última versión**: Node-RED `5.0.x` (publicada en junio de 2026; `5.0.7` es la revisión actual en npm).
- **Node.js**: la 5.0 exige un **mínimo de Node.js 22.9.0** y recomienda **Node.js 24** (las imágenes Docker se basan en Node 24).
- La versión 4.1.x sigue con soporte de mantenimiento. Ya no se admiten Raspberry Pi antiguas (arm/v7 de 32 bits): hace falta un sistema de 64 bits.

## 🚀 Instalación

```bash
# npm global
npm install -g node-red
node-red

# Docker (recomendado en servidor)
docker run -d --name nodered -p 1880:1880 \
  -v nodered_data:/data \
  nodered/node-red

# Raspberry Pi (64 bits)
npm install -g node-red
node-red-pi --max-old-space-size=256
```

Interfaz por defecto: `http://localhost:1880`

## 🧩 Conceptos

| Concepto | Descripción |
|---|---|
| **Flow** | Pestaña con un conjunto de nodos |
| **Node** | Bloque funcional (entrada, proceso o salida) |
| **msg** | Objeto JSON que viaja entre nodos (`msg.payload`) |
| **Wire** | Conexión entre nodos |
| **Context** | Almacenamiento de estado (node, flow, global) |
| **Palette** | Nodos instalados, agrupados por categoría |
| **Config node** | Nodo de configuración compartida (broker MQTT, BD...) |

## 🧮 Contexto: node / flow / global

Tres ámbitos de almacenamiento. El matiz importante: dentro de un nodo, `context` es el **ámbito de ese nodo**, no un "global". Los ejemplos antiguos que abusaban de `flow.get/set` como cajón único son un mal uso.

```javascript
// Ámbito de NODO: solo este nodo ve el valor
context.set("contador", 1);
context.get("contador");

// Ámbito de FLOW: compartido por los nodos de la misma pestaña
flow.set("estado", "ok");
flow.get("estado");

// Ámbito GLOBAL: compartido por todos los flujos y pestañas
global.set("config", { umbral: 35 });
global.get("config");
```

Persistencia: el almacenamiento en memoria se pierde al reiniciar; para conservarlo se usa `localfilesystem`, configurable en `settings.js`.

## 🔧 Nodos core

### Entrada

| Nodo | Uso |
|---|---|
| **Inject** | Disparar manualmente, por intervalo o por timestamp |
| **HTTP In** | Crear un endpoint HTTP |
| **WebSocket In** | Mensajes por WebSocket |
| **TCP / UDP In** | Sockets crudos |
| **MQTT In** | Suscripción a un tópico |
| **Serial In** | Puerto serie (Arduino, sensores) |

### Salida

| Nodo | Uso |
|---|---|
| **Debug** | Ver `msg` en el panel Debug (con pausa desde la 5.0) |
| **HTTP Response** | Contestar a una petición HTTP |
| **HTTP Request** | Hacer peticiones salientes |
| **MQTT Out** | Publicar en un tópico |
| **File** | Escribir en disco |
| **Email** | Enviar correo por SMTP |

### Proceso

| Nodo | Uso |
|---|---|
| **Function** | JavaScript arbitrario |
| **Change** | Mover, cambiar o borrar propiedades de `msg` |
| **Switch** | Enrutar según reglas |
| **Template** | Renderizar plantillas (Mustache) |
| **Range** | Mapear valores (p. ej. 0-100 → 0-255) |
| **Delay** | Retrasar, limitar tasa (con *burst mode* en 5.0) |
| **Join / Split** | Combinar o dividir mensajes |
| **Trigger** | Emitir mensajes de inicio y fin |
| **Exec** | Ejecutar un comando del sistema |
| **RBE** | Report By Exception: solo pasa si cambia el valor |

## 🌐 HTTP, MQTT y WebSocket

```text
# Endpoint HTTP
[HTTP In (POST /api/alta)] → [Function] → [HTTP Response]
Async: msg.req.query / msg.req.body / msg.req.headers
Respuesta: msg.payload (cuerpo), msg.statusCode, msg.headers

# MQTT (broker externo: Mosquitto, HiveMQ...)
Config node "MQTT Broker" → server, port (1883/8883)
[MQTT In (topic "casa/+/temperatura")] → [Function] → [MQTT Out]
Comodines: + (un nivel), # (multinivel)

# WebSocket
[WebSocket In] → [Function] → [WebSocket Out]
```

## 🧠 Function node

Recibe `msg`, modifica y devuelve. Devuelve `null` para no enviar nada. Soporta `async/await` nativo desde la 4.x.

```javascript
// Transformación básica
msg.payload = { doble: msg.payload * 2 };
return msg;

// Varias salidas en un nodo con 2 salidas (null = no emitir)
return [null, msg];

// Emisión diferida
setTimeout(() => node.send({ payload: "retrasado" }), 1000);

// Errores y logging
if (msg.payload == null) {
  node.error("payload vacío", msg);
  return null;
}
node.warn("revisar valor");

// Llamar a un nodo Link y esperar respuesta (novedad de la 5.0)
const { payload: filas } = await node.linkcall("consulta-db", { query: "SELECT * FROM t" });
```

## 📦 Subflows

Agrupa nodos en un bloque reutilizable:

1. Selecciona los nodos → clic derecho → **Create subflow**.
2. Define entradas/salidas y variables de entorno del subflow.
3. Aparece en la palette bajo la categoría *Subflows* y se arrastra como cualquier nodo.

## ⚙️ settings.js

En el directorio de usuario (habitualmente `~/.node-red/`):

```javascript
module.exports = {
  uiPort: 1880,
  httpAdminRoot: "/admin",      // ruta del editor
  httpNodeRoot: "/api",         // ruta de los endpoints HTTP In
  flowFile: "flows.json",
  credentialSecret: process.env.NR_CREDENTIAL_SECRET,  // cifra credenciales
  adminAuth: {
    type: "credentials",
    users: [{ username: "admin", password: "$2b$08$...hash...", permissions: "*" }]
  },
  // Módulos externos disponibles en la Function node
  functionExternalModules: true,
  functionGlobalContext: { fetch: global.fetch }
};
```

La contraseña va **hasheada** (bcrypt): se genera con `node-red admin hash-pw`.

## 🗂️ Proyectos (Git)

La función **Projects** integra los flujos con Git: cada proyecto es un repositorio con `flows.json`, `settings.js` y `package.json`. Permite ramas, historial y despliegue versionado sin herramientas adicionales (se activa con `projects.enabled: true`).

## 📊 Dashboard: clásico vs 2.0

- **Node-RED Dashboard 1.0** (`node-red-dashboard`): **deprecado** desde el 27 de junio de 2024. Sigue instalable y funcional, pero **no** recibe desarrollo ni nuevas funciones; se basa en Angular v1, ya sin mantenimiento.

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `node-red-dashboard` (Dashboard 1.0) está formalmente deprecado. Alternativa recomendada: **FlowFuse Dashboard (Dashboard 2.0)**, `@flowfuse/node-red-dashboard`.

```bash
# Dashboard 1.0 (deprecado)
npm install node-red-dashboard

# Dashboard 2.0 (recomendado)
npm install @flowfuse/node-red-dashboard
```

| En su lugar | Ventaja | Enlace |
|---|---|---|
| [FlowFuse Dashboard (D2)](https://dashboard.flowfuse.com/) | Layout responsive, multi-usuario, PWA, Apache 2.0 | dashboard.flowfuse.com |

## 🐳 Despliegue con Docker

```bash
docker run -d --name nodered \
  -p 1880:1880 \
  -v nodered_data:/data \
  -e TZ=Europe/Madrid \
  nodered/node-red
```

- El directorio `/data` contiene `flows.json`, `settings.js`, credenciales y `node_modules`. **Móntalo siempre** para no perder datos.
- Para producción detrás de un proxy inverso, sirve Node-RED por HTTP interno y termina TLS (Nginx, Caddy, Traefik).

## 🔒 Seguridad

- **adminAuth**: protege el editor con usuario y contraseña (hash bcrypt).
- **HTTPS**: configuración TLS en `settings.js` o terminación en el proxy inverso.
- **credentialSecret**: cifra las credenciales de los flujos; guárdala fuera del repositorio.
- **Palette manager**: restringe la instalación de nodos si el editor no es de confianza.
- **No expongas** `httpAdminRoot` directamente a Internet.
- Novedades de la 5.0: **OAuth con token exchange**, CORS de admin endurecido y más opciones TLS (PFX/P12, claves por variables de entorno, SNI en HTTP Request).

## 🏭 Producción y alternativas

| Necesidad | Herramienta |
|---|---|
| IoT, edge, tiempo real, dashboards de planta | **Node-RED** |
| Flujos de negocio/APIs sin perfil IoT | [n8n](./manual_n8n.md) |
| Hosting gestionado, multi-tenant, HA | **FlowFuse** ([flowfuse.com](https://flowfuse.com/)) |

## ❓ FAQ

**❓ ¿Qué versión de Node.js necesito?**
➡ Node-RED 5.0 requiere Node.js 22.9.0 o superior; se recomienda la 24.

**❓ ¿Sigue vivo el Dashboard clásico?**
➡ No: fue deprecado en 2024. Usa FlowFuse Dashboard (Dashboard 2.0).

**❓ ¿Puedo versionar mis flujos con Git?**
➡ Sí, con la función Projects integrada; o exportando/importando el JSON de los flujos.

## 🔗 Enlaces

- [Documentación oficial](https://nodered.org/docs/)
- [Versiones de Node.js soportadas](https://nodered.org/docs/faq/node-versions)
- [Flow Library (nodos y flujos)](https://flows.nodered.org/)
- [Releases en GitHub](https://github.com/node-red/node-red/releases)
- [FlowFuse Dashboard (Dashboard 2.0)](https://dashboard.flowfuse.com/)
- [FlowFuse (producción)](https://flowfuse.com/)

## 🧩 Ver también

- [n8n](./manual_n8n.md)
- [Make.com](./manual_make_com.md)
- [ActivePieces](./manual_activepieces.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
