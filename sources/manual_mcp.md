# MCP – Model Context Protocol

Protocolo abierto que estandariza cómo los agentes LLM se conectan con herramientas y datos. Esta guía cubre la **spec 2026-07-28**, vigente, y marca como obsoletas las anteriores.

> 🎯 **Nivel**: avanzado · **Requisitos**: saber que son las tools ([Function Calling](./manual_function_calling.md)) · **Revisado**: octubre 2026

## 🧠 ¿Qué es MCP?

MCP define un contrato común entre un **host** (agente/IDE/app) y **servidores MCP** que exponen herramientas, recursos y prompts.

```text
Host (Claude, IDE, agente, app custom)
  └── MCP Client
        ├──→ MCP Server A  (archivos locales)
        ├──→ MCP Server B  (base de datos)
        └──→ MCP Server C  (API externa)
```

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: la spec **2024-11-05** y el transporte **HTTP+SSE** quedaron obsoletos con la spec `2026-07-28`. Si mantienes código antiguo, migra a los SDKs v2. Ver `## 📌 Qué cambió en 2026-07-28`.

## 📌 Qué cambió en la spec 2026-07-28 (verificada)

La revisión `2026-07-28` (28 jul. 2026) convierte MCP en un protocolo **stateless** (request/response):

- **Sin handshake ni sesiones**: se retiran `initialize`/`initialized` y la cabecera `Mcp-Session-Id`. Cada petición viaja sola con su versión, identidad y capacidades en `_meta`.
- La versión y el método viajan en cabeceras HTTP (`MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name`), que permiten enrutar/autorizar sin parsear el body.
- **MRTR (Multi Round-Trip Requests)**: muestreo y *elicitation* se rediseñan sin bidi-streams abiertos.
- Resultados de `list` cacheables (caché de catálogos de tools).
- **SDKs v2** disponibles hoy en **TypeScript, Python, Go y C#** (Rust en beta).

> ✅ **Estado** (oct. 2026): spec vigente = `2026-07-28`. Roots, Sampling y Logging quedaron **deprecados** (aún funcionan 12 meses, no los adopten en código nuevo). El transporte HTTP+SSE quedó deprecado.

## 🔌 Transports

- **stdio**: el cliente lanza el servidor como proceso hijo; comunicación por stdin/stdout. El más común en herramientas locales y desarrollo.
- **Streamable HTTP**: servidor remoto vía `POST /mcp`; soporta `Server-Sent-Events` y peticiones stateless (sin sesión) siguiendo la spec 2026-07-28.

```bash
# Ejemplo mínimo de petición streamable HTTP (spec 2026-07-28)
curl -X POST https://mcp.ejemplo.com/mcp \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -H "Mcp-Method: tools/list" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 🧰 Primitivas

| Concepto | Qué es | Ejemplo |
|---|---|---|
| **Tool** | Función que el agente puede invocar | `query_sql()`, `buscar()`, `crear_ticket()` |
| **Resource** | Datos que el agente puede leer | Schema de DB, archivos, docs |
| **Prompt** | Plantilla de mensaje reutilizable | "Analiza este log: {log}" |
| **Sampling (deprecado)** | El servidor pedía generación al cliente | Se reemplaza por MRTR |
| **Elicitation (MRTR)** | El servidor pide datos/confirmación al usuario mid-call | Confirmar antes de borrar |

## 🚀 Servidor MCP con el SDK v2 (Python)

```bash
pip install "mcp>=2.0"   # SDK v2, spec 2026-07-28
```

```python
import subprocess
from mcp.server import Server

server = Server("shell-executor")

@server.tool()
async def ejecutar_comando(comando: str) -> str:
    """Ejecuta un comando bash y devuelve la salida.
    ⚠️ Ejemplo educativo: nunca expongas un ejecutor arbitrario
    sin sandbox/allowlist (ver sección Seguridad)."""
    try:
        r = subprocess.run(comando, shell=True,
                           capture_output=True, text=True, timeout=30)
        return r.stdout or r.stderr
    except Exception as e:
        return f"Error: {e}"

