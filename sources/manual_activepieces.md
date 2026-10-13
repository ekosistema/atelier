# ActivePieces – Automatización open core (MIT + Enterprise)

Plataforma de automatización visual de código abierto (modelo *open core*) con piezas modulares, conexiones unificadas y enfoque actual en agentes de IA y servidores MCP. Autoalojable o en la nube.

> 🎯 **Nivel**: intermedio · **Requisitos**: Docker (self-host) o cuenta en el cloud · **Revisado**: octubre 2026

## 📌 Estado real del proyecto

**El proyecto está vivo y con desarrollo activo.** Verificación (octubre 2026):

- Última release **0.92.3** publicada el **12 de octubre de 2026**; ciclo de releases habitual de semanas.
- Repositorio de **TypeScript** con más de 23.000 estrellas en GitHub.
- Posicionamiento actual: **"AI Agents & MCPs"** a la que se añade la automatización de flujos; se anuncian ~400 MCP servers para agentes de IA.

> 📌 **Estado.** Activo y en crecimiento. No está en pausa; el foco de producto se ha desplazado claramente hacia agentes de IA y MCP.

### Licencia: matiz que suele malinterpretarse

> ⚠️ **Obsoleto / cambio de licencia (oct. 2026).** El manual antiguo describía ActivePieces como "MIT sin restricciones". Hoy es **open core**: el **core es MIT**, pero las funciones de cloud/enterprise van bajo una **licencia comercial** aparte (carpeta `packages/ee`). No es "MIT puro".

El core autoalojable se puede usar, modificar y redistribuir libremente; las funciones Enterprise (multi-usuario avanzado, determinadas integraciones) requieren licencia comercial.

## 🧩 Conceptos

| Concepto | Descripción |
|---|---|
| **Flow** | Automatización completa |
| **Piece** | Integración con un servicio (Slack, Gmail, Postgres...) |
| **Step** | Trigger o acción dentro del flow |
| **Trigger** | Evento que inicia el flow |
| **Action** | Operación sobre un Piece |
| **Connection** | Credenciales (OAuth2, API Key, Basic) reutilizables entre flows |
| **Run** | Historial de una ejecución con logs detallados |

## 🚀 Instalación y self-hosting (Docker)

```bash
# Imagen oficial de contenedor
docker run -d --name activepieces -p 8080:80 \
  ghcr.io/activepieces/activepieces

# Producción con Postgres (ver abajo)
```

Acceso web: `http://localhost:8080`

### docker-compose de producción

```yaml
services:
  activepieces:
    image: ghcr.io/activepieces/activepieces
    ports:
      - "8080:80"
    environment:
      AP_ENCRYPTION_KEY: "<clave-hex-64>"     # obligatoria
      AP_JWT_SECRET: "<aleatorio-largo>"
      AP_POSTGRES_HOST: postgres
      AP_POSTGRES_PORT: 5432
      AP_POSTGRES_DATABASE: activepieces
      AP_POSTGRES_USER: ap
      AP_POSTGRES_PASSWORD: cambiame
      AP_TELEMETRY_DISABLED: "true"
      AP_SIGN_UP_ENABLED: "false"             # cerrar el registro abierto
    depends_on: [postgres]

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: activepieces
      POSTGRES_USER: ap
      POSTGRES_PASSWORD: cambiame
    volumes:
      - ap_postgres:/var/lib/postgresql/data

volumes:
  ap_postgres:
```

## 🧱 Pieces

Los **pieces** son las integraciones (equivalen a "apps"). Se instalan desde el **Pieces Marketplace**. Ejemplos habituales:

| Piece | Triggers | Actions |
|---|---|---|
| **Schedule** | Cada X, cron | |
| **Webhook** | Catch HTTP | Respond |
| **HTTP Request** | | GET/POST/PUT/DELETE |
| **Slack** | New message | Send message, create channel |
| **Google Sheets** | New row | Append, update, find rows |
| **Gmail** | New email | Send, trash, mark read |
| **OpenAI** | | Chat, imagen, TTS |
| **PostgreSQL** | | Execute query |
| **Telegram / Discord** | New message | Send message |

