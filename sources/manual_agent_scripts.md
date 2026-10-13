# Agentes con scripts – Loop agente sin frameworks

El "loop agente" a mano (bash/Python) para entender el patrón, y cuándo conviene pasar a un framework. Incluye estado, costes, logs y seguridad.

> 🎯 **Nivel**: avanzado · **Requisitos**: [Function Calling](./manual_function_calling.md) · **Revisado**: octubre 2026

## 🧠 Idea central

Un agente es un bucle que **piensa, actúa y observa** hasta completar la tarea.

```text
while tarea_no_completa:
    1. LLM → decide qué tool llamar (o responde)
    2. Ejecutas la tool (bash, Python, API)
    3. Resultado → contexto del LLM
    4. Repetir (con límite de iteraciones)
```

## 🐍 Agente mínimo en Python (patrón puro)

```python
#!/usr/bin/env python3
import json, os, subprocess, sys
import requests

API    = "http://127.0.0.1:11434/api/chat"     # Ollama local (o cualquier API)
MODEL  = "llama3.3"
MAX_IT = 10                                     # límite de iteraciones (coste)

tools = {
    "bash": lambda cmd: subprocess.run(
        cmd, shell=True, capture_output=True, text=True).stdout,
}
ALLOWED = {"bash"}                              # allowlist de tools

def chat(messages):
    r = requests.post(API, json={"model": MODEL, "messages": messages,
                                 "stream": False})
    return r.json()["message"]

def agent(task):
    messages = [
        {"role": "system", "content":
         'Eres un agente con una tool "bash". Para usarla, responde JSON: '
         '{"tool":"bash","args":"comando"}. Luego recibirás el resultado. '
         "Continúa hasta completar la tarea."},
        {"role": "user", "content": task},
    ]
    for _ in range(MAX_IT):
        msg = chat(messages)
        try:
            tc = json.loads(msg["content"])
            if tc.get("tool") in ALLOWED:
                result = tools[tc["tool"]](tc["args"])
                messages.append({"role": "user",
                    "content": f"Resultado:\n{result}\nSigue con la tarea."})
                continue
        except json.JSONDecodeError:
            pass
        return msg["content"]                   # respuesta final
    return "Máximo de iteraciones alcanzado"

if __name__ == "__main__":
    print(agent(" ".join(sys.argv[1:])))
```

Uso: `python agente.py "dime todos los archivos .py de esta carpeta"`.

> 📌 Este ejemplo hereda el patrón de `eval`-like: ejecuta comandos a pelo. En producción **no** ejecutes comandos arbitrarios; validalos (allowlist de comandos, sandbox, timeouts). El loop en sí es lo que quieres aprender.

## 🔧 Tools típicas de un agente

```python
# Patrón: un dict / registro de funciones + una allowlist
tools = {
    "bash":   ejecutar_bash,
    "read":   leer_archivo,
    "write":  escribir_archivo,
    "search": buscar_en_directorio,
    "web":    curl_web,
    "ask":    preguntar_al_usuario,
    "python": ejecutar_python,
}
```

## ☁️ ¿Script propio o framework?

El loop "a mano" vale para **entender** el patrón y para casos triviales. En producción, un framework te da estado, retries, loggear y orquestación multi-agente de serie.

