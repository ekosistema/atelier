# Function Calling – LLMs que ejecutan herramientas

Cómo darle al LLM herramientas definidas por esquema JSON: el ciclo tool-call, llamadas en paralelo, elección de herramienta, validación de salida y seguridad. Este patrón es lo que MCP estandariza.

> 🎯 **Nivel**: intermedio · **Requisitos**: saber llamar a una API de LLM · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Qué es function calling?](#-qué-es-function-calling)
- [Definir herramientas (esquema JSON)](#-definir-herramientas-esquema-json)
- [Ciclo tool-call en la API](#-ciclo-tool-call-en-la-api)
- [Implementación completa en Python](#-implementación-completa-en-python)
- [Llamadas en paralelo](#-llamadas-en-paralelo)
- [Elección de herramienta (`tool_choice`)](#-elección-de-herramienta-tool_choice)
- [Structured outputs y validación con Pydantic/Zod](#-structured-outputs-y-validación-con-pydanticzod)
- [Seguridad e idempotencia](#-seguridad-e-idempotencia)
- [Por qué MCP estandariza esto?](#-por-qué-mcp-estandariza-esto)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🧠 ¿Qué es function calling?

El LLM **no ejecuta código**: decide qué función llamar y con qué argumentos. Tu código ejecuta y devuelve el resultado al modelo.

```text
1. User: "¿Qué tiempo hace en Madrid?"
2. LLM:  tool_call → get_weather(ciudad="Madrid")
3. Tu código: ejecuta get_weather y devuelve el resultado
4. LLM:  "En Madrid hay 22°C y está soleado"
```

## 📦 Definir herramientas (esquema JSON)

```json
{
  "type": "function",
  "name": "get_weather",
  "description": "Obtener el clima de una ciudad",
  "parameters": {
    "type": "object",
    "properties": {
      "ciudad": {"type": "string", "description": "Nombre de la ciudad"},
      "unidad": {"type": "string", "enum": ["celsius", "fahrenheit"]}
    },
    "required": ["ciudad"]
  }
}
```

Reglas: descripciones claras *de cuándo usar la herramienta* (el modelo decide con la descripción), nombres aclaratorios, y tipos de JSON con `required`.

## 🔄 Ciclo tool-call en la API

El patrón es **multiturno**: el modelo responde con `tool_calls`; tú ejecutas y reenvías el resultado con `role: "tool"` y el `tool_call_id` que devolvió.

```bash
# 1º llamada: user → LLM → responde con tool_call
curl -s https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $(echo $OPENAI_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.6-terra",
    "input": [{"role": "user", "content": "¿Tiempo en Madrid?"}],
    "tools": [{"type": "function", "name": "get_weather",
      "description": "Clima de una ciudad",
      "parameters": {"type": "object",
        "properties": {"ciudad": {"type": "string"}},
        "required": ["ciudad"]}}]
  }' | jq '.output'
# 2º llamada: ejecutar la tool y devolver el resultado al LLM (role: tool)
# En Responses se usa "output": [...] con "type": "function_call_output"
```

En Chat Completions el resultado se devuelve con `{"role": "tool", "content": resultado, "tool_call_id": <id>}`. El patrón de roles depende del endpoint pero el ciclo es el mismo: **llamar → ejecutar → reenviar**.

## 🐍 Implementación completa en Python

```python
import json, os, requests
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def get_weather(ciudad):
    # Simulación; en producción aquí iría una API real
    temps = {"madrid": 22, "barcelona": 25, "bilbao": 18}
    return json.dumps({"ciudad": ciudad, "temperatura": temps.get(ciudad.lower(), 20)})

tools = [{"type": "function", "name": "get_weather",
          "description": "Clima de una ciudad",
          "parameters": {"type": "object",
            "properties": {"ciudad": {"type": "string"}},
            "required": ["ciudad"]}}]

# 1º: user → LLM → tool_call
msg = client.responses.create(
    model="gpt-5.6-terra",
    input=[{"role": "user", "content": "Tiempo en Madrid"}],
    tools=tools).output

# 2º: ejecutar la tool
resultados = []
for item in msg:
    if item.type == "function_call":
        args = json.loads(item.arguments)
        resultados.append({"type": "function_call_output",
                           "call_id": item.call_id,
                           "output": get_weather(**args)})

# 3º: resultados → LLM → respuesta final
final = client.responses.create(
    model="gpt-5.6-terra",
    input=[{"role": "user", "content": "Tiempo en Madrid"}, *msg, *resultados],
    tools=tools)
print(final.output_text)
```

## ⚡ Llamadas en paralelo

Un solo turno puede devolver **varias** `tool_calls`: el modelo sugiere llamar a varias herramientas a la vez. Ejecútalas en paralelo pero **devuelve cada resultado con su `call_id`/`tool_call_id`**.

```bash
# Ejecuta en paralelo y junta todos los resultados antes del turno final
```

## 🎯 Elección de herramienta (`tool_choice`)

| Valor | Efecto |
|---|---|
| `auto` | El modelo decide si llamar o responder |
| `required` (o `any`) | Fuerza al menos una llama a herramienta |
| `none` | Desactiva herramientas |
| `{type:function, name: x}` | Obliga a llamar SIEMPRE a `x` (útil para extraer datos) |

Para **extracción estructurada**, `tool_choice` que fija una tool específica garantiza formato sin depender de la "voluntad" del modelo.

## 🧪 Structured outputs y validación con Pydantic/Zod

El LLM puede alucinar argumentos; valida la entrada/salida en tu código.

```python
# Pydantic valida el argumento antes de ejecutar la tool
from pydantic import BaseModel, ValidationError

class ClimaArgs(BaseModel):
    ciudad: str
    unidad: str = "celsius"

args = ClimaArgs(**json.loads(item.arguments))   # lanza error si no cumple el esquema
```

```ts
// Equivalente en TypeScript con Zod
import { z } from "zod";
const ClimaArgs = z.object({ ciudad: z.string(), unidad: z.string().optional() });
const args = ClimaArgs.parse(JSON.parse(item.arguments));
```

## 🔒 Seguridad e idempotencia

- **Allowlist de herramientas**: expón solo las que el agente puede tocar. Nunca dejes ejecutar comandos arbitrarios; usa una lista blanca de acciones.
- **Validar antes de ejecutar**: el LLM sugiere, tu código autoriza (permisos, sandbox).
- **Idempotencia**: que repetir la misma llamada no produzca efectos duplicados (inventarios, envíos). Fija un límite de iteraciones para evitar bucles.

```python
ALLOWLIST = {"get_weather", "db_read"}        # tools permitidas
if tool_name not in ALLOWLIST:
    raise PermissionError("Herramienta no permitida")
```

- **Límite de iteraciones**: un máximo (p. ej. 10 turnos) para que el agente no incurra en tokens/coste infinitos.

## 🔗 ¿Por qué MCP estandariza esto?

Cada proveedor tenía su formato de `tools`; **MCP** define el patrón herramienta-esquema-ejecución-resultado **una vez** y lo comparte entre agentes y herramientas.

```text
Tu código con tools (Este manual)  →  el patrón que MCP pone en el protocolo
```

MCP envuelve function calling + recursos + prompts en un protocolo abierto: defines el server una vez y cualquier cliente (Claude, IDEs, agentes) lo usa. Detalles en [MCP](./manual_mcp.md).

## ❓ FAQ

**❓ El LLM no llama a la herramienta cuando debe?**
➡ Mejora la descripción, di explícitamente cuándo usarla y baja `temperature`. Último recurso: `tool_choice` forzado.

**❓ ¿`auto` vs `required`?**
➡ `auto`: decide el modelo. `required`: fuerza al menos una. `{..., name}` fija una tool concreta.

**❓ ¿Cómo devuelvo el resultado?**
➡ Con `role: "tool"` y el `tool_call_id` (Chat Completions) o `function_call_output` (Responses) que devolvió el modelo.

**❓ ¿Parallel calls?**
➡ Sí, el modelo puede emitir varias `tool_calls` en un turno; ejecútalas en paralelo y devuelve cada resultado con su id.

**❓ ¿Y si el LLM devuelve argumentos inválidos?**
➡ Valida con Pydantic/Zod y vuelve a llamarlo con el error como contenido del resultado de la tool.

## 🔗 Enlaces
- [OpenAI Function calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Gemini Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Pydantic](https://docs.pydantic.dev/)
- [Zod](https://zod.dev/)

## 🧩 Ver también
- [MCP (protocolo estándar)](./manual_mcp.md)
- [Prompt Engineering](./manual_prompt_engineering.md)
- [Llamar a APIs de LLM](./manual_llm_apis.md)
- [Agentes con scripts](./manual_agent_scripts.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