Todas las pieces del marketplace son de código abierto y se pueden ampliar con piezas personalizadas.

## ⚡ Triggers y flujos

- **Triggers**: webhook, schedule (cron), y los de cada piece.
- El editor es un **canvas con pasos guiados**; cada paso recibe los datos del anterior.
- **Versionado**: publicar crea una versión del flow; los activos corren sobre la última publicada y se puede volver atrás (*draft vs published*).
- **Test**: ejecutar un paso en solitario con entrada de muestra o datos reales; **Runs** muestra inputs/outputs por paso.

```text
Webhook (Typeform new entry)
  └─ OpenAI: "Resume esta respuesta en 1 línea"
  └─ Google Sheets: Append row (original + resumen)
```

## 🤖 IA y MCP

- Integración nativa con LLMs (OpenAI, Anthropic, etc.) y **MCP** como uno de los ejes de producto.
- Se pueden exponer flows o pieces como **tools MCP** para que agentes externos (Claude, ChatGPT, etc.) las invoquen.
- Ejemplo: un chat de agente llama a un flow de ActivePieces vía MCP para leer/escribir en un SaaS.

## 🔒 Producción

- **AP_ENCRYPTION_KEY** obligatoria y **AP_JWT_SECRET** fuerte.
- Cierra el registro de usuarios en producción (`AP_SIGN_UP_ENABLED=false`).
- Credenciales cifradas y conexiones unificadas por servicio.
- Despliegue con Postgres para persistencia real (evita SQLite salvo pruebas).

## 💰 Cloud vs self-hosted

- **Cloud**: suscripción por plan con límites de tareas/flows y funciones Enterprise.
- **Self-hosted**: el core MIT no limita tareas artificialmente; dependes de los recursos de tu servidor. Las funciones Enterprise del cloud no están en el core gratuito.
- Detalle e importes en la [página de precios oficial](https://www.activepieces.com/pricing) (no se fijan cifras aquí por variar).

## 🔀 Alternativas mantenidas

| Herramienta | Veredicto | Notas |
|---|---|---|
| [n8n](./manual_n8n.md) | Activa | Fair-code, self-host maduro, 2.41.x (oct. 2026) |
| **Windmill** | Activa | AGPLv3; workflows y scripts por código |
| **Huginn** | Activa | Release `v2026.10.04`; agentes "vigilantes" en Ruby |
| **Make / Zapier** | Activas | SaaS con [Make.com](./manual_make_com.md) y [Zapier](./manual_zapier.md) |

## ❓ FAQ

**❓ ¿Está abandonado ActivePieces?**
➡ No. Última release 0.92.3 (12 oct. 2026) y desarrollo activo.

**❓ ¿Sigue siendo MIT?**
➡ El core sí (MIT); las funciones enterprise/cloud van con licencia comercial aparte (open core).

**❓ ¿Se puede autoalojar gratis?**
➡ Sí, el core MIT se autoaloja sin límites artificiales con Docker + Postgres.

## 🔗 Enlaces

- [Documentación oficial](https://www.activepieces.com/docs)
- [Licencia (MIT core + Enterprise)](https://www.activepieces.com/docs/about/license)
- [Releases en GitHub](https://github.com/activepieces/activepieces/releases)
- [Repositorio en GitHub](https://github.com/activepieces/activepieces)
- [Pieces Marketplace](https://www.activepieces.com/pieces)
- [Precios](https://www.activepieces.com/pricing)

## 🧩 Ver también

- [n8n](./manual_n8n.md)
- [Make.com](./manual_make_com.md)
- [Zapier](./manual_zapier.md)
- [Node-RED](./manual_node_red.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
