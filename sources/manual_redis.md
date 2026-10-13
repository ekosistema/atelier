# Redis – Almacenamiento en memoria (caching, colas, sesiones)

Base de datos clave-valor en memoria, de alto rendimiento. Ideal para caching, sesiones, colas de mensajes, rate limiting y datos temporales con baja latencia.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: terminal, Docker opcional · **Revisado**: noviembre 2026

> ⚠️ **Licencia y alternativas (nov. 2026)**: Redis 7.2 y anteriores son BSD; de la **7.4 a la 7.8** pasó a doble licencia *source-available* (RSALv2/SSPLv1), y **Redis 8** ofrece tres opciones (RSALv2, SSPLv1 y **AGPLv3**, esta última aprobada por la OSI). La **Linux Foundation** mantiene el fork libre **[Valkey](https://valkey.io/)** (BSD), compatible con los comandos de este manual y con `redis-cli`/clientes habituales (`valkey-cli`). Revisa la licencia vigente antes de usarlo en un producto comercial o ofrecerlo como servicio. Los paquetes de las distribuciones pueden traer Valkey en lugar de Redis.

## 📋 Tabla de Contenidos

- [Instalación](#-instalación)
- [Redis CLI](#-redis-cli)
- [Strings](#-strings)
- [Lists](#-lists)
- [Sets](#-sets)
- [Hashes](#️-hashes)
- [Sorted Sets](#-sorted-sets)
- [TTL y expiración](#-ttl-y-expiración)
- [Pub/Sub](#-pubsub)
- [Persistencia](#-persistencia)
- [Streams](#-streams)
- [Configuración básica](#️-configuración-básica)
- [CLI avanzado](#️-cli-avanzado)
- [Enlaces](#-enlaces)

## 🔧 Instalación

```bash
# Docker
docker run -d --name redis -p 127.0.0.1:6379:6379 -v redis-data:/data redis:8
# Alternativa libre: docker run -d --name valkey -p 127.0.0.1:6379:6379 valkey/valkey

# Linux
sudo apt install redis-server        # Debian/Ubuntu
sudo systemctl enable redis-server
sudo systemctl start redis-server

# macOS
brew install redis && brew services start redis

# Verificar
redis-cli ping    # → PONG
```

## 💻 Redis CLI

```bash
redis-cli                        # Conectar por defecto (localhost:6379)
redis-cli -h host -p 6379        # Conectar remoto
REDISCLI_AUTH='contraseña' redis-cli --user app   # Autenticación sin dejar la clave en `ps`/historial (evita `-a`)
redis-cli --raw                  # Output sin comillas (útil para scripts)

# Información y monitoreo
redis-cli INFO                   # Estadísticas del servidor
redis-cli MONITOR                # Comandos en tiempo real (solo depuración: penaliza el rendimiento)
redis-cli CLIENT LIST            # Conexiones activas
redis-cli SLOWLOG GET 10         # Últimas 10 queries lentas
```

## 🔤 Strings

Tipo básico: textos, números, JSON serializado:

```bash
SET usuario:1 "Juan"             # Crear/actualizar clave
GET usuario:1                    # Obtener valor
SET usuario:1 "Pedro" GET        # Asignar nuevo y devolver el anterior (sustituye a GETSET, obsoleto)
SET usuario:2 "Ana" NX           # Solo si no existe (sustituye a SETNX, obsoleto)
MSET k1 v1 k2 v2                 # Múltiples claves
MGET k1 k2                       # Obtener múltiples

INCR contador                    # Incrementar en 1 (atómico)
INCRBY contador 10               # Incrementar en N
DECR contador                    # Decrementar
STRLEN usuario:1                 # Longitud del string
APPEND usuario:1 " Pérez"        # Concatenar
```

## 📋 Lists

Listas ordenadas (ideal para colas FIFO/LIFO):

```bash
LPUSH cola "tarea1"              # Insertar al inicio (izquierda)
RPUSH cola "tarea2"              # Insertar al final (derecha)
LPOP cola                        # Extraer del inicio
RPOP cola                        # Extraer del final
LLEN cola                        # Longitud de la lista
LRANGE cola 0 -1                 # Todos los elementos
LRANGE cola 0 4                  # Primeros 5

# Cola FIFO (First In, First Out)
RPUSH notificaciones "msg1"
RPUSH notificaciones "msg2"
LPOP notificaciones              # → "msg1" (el primero en entrar)
BLPOP notificaciones 5           # Bloqueante: espera hasta 5 s a que llegue algo

# Pila LIFO
LPUSH pila "a"
LPUSH pila "b"
LPOP pila                        # → "b" (el último en entrar)
```

> Con una lista, si el consumidor cae tras el `LPOP` el mensaje se pierde. Para colas fiables usa [Streams](#-streams).

## 🎯 Sets

Conjuntos no ordenados sin duplicados:

```bash
SADD tags:python "funcional" "orientado-a-objetos"
SMEMBERS tags:python             # Todos los miembros
SISMEMBER tags:python "funcional"  # Verificar existencia (1 o 0)
SCARD tags:python                # Número de elementos

SINTER set1 set2                 # Intersección
SUNION set1 set2                 # Unión
SDIFF set1 set2                  # Diferencia

# Útil para: tags, permisos, usuarios únicos
```

## 🗂️ Hashes

Estructuras tipo objeto (campos + valores):

```bash
HSET usuario:1 nombre "Ana" edad 30 pais "MX"
HGET usuario:1 nombre              # Obtener un campo
HGETALL usuario:1                  # Todos los campos y valores
HKEYS usuario:1                    # Solo campos
HVALS usuario:1                    # Solo valores
HEXISTS usuario:1 email            # Verificar si campo existe
HDEL usuario:1 edad                # Eliminar campo
HINCRBY usuario:1 visitas 1        # Incrementar campo numérico

# Ideal para: sesiones, perfiles, configuraciones
```

## 📊 Sorted Sets

Sets ordenados por puntuación (score):

```bash
ZADD leaderboard 100 "jugador1" 200 "jugador2" 150 "jugador3"
ZRANGE leaderboard 0 -1              # Orden ascendente por score
ZRANGE leaderboard 0 -1 WITHSCORES   # Con puntuaciones
ZRANGE leaderboard 0 2 REV           # Top 3 (descendente; sustituye a ZREVRANGE, obsoleto)
ZSCORE leaderboard "jugador1"        # Score de un miembro
ZINCRBY leaderboard 10 "jugador1"    # Incrementar score
ZRANK leaderboard "jugador1"         # Posición (0-based)

# Útil para: rankings, colas con prioridad, autocomplete con peso
```

## ⏰ TTL y expiración

Claves con tiempo de vida limitado: esencial para caching:

```bash
SET cache:pagina "<html>..." EX 3600    # Expirar en 1 hora
SET cache:api "{...}" EX 300            # Set + TTL en un comando (SETEX está obsoleto)
TTL cache:pagina                        # Tiempo restante (segundos)
EXPIRE cache:pagina 60                  # Cambiar TTL
PERSIST cache:pagina                    # Quitar expiración

# TTL especiales
TTL clave              # → -1 si no expira, -2 si no existe
```

## 📡 Pub/Sub

Mensajería publicador/suscriptor (no persistente):

```bash
# Terminal 1: suscriptor
SUBSCRIBE canal:notificaciones

# Terminal 2: publicador
PUBLISH canal:notificaciones "{\"evento\":\"deploy\",\"app\":\"api\"}"

# Suscribirse a múltiples canales con patrón
PSUBSCRIBE canal:*                    # Todos los canales que empiezan por "canal:"
```

## 💾 Persistencia

```bash
# Configurar en redis.conf o vía CONFIG SET

# RDB (snapshots periódicos): por defecto
save 900 1                           # 1 cambio en 15 min
save 300 10                          # 10 cambios en 5 min
save 60 10000                        # 10000 cambios en 1 min

# AOF (append-only file, cada escritura): más durable
appendonly yes
appendfsync everysec                 # Sincronizar cada segundo

# Comandos de persistencia manual
redis-cli SAVE                       # Snapshot síncrono (bloquea)
redis-cli BGSAVE                     # Snapshot en background
redis-cli BGREWRITEAOF               # Recompactar AOF
```

## 🌊 Streams

Log de mensajes persistente con grupos de consumidores y confirmación (`ACK`): la opción fiable para colas y eventos.

```bash
XADD pedidos '*' cliente 42 total 99     # Añadir entrada (id automático)
XGROUP CREATE pedidos workers '$' MKSTREAM   # Crear grupo de consumidores
XREADGROUP GROUP workers w1 COUNT 10 BLOCK 5000 STREAMS pedidos '>'   # Leer nuevos
XACK pedidos workers <id>                # Confirmar procesado
XPENDING pedidos workers                 # Entradas leídas pero sin confirmar
XLEN pedidos
```

## ⚙️ Configuración básica

```bash
# redis.conf (o vía CONFIG SET en caliente)
bind 127.0.0.1                       # Solo localhost (seguro)
port 6379                            # Puerto por defecto
protected-mode yes                   # No exponer sin autenticación
maxmemory 512mb                      # Límite de RAM
maxmemory-policy allkeys-lru         # Política de evicción (LRU cuando se llene)

# Políticas de evicción comunes
# allkeys-lru      → eliminar las menos usadas (recomendado para cache)
# volatile-lru     → solo claves con TTL
# noeviction       → error si la memoria se llena
```

```bash
redis-cli CONFIG GET maxmemory       # Ver configuración actual
redis-cli CONFIG SET maxmemory 1gb   # Cambiar en caliente
```

Autenticación con **ACL** (Redis 6+), mejor que un único `requirepass`:

```bash
ACL SETUSER app on '>una-clave-larga' '~app:*' '+@read' '+@write' '-@dangerous'
ACL SETUSER default off              # Desactivar el usuario por defecto sin clave
ACL LIST
# En producción: TLS (`tls-port`, `tls-cert-file`…), no exponer 6379 a Internet
```

## 🛠️ CLI avanzado

```bash
# Escanear claves con patrón (no bloqueante como KEYS)
redis-cli SCAN 0 MATCH usuario:* COUNT 100

# Transacciones
MULTI
SET clave1 "valor1"
SET clave2 "valor2"
EXEC

# Pipeline (múltiples comandos sin esperar respuestas)
redis-cli --pipe < comandos.txt

# Evaluar script Lua
EVAL "return redis.call('GET', KEYS[1])" 1 usuario:1

# Eliminar todo (¡destructivo! comprueba a qué servidor estás conectado)
redis-cli FLUSHDB                   # Solo DB actual
redis-cli FLUSHALL                  # Todas las DBs
```

> Redis 8 integra en el núcleo módulos antes separados (JSON, búsqueda, series temporales, tipos probabilísticos, vectores). Consulta la documentación de la versión que uses.

## 🔗 Enlaces
- [Documentación oficial Redis](https://redis.io/docs/)
- [Redis Commands](https://redis.io/commands/)
- [Redis Configuration](https://redis.io/docs/management/config/)
- [Redis ACL](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/)
- [Valkey (fork libre)](https://valkey.io/)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
