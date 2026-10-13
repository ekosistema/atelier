# Ollama – LLMs locales en tu máquina

Ollama es una plataforma open source para descargar, ejecutar y servir LLMs de forma local con una API compatible con OpenAI. Es la vía más sencilla para probar modelos sin depender de la nube ni de una GPU potente.

> 🎯 **Nivel**: básico · **Requisitos**: nociones de terminal, ~8 GB de RAM libres · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Instalación](#-instalación)
- [Gestionar modelos](#-gestionar-modelos)
- [Ejecutar modelos](#-ejecutar-modelos)
- [API REST (servidor)](#️-api-rest-servidor)
- [Variables de entorno](#️-variables-de-entorno)
- [Modelfile – crear modelos personalizados](#️-modelfile--crear-modelos-personalizados)
- [Contexto, cuantización y VRAM](#-contexto-cuantización-y-vram)
- [Clientes desde código](#-clientes-desde-código)
- [Alternativas a Ollama](#-alternativas-a-ollama)
- [Local vs API en la nube](#️-local-vs-api-en-la-nube)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 Instalación

Versión de referencia: **Ollama 0.40.x** (oct. 2026).

```bash
# macOS
brew install ollama

# Linux (y Windows en WSL2)
curl -fsSL https://ollama.com/install.sh | sh

# Windows nativo: instalador desde ollama.com/download
ollama --version            # comprobar la versión instalada
```

## 📥 Gestionar modelos

`pull` descarga; `run` descarga si falta y abre chat interactivo.

```bash
ollama pull llama3.3        # modelo general (Meta). Consulta el registro para el vigente
ollama pull gemma3:2b       # pequeño y rápido (Google)
ollama pull qwen3:4b        # bueno para código (Alibaba)

ollama list                 # modelos descargados
ollama rm llama3.3          # eliminar un modelo (borra los pesos del disco)
ollama show llama3.3        # arquitectura, contexto, capas
```

> 📌 Los nombres y tamaños cambian a menudo. Mira la lista vigente en el [registro oficial](https://registry.ollama.ai/library) antes de `pull`.

## 💬 Ejecutar modelos

```bash
ollama run llama3.3                  # chat interactivo
ollama run gemma3:2b "dime un chiste"
ollama run llama3.3 --verbose        # tiempos y VRAM usada

# Parámetros de muestreo por invocación
ollama run llama3.3 --temperature 0.2 --top-p 0.9
```

## 🖥️ API REST (servidor)

`ollama serve` levanta el servidor en `http://127.0.0.1:11434`.

```bash
ollama serve                          # deja una terminal solo para esto

# Chat con mensajes (recomendado)
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "llama3.3",
  "messages": [
    {"role": "system", "content": "Responde siempre en español."},
    {"role": "user", "content": "¿Qué es un LLM?"}
  ],
  "stream": false
}'

# Generación simple
curl http://127.0.0.1:11434/api/generate -d '{
  "model": "llama3.3",
  "prompt": "Cuéntame algo interesante",
  "stream": false
}'

# Compatible con OpenAI: mismo contrato que /v1/chat/completions
curl http://127.0.0.1:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.3", "messages": [{"role": "user", "content": "Hola"}]}'
```

### Embeddings

```bash
curl http://127.0.0.1:11434/api/embed -d '{
  "model": "nomic-embed-text",
  "input": "El gato duerme en el sofá"
}' | jq '.embeddings | length'
# Equivalente compatible OpenAI: POST /v1/embeddings
```

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: el endpoint antiguo `/api/embeddings` se sustituyó por `/api/embed`, que usa `input` y devuelve `embeddings`. Usa `/api/embed` o `/v1/embeddings`.

## ⚙️ Variables de entorno

```bash
export OLLAMA_HOST="0.0.0.0:11434"    # exponer a la red local / cambiar puerto
export OLLAMA_MODELS="/ruta/carpeta"  # dónde se guardan los modelos
export OLLAMA_CONTEXT_LENGTH=8192     # contexto por defecto (tokens)
export OLLAMA_NUM_PARALLEL=4          # peticiones concurrentes
ollama serve                          # usa estas variables en cada arranque
```

## ⚙️ Modelfile – crear modelos personalizados

Es como un Dockerfile para LLMs: parte de un modelo base y le añades instrucciones y parámetros.

```dockerfile
FROM llama3.3

# System prompt por defecto
SYSTEM "Eres un experto en Python. Responde solo con código."

# Parámetros por defecto
PARAMETER temperature 0.1
PARAMETER top_p 0.95
PARAMETER num_ctx 8192                # tamaño de la ventana de contexto

# Plantilla de chat (usa la del modelo base si no la cambias)
TEMPLATE """{{- if .System }}<|system|>
{{ .System }}
{{- end }}<|user|>
{{ .Prompt }}
<|assistant|>"""
```

```bash
ollama create mi-experto -f Modelfile   # crea el modelo "mi-experto"
ollama run mi-experto                   # ya está disponible localmente
ollama show mi-experto --modelfile      # inspecciona qué incluye
```

## 📏 Contexto, cuantización y VRAM

- **`num_ctx`** controla el contexto: un contexto mayor consume mucha más VRAM (crece casi linealmente).
- **Q4_K_M** es el punto habitual: ~4 bits por peso, gran relación calidad/VRAM. Q8 o fp16 son más precisos pero duplican o cuadruplican la RAM.
- Referencia rápida de VRAM: un modelo de ~7B en Q4 ocupa ≈4-6 GB; uno de ~13B ≈8-10 GB; ~70B Q4 ≈40+ GB.

```bash
ollama run llama3.3 --num-ctx 32768     # contexto grande bajo demanda
ollama ps                               # modelos en memoria y su VRAM
ollama stop llama3.3                    # descargar de memoria para liberar VRAM
```

## 🔌 Clientes desde código

```python
import requests

r = requests.post("http://127.0.0.1:11434/api/chat", json={
    "model": "llama3.3",
    "messages": [{"role": "user", "content": "¿Qué es Ollama?"}],
    "stream": False,
})
print(r.json()["message"]["content"])
```

Reutiliza la librería oficial de OpenAI apuntando a Ollama como `base_url`; así compartes el mismo código entre nube y local:

```python
from openai import OpenAI
client = OpenAI(base_url="http://127.0.0.1:11434/v1", api_key="no-necesaria")
r = client.chat.completions.create(
    model="llama3.3",
    messages=[{"role": "user", "content": "Hola"}])
print(r.choices[0].message.content)
```

## 🧪 Alternativas a Ollama

| En su lugar | Cuándo | Nota |
|---|---|---|
| llama.cpp | Control fino y benchmarks | Muy rápido en CPU, más complejo |
| LM Studio | GUI de escritorio para probar GGUF | Cómodo en Windows/macOS/Linux |
| vLLM | Serving en servidor con mucha concurrencia | Estándar en producción (GPU dedicada) |
| MLX / `mlx-lm` | Apple Silicon optimizado | Ideal en Mac (GPU Metal) |
| text-generation-webui | Chat + entrenamiento con GUI | Muy usado en la comunidad |

## ⚖️ Local vs API en la nube

| Criterio | Local (Ollama) | API en la nube |
|---|---|---|
| Coste | Solo hardware (electricidad + GPU) | Pago por token (escala con el uso) |
| Privacidad | Los datos no salen de tu máquina | Los prompts viajan al proveedor |
| Latencia | Depende de tu GPU; sin red | Muy baja en origen, pero +red |
| Calidad | Modelos open, algo por detrás de los top | Modelos propietarios de frontera |
| Mantenimiento | Tú gestionas pesos, cuantización, VRAM | Lo hace todo el proveedor |

## ❓ FAQ

**❓ Cuánta RAM/VRAM necesito?**
➡ 2B-3B: 4-8 GB · 7B-8B: 8-16 GB · 13B+: 16-32 GB · 70B Q4: 40+ GB (idealmente GPU).

**❓ Diferencia entre `pull` y `run`?**
➡ `pull` solo descarga; `run` descarga si es necesario y abre chat.

**❓ ¿Uso GPU en macOS?**
➡ Metal (GPU de Apple) se activa automáticamente. Verifícalo con `ollama run llama3.3 --verbose`. En Apple Silicon, `mlx-lm` es la alternativa optimizada.

**❓ ¿Puedo usar modelos de Ollama con código que ya usa OpenAI?**
➡ Sí: apunta `base_url` de la librería OpenAI a `http://127.0.0.1:11434/v1`.

## 🔗 Enlaces
- [Ollama oficial](https://ollama.com/)
- [Registro de modelos](https://registry.ollama.ai/library)
- [Releases en GitHub](https://github.com/ollama/ollama/releases)
- [Docs de Modelfile](https://docs.ollama.com/modelfile/)
- [Compatibilidad con OpenAI](https://ollama.com/blog/openai-compatibility)

## 🧩 Ver también
- [Llamar a APIs de LLM](./manual_llm_apis.md)
- [Prompt Engineering](./manual_prompt_engineering.md)
- [Embeddings](./manual_embeddings.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
