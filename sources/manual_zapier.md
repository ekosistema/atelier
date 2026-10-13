# Zapier – Automatización SaaS para no-programadores

Plataforma SaaS de automatización por suscripción con miles de integraciones preconstruidas. Enfocada a simplicidad: triggers y acciones se montan en minutos sin código.

> 🎯 **Nivel**: básico · **Requisitos**: cuenta en zapier.com · **Revisado**: octubre 2026

## 🧩 Conceptos

| Concepto | Descripción |
|---|---|
| **Zap** | Flujo de automatización (disparador + 1 o más acciones) |
| **Trigger** | Evento que inicia el Zap |
| **Action** | Tarea que ejecuta el Zap |
| **Task** | Una ejecución completada de un Zap (unidad de consumo) |
| **Filter** | Condición que deja pasar o bloquea datos |
| **Path** | Ramificación condicional (equivalente a if/switch) |
| **Formatter** | Transformar texto, números, fechas y listas |
| **Tables** | Base de datos integrada (clave-valor / filas) |
| **Forms** | Formularios que disparan Zaps (antes "Interfaces") |

## 🔧 Zaps: triggers y acciones

### Tipos de trigger

| Tipo | Descripción |
|---|---|
| **Polling** | Revisa el origen cada pocos minutos (retardo típico) |
| **REST Hook / Webhook** | Instantáneo, si la app lo soporta |
| **Schedule** | Cron: cada hora, día, semana... |
| **Catch Hook** | Webhook genérico de la app Zapier Webhooks |

### Tipos de acción

| Tipo | Descripción |
|---|---|
| **Create** | Crear registro (email, tarea, lead...) |
| **Update** | Actualizar registro existente |
| **Search** | Buscar por criterios |
| **Search / Create** | Buscar y, si no existe, crear |

Los **multi-step Zaps** encadenan varias acciones. En el plan Free el Zap es de **dos pasos** (un trigger + una acción); en los planes de pago son multi-paso.

## 🔀 Filtros, Paths y Formatter

### Filter

Corta el flujo si no se cumple la condición: se usa temprano para no malgastar tareas.

```text
[Nuevo lead] → Filter (email no vacío)
               ├─ pasa   → Continuar
               └─ no pasa → Detener Zap
```

### Paths

Ramificación que evalúa las rutas en orden:

```text
[New payment] → Path A: amount > 100  → Slack #ventas
                Path B: amount <= 100 → Email receipt
                Path C: resto         → Log
```

### Formatter

Transformación de datos sin código: texto (upper, trim, replace), números (redondeo, moneda, porcentaje), fechas (formato, sumar días, zona horaria) y listas (first, sort, join, random).

## 🗄️ Tables y Forms

- **Tables**: base de datos integrada donde almacenar registros que usan los Zaps (listas, contadores, estado entre ejecuciones).
- **Forms**: formularios públicos que al enviarse disparan un Zap; se conectan a Tables, a una hoja o a cualquier app.

## 🪝 Webhooks

```bash
# Entrada (Catch Hook)
URL: https://hooks.zapier.com/hooks/catch/.../
Método: POST / GET / PUT  → responde 200 con JSON

# Salida (Custom Request)
Petición HTTP a cualquier URL con headers, query y cuerpo configurables
```

Sirven para conectar APIs que no tienen app integrada en Zapier.

## 🤖 IA, Agentes y MCP

Zapier ha evolucionado hacia el orquestador de agentes:

- **Zapier MCP**: servidor MCP (*Model Context Protocol*) que permite a Claude, Cursor, ChatGPT y otros agentes buscar y ejecutar acciones sobre las apps conectadas.
- **AI by Zapier**: razonamiento, resumen y toma de decisiones dentro de los Zaps.
- **Next Gen Zaps**: unión de razonamiento de IA con pasos deterministas; está en *early access*.
- **Agents** y **Copilot**: construyen y ejecutan automatizaciones en lenguaje natural.

