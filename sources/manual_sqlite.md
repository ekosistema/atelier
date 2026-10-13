# SQLite – Base de datos embebida en un fichero

Motor SQL sin servidor: toda la base de datos vive en un único fichero. Ideal para aplicaciones locales, móviles y de escritorio, herramientas CLI, prototipos y servicios con carga moderada de escritura.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: SQL básico ([manual de SQL](./manual_sql.md)) · **Revisado**: noviembre 2026

> 📌 **Versiones mínimas por función**: `RETURNING` (SQLite 3.35.0), tablas `STRICT` (3.37.0) y operadores JSON `->` / `->>` (3.38.0). Comprueba tu versión con `sqlite3 --version` o `SELECT sqlite_version();`. Las librerías de distintos lenguajes pueden incluir una versión más antigua que la de tu sistema.

## 🔧 Instalación y uso del CLI

```bash
# macOS
brew install sqlite
# Debian/Ubuntu
sudo apt install sqlite3
# Windows: descarga las "command-line tools" de https://www.sqlite.org/download.html
# (o usa sqlite3 dentro de WSL2)

sqlite3 app.db                  # abre (o crea) el fichero
sqlite3 app.db "SELECT count(*) FROM usuarios;"   # una consulta y salir
```

```sql
-- Comandos del shell (empiezan por punto, no llevan ;)
.help
.tables                         -- tablas
.schema usuarios                -- DDL de una tabla
.headers on
.mode column                    -- también: csv, json, markdown, table
.read esquema.sql               -- ejecutar un fichero SQL
.import datos.csv usuarios --csv   -- importar CSV
.output salida.csv              -- redirigir resultados a un fichero
.quit
```

## ⚙️ PRAGMAs recomendados al abrir cada conexión

Algunos comportamientos importantes **no están activos por defecto** y se configuran por conexión:

```sql
PRAGMA journal_mode = WAL;      -- escrituras no bloquean a los lectores (el modo por defecto es DELETE)
PRAGMA foreign_keys = ON;       -- las claves foráneas NO se aplican si no lo activas
PRAGMA busy_timeout = 5000;     -- espera hasta 5 s si la base está bloqueada, en vez de fallar al instante
PRAGMA synchronous = NORMAL;    -- combinación habitual con WAL: menos fsync, durabilidad razonable
```