server.run()   # comunicación por stdio por defecto
```

Configurar en un cliente (Claude Desktop, IDEs...) vía `claude_desktop_config.json` / `mcp.json`:

```json
{
  "mcpServers": {
    "shell": {
      "command": "python",
      "args": ["/ruta/servidor_mcp.py"]
    }
  }
}
```

> 📌 En Hermes y otros agentes el patrón es el mismo: declaras el servidor en la config de MCP del cliente (con `command`+`args` para stdio, o `url`+token para HTTP) y el cliente lista e invoca sus tools.

## 🔌 Cliente MCP desde Python

```python
import asyncio
from mcp import ClientSession, StdioServerParameters

async def main():
    params = StdioServerParameters(command="python",
                                   args=["servidor_mcp.py"])
    async with ClientSession(params) as session:
        tools = await session.list_tools()          # caché del catálogo
        for t in tools:
            print(f"{t.name}: {t.description}")
        res = await session.call_tool("ejecutar_comando",
                          arguments={"comando": "echo hola"})
        print(res)

asyncio.run(main())
```

## 📋 Servidor SQLite (ejemplo real)

```python
import sqlite3
from mcp.server import Server

server = Server("db-query")
conn = sqlite3.connect("datos.db")

@server.tool()
async def query(sql: str) -> str:
    """Ejecuta una consulta SQL y devuelve los resultados."""
    return str(conn.execute(sql).fetchall())

@server.resource("db://schema")
async def schema() -> str:
    """Devuelve el esquema de la base de datos."""
    rows = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table'").fetchall()
    return "\n".join(r[0] for r in rows)
```

## 🛡️ Seguridad

- **Allowlist**: expón solo las tools necesarias; no dejes que el LLM elija comandos arbitrarios.
- **Sandbox**: ejecuta servers en entornos limitados (contenedor, proceso aislado, permisos mínimos).
- **Secrets**: los tokens/credenciales del server viven en variables de entorno, no en el código ni en el repo.
- **Auth remota**: con Streamable HTTP valida el emisor de tokens (`iss`) y usa clientes registrados (CIMD) en 2026-07-28.

## 📦 Ecosistema y registries

Cada vez hay más **registries** de servidores MCP listos para usar (oficiales, por paquetes `npx`, PyPI y repos comunitarios). Ejemplos clásicos de servidores ya hechos:

```bash
# Filesystem (acceso acotado a archivos)
npx @modelcontextprotocol/server-filesystem /ruta/permitida
# PostgreSQL / SQLite, GitHub, etc.: busca en el SDK/servidores del org
```

## ❓ FAQ

**❓ MCP vs function calling?**
➡ Function calling es el patrón interno de cada API ([Function Calling](./manual_function_calling.md)); MCP estandariza ese patrón en un protocolo que cualquier agente entiende, añadiendo recursos y prompts.

**❓ MCP requiere Claude?**
➡ No. Es abierto: cualquier agente (Claude, IDEs, Hermes, app propia) puede ser cliente MCP. Anthropic lo creó, pero la spec y los SDKs v2 son de la comunidad.

**❓ ¿Debo migrar ya del transporte HTTP+SSE?**
➡ Sí, dejó de ser el transporte estándar en la spec 2026-07-28; usa stdio o Streamable HTTP con los SDKs v2.

**❓ ¿Handshake obligatorio?**
➡ No. En 2026-07-28 ya no existe sesión ni `initialize`; la versión y capacidades van por `_meta`.

**❓ ¿Cómo debuggeo un server?**
➡ Ejecútalo solo: `python servidor_mcp.py`. Los logs van a stderr; los mensajes MCP van por stdout.

## 🔗 Enlaces
- [MCP oficial](https://modelcontextprotocol.io/)
- [Blog: spec 2026-07-28](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- [Spec 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)
- [SDK Python](https://github.com/modelcontextprotocol/python-sdk)
- [SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Servidores](https://github.com/modelcontextprotocol/servers)

## 🧩 Ver también
- [Function Calling](./manual_function_calling.md)
- [Agentes con scripts](./manual_agent_scripts.md)
- [Agentes de coding IA](./manual_ai_coding_agents.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
