# LLM APIs – Llamar modelos desde la terminal

Guía práctica para llamar a las APIs de LLMs (OpenAI, Anthropic, Gemini, Groq, DeepSeek, OpenRouter) con `curl`: autenticación, cuerpo JSON, streaming, errores y buenas prácticas de claves.

> 🎯 **Nivel**: intermedio · **Requisitos**: `curl`, `jq`, conocer tu clave de API · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Conceptos comunes](#-conceptos-comunes)
- [Gestión segura de claves](#-gestión-segura-de-claves)
- [Parámetros clave](#-parámetros-clave)
- [OpenAI – **Responses API** (recomendada)](#-openai--responses-api-recomendada)
- [Anthropic (Claude) – Messages API](#-anthropic-claude--messages-api)
- [Google (Gemini) – generateContent](#-google-gemini--generatecontent)
- [Groq (open source, muy rápido)](#-groq-open-source-muy-rápido)
- [DeepSeek](#-deepseek)
- [OpenRouter (agregador)](#-openrouter-agregador)
- [Compatible OpenAI (Ollama local, vLLM, etc.)](#-compatible-openai-ollama-local-vllm-etc)
- [Streaming SSE con `curl -N`](#-streaming-sse-con-curl--n)
- [Herramientas y output estructurado](#️-herramientas-y-output-estructurado)
- [Errores y rate limits](#️-errores-y-rate-limits)
- [Contar tokens](#-contar-tokens)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 Conceptos comunes

Todas las APIs comparten la misma idea: una cabecera de clave, un POST con JSON `{model, messages}` y una respuesta JSON. El modelo y el *endpoint* cambian según el proveedor.

```bash
# Estructura genérica (ejemplo OpenAI)
curl https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $(echo $OPENAI_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.6-terra",
    "input": [{"role": "user", "content": "Hola"}]
  }'
```

## 🔑 Gestión segura de claves

- **Nunca** metas la clave en el código ni en el repositorio.
- Usa variables de entorno y haz que el proceso de arranque la lea.

```bash
export OPENAI_API_KEY="sk-..."   # y lo mismo con ANTHROPIC_API_KEY, GEMINI_API_KEY...
# Activa el guard pulgas en tu shell para no loguearla por accidente
# Añade tu .env a .gitignore si usas fichero de entorno
```

## 🎯 Parámetros clave

| Parámetro | Qué hace | Uso típico |
|---|---|---|
| `max_tokens` | Máximo de tokens a generar (obligatorio en Anthropic) | 1024 |
| `temperature` (0-2) | Creatividad. 0 = determinista | 0.1 código, 0.8 creativo |
| `top_p` (0-1) | Nucleus sampling, alternativa a temperature | 0.9 |
| `stream` | Respuesta token a token (SSE) | `true` para UX interactiva |
| `stop` | Secuencias que detienen la generación | `["\n\n"]` |
| `system` | Instrucciones de sistema | texto de rol |

## 🔴 OpenAI – **Responses API** (recomendada)

Desde 2025 OpenAI recomienda la **Responses API** para proyectos nuevos; Chat Completions sigue soportada pero en vía de migración. La Responses unifica chat, herramientas y estado.

```bash
curl https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $(echo $OPENAI_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.6-terra",
    "instructions": "Responde siempre en español.",
    "input": [{"role": "user", "content": "Explica MCP en 3 líneas"}],
    "max_output_tokens": 300
  }' | jq '.output_text'

# Listar modelos disponibles
curl -s https://api.openai.com/v1/models \
  -H "Authorization: Bearer $(echo $OPENAI_API_KEY)" | jq -r '.data[].id'
```

> 📌 A fecha de octubre 2026 coexisten la familia GPT-6 (frontera) y GPT-5.6 (equilibrio coste/calidad: `gpt-5.6-terra`, `gpt-5.6-luna`) y `gpt-5.4-mini`. Los nombres cambian con frecuencia: consulta la [página de modelos](https://platform.openai.com/docs/models) antes de fijar uno.

> 📌 **Estado.** Chat Completions (`/v1/chat/completions`) sigue funcionando pero OpenAI recomienda migrar a Responses para proyectos nuevos.

## 🟣 Anthropic (Claude) – Messages API

Los IDs de Claude son snapshots fijos. Modelos vigentes (oct. 2026): `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $(echo $ANTHROPIC_API_KEY)" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-5-5",
    "max_tokens": 1024,
    "system": "Responde en español, breve.",
    "messages": [{"role": "user", "content": "Explica MCP en 3 líneas"}]
  }' | jq '.content[0].text'
```

## 🟢 Google (Gemini) – generateContent

Modelos vigentes (oct. 2026): `gemini-3.1-pro-preview` (preview, frontera) y `gemini-3.6-flash` (stable, rápido).

```bash
export GEMINI_API_KEY="AIza..."
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "system_instruction": {"parts": [{"text": "Responde en español."}]},
    "contents": [{"parts": [{"text": "¿Qué puedes hacer?"}]}]
  }' | jq -r '.candidates[0].content.parts[0].text'
```

## 🟠 Groq (open source, muy rápido)

Single-tenant LPU: velocidad extrema sobre modelos open. La lista vigente está en su consola.

```bash
export GROQ_API_KEY="gsk_..."
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $(echo $GROQ_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hola"}]
  }' | jq '.choices[0].message.content'
```

## ⚫ DeepSeek

`deepseek-chat` y `deepseek-reasoner` se retiraron el **24 jul. 2026**. Los vigentes son `deepseek-v4-flash` y `deepseek-v4-pro` (1M de contexto, doble modo pensamiento/no-pensamiento).

```bash
export DEEPSEEK_API_KEY="sk-..."
curl https://api.deepseek.com/chat/completions \
  -H "Authorization: Bearer $(echo $DEEPSEEK_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [{"role": "user", "content": "Hola"}]
  }' | jq -r '.choices[0].message.content'
```

## 🌐 OpenRouter (agregador)

Un solo endpoint da acceso a cientos de modelos; el ID usa formato `proveedor/modelo`. Muy útil para comparar proveedores sin cambiar de SDK.

```bash
export OPENROUTER_API_KEY="sk-or-..."
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $(echo $OPENROUTER_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-5.5",
    "messages": [{"role": "user", "content": "Hola"}]
  }' | jq '.choices[0].message.content'
# Lista de modelos: https://openrouter.ai/models
```

## 📦 Compatible OpenAI (Ollama local, vLLM, etc.)

```bash
# Ollama local
curl http://127.0.0.1:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.3", "messages": [{"role": "user", "content": "Hola"}]}'
```

## 📡 Streaming SSE con `curl -N`

Con `stream: true` la respuesta llega línea a línea (Server-Sent Events). `-N` evita que `curl` espere al final.

```bash
curl -N https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $(echo $OPENAI_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.6-terra",
    "stream": true,
    "input": [{"role": "user", "content": "Cuenta hasta 3"}]
  }' | grep -i '"output_text"'     # te enseña los fragmentos de texto que llegan
# Ojo: los eventos llegan como "data: {...}"; Sepáralos y parsea cada línea
```

## 🛠️ Herramientas y output estructurado

```bash
# Llamar a una función definida por réplica (tool calling), payload OpenAI-style:
curl -s https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $(echo $OPENAI_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.6-terra",
    "input": [{"role": "user", "content": "¿Qué tiempo hace en Madrid?"}],
    "tools": [{
      "type": "function",
      "name": "get_weather",
      "description": "Clima de una ciudad",
      "parameters": {
        "type": "object",
        "properties": {"ciudad": {"type": "string"}},
        "required": ["ciudad"]
      }
    }]
  }' | jq '.output'
```

**Structured outputs / JSON Schema:** la mayoría de proveedores aceptan un esquema JSON y garantizan que la salida es JSON válido (`response_format` en Chat Completions, `text.format` en Responses, `response_json_schema` en Gemini).

## ⚠️ Errores y rate limits

| Código | Significado | Qué hacer |
|---|---|---|
| 401 | Clave inválida/ausente | Revisa la variable de entorno |
| 429 | Rate limit o saldo | `--retry`, espera, sube de plan |
| 400 | Payload malformado | Revisa esquema y tipos |
| 5xx | Fallo del proveedor | Reintenta con backoff |

Los rate limits y límites de tokens dependen del plan. Consulta la página de precios/límites de cada proveedor (precios: volátiles).

```bash
# Curl con reintentos y pausa
curl --retry 5 --retry-delay 3 --retry-all-errors \
  -H "Authorization: Bearer $(echo $OPENAI_API_KEY)" \
  https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-5.6-terra",
       "input": [{"role": "user", "content": "Hola"}]}'
```

## 💰 Contar tokens

```bash
pip install tiktoken
python -c "
import tiktoken
enc = tiktoken.encoding_for_model('gpt-5.6')   # usa el encoding del modelo/cercano
print(len(enc.encode('texto a contar')))"
```

## ❓ FAQ

**❓ ¿Cómo estimar costes?**
➡ `tokens_entrada × precio_entrada + tokens_salida × precio_salida`. Precios por millón de tokens: [openai.com/pricing](https://openai.com/pricing) (y equivalentes por proveedor).

**❓ ¿Diferencias entre `stream: false` y `stream: true`?**
➡ `false`: esperas a recibir todo el texto. `true`: recibes tokens en tiempo real (SSE, línea a línea).

**❓ ¿Por qué usar `jq` al final?**
➡ Para extraer solo el texto de la respuesta JSON; sin `jq` ves el JSON completo.

**❓ ¿Respuestas vs Chat Completions en OpenAI?**
➡ Usa **Responses** para proyectos nuevos (unifica chat, tools y estado). Chat Completions sigue disponible pero en vía de migración.

## 🔗 Enlaces
- [OpenAI API reference](https://platform.openai.com/docs/api-reference)
- [OpenAI Models](https://platform.openai.com/docs/models)
- [Anthropic Models](https://platform.claude.com/docs/en/models/overview)
- [Gemini Models](https://ai.google.dev/gemini-api/docs/models)
- [Groq Models](https://console.groq.com/docs/models)
- [DeepSeek API](https://api-docs.deepseek.com/)
- [OpenRouter API](https://docs.openrouter.ai/api)

## 🧩 Ver también
- [Prompt Engineering](./manual_prompt_engineering.md)
- [Function Calling](./manual_function_calling.md)
- [Ollama (local)](./manual_ollama.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