| Framework | Lenguaje | Cuándo | Docs |
|---|---|---|---|
| **Anthropic Agent SDK** | Python/TS | Ampliar Claude Code como agente, uso de Claude | [code.claude.com/docs/en/agent-sdk](https://code.claude.com/docs/en/agent-sdk/overview) |
| **OpenAI Agents SDK** | Python | Multi-agente, orquestación con tareas y guards | [openai.github.io/openai-agents-python](https://openai.github.io/openai-agents-python/) |
| **LangGraph** | Python | Grafos de estado complejos, control fino | [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/) |
| **PydanticAI** | Python | Tipado con Pydantic, validación de salida | [pydantic.dev/docs/ai](https://pydantic.dev/docs/ai/capabilities/overview) |
| **smolagents** | Python | Agentes mínimos con Hugging Face | [huggingface.co/docs/smolagents](https://huggingface.co/docs/smolagents/en/index) |
| **Mastra** | TypeScript | Full-stack TS, gráfico y MCP nativo | [mastra.ai/docs](https://mastra.ai/docs) |

> 📌 A fecha de oct. 2026 los frameworks citados tienen docs oficiales (enlaces en `## 🔗 Enlaces`). La elección es de "equilibrio": LangGraph y OpenAI Agents SDK son los más usados en producción; PydanticAI y smolagents optimizan sencillez/tipado; Mastra si ya estás en TS.

**¿Cuándo NO usar framework?** Para un one-shot (una llamada + llamar a 1-2 tools) un script directo es más limpio y sin dependencias. El framework empieza a rentar con estado, varios agentes o retries/guardas.

## 🧠 Estado y memoria

- No reinventes: reenvía el historial (mensajes) como contexto en cada turno.
- Memoria persistente (perfiles, resúmenes antiguos) es un problema de diseño de datos; resumir lo antiguo ahorra tokens.
- En frameworks, el "estado" suele ser un objecto del grafo; en scripts manuales, la lista de `messages`.

## 💰 Límites de coste y logs

- **Coste**: cada iteración reenvía todo el historial (≈ +tokens por vuelta). Fija `MAX_IT`, timeout por tool y presupuesto.
- **Logs y trazabilidad**: registra cada `tool_call` y su resultado con IDs de la conversación.

```python
# Registro mínimo: guarda los turnos para auditoría
import json
with open("agente.log", "a") as f:
    f.write(json.dumps({"turno": msg, "resultado": result}) + "\n")
```

## 🧪 Evaluación

- Golden set de tareas; comprueba si el agente las termina bien.
- Métricas: tasa de éxito, iteraciones usadas, coste por tarea.
- **LLM-as-judge** con rúbrica clara para tareas de texto abierto (con reservas; ver [Prompt Engineering](./manual_prompt_engineering.md)).

## 🔒 Seguridad

```text
✓ Sandbox (contenedor / permisos mínimos) si el agente ejecuta comandos
✓ Allowlist de tools y de comandos; nunca "haz lo que diga el prompt"
✓ Validar entradas del tool (Pydantic/Zod)
✓ Timeout por tool y límite de iteraciones global
✓ No exponer secretos al agente; usar variables de entorno
```

## ❓ FAQ

**❓ ¿Cuándo un agente vs un script normal?**
➡ Un script es determinista; un agente cuando no sabes de antemano los pasos.

**❓ ¿Evitar loops infinitos?**
➡ Máximo de iteraciones + timeout global por tool. Listo.

**❓ ¿Siempre responde sin usar tools?**
➡ Baja `temperature`, describe mejor las tools y usa `tool_choice`/allowlist para forzar el uso.

**❓ ¿Script o framework?**
➡ Script para aprender/prototipo; framework (LangGraph, OpenAI Agents SDK, PydanticAI...) para producción con estado y multi-agente.

## 🔗 Enlaces
- [Anthropic: Building agents](https://docs.anthropic.com/en/docs/build-with-claude/agentic)
- [OpenAI: Agents](https://platform.openai.com/docs/guides/agents)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Anthropic Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [PydanticAI](https://pydantic.dev/docs/ai/capabilities/overview)
- [smolagents](https://huggingface.co/docs/smolagents/en/index)
- [Mastra](https://mastra.ai/docs)

## 🧩 Ver también
- [Function Calling](./manual_function_calling.md)
- [MCP (estándar de tools)](./manual_mcp.md)
- [Agentes de coding IA](./manual_ai_coding_agents.md)
- [Prompt Engineering](./manual_prompt_engineering.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
