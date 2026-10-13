# MongoDB – Base de datos NoSQL documental

Base de datos NoSQL orientada a documentos (BSON). Sin esquema fijo, escalable horizontalmente, ideal para datos semi-estructurados, catálogos, y aplicaciones que evolucionan rápido.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: terminal, JSON, nociones de bases de datos · **Revisado**: noviembre 2026

> 📌 **Estado (nov. 2026)**: los ejemplos usan la serie **8.0** (versión mayor con soporte hasta octubre de 2029 según el [calendario oficial](https://www.mongodb.com/legal/support-policy/lifecycles); existen también las 8.2 y 8.3 posteriores). Cambia `8.0` por la serie que elijas y comprueba ese calendario. El shell clásico `mongo` está retirado: usa **`mongosh`**. La licencia del servidor Community es **SSPL**, no OSI; alternativas compatibles en la nube: Atlas, o proyectos como FerretDB.

## 📋 Tabla de Contenidos

- [Instalación](#-instalación)
- [Conceptos básicos](#-conceptos-básicos)
- [CRUD básico](#-crud-básico)
- [Consultas avanzadas](#-consultas-avanzadas)
- [Agregaciones (pipeline)](#-agregaciones-pipeline)
- [Índices](#-índices)
- [Relaciones (referencias vs embed)](#-relaciones-referencias-vs-embed)
- [Exportar e importar](#-exportar-e-importar)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)

## 🔧 Instalación

```bash
# Docker
docker run -d --name mongo -p 127.0.0.1:27017:27017 -v mongo-data:/data/db mongo:8.0

# Linux (apt): sustituye 8.0 por la serie que quieras y la distro por la tuya
# (guía oficial: https://www.mongodb.com/docs/manual/administration/install-on-linux/)
sudo apt install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Cliente (mongosh): suele venir con mongodb-org; si no, brew install mongosh
mongosh
```

## 📐 Conceptos básicos

| SQL | MongoDB |
|-----|---------|
| Database | Database |
| Table | Collection |
| Row | Document (BSON) |
| Column | Field |
| Index | Index |
| JOIN | $lookup aggregation |

```javascript
// Documento de ejemplo
{
  "_id": ObjectId("6612a0b1c1d2e3f4a5b6c7d8"),
  "nombre": "Ana García",
  "email": "ana@example.com",
  "edad": 28,
  "direccion": {
    "calle": "Av. Reforma 123",
    "ciudad": "CDMX"
  },
  "tags": ["python", "mongodb", "api"],
  "activo": true,
  "saldo": 1500.50
}
```

## 📝 CRUD básico

```javascript
// use mi_bd             // crear/seleccionar base de datos

// CREATE
db.usuarios.insertOne({ nombre: "Ana", email: "ana@example.com", edad: 28 })
db.usuarios.insertMany([
  { nombre: "Luis", email: "luis@example.com", edad: 35 },
  { nombre: "Sofía", email: "sofia@example.com", edad: 22 }
])

// READ
db.usuarios.find()                            // todos
db.usuarios.find({ edad: { $gte: 25 } })      // filtro
db.usuarios.find({ tags: "python" })          // array contiene
db.usuarios.find({}, { nombre: 1, email: 1 }) // proyección
db.usuarios.findOne({ email: "ana@example.com" })

// UPDATE
db.usuarios.updateOne(
  { email: "ana@example.com" },
  { $set: { edad: 29 }, $inc: { saldo: 100 } }
)
db.usuarios.updateMany(
  { activo: false },
  { $set: { activo: true } }
)

// DELETE
db.usuarios.deleteOne({ email: "old@example.com" })
db.usuarios.deleteMany({ activo: false })
```

## 🔍 Consultas avanzadas

```javascript
// Operadores de comparación
db.productos.find({ precio: { $gt: 100 } })           // greater than
db.productos.find({ precio: { $gte: 50, $lte: 200 } })
db.productos.find({ categoria: { $in: ["ropa", "zapatos"] } })
db.productos.find({ nombre: { $regex: "^Camis", $options: "i" } })  // regex

// Operadores lógicos
db.productos.find({
  $and: [ { precio: { $gte: 50 } }, { stock: { $gt: 0 } } ]
})
db.productos.find({
  $or: [ { categoria: "oferta" }, { descuento: { $exists: true } } ]
})

// Arrays
db.posts.find({ tags: { $all: ["mongodb", "tutorial"] } })     // contiene ambos
db.posts.find({ tags: { $size: 3 } })                           // exactamente 3 tags
db.posts.find({ "comentarios.autor": "Ana" })                   // campo anidado
```

## 🔧 Agregaciones (pipeline)

Pipeline de etapas para transformar y analizar datos:

```javascript
db.ventas.aggregate([
  { $match: { fecha: { $gte: ISODate("2025-01-01") } } },       // filtrar
  { $group: {
      _id: "$producto",
      total: { $sum: "$monto" },
      cantidad: { $sum: 1 },
      promedio: { $avg: "$monto" }
  }},
  { $sort: { total: -1 } },                                      // ordenar
  { $limit: 10 },                                                // top 10
  { $project: { _id: 0, producto: "$_id", total: 1, ventas: "$cantidad" } }
])

// Lookup (JOIN)
db.ordenes.aggregate([
  { $lookup: {
      from: "usuarios",
      localField: "usuario_id",
      foreignField: "_id",
      as: "usuario"
  }},
  { $unwind: "$usuario" },
  { $project: { total: 1, "usuario.nombre": 1, "usuario.email": 1 } }
])

// Etapas útiles: $unwind, $group, $sort, $limit, $project, $addFields, $bucket
```

## ⚡ Índices

Optimizar consultas frecuentes:

```javascript
// Crear índices
db.usuarios.createIndex({ email: 1 })                    // ascendente
db.usuarios.createIndex({ nombre: 1, edad: -1 })         // compuesto
db.productos.createIndex({ nombre: "text", descripcion: "text" })  // texto

// Índices especiales
db.pedidos.createIndex({ creado_en: 1 }, { expireAfterSeconds: 86400 * 30 })  // TTL (30 días)
db.ubicaciones.createIndex({ coordenadas: "2dsphere" })  // geoespacial
db.coleccion.createIndex({ campo: 1 }, { unique: true }) // único

// Ver índices
db.usuarios.getIndexes()
db.usuarios.dropIndex("email_1")

// Explicar plan de consulta
db.usuarios.find({ email: "ana@example.com" }).explain("executionStats")
```

## 🔗 Relaciones (referencias vs embed)

```javascript
// EMBED: datos que siempre se leen juntos (1:1 o 1:N pequeño)
db.ordenes.insertOne({
  usuario: { nombre: "Ana", email: "ana@example.com" },
  items: [
    { producto: "Camiseta", precio: 25 },
    { producto: "Gorra", precio: 15 }
  ],
  total: 40
})

// REFERENCE: datos que crecen o se consultan por separado (1:N grande, N:M)
db.usuarios.insertOne({ _id: ObjectId(), nombre: "Ana" })
db.ordenes.insertOne({
  usuario_id: ObjectId("..."),    // referencia al _id del usuario
  total: 40
})
db.ordenes.aggregate([
  { $lookup: { from: "usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } }
])
```

Regla general: embed si lees juntos siempre, reference si los datos crecen sin límite.

## 📦 Exportar e importar

```bash
# Exportar colección a JSON
mongoexport --db mi_bd --collection usuarios --out usuarios.json

# Exportar con filtro
mongoexport --db mi_bd --collection ventas --query '{"fecha": {"$gte": {"$date": "2025-01-01T00:00:00Z"}}}' --out ventas_2025.json

# Importar desde JSON
mongoimport --db mi_bd --collection usuarios --file usuarios.json

# Exportar/importar BSON (más rápido, preserva tipos)
mongodump --db mi_bd --out ./backup/
mongorestore --db mi_bd ./backup/mi_bd/

# Backup de toda la instancia (no pongas la contraseña en la URI; mongodump la pide por prompt)
mongodump --uri "mongodb://user@host:27017/" --out ./backup_completo
```

## ❓ FAQ

**❓ MongoDB vs PostgreSQL: cuándo usar cuál?**
➡ MongoDB: datos semi-estructurados, esquema flexible, escalado horizontal. PostgreSQL: datos relacionales, integridad referencial, joins complejos.

**❓ Cómo resetear la contraseña de admin?**
➡ Para el servidor y arráncalo **sin** `--auth` (`mongod --dbpath /var/lib/mongodb --bind_ip 127.0.0.1`), conecta con `mongosh`, ejecuta `use admin` y `db.changeUserPassword("admin", passwordPrompt())`. Reinicia después con autenticación activada. Hazlo solo en localhost.

**❓ Error "Transaction numbers are only allowed on a replica set member"?**
➡ Las transacciones multi-documento requieren replica set (no standalone). Para pruebas locales, inicia con `mongod --replSet rs0` y `rs.initiate()`.

**❓ Cómo ver queries lentas?**
➡ `db.setProfilingLevel(1, { slowms: 200 })` luego `db.system.profile.find().sort({ ts: -1 }).limit(10)`

## 🔗 Enlaces
- [Documentación MongoDB](https://www.mongodb.com/docs/)
- [MongoDB CRUD Operations](https://www.mongodb.com/docs/manual/crud/)
- [Aggregation Pipeline](https://www.mongodb.com/docs/manual/aggregation/)
- [MongoDB Indexing Strategies](https://www.mongodb.com/docs/manual/indexes/)
- [MongoDB Playground (online)](https://mongoplayground.net/)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
