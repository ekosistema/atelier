# SQL – Lenguaje estándar de definición y consulta de datos

SQL (Structured Query Language) es el lenguaje normalizado para definir, consultar y modificar datos en bases de datos relacionales. Este manual cubre el estándar y marca las diferencias entre los dialectos más usados.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: una base de datos (PostgreSQL, MySQL/MariaDB, SQLite o SQL Server) · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [DDL: bases de datos, tablas y columnas](#-ddl-bases-de-datos-tablas-y-columnas)
- [DML: insertar, actualizar y borrar](#-dml-insertar-actualizar-y-borrar)
- [Consultas y agregación](#-consultas-y-agregación)
- [JOINs](#-joins)
- [Subconsultas y CTE](#-subconsultas-y-cte)
- [Funciones de ventana](#-funciones-de-ventana)
- [JSON: SQL/JSON estándar vs JSONB](#-json-sqljson-estándar-vs-jsonb)
- [Índices y `EXPLAIN`](#-índices-y-explain)
- [Transacciones (ACID)](#-transacciones-acid)
- [Diferencias entre dialectos](#️-diferencias-entre-dialectos)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 DDL: bases de datos, tablas y columnas

```sql
CREATE DATABASE mi_bd;                 -- crear base de datos
DROP DATABASE mi_bd;                   -- eliminar base de datos
```

```sql
CREATE TABLE usuarios (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- estándar SQL (sustituye a SERIAL)
    nombre      VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE,
    activo      BOOLEAN DEFAULT TRUE,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20);  -- añadir columna
DROP TABLE usuarios;                  -- eliminar tabla
TRUNCATE TABLE usuarios;              -- vaciar sin borrar estructura
```

> 🧪 **Alternativa moderna**: `id BIGINT GENERATED ALWAYS AS IDENTITY` en lugar de `SERIAL`/`BIGSERIAL` (PostgreSQL) o `AUTO_INCREMENT` (MySQL). Es estándar SQL, estándar desde hace años y evita problemas de secuencias huérfanas.

```sql
-- Clave foránea y ON DELETE
CREATE TABLE pedidos (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    total       NUMERIC(10,2) NOT NULL,
    fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📥 DML: insertar, actualizar y borrar

```sql
INSERT INTO usuarios (nombre, email) VALUES ('Ana Torres', 'ana@example.com');

INSERT INTO usuarios (nombre, email) VALUES
  ('Luis Díaz', 'luis@example.com'),
  ('Marta Ruiz', 'marta@example.com');

UPDATE usuarios SET email = 'nuevo@example.com' WHERE id = 1;
DELETE FROM usuarios WHERE id = 1;
```

### `RETURNING`: obtener las filas afectadas

```sql
INSERT INTO usuarios (nombre, email) VALUES ('Ana', 'ana@example.com')
RETURNING id, creado_en;                 -- PostgreSQL, SQLite 3.35+, MariaDB

UPDATE usuarios SET activo = FALSE WHERE id = 1 RETURNING *;
DELETE FROM usuarios WHERE id = 1 RETURNING nombre;
```

### `MERGE`: insertar o actualizar según exista la fila

```sql
MERGE INTO stock AS s
USING nuevas_entradas AS n ON s.producto_id = n.producto_id
WHEN MATCHED THEN UPDATE SET cantidad = s.cantidad + n.cantidad
WHEN NOT MATCHED THEN INSERT (producto_id, cantidad) VALUES (n.producto_id, n.cantidad);
```

> 📌 **Estado**: `MERGE` es estándar SQL y lo soportan SQL Server, Oracle, PostgreSQL (15+) y SQLite. En **MySQL/MariaDB** y en muchos casos conviene `INSERT ... ON DUPLICATE KEY UPDATE` o `INSERT ... ON CONFLICT` por rendimiento.

```sql
-- PostgreSQL / SQLite: UPSERT con ON CONFLICT
INSERT INTO stock (producto_id, cantidad) VALUES (42, 10)
ON CONFLICT (producto_id) DO UPDATE SET cantidad = stock.cantidad + EXCLUDED.cantidad;

-- MySQL / MariaDB
INSERT INTO stock (producto_id, cantidad) VALUES (42, 10)
ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad);
```

## 🔎 Consultas y agregación

```sql
SELECT nombre, email FROM usuarios WHERE activo = TRUE;
SELECT * FROM usuarios WHERE email LIKE '%@example.com' ORDER BY creado_en DESC;
SELECT * FROM usuarios ORDER BY id LIMIT 10 OFFSET 20;   -- paginación (estándar)

SELECT usuario_id, COUNT(*) AS num, SUM(total) AS total
FROM pedidos GROUP BY usuario_id HAVING SUM(total) > 100;
```

## 🔗 JOINs

```sql
-- INNER JOIN: solo coincidencias en ambas tablas
SELECT u.nombre, p.total
FROM usuarios u
JOIN pedidos p ON u.id = p.usuario_id;

-- LEFT / RIGHT / FULL OUTER JOIN: conserva filas sin coincidencia
SELECT u.nombre, p.total FROM usuarios u LEFT JOIN pedidos p ON u.id = p.usuario_id;
SELECT u.nombre, p.total FROM usuarios u FULL OUTER JOIN pedidos p ON u.id = p.usuario_id;

-- UNION (sin duplicados) y UNION ALL (con duplicados, más rápido)
SELECT nombre FROM usuarios UNION ALL SELECT nombre FROM clientes_vip;
```

## ⚡ Subconsultas y CTE

```sql
-- Subconsulta
SELECT nombre FROM usuarios
WHERE id IN (SELECT usuario_id FROM pedidos WHERE total > 100);

-- CTE simple con WITH
WITH pedidos_recientes AS (
    SELECT usuario_id, COUNT(*) AS num
    FROM pedidos
    WHERE fecha > CURRENT_TIMESTAMP - INTERVAL '30 days'
    GROUP BY usuario_id
)
SELECT u.nombre, p.num FROM usuarios u JOIN pedidos_recientes p ON u.id = p.usuario_id;
```

### CTE recursiva (jerarquías)

```sql
WITH RECURSIVE organizacion AS (
    SELECT id, nombre, jefe_id, 1 AS nivel FROM empleados WHERE jefe_id IS NULL
    UNION ALL
    SELECT e.id, e.nombre, e.jefe_id, o.nivel + 1
    FROM empleados e JOIN organizacion o ON e.jefe_id = o.id
)
SELECT nivel, nombre FROM organizacion ORDER BY nivel;
```

## 📊 Funciones de ventana

Calculan sobre un conjunto de filas sin colapsarlas (a diferencia de `GROUP BY`).

```sql
SELECT nombre, departamento, salario,
       ROW_NUMBER() OVER (PARTITION BY departamento ORDER BY salario DESC) AS pos,
       RANK()       OVER (PARTITION BY departamento ORDER BY salario DESC) AS rango,
       AVG(salario) OVER (PARTITION BY departamento)                       AS media_depto
FROM empleados;

-- Media móvil de 3 días
SELECT fecha, venta,
       AVG(venta) OVER (ORDER BY fecha ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS media_movil
FROM ventas_diarias;
```

## 🧾 JSON: SQL/JSON estándar vs JSONB

```sql
-- SQL/JSON estándar (SQL:2016): JSON_QUERY, JSON_VALUE, JSON_EXISTS, JSON_TABLE
SELECT JSON_VALUE(datos, '$.nombre') FROM perfiles;

-- PostgreSQL: tipo JSONB (binario, indexable y consultable con operadores)
SELECT datos->>'nombre' AS nombre, datos->'dir'->>'ciudad' AS ciudad
FROM perfiles
WHERE datos @> '{"activo": true}';
```

> 🧪 **Alternativa moderna.** Para consultar y filtrar usa **JSONB** (PostgreSQL) o el tipo JSON nativo, no columnas de texto con JSON serializado. `JSON` (sin B) conserva el texto original; `JSONB` es más rápido de consultar e indexable con GIN.

## ⚡ Índices y `EXPLAIN`

```sql
CREATE INDEX idx_usuarios_email ON usuarios (email);
CREATE INDEX idx_pedidos_usuario_fecha ON pedidos (usuario_id, fecha DESC);  -- compuesto
CREATE UNIQUE INDEX idx_email_unico ON usuarios (email);
DROP INDEX idx_usuarios_email;
```

```sql
EXPLAIN ANALYZE SELECT * FROM usuarios WHERE email = 'ana@example.com';   -- plan + tiempos reales
```

Revisa en el plan si aparece un `Seq Scan` sobre una tabla grande: suele indicar falta de índice o estadísticas desactualizadas.

## 🔐 Transacciones (ACID)

```sql
BEGIN;
UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1;
UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2;
COMMIT;              -- confirma
-- ROLLBACK;         -- deshace si algo falla
```

## 🗺️ Diferencias entre dialectos

| Función | PostgreSQL | MySQL / MariaDB | SQLite | SQL Server |
|---|---|---|---|---|
| Auto-incremento | `GENERATED AS IDENTITY` / `SERIAL` | `AUTO_INCREMENT` | `INTEGER PRIMARY KEY` | `IDENTITY(1,1)` |
| Limitar filas | `LIMIT n OFFSET m` | `LIMIT n OFFSET m` | `LIMIT n OFFSET m` | `OFFSET m ROWS FETCH NEXT n ROWS` |
| Booleano nativo | `BOOLEAN` | `TINYINT(1)` | `INTEGER` | `BIT` |
| Concatenar texto | `||` | `CONCAT()` | `||` | `+` / `CONCAT()` |
| UPSERT | `ON CONFLICT` | `ON DUPLICATE KEY` | `ON CONFLICT` | `MERGE` |
| `RETURNING` | Sí | MariaDB sí | 3.35+ | `OUTPUT` |
| JSON | `jsonb` (indexable) | `JSON` | `JSON1` | `JSON` / `NVARCHAR` |
| Generar UUID | `gen_random_uuid()` | `UUID()` | aplicación | `NEWID()` |

Para PostgreSQL en detalle, consulta [./manual_postgresql.md](./manual_postgresql.md).

## ❓ FAQ

**❓ ¿`DELETE`, `TRUNCATE` o `DROP`?**
➡ `DELETE` borra filas (admite `WHERE`); `TRUNCATE` vacía la tabla rápido (no admite `WHERE`); `DROP` elimina la tabla entera.

**❓ ¿`INNER JOIN` o `LEFT JOIN`?**
➡ `INNER` devuelve solo las coincidencias en ambas tablas; `LEFT` conserva todas las filas de la izquierda (con `NULL` si no hay coincidencia).

**❓ ¿`WHERE` o `HAVING`?**
➡ `WHERE` filtra filas antes de agrupar; `HAVING` filtra grupos después de `GROUP BY`.

**❓ ¿Cómo veo las tablas y su estructura?**
➡ PostgreSQL: `\dt` y `\d tabla`. MySQL: `SHOW TABLES;` y `DESCRIBE tabla;`.

**❓ ¿Ventana o `GROUP BY`?**
➡ `GROUP BY` colapsa filas en una por grupo; una función de ventana calcula por grupo pero **mantiene todas las filas**.

## 🔗 Enlaces

- [PostgreSQL: documentos oficiales](https://www.postgresql.org/docs/)
- [MySQL: documentación](https://dev.mysql.com/doc/)
- [MariaDB: documentación](https://mariadb.com/kb/en/documentation/)
- [SQLite: documentación](https://www.sqlite.org/docs.html)
- [SQL Server: documentación](https://learn.microsoft.com/sql/)
- [Guía de estilo SQL](https://www.sqlstyle.guide/)

## 🧩 Ver también

- [Manual de PostgreSQL](./manual_postgresql.md)
- [Manual de jq (JSON en terminal)](./manual_jq.md)
- [Manual de curl y HTTP](./manual_curl_http.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
