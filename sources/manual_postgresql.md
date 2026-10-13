# PostgreSQL – Base de datos relacional robusta y extensible

Sistema de gestión de bases de datos relacional open source con fuerte cumplimiento del estándar SQL, JSON, indexación avanzada, particionado y extensiones. Ideal como almacén principal de aplicaciones web y analíticas.

> 🎯 **Nivel**: intermedio · **Requisitos**: acceso al servidor y a `psql` · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Instalación](#-instalación)
- [Roles, permisos y autenticación](#-roles-permisos-y-autenticación)
- [psql y metacomandos](#️-psql-y-metacomandos)
- [`EXPLAIN` y `pg_stat_statements`](#-explain-y-pg_stat_statements)
- [Indexación según el acceso](#-indexación-según-el-acceso)
- [Particionado](#-particionado)
- [JSON y JSONB](#-json-y-jsonb)
- [Extensiones](#-extensiones)
- [Mantenimiento](#-mantenimiento)
- [Backups lógicos: `pg_dump` / `pg_restore`](#-backups-lógicos-pg_dump--pg_restore)
- [Backups físicos y PITR: pgBackRest y WAL-G](#️-backups-físicos-y-pitr-pgbackrest-y-wal-g)
- [Pooling de conexiones con PgBouncer](#-pooling-de-conexiones-con-pgbouncer)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 Instalación

Usa el repositorio oficial de PostgreSQL, no el paquete antiguo de tu distribución.

```bash
# Debian / Ubuntu
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
sudo wget -O /etc/apt/trusted.gpg.d/postgresql.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
sudo apt update && sudo apt install postgresql

# macOS
brew install postgresql@18

# RHEL / Fedora
sudo dnf install postgresql-server
```

```bash
sudo systemctl enable --now postgresql        # iniciar servidor (Debian/Ubuntu)
sudo -i -u postgres psql                       # conectarse como superusuario postgres
```

### Versión mayor actual

> 📌 **Estado.** La versión mayor actual es **PostgreSQL 18** (liberada el 25 sep. 2025; minor 18.6 a oct. 2026; soporte hasta el 14 nov. 2030). Cada versión mayor recibe **5 años** de soporte oficial. A oct. 2026 tienen soporte activo **15, 16, 17 y 18**. Usa siempre la última minor de tu mayor.

```bash
psql --version   # o: SELECT version();
```

## 👤 Roles, permisos y autenticación

```sql
CREATE ROLE dev LOGIN PASSWORD 'clave';      -- usuario con login
ALTER ROLE dev CREATEDB;                     -- permite crear bases de datos
GRANT ALL PRIVILEGES ON DATABASE mi_bd TO dev;
GRANT SELECT, INSERT, UPDATE ON tabla TO dev;   -- permisos a nivel de objeto
\du                                            -- listar roles
DROP ROLE dev;
```

Según práctica mínima: roles de **solo lectura** frente a los de **escritura**, y nunca conectarse como `postgres` desde la aplicación. Autentica por contraseña o certificado en lugar de `trust`.

```bash
# postgresql.conf / pg_hba.conf  (Deja conexiones remotas solo en redes confiables)
listen_addresses = '*'         # en postgresql.conf
# pg_hba.conf:  host all all 192.168.1.0/24 scram-sha-256
sudo systemctl restart postgresql
```

## 🖥️ psql y metacomandos

```bash
psql -h localhost -U dev mi_bd       # conectar
psql -c "SELECT 1;"                  # ejecutar una consulta sin modo interactivo
```

```sql
\l        -- listar bases de datos
\c mi_bd  -- cambiar de base de datos
\dt       -- listar tablas
\d pedidos -- describir una tabla
\di       -- listar índices
\dn       -- listar esquemas
\x        -- vista expandida (filas verticales)
\q        -- salir
```

## 📊 `EXPLAIN` y `pg_stat_statements`

```sql
EXPLAIN SELECT * FROM usuarios WHERE email='x@ej.com';            -- plan (sin ejecutar)
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM usuarios WHERE email='x@ej.com';
```

`ANALYZE` ejecuta la consulta y muestra tiempos reales; `BUFFERS` añade lecturas de caché/disco. Busca `Seq Scan` en tablas grandes → falta un índice. `(FORMAT JSON)` para exportar el plan.

[Módulo para medir consultas lentas](https://www.postgresql.org/docs/current/pgstatstatements.html): precarga `pg_stat_statements` en `shared_preload_libraries = 'pg_stat_statements'` y reinicia:

```sql
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
```

## ⚡ Indexación según el acceso

```sql
CREATE INDEX idx_usuarios_email ON usuarios (email);               -- B-tree (por defecto)
CREATE INDEX idx_productos_titulo ON productos USING GIN (to_tsvector('spanish', titulo)); -- texto completo
CREATE INDEX idx_usuarios_act ON usuarios (activo) WHERE activo;   -- índice parcial
CREATE INDEX idx_pedidos_datos ON pedidos USING GIN (datos jsonb); -- JSONB
```

| Tipo | Uso |
|---|---|
| B-tree (estándar) | igualdad, rango, ordenación |
| **GIN** | texto completo, arrays, JSONB `@>` |
| **GiST** | búsqueda geométrica y por proximidad, trigramas |
| **BRIN** | tablas muy grandes y ordenadas por una columna (p. ej. timestamps) |

```sql
ANALYZE;                          -- refresca estadísticas para el planificador
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;  -- verifica si el índice se usa
```

## 🧩 Particionado

```sql
CREATE TABLE logs (id BIGINT, fecha DATE) PARTITION BY RANGE (fecha);

CREATE TABLE logs_2026 PARTITION OF logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE logs_viejos PARTITION OF logs FOR VALUES FROM (MINVALUE) TO ('2026-01-01');
```

Ventaja: consultas por rango (p. ej. un año) tocan una sola partición, y puedes vaciar datos viejos con un simple `DROP PARTITION` (con detach-manteniéndolo si es preciso).

## 🧾 JSON y JSONB

```sql
SELECT datos->>'nombre' AS nombre, datos->'dir'->>'ciudad' AS ciudad
FROM perfiles WHERE datos @> '{"activo": true}';
```

- `jsonb` valida, normaliza y permite indexar con GIN; consúltalo casi siempre.
- Funciones: `jsonb_build_object`, `jsonb_set`, `to_jsonb`, `jsonb_path_query`.

## 🔌 Extensiones

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- criptografía: pgp_sym_encrypt, crypt()
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- búsqueda con LIKE/ILIKE rápida (GIN trigramas)
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector: búsqueda por similitud de embeddings
```

```sql
SELECT gen_random_uuid();                   -- UUID v4 (integrado desde PG 13, sin extensión)
SELECT crypt('secreto', gen_salt('bf'));    -- hash seguro con pgcrypto
```

> 🧪 **Alternativa moderna**: `gen_random_uuid()` integrado en lugar de `uuid-ossp`/`uuid_generate_v4()`. Y `uuidv7()` (PG 18) para IDs ordenables por tiempo.

## 🧹 Mantenimiento

```sql
VACUUM;            -- recupera espacio de filas borradas
VACUUM ANALYZE;    -- + actualiza estadísticas
ANALYZE;           -- solo estadísticas
REINDEX TABLE usuarios;
```

En producción el autovacuum se encarga solo; solo interviene en casos concretos (tablas muy activas, índices corruptos).

## 💾 Backups lógicos: `pg_dump` / `pg_restore`

```bash
pg_dump mi_bd > backup.sql                     # dump en texto (SQL)
pg_dump -Fc mi_bd > backup.dump                # formato custom con compresión
pg_dump -Fc -j 8 -d mi_bd > backup.dump        # paralelo (solo -Fc)
pg_restore -d mi_bd backup.dump                # restaurar
pg_dump --schema-only mi_bd > esquema.sql      # solo estructura
```

El dump lógico sirve para bases pequeñas o migraciones entre versiones; **no** da recuperación punto-en-el-tiempo (PITR) ni sirve a gran escala.

## 🛡️ Backups físicos y PITR: pgBackRest y WAL-G

Para producción, combina **base backup** + **archivado continuo de WAL**: así restauras a cualquier instante (PITR).

```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'pgbackrest --stanza=main archive-push %p'
```

```bash
pgbackrest --stanza=main backup --type=full       # backup completo
pgbackrest --stanza=main backup --type=diff       # incremental respecto al full
pgbackrest --stanza=main info
pgbackrest --stanza=main --type=time --target="2026-10-01 14:30:00 UTC" restore  # PITR
```

| Herramienta | Fortaleza | Licencia |
|---|---|---|
| [pgBackRest](https://pgbackrest.org/) | Completa: full/diff/incr en paralelo, cifrado AES-256, multi-repo, S3/GCS/Azure | MIT |
| [WAL-G](https://github.com/wal-g/wal-g) | Nube nativo (S3/GCS/Azure/B2), binario único en Go, ideal para Kubernetes | Apache-2.0 |
| `pg_basebackup` + archivado WAL | Integrado; correcto para casos sencillos | PostgreSQL |

> 📌 **Estado**: pgBackRest, que en abril de 2026 anunció una pausa temporal por financiación, sigue activo con el respaldo de una coalición de patrocinadores (v2.59.2, sep. 2026). WAL-G (3.0.9) cubre el caso cloud nativo. Restaura periódicamente en un servidor de pruebas para validar tus backups.

## 🔀 Pooling de conexiones con PgBouncer

Cuando muchas aplicaciones se conectan, evita agotar las conexiones del servidor con un pooler ligero.

```ini
# /etc/pgbouncer/pgbouncer.ini  (PgBouncer 1.26.0, sep. 2026)
[databases]
mi_bd = host=127.0.0.1 port=5432 dbname=mi_bd
[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = scram-sha-256
pool_mode = transaction        # recomendado: sueltas la conexión al acabar cada transacción
max_client_conn = 1000
default_pool_size = 50
```

```bash
# .userlist.txt  (credenciales que PgBouncer usa para autenticar)
"dev" "clave"
```

Las aplicaciones se conectan a `127.0.0.1:6432` en lugar del puerto 5432. En render y servidores pequeños, `pool_mode = transaction` suele ser el mejor equilibrio.

## ❓ FAQ

**❓ ¿Dónde están los ficheros de configuración?**
➡ `/etc/postgresql/<versión>/main/` (Debian/Ubuntu) o `/var/lib/pgsql/data/` (RHEL): `postgresql.conf` y `pg_hba.conf`.

**❓ ¿Cómo cambio la contraseña de `postgres`?**
➡ `sudo -u postgres psql` → `\password postgres`.

**❓ ¿`SERIAL` o `GENERATED AS IDENTITY`?**
➡ `GENERATED ALWAYS AS IDENTITY` es estándar SQL y más seguro; evita secuencias huérfanas al hacer `INSERT` explícito de `id`.

**❓ ¿`pg_dump` sirve como copia de seguridad de producción?**
➡ Solo para bases pequeñas o migraciones. Para PITR usa pgBackRest/WAL-G con archivado de WAL.

**❓ ¿Cuándo añadir un pooler como PgBouncer?**
➡ Cuando el número de conexiones concurrentes de la app supere decenas y el servidor llegue al límite (`max_connections`).

## 🔗 Enlaces

- [PostgreSQL: documentación oficial](https://www.postgresql.org/docs/)
- [PostgreSQL: política de versiones](https://www.postgresql.org/support/versioning/)
- [pgAdmin](https://www.pgadmin.org/) · [psql cheatsheet](https://www.postgresqltutorial.com/postgresql-cheat-sheet/)
- [pgBackRest](https://pgbackrest.org/) · [WAL-G](https://github.com/wal-g/wal-g) · [PgBouncer](https://www.pgbouncer.org/)

## 🧩 Ver también

- [Manual de SQL](./manual_sql.md)
- [Manual de Nginx (proxy hacia tu base / app)](./manual_nginx.md)
- [Manual de Docker Compose](./manual_docker_compose.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