## 💳 Tareas, límites y planes

El consumo es **por tarea** (una ejecución completada de un Zap). El plan Free incluye una cuota mensual de tareas con **Zaps, Tables y Forms ilimitados**; los siguientes (Professional, Team, Enterprise) suben tareas y desbloquean multi-paso, apps premium, Paths más numerosos y controles de administración.

En cuanto a coste a escala, el precio depende del número de tareas contratadas, no de la complejidad del Zap. Consulta los importes y los límites vigentes en [zapier.com/pricing](https://zapier.com/pricing) (no se fijan importes aquí por variar con frecuencia).

## 🛑 Cuándo NO usar Zapier

- **Volumen alto**: si superas con holgura tu cuota mensual, el coste por tarea se dispara frente a un self-host (n8n, Windmill).
- **Datos sensibles**: los datos pasan por la nube de Zapier y por terceros; para residencia o cumplimiento estricto usa self-hosting.
- **Lógica compleja**: loops, agregaciones y transformaciones avanzadas se quedan cortas frente a Make o n8n.
- **Coste determinista**: la incertidumbre del consumo por tarea penaliza predicciones de coste.

## 🔁 Depuración

- **History / Task History**: revisa cada ejecución y su entrada/salida.
- **Replay**: re-ejecuta una tarea fallida.
- **Test step**: prueba cada paso con datos reales antes de activar.
- **Notificaciones por email**: alertas de errores.

## 🥊 Alternativas

| Alternativa | Cuándo usarla |
|---|---|
| [Make.com](./manual_make_com.md) | Transformación de datos y flujos complejos en la nube |
| [n8n](./manual_n8n.md) | Self-host, código propio, control de datos |
| [ActivePieces](./manual_activepieces.md) | Open core, enfoque en agentes/MCP |
| **Windmill** | Flujos y scripts por código (TS/Python/Go), AGPLv3 |

## ✅ Criterios de elección (coste a escala)

1. **Estima tareas/mes** reales (cada ejecución *completa* cuenta) y compáralas con tu cuota.
2. **Razón entre automatizaciones ejecutadas vs fallidas**: los Zaps que disparan mucho sin filtrar consumen tareas (usa Filters).
3. **Con carga alta constante**, el self-host (n8n/Windmill) casi siempre gana en coste y en control.
4. **Con variedad enorme de apps y equipo no técnico**, Zapier es difícil de batir por su ecosistema y facilidad.

## 🧪 Escenarios prácticos

```text
# Gmail → Slack → Sheets
Trigger: nuevo email con etiqueta "urgente"
  └─ Filter: contiene "factura"
  └─ Slack (mensaje en #finanzas)
  └─ Sheets (añadir fila de registro)

# Formulario → CRM → Email
Trigger: nueva entrada de Typeform
  └─ HubSpot: crear/actualizar contacto
  └─ Path A (nuevo lead) → SendGrid email
  └─ Path B (existente)  → Slack #ventas
```

## ❓ FAQ

**❓ ¿Qué cuenta como "tarea"?**
➡ Cada ejecución completada de un Zap (se inicia el Zap y terminan sus acciones).

**❓ ¿Zapier tiene servidor MCP?**
➡ Sí: **Zapier MCP** expone las apps conectadas a agentes como Claude, ChatGPT o Cursor.

**❓ ¿Puedo autoalojar Zapier?**
➡ No. Para self-hosting usa n8n o Windmill.

## 🔗 Enlaces

- [Documentación oficial](https://help.zapier.com/)
- [Precios y planes](https://zapier.com/pricing)
- [Zapier MCP](https://zapier.com/mcp)
- [Plataforma para desarrolladores](https://platform.zapier.com/)
- [Plantillas de Zaps](https://zapier.com/templates)
- [Estado del servicio](https://status.zapier.com/)

## 🧩 Ver también

- [Make.com](./manual_make_com.md)
- [n8n](./manual_n8n.md)
- [ActivePieces](./manual_activepieces.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
