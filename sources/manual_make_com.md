# Make.com – Automatización visual SaaS (ex-Integromat)

Plataforma SaaS de automatización visual, antes Integromat. Destaca por su canvas de módulos, la transformación de datos sin código y un modelo de consumo por créditos.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: cuenta en make.com · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Conceptos](#-conceptos)
- [Interfaz](#️-interfaz)
- [Tipos de módulos](#-tipos-de-módulos)
- [Routers y filtros](#-routers-y-filtros)
- [Iteradores y agregadores](#-iteradores-y-agregadores)
- [Data Stores](#️-data-stores)
- [Funciones de transformación](#-funciones-de-transformación)
- [Programación y consumo de créditos](#️-programación-y-consumo-de-créditos)
- [Errores y reejecuciones](#-errores-y-reejecuciones)
- [IA en Make](#-ia-en-make)
- [Límites y cuotas](#-límites-y-cuotas)
- [Comparativa con n8n y Zapier](#-comparativa-con-n8n-y-zapier)
- [Criterios de elección](#-criterios-de-elección)
- [Escenarios prácticos](#-escenarios-prácticos)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🧩 Conceptos

| Concepto | Descripción |
|---|---|
| **Scenario** | Flujo completo de automatización (equivale a "workflow") |
| **Module** | Bloque individual: trigger, acción, búsqueda o agregador |
| **Bundle** | Paquete de datos que viaja entre módulos |
| **Route** | Rama de un Router |
| **Filter** | Condición que deja pasar o bloquea datos |
| **Connection** | Credenciales de un servicio, reutilizables |
| **Data Store** | Almacén clave-valor persistente integrado |
| **Credit (op)** | Unidad de consumo; una acción de módulo = 1 crédito |

## 🖥️ Interfaz

- **Dashboard**: escenarios, plantillas, conexiones y consumo.
- **Scenario editor**: canvas con módulos conectados y el *data inspector* para ver los datos de cada paso.
- **History**: ejecuciones con estado success/warning/error y búsqueda de texto completo (planes superiores).
- **Make Grid**: vista del ecosistema de escenarios y dependencias.
- **Maia by Make**: asistente que construye automatizaciones y agentes por conversación.

## 🧱 Tipos de módulos

### Triggers

| Tipo | Nota |
|---|---|
| **Watch** | Polling; la frecuencia mínima depende del plan |
| **Webhook** | URL pública; instantáneo |
| **Schedule** | Cron; en planes de pago baja hasta el minuto |

### Acciones y utilidades

| Módulo | Uso |
|---|---|
| **HTTP** | GET/POST/PUT/DELETE contra cualquier API |
| **Tools > Get/Set Variable** | Variables locales del escenario |
| **Tools > Repeater** | Generar N bundles idénticos |
| **Text Parser** | Extraer datos con regex |
| **Date & Time** | Formatear, sumar y comparar fechas |
| **JSON** | Parsear, crear y transformar JSON |
| **Router** | Dividir el flujo en rutas condicionales |
| **Data Store** | CRUD sobre el almacén clave-valor |
| **Make Code App** | Scripting con JavaScript o Python |

## 🔀 Routers y filtros

### Filter

Un filtro **no ramifica**: solo permite o corta el paso. Se coloca entre dos módulos.

```text
Data → Filter (price > 0) → Next module
```

### Router

Un router abre varias rutas, cada una con su propia condición:

```text
HTTP Get → Router
           ├─ price < 100  → Send Email
           ├─ price >= 100 → Slack Notification
           └─ fallback     → Log
```

## 🔁 Iteradores y agregadores

- **Iterator**: trocea un array en bundles individuales (uno por elemento).
- **Aggregators** (nativos de Make): funden muchos bundles en uno. Es la gran ventaja frente a n8n.

```text
Array Aggregator   → [item1, item2, ...] → un único array
Text Aggregator    → une líneas en un solo texto
Numeric Aggregator → suma / promedio / máximo de un conjunto
```

Sin agregador, cada bundle se procesa en serie; con agregador puedes operar sobre el conjunto.

## 🗄️ Data Stores

Base de datos clave-valor dentro de Make, para estado entre ejecuciones.

```text
Data Store: "precios"
  ├─ add     → crear registro
  ├─ update  → actualizar por key
  ├─ get     → leer por key
  ├─ delete  → eliminar
  └─ list    → listar
```

El tamaño disponible depende del plan; consulta la cuota en la página de precios.

## 🧮 Funciones de transformación

Se escriben entre `{{ }}` en cualquier campo:

```javascript
{{ map(array; "campo") }}          // extrae un campo de cada elemento
{{ filter(array; condicion) }}     // filtra un array
{{ get(objeto; "clave") }}         // acceso seguro
{{ if(cond; val_si; val_no) }}
{{ length(array) }}
{{ replace(texto; busca; pone) }}
{{ formatDate(fecha; "DD/MM/YYYY HH:mm") }}
{{ parseNumber(texto; "."; ",") }}
```

## ⏱️ Programación y consumo de créditos

- **Programación**: el intervalo mínimo lo marca el plan; en los planes de pago baja hasta **el minuto**.
- **Modelo de consumo**: cada acción de módulo consume créditos (los "operations" de antes). Automatizaciones con IA pueden consumir más de un crédito por paso según la operación.
- Planes habituales: **Free, Core, Pro, Teams y Enterprise**; el margen operativo depende del volumen de créditos contratado. Precios y niveles en [make.com/pricing](https://www.make.com/en/pricing).

## 🛑 Errores y reejecuciones

Se configuran por módulo o por escenario:

| Estrategia | Efecto |
|---|---|
| **Ignore** | Continúa pese al error |
| **Resume / Complete** | Marca el módulo como completado aunque falle |
| **Rollback** | Revierte (según plan) |
| **Break** | Detiene el escenario |
| **Retry** | Reintenta con intervalo y número de intentos configurables |

Los errores de un bundle no bloquean los demás. Desde **History** se reejecutan ejecuciones fallidas.

## 🤖 IA en Make

- **Make AI Agents** y **AI Toolkit**: construyen agentes con el proveedor de IA de Make o tu propia clave de LLM.
- **Maia by Make**: creación de escenarios y agentes en lenguaje natural.
- **Code App**: lógica avanzada en JavaScript o Python dentro del flow.

## 📊 Límites y cuotas

- **Créditos/mes**: los del plan contratado (los excedentes se facturan o se cortan según plan).
- **Intervalo mínimo de programación**: limitado por plan.
- **Data transfer / storage** y tamaño de cola de webhooks: proporcionales a los créditos contratados.
- **Escenarios activos**: ilimitados desde el primer plan de pago.

Como las cifras cambian con frecuencia, no se fijan aquí: verifica los valores vigentes en la [página de precios](https://www.make.com/en/pricing) y en la [documentación](https://www.make.com/en/help).

## 🥊 Comparativa con n8n y Zapier

| Criterio | Make | n8n | Zapier |
|---|---|---|---|
| **Alojamiento** | Cloud (SaaS) | Self-host o Cloud | Cloud (SaaS) |
| **Modelo de coste** | Créditos/módulo | Infra + licencia (self-host) | Tareas |
| **Agregadores** | Nativos | Requiere Aggregate/Split | Limitado |
| **Transformación de datos** | Funciones inline muy potentes | Expresiones + Code | Formatter |
| **Autoalojable** | No | Sí | No |
| **Curva de aprendizaje** | Media | Media-alta | Baja |
| **Apps** | +2.000 | +400 nativas | Miles |

## ✅ Criterios de elección

- **Make**: flujos con transformación de datos intensiva, agregaciones y ramificación compleja, sin querer gestionar servidores.
- **n8n**: control total, datos sensibles, código propio y self-hosting.
- **Zapier**: máxima variedad de apps y la curva de aprendizaje más baja.
- Si el coste a escala es crítico: cuantifica créditos/tareas por ejecución antes de decidir (ver [Zapier](./manual_zapier.md) y [n8n](./manual_n8n.md)).

## 🧪 Escenarios prácticos

```text
# Slack → Trello
Webhook (Slack) → Router
                  ├─ si "bug" → Trello (Create Card) → Slack
                  └─ resto    → Slack

# ETL diario: API → CSV → Email
Schedule (diario) → HTTP Get → Array Aggregator → CSV → Email

# Chatbot por webhook
Webhook → Router
          ├─ si mensaje == "hola" → HTTP (respuesta saludo)
          └─ resto                → HTTP (respuesta por defecto)
```

## ❓ FAQ

**❓ ¿Qué es un crédito?**
➡ La unidad de consumo: normalmente una acción de módulo. Las operaciones de IA pueden consumir más de uno.

**❓ ¿Puedo autoalojar Make?**
➡ No. Make es exclusivamente SaaS; para self-hosting usa n8n, Windmill o ActivePieces.

**❓ ¿Hay versión gratuita?**
➡ Sí, el plan Free no caduca pero tiene un límite mensual de créditos y un intervalo de programación mayor.

## 🔗 Enlaces

- [Documentación oficial](https://www.make.com/en/help)
- [Precios y planes](https://www.make.com/en/pricing)
- [Plantillas de escenarios](https://www.make.com/en/templates)
- [Make Academy](https://www.make.com/en/academy)
- [Comunidad](https://community.make.com/)

## 🧩 Ver también

- [n8n](./manual_n8n.md)
- [Zapier](./manual_zapier.md)
- [ActivePieces](./manual_activepieces.md)
- [Node-RED](./manual_node_red.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