- `journal_mode=WAL` es persistente (queda guardado en el fichero); los demás PRAGMAs se aplican a cada conexión, así que ponlos en el código que abre la base.
- Si SQLite no puede convertir a WAL (p. ej. en ciertos sistemas de ficheros), el modo no cambia. Más en la [documentación de WAL](https://www.sqlite.org/wal.html) y de [claves foráneas](https://www.sqlite.org/foreignkeys.html).
- En modo WAL aparecen ficheros `-wal` y `-shm` junto a la base: forman parte de ella.

## 🧱 Esquema y tipos

SQLite usa **tipado flexible** por defecto (el tipo de la columna es una «afinidad», no una restricción). Las tablas `STRICT` imponen los tipos:

```sql
CREATE TABLE usuarios (
  id         INTEGER PRIMARY KEY,           -- alias del rowid, autoincremental
  email      TEXT    NOT NULL UNIQUE,
  nombre     TEXT    NOT NULL,
  activo     INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  creado_en  TEXT    NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE pedidos (
  id          INTEGER PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  total       REAL    NOT NULL
) STRICT;

CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
```

Tipos permitidos en `STRICT`: `INT`, `INTEGER`, `REAL`, `TEXT`, `BLOB`, `ANY`. No hay tipo fecha ni booleano: guarda fechas como `TEXT` (ISO 8601) o `INTEGER` (epoch) y booleanos como `0/1`.

## ✍️ Consultas útiles

```sql
-- UPSERT
INSERT INTO usuarios (email, nombre) VALUES ('ana@example.com', 'Ana')
ON CONFLICT(email) DO UPDATE SET nombre = excluded.nombre;

-- RETURNING: obtener el id o las filas afectadas sin otra consulta
INSERT INTO usuarios (email, nombre) VALUES ('luis@example.com', 'Luis') RETURNING id;
DELETE FROM pedidos WHERE total = 0 RETURNING *;

-- Fechas
SELECT date('now'), datetime('now', '-7 days'), strftime('%Y-%m', creado_en) FROM usuarios;

-- Plan de ejecución
EXPLAIN QUERY PLAN SELECT * FROM pedidos WHERE usuario_id = 1;

-- Transacciones
BEGIN;
UPDATE usuarios SET activo = 0 WHERE id = 7;
COMMIT;   -- o ROLLBACK;
```

## 🧾 JSON

```sql
CREATE TABLE eventos (id INTEGER PRIMARY KEY, datos TEXT NOT NULL) STRICT;
INSERT INTO eventos (datos) VALUES ('{"tipo":"login","usuario":{"id":7,"pais":"ES"}}');

SELECT json_extract(datos, '$.usuario.pais') FROM eventos;   -- función clásica
SELECT datos ->> '$.tipo' FROM eventos;                      -- operador ->> (devuelve valor SQL)
SELECT datos ->  '$.usuario' FROM eventos;                   -- operador -> (devuelve JSON)

CREATE INDEX idx_evento_tipo ON eventos (json_extract(datos, '$.tipo'));   -- índice sobre expresión
```

Desde 3.38 JSON viene integrado y activado por defecto.

## 🔎 Búsqueda de texto: FTS5

```sql
CREATE VIRTUAL TABLE docs USING fts5(titulo, cuerpo);
INSERT INTO docs VALUES ('Guía de Docker', 'Contenedores, redes y volúmenes');

SELECT titulo FROM docs WHERE docs MATCH 'contenedores';
SELECT titulo, bm25(docs) AS relevancia FROM docs WHERE docs MATCH 'redes' ORDER BY relevancia;
```

Para búsqueda vectorial existe la extensión `sqlite-vec` (sustituta de la abandonada `sqlite-vss`, ver la [tabla de estado](../README.md#-estado-del-software-octubre-2026)).

## 💾 Copias de seguridad

```sql
.backup copia.db                 -- copia consistente desde el shell (también con la base en uso)
VACUUM INTO 'compacta.db';       -- copia compactada, desde SQL
.dump                            -- volcado SQL completo (texto)
```

```bash
sqlite3 app.db ".backup 'copia.db'"
sqlite3 app.db .dump > volcado.sql && sqlite3 nueva.db < volcado.sql   # restaurar desde SQL
```

> No copies el fichero `.db` con `cp` mientras una aplicación escribe, sobre todo en WAL (existen `-wal` y `-shm`): puedes obtener una copia corrupta. Usa `.backup` o `VACUUM INTO`.

## ⚖️ Límites y cuándo elegir otra cosa

| SQLite encaja si… | Mejor PostgreSQL/otro si… |
|---|---|
| Un solo proceso o pocos, en la misma máquina | Muchos clientes remotos escribiendo a la vez |
| Lecturas abundantes y escrituras moderadas | Escrituras concurrentes muy altas |
| Quieres cero administración y un fichero que copiar | Necesitas roles, replicación o conexión por red |

- Solo hay **un escritor a la vez** (WAL permite lectores simultáneos).
- No pongas la base en un sistema de ficheros de red (NFS/SMB): el bloqueo no es fiable.
- Compara con [PostgreSQL](./manual_postgresql.md) para servicios multiusuario.

## ❓ FAQ

**❓ `database is locked`.**
➡ Otra conexión mantiene un bloqueo de escritura. Usa WAL, `busy_timeout`, transacciones cortas y evita transacciones abiertas durante mucho tiempo.

**❓ Mis claves foráneas no se aplican.**
➡ `PRAGMA foreign_keys = ON` debe ejecutarse en cada conexión nueva.

**❓ ¿Por qué acepta un texto en una columna INTEGER?**
➡ Tipado flexible. Declara la tabla `STRICT` (3.37+) para que lo rechace.

**❓ ¿Cómo veo el esquema completo?**
➡ `.schema` en el shell o `SELECT sql FROM sqlite_master;`.

## 🔗 Enlaces
- [Documentación de SQLite](https://www.sqlite.org/docs.html)
- [Write-Ahead Logging](https://www.sqlite.org/wal.html)
- [Claves foráneas](https://www.sqlite.org/foreignkeys.html)
- [PRAGMA](https://www.sqlite.org/pragma.html)
- [Historial de versiones](https://sqlite.org/changes.html)

## 🧩 Ver también
- [SQL](./manual_sql.md) · [PostgreSQL](./manual_postgresql.md) · [Embeddings](./manual_embeddings.md) · [Redis](./manual_redis.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
