# Embeddings y búsqueda semántica

Qué son los embeddings, cómo obtenerlos (API y local), cómo medir similitud, cómo partir documentos en fragmentos y qué vector store elegir para cada caso.

> 🎯 **Nivel**: intermedio · **Requisitos**: nociones de vectores y Python · **Revisado**: octubre 2026

## 📐 ¿Qué es un embedding?

Un **embedding** es un vector de números que representa el *significado* de un texto: frases con sentido parecido quedan cerca (similitud alta), aunque no compartan palabras.

```text
"El perro corre en el parque"  → [0.12, -0.34, 0.02, ...]   (dimensión D)
"Un can juega al aire libre"   → [0.11, -0.33, 0.01, ...]   (cerca)
"Hoy hace sol, vamos a la playa" → [0.52, 0.11, ...]         (lejos)
```

- **Dimensión**: típicamente 384-3072. Más dimensión = más capacidad (y más memoria/latencia).
- **Normalización**: dividir el vector por su norma L2 hace que la **similitud coseno == producto punto**, más rápido de calcular.
- **Modelos**: uno por idioma/dominio; los multilingües sirven para varias lenguas.

## 🔢 Obtener embeddings (APIs)

Modelos vigentes (oct. 2026): OpenAI `text-embedding-3-small` (1536 dim) y `text-embedding-3-large` (3072 dim), reducibles a 512/256/1024 vía parámetro `dimensions`.

```bash
export OPENAI_API_KEY="sk-..."
# text-embedding-ada-002 quedó como legacy; los text-embedding-3-* son los vigentes
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $(echo $OPENAI_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "El gato duerme en el sofá"
  }' | jq '.data[0].embedding | length'   # imprime la dimensión
```

Otros buenos modelos (oct. 2026):

| Modelo | Proveedor | Dimensión | Nota |
|---|---|---|---|
| `text-embedding-3-small` | OpenAI | 1536 (o 512) | Default general (relación calidad/coste) |
| `text-embedding-3-large` | OpenAI | 3072 (o 1024/256) | Mejor calidad del catálogo OpenAI |
| `voyage-3` (familia) | Voyage AI | según variante | Muy bueno en retrieval, multimodal |
| `BGE-M3` | BAAI | 1024 | Multilingüe (170+ idiomas), dense+sparse |
| `embed-v4.0` | Cohere | seg. variante | Multimodal (texto e imagen) |

> 📌 Los nombres de modelos cambian a menudo. Consulta la [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard) para comparar calidad y la página de modelos de cada proveedor antes de decidir.

### Modelos locales

- **Ollama**: `nomic-embed-text` (768 dim), `all-minilm`, `mxbai-embed-large`. Última versión: `nomic-embed-text-v1.5`.
- **`sentence-transformers`** (Python): cargas cualquier modelo de Hugging Face localmente.
- **`fastembed`** (Qdrant): embeddings localmente en formato ONNX, muy rápido.

```bash
pip install fastembed
python -c "
from fastembed import TextEmbedding
emb = TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')  # 384 dim
v = list(emb.embed(['El gato duerme en el sofá']))[0]
print(len(v))"
```

## 📏 Similitud coseno

```python
import numpy as np

def similitud_coseno(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Con vectores ya normalizados, el producto punto basta (más rápido):
def producto_punto(a, b):
    return np.dot(a, b)
```

## ✂️ Chunking (partir documentos)

Los modelos de embedding tienen límite de tokens por entrada; los documentos largos se cortan en fragmentos.

```python
# Chunking por caracteres con solape
def chunk_text(texto, tamano=500, solapamiento=50):
    chunks = []
    for i in range(0, len(texto), tamano - solapamiento):
        chunks.append(texto[i:i + tamano])
    return chunks

# Consejos: respeta límites de párrafo cuando puedas (chunking semántico/por secciones)
# y guarda metadatos (fuente, sección) en cada chunk para filtrar después.
```

