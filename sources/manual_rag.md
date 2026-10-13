# RAG – Retrieval-Augmented Generation (práctico)

Técnica que combina recuperación de información con generación mediante LLMs para responder sobre documentos privados sin reentrenar el modelo. Actualizado a las prácticas vigentes de 2026.

> 🎯 **Nivel**: avanzado · **Requisitos**: haber leído [Embeddings](./manual_embeddings.md) · **Revisado**: octubre 2026

## 🧠 ¿Qué es RAG?

```text
Documentos → ingest → chunk → embed → store → retrieve → rerank → contexto + query → LLM → respuesta
```

**RAG naive** (solo vector + `top_k`) es un punto de partida válido pero fácilmente superable: recuperar los 3 chunks más cercanos por similitud no basta en producción. La versión práctica añade **recuperación híbrida**, **reranking** y **evaluación**.

## 📦 Stack mínimo (sin frameworks, para entenderlo)

```bash
pip install openai numpy
# O todo local con Ollama (embeddings + chat) y sqlite-vec
```

## 🔧 Pipeline completo en Python

```python
import openai, numpy as np

# 1. INGEST: leer el documento
texto = open("manual.txt").read()

# 2. CHUNK: partir en fragmentos con solape
def chunk_text(t, tamano=500, solape=50):
    return [t[i:i+tamano] for i in range(0, len(t), tamano - solape)]
chunks = chunk_text(texto)

# 3. EMBED: vectorizar cada fragmento
def embed(t):
    r = openai.embeddings.create(model="text-embedding-3-small", input=[t])
    return r.data[0].embedding
CHUNKS = chunks
VECT   = [embed(c) for c in chunks]        # normaliza si tu modelo no lo hace

# 4. STORE: en memoria (en producción: pgvector, Qdrant, Chroma...)
# 5. RETRIEVE (híbrido: vectorial + BM25)
from sklearn.feature_extraction.text import TfidfVectorizer
vec = TfidfVectorizer().fit_transform(chunks)          # BM25 simplificado

def buscar(query, top_k=5):
    q = np.array(embed(query))
    scores = [np.dot(q, np.array(v)) for v in VECT]    # vectores normalizados
    idx = np.argsort(scores)[-top_k:][::-1]
    return [CHUNKS[i] for i in idx]                    # top_k vectorial

# 6. RERANK: un cross-encoder reordena los candidatos recuperados
#   (usa un modelo tipo bge-reranker; aquí solo indicamos el patrón)

# 7. GENERATE
def preguntar(query):
    contexto = "\n\n---\n\n".join(buscar(query))
    r = openai.responses.create(
        model="gpt-5.6-terra",
        instructions=("Responde usando SOLO el contexto. "
                      "Si no encuentras la respuesta, di que no la sabes."),
        input=[{"role": "user",
                "content": f"Contexto:\n{contexto}\n\nPregunta: {query}"}])
    return r.output_text

print(preguntar("¿Qué dice sobre la instalación?"))
```

## 🧩 Recuperación híbrida (BM25 + vectorial)

La similitud vectorial captura semántica pero falla con nombres/IDs exactos; BM25 (léxico) captura coincidencias exactas. Combina ambos y fusiona resultados (fusion rank / RRF).

```python
# RRF: combinar dos rankings por posición
def rrf(lista_a, lista_b, k=60):
    score = {}
    for lista in (lista_a, lista_b):
        for i, item in enumerate(lista):
            score[item] = score.get(item, 0) + 1 / (k + i + 1)
    return sorted(score, key=score.get, reverse=True)
```

## 🎯 Reranking con cross-encoders

- El embedding (bi-encoder) es rápido pero aproximado; recupera candidatos.
- Un **reranker cross-encoder** puntúa cada (consulta, documento) conjuntamente y es más preciso. Reordena los ~10-20 recuperados y deja los 3-5 mejores.
- Fronts: `BGE-reranker`, modelos de Cohere (`rerank`) y de Voyage (`rerank-2`).

```python
# Patrón tras recuperar candidatos:
candidatos = buscar(query, top_k=20)
#   → reranker puntúa cada (query, doc) y selecciona top 3-5
#   → esos pasan como contexto al LLM
```

## 🧩 Contextual retrieval y parent-document

- **Contextual retrieval**: al indexar cada chunk, añade una frase de contexto global del documento para que el embedding no pierda el significado.
- **Parent-document retrieval**: recupera el *chunk hijo* para encontrar la pertinencia, pero devuelve al LLM el *bloque padre* más largo (sección/completo) para que la respuesta tenga contexto de sobra.

## 🧪 Evaluar calidad RAG

```bash
pip install ragas
```

| Métrica | Qué mide |
|---|---|
| **Context precision** | ¿Lo recuperado es relevante para la pregunta? |
| **Context recall** | ¿Se recuperaron todos los fragmentos relevantes? |
| **Faithfulness** | ¿La respuesta se sostiene solo con el contexto? |
| **Answer relevance** | ¿La respuesta responde a lo preguntado? |

`ragas` evalúa con LLMs en un dataset de preguntas reales:

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
# resultado = evaluate(dataset, metrics=[faithfulness, context_precision, ...])
```

## ⚠️ Cuándo NO usar RAG

| Caso | Alternativa | Por qué |
|---|---|---|
| El "documento" cabe en el contexto | Prompt directo / agentic search | Menos piezas = menos fallos |
| Necesitas razonar sobre muchos docs a la vez | Contexto largo / **agentic search + MCP** | RAG pega trozos, el agente explora |
| Estilo/tono/forma estable y repetida | **Fine-tuning** | Aprende comportamiento, no datos |
| Respuestas que deben citar fuentes | RAG bien hecho | Aquí sí RAG con metadatos de fuente |

> 📌 En 2026 los modelos con contexto de 1M tokens redujeron el caso de uso "Solo cabe el PDF entero". RAG sigue ganando cuando el corpus es grande, se actualiza o tienes que restringir el acceso; el **agentic search** (herramientas de búsqueda + razonamiento, vía [MCP](./manual_mcp.md)) es la alternativa para preguntas abiertas sobre muchos documentos.

## ❓ FAQ

**❓ RAG vs fine-tuning?**
➡ RAG da conocimiento actual y citable; fine-tuning enseña comportamiento estable. No compiten, se combinan.

**❓ ¿Cómo mejorar la búsqueda?**
➡ 1) Recuperación híbrida (BM25+vectorial), 2) reranker cross-encoder, 3) chunking semántico, 4) filtros por metadatos.

**❓ Mi RAG devuelve irrelevantes?**
➡ Sube calidad del embedding, baja el chunk size, usa reranker, o muy arriba: revisa el retrieval con `context_precision`, no aspirando al azar.

**❓ ¿Vale la pena la "RAG naive"?**
➡ Como punto de partida sí; no la lleves a producción sin híbrido + rerank + evals.

**❓ ¿Cuándo uso un vector store?**
➡ Para el corpus persistido elegirás un store (pgvector/Qdrant/Chroma...) según dónde viva ya tu dato; ver [Embeddings](./manual_embeddings.md).

## 🔗 Enlaces
- [OpenAI RAG guide](https://platform.openai.com/docs/guides/rag)
- [Anthropic Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [Ragas](https://docs.ragas.io/)
- [MTEB (embeddings)](https://huggingface.co/spaces/mteb/leaderboard)
- [Voyage rerank](https://docs.voyageai.com/)

## 🧩 Ver también
- [Embeddings](./manual_embeddings.md)
- [Prompt Engineering](./manual_prompt_engineering.md)
- [Function Calling](./manual_function_calling.md)
- [MCP](./manual_mcp.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
