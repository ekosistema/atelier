# n8n – Automatización visual de flujos y agentes de IA

Plataforma de código abierto (modelo *fair-code*) para construir automatizaciones y agentes de IA sobre un canvas visual, combinando nodos con código propio. Autoalojable o en la nube.

> 🎯 **Nivel**: intermedio · **Requisitos**: Docker, o Node.js 22+ para self-host · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Qué es y licencia (fair-code)](#-qué-es-y-licencia-fair-code)
- [Conceptos](#-conceptos)
- [Modos de ejecución](#-modos-de-ejecución)
- [Despliegue con Docker + Postgres](#-despliegue-con-docker--postgres)
- [Triggers](#-triggers)
- [Nodos core](#-nodos-core)
- [Nodos de IA y agentes (LangChain)](#-nodos-de-ia-y-agentes-langchain)
- [Expresiones](#-expresiones)
- [Sub-workflows](#-sub-workflows)
- [Manejo de errores y reintentos](#-manejo-de-errores-y-reintentos)
- [Credenciales y secretos](#-credenciales-y-secretos)
- [API y CLI](#-api-y-cli)
- [Self-host vs Cloud (cualitativo)](#-self-host-vs-cloud-cualitativo)
- [Alternativas por caso de uso](#-alternativas-por-caso-de-uso)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 📌 Qué es y licencia (fair-code)

- **Versión actual**: n8n `2.x` (estable `2.41.x`; `2.42` en beta, octubre 2026). La rama `1.123.x` sigue recibiendo parches para instalaciones antiguas.
- **Licencia**: *Sustainable Use License*, basada en el modelo **fair-code** (no es open source según la OSI). Permite usar, modificar y redistribuir el código para **uso interno de tu negocio** o personal.
- **Qué NO permite**: revender n8n ni ofrecerlo como servicio cuyo valor derive íntegra o sustancialmente de su funcionalidad. Los ficheros con `.ee.` en el nombre van bajo licencia Enterprise aparte.
- **Qué SÍ permite**: cobrar por consultoría, formación o desarrollar workflows y nodos para clientes, sin acuerdo adicional con n8n.

> 📌 **Estado.** Proyecto muy activo (repositorio con más de 200k estrellas). El desarrollo se concentra en `2.x`; `1.x` está en mantenimiento y la versión 3.0 ya anuncia cambios incompatibles.

## 🧩 Conceptos

| Concepto | Descripción |
|---|---|
| **Node** | Bloque individual: trigger o acción |
| **Workflow** | Grafo de nodos conectados |
| **Execution** | Una ejecución del workflow |
| **Item** | Cada registro del array que fluye entre nodos |
| **Expression** | Código inline `{{ }}` para transformar datos |
| **Credential** | Conexión autenticada a un servicio externo |
| **Sub-workflow** | Workflow invocado desde otro workflow |
| **Cluster node** | Nodo raíz + sub-nodos (usado por IA y agregaciones) |

## 🚀 Modos de ejecución

n8n corre en dos modos principales, configurables con `EXECUTIONS_MODE`:

| Modo | Uso | Requisitos |
|---|---|---|
| **Regular (`main`)** | Instancia única, desarrollo o poca carga | SQLite o Postgres |
| **Queue (`queue`)** | Producción escalable | Redis + Postgres + workers |

### Queue mode (Redis + workers)

- Una instancia **main** recibe triggers y encola ejecuciones (no las ejecuta).
- El **broker** es **Redis**; los **workers** recogen y ejecutan los jobs.
- Los **webhook processors** opcionales escalan la entrada de webhooks en paralelo.
- **Multi-main**: varias instancias `main` en alta disponibilidad; una actúa de *leader* (tareas "at-most-once") y el resto de *followers*.
- Concurrencia por worker por defecto `10` (`--concurrency`); n8n recomienda `5` o más.

```bash
# Main en modo cola
EXECUTIONS_MODE=queue

# Redis
QUEUE_BULL_REDIS_HOST=localhost
QUEUE_BULL_REDIS_PORT=6379

# URL pública para webhooks (N8N_WEBHOOK_URL desde 2.30)
N8N_WEBHOOK_URL=https://midominio.com
```

## 🐳 Despliegue con Docker + Postgres

```yaml
services:
  n8n:
    image: n8nio/n8n
    ports: ["5678:5678"]
    environment:
      - N8N_HOST=midominio.com
      - N8N_PROTOCOL=https
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=cambiame
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}   # 64 hex, obligatoria en prod
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on: [postgres]

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: n8n
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: cambiame
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
```

## ⚡ Triggers

| Nodo | Uso |
|---|---|
| **Schedule Trigger** | Cron o intervalo fijo |
| **Webhook** | Endpoint HTTP (GET/POST) público |
| **Form Trigger** | Formulario web generado por n8n |
| **Chat Trigger** | Inicia el flow desde un mensaje de chat (IA) |
| **MCP Server Trigger** | Expone tools a un cliente MCP |
| **Manual Trigger** | Botón "Execute workflow" (pruebas) |
| **Polling / app triggers** | Gmail, RSS, Airtable, etc. por evento |

## 🔧 Nodos core

| Nodo | Uso |
|---|---|
| **HTTP Request** | Llamar APIs REST (autenticación integrada) |
| **Code** | JavaScript o Python arbitrario |
| **Edit Fields (Set)** | Crear/renombrar/simplificar campos |
| **If** | Condicional binario → dos ramas |
| **Switch** | Múltiples rutas por reglas |
| **Merge** | Combinar ramas (append, combine, choose-branch) |
| **Filter** | Descarta items según condición |
| **Aggregate / Summarize** | Unir items en uno solo |
| **Sort / Remove Duplicates** | Limpieza de items |
| **Split In Batches / Loop Over Items** | Procesar en lotes |
| **Wait** | Pausar hasta un intervalo o fecha |
| **Sticky Note** | Notas visuales en el canvas |

> Nota de nomenclatura: en la 1.x `IF` → **If** y `Set` pasó a llamarse **Edit Fields (Set)**.

## 🤖 Nodos de IA y agentes (LangChain)

n8n implementa LangChain como **cluster nodes**: un nodo raíz + sub-nodos laterales.

| Nodo raíz | Sub-nodos que se conectan |
|---|---|
| **AI Agent** | Chat Model + Memory + Tools + Output Parser |
| **Basic LLM Chain** | Chat Model + Output Parser |
| **Vector Store** | Embeddings + Document Loader |

- **AI Agent**: el único tipo desde `1.82.0` es **Tools Agent** (el ajuste "agent type" está deprecado). El nodo v1 se elimina en n8n 3.0.
- **Chat Models**: OpenAI, Anthropic, Google Gemini, Ollama, etc.
- **Memory**: Simple Memory, Postgres Chat Memory, Redis Chat Memory.
- **Tools**: Code Tool, HTTP Request Tool, **Call n8n Workflow Tool**, Wikipedia, Vector Store y cientos de nodos de app como tool.
- **MCP**: `MCP Server Trigger` (n8n expone tools) y `MCP Client Tool` (n8n consume tools).
- **Human-in-the-loop**: desde `2.6` se puede exigir aprobación humana antes de ejecutar tools concretas; los nodos "send and wait" crean enlaces `/webhook-waiting/*`.

## 🧮 Expresiones

Se usan en cualquier campo, entre `{{ }}`.

```javascript
$json                    // datos del item actual
$items                   // todos los items de la entrada
$node("Nombre").json     // salida de otro nodo
$binary                  // datos binarios (ficheros)
$env                     // variables de entorno
$now / $today            // fecha actual
$workflow / $execution   // metadatos del flow y de la ejecución

{{ $json.email | lower }}                 // filtros estilo LiquidJS
{{ $json.fecha | date("DD-MM-YYYY") }}
{{ $json.tags | first }}
```

## 🔄 Sub-workflows

Agrupa lógica reutilizable y aísla partes del flow:

- **Execute Sub-workflow** llama a otro workflow por ID y espera su salida.
- **Execute Sub-workflow Trigger** marca el workflow de destino como invocable.
- El **Call n8n Workflow Tool** permite usar un sub-workflow como tool de un AI Agent.

## 🛑 Manejo de errores y reintentos

- **A nivel de nodo** (**Settings → On Error**):
  - `Stop Workflow`: detiene todo.
  - `Continue (using error output)`: emite el error por una segunda salida para tratarlo.
- **Retry On Fail**: reintentos por nodo con número de intentos y espera (útil en APIs inestables).
- **Error Workflow**: un workflow global que se dispara cuando otro falla; recibe `error`, `execution.id`, `workflow.id`. Desde la versión `2.38` sus ejecuciones **no** consumen cuota.
- **Stop And Error**: fuerza un error con mensaje propio.

## 🔑 Credenciales y secretos

- Credenciales cifradas en la base de datos con `N8N_ENCRYPTION_KEY` (guárdala: perderla invalida todo).
- Tipos: OAuth2, API Key, Basic Auth, Header Auth, Service Account.
- **External Secrets** (solo Enterprise): 1Password (Connect Server), AWS Secrets Manager, Azure Key Vault, GCP Secrets Manager, HashiCorp Vault (self-hosted, no HCP Vault Secrets) e Infisical. Se referencian como `{{ $secrets.<vault>.<nombre> }}` y **solo** resuelven en campos de credencial.

## 💻 API y CLI

```bash
# CLI
n8n execute --id 12                          # ejecutar workflow por ID
n8n export:workflow --all --output=flows/    # exportar todos
n8n import:workflow --input=flows/mi.json    # importar
n8n update:workflow --id=12 --active=true    # activar/desactivar

# API pública (requiere N8N_API_KEY)
curl -H "X-N8N-API-KEY: $N8N_API_KEY" https://midominio.com/api/v1/workflows
```

## 💰 Self-host vs Cloud (cualitativo)

| | Self-hosted | n8n Cloud |
|---|---|---|
| **Coste** | Solo tu infraestructura (servidor/DB) + tiempo de mantenimiento | Suscripción por plan y ejecuciones |
| **Control** | Total: datos, red, versiones, backups | Gestionado por n8n |
| **Escala** | Ilimitada (queue mode, workers) | Sujeta al plan |
| **Operación** | Tú te encargas de actualizar y monitorizar | Incluida |

Regla práctica: volumen bajo y cero operación → Cloud; volumen alto, datos sensibles o requisitos de residencia → self-host. Precios en [n8n.io/pricing](https://n8n.io/pricing).

## 🔀 Alternativas por caso de uso

| Alternativa | Cuándo elegirla |
|---|---|
| **Windmill** [(web)](https://www.windmill.dev/) | Scripts y workflows de código (TS/Python/Go) con UI autogenerada; AGPLv3 |
| **Temporal** [(web)](https://temporal.io/) | Durable execution para procesos críticos y de larga duración (MIT) |
| **Airflow / Dagster / Prefect** | Orquestación de datos y ETL con DAGs y planificación |
| **ActivePieces** | Alternativa open core con enfoque en MCP/agentes de IA |

## ❓ FAQ

**❓ ¿Es n8n realmente open source?**
➡ No según la OSI: usa la Sustainable Use License (fair-code), que restringe el uso comercial como servicio.

**❓ ¿Cuántas integraciones tiene?**
➡ Más de 400 nativas (según la descripción oficial del repositorio), ampliables con HTTP Request y Code.

**❓ ¿Puedo usarlo gratis en mi empresa?**
➡ Sí, el uso interno está permitido sin coste; solo pagas si quieres Cloud o funciones Enterprise.

## 🔗 Enlaces

- [Documentación oficial](https://docs.n8n.io/)
- [Licencia Sustainable Use](https://docs.n8n.io/sustainable-use-license)
- [Queue mode (docs)](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode)
- [Releases en GitHub](https://github.com/n8n-io/n8n/releases)
- [Precios](https://n8n.io/pricing) · [Plantillas](https://n8n.io/workflows)
- [Foro de la comunidad](https://community.n8n.io/)

## 🧩 Ver también

- [Make.com (ex-Integromat)](./manual_make_com.md)
- [Zapier](./manual_zapier.md)
- [ActivePieces](./manual_activepieces.md)
- [Node-RED](./manual_node_red.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