## 💾 Vector stores: cuál usar

| Store | Tipo | Ideal para | Nota |
|---|---|---|---|
| **FAISS** | Librería Python (en mémoire) | Prototipos, búsqueda en RAM, rápido | Sin persistencia de logica de negocio |
| **Chroma** | Local, embebible | Dev, RAG ligero | Simple, persistente, Python nativo |
| **sqlite-vec** | Extensión SQLite | Datos que ya viven en SQLite | Sucesor de `sqlite-vss`, sin servicios extra |
| **pgvector** | Extensión PostgreSQL | RAG donde ya usas Postgres | Añade HNSW e híbrido con SQL |
| **Qdrant** | Servidor dedicado | Producción a escala, filtros | Muy completo, soporta filters |
| **LanceDB** | Columnar embebible | Grandes volúmenes, datos multimodales | Corre sobre object storage |

**pgvector con índice HNSW** (escala bien): crea el índice en vez de hacer scan lineal.

```sql
CREATE EXTENSION vector;                          -- habilita el tipo de dato
CREATE TABLE docs (id bigserial, chunk text, emb vector(1536));

-- Índice HNSW para búsqueda aproximada rápida
CREATE INDEX ON docs USING hnsw (emb vector_cosine_ops);

-- Búsqueda por similitud
SELECT chunk FROM docs ORDER BY emb <=> $1 LIMIT 5;   -- distancia coseno
```

## 🔍 Ejemplo Python mínimo (todo el flujo)

```python
import numpy as np

def buscar(query, vectores, chunks, top_k=3):
    qv = np.array(query)                    # supón que ya tienes el embedding
    scores = [np.dot(qv, np.array(v)) for v in vectores]   # vectores normalizados
    idx = np.argsort(scores)[-top_k:][::-1]
    return [(chunks[i], scores[i]) for i in idx]

# Flujo: documento → chunking → embed → guardar → buscar → pasar a la LLM
# (el paso de "contexto → LLM" es el RAG, ver manual_rag.md)
```

## ⚠️ Errores frecuentes

- **No normalizar**: si no normalizas, coseno ≠ dot product y los scores no son comparables.
- **Batch sin límite**: envía los textos por lotes (p. ej. ≤ 100-1k según proveedor); paginas 429.
- **Ignorar límites de tokens**: un texto demasiado largo se trunca o se rechaza; haz chunking antes.
- **Idioma equivocado**: un modelo inglés pierde calidad en español; usa multilingüe para corpora mixtos.
- **Filtrar por metadatos**: sin tags de fuente/sección no puedes restringir la búsqueda a un subconjunto.

## ❓ FAQ

**❓ ¿Más dimensiones es siempre mejor?**
➡ No. Más dimensión = más precisión, pero más memoria/latencia. 384-768 bastan para la mayoría.

**❓ ¿Embedding vs modelo de chat?**
➡ Embeddings producen vectores (para búsqueda); los modelos de chat producen texto (para respuestas). Se complementan.

**❓ ¿Cómo normalizo?**
➡ Divide cada componente por la norma L2 del vector. Con vectores normalizados, coseno = producto punto.

**❓ ¿Chunk muy pequeño o muy grande?**
➡ Muy pequeño pierde contexto; muy grande supera el límite y diluye el significado. 300-800 tokens con solape es un buen punto de partida.

## 🔗 Enlaces
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Voyage AI](https://docs.voyageai.com/)
- [Cohere Embed](https://docs.cohere.com/)
- [BGE-M3 (Hugging Face)](https://huggingface.co/BAAI/bge-m3)
- [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard)
- [pgvector](https://github.com/pgvector/pgvector)
- [sqlite-vec](https://github.com/asg017/sqlite-vec)

## 🧩 Ver también
- [RAG (práctico)](./manual_rag.md)
- [Prompt Engineering](./manual_prompt_engineering.md)
- [PostgreSQL](./manual_postgresql.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
