# OpenTelemetry – Observabilidad de los tres pilares

Marco de instrumentación estándar del ecosistema (CNCF) para emitir **métricas, trazas y logs** de forma uniforme con **otlp**, neutral de proveedor. Sustituye a la suma de agentes/vendors dispares por un solo pipeline de telemetría abierto.

> 🎯 **Nivel**: avanzado · **Requisitos**: una aplicación instrumentada con el SDK de tu lenguaje · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos

- [Qué resuelve](#-qué-resuelve)
- [Arquitectura: SDK + Collector + Backend](#️-arquitectura-sdk--collector--backend)
- [Señales: cuál usar para qué](#-señales-cuál-usar-para-qué)
- [Ejemplo mínimo con el Collector](#️-ejemplo-mínimo-con-el-collector)
- [Instrumentación](#-instrumentación)
- [Muestreo (sampling): el coste lo controlas tú](#-muestreo-sampling-el-coste-lo-controlas-tú)
- [SLI / SLO y alertas por burn rate](#-sli--slo-y-alertas-por-burn-rate)
- [Control de cardinalidad y costes](#-control-de-cardinalidad-y-costes)
- [Stack open source de referencia](#-stack-open-source-de-referencia)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🧠 Qué resuelve

En 2026, **otlp** es prácticamente el único protocolo de telemetría aceptado (Tempo, Jaeger, Honeycomb, Datadog, New Relic, Dynatrace, Grafana Cloud, SigNoz…). Las **convenciones semánticas v1** están congeladas: `http.request.method`, `db.system.name`, `messaging.system`, `service.name`… ya **no cambian** (los cambios futuros irán a un espacio v2, como en Kubernetes). El **log ya es un señal GA** (2024) y **profiles** entra como cuarta señal (beta del wire protocol en 2026).

> 📌 **Estado.** Las convenciones de **GenAI** (`gen_ai.*`) están en nivel *Development* (migradas a su propio repo el 12 jun. 2026); construye dashboards solo sobre nombres *Stable*. `db.system` se renombró a `db.system.name` en la v1.33.0 de convenciones.

## 🏗️ Arquitectura: SDK + Collector + Backend

```text
Aplicación (SDK/auto-instrumentación)
        │  OTLP (gRPC/HTTP)
        ▼
OpenTelemetry Collector (receivers/processors/exporters)   ← el "router" de datos
        │
        ├──► Prometheus / Mimir / VictoriaMetrics  (métricas)
        ├──► Tempo / Jaeger                         (trazas)
        └──► Loki / Elasticsearch                   (logs)
```

- **SDK**: bibliotecas (`opentelemetry-python`, `opentelemetry-java`, Node, Go…) que capturan spans, métricas y LogRecords en el proceso.
- **Collector** `v0.162.0` (sep. 2026): agente que recibe de muchas fuentes (incluido oltp), procesa (sampling, atributos, cardinalidad) y exporta a uno o varios backends.
- **OTLP**: protocolo wire protobuf sobre gRPC/HTTP, multiplataforma.

## 📦 Señales: cuál usar para qué

| Señal | Captura | Uso | Coste |
|---|---|---|---|
| **Métricas** | agregados en el tiempo (Counter, Gauge, Histogram, ExponentialHistogram) | SLI, dashboards, alertas | barato, siempre activo |
| **Trazas** | spans (petición a través de servicios) | debugging, causa raíz | alto → muestrea |
| **Logs** | LogRecords crudos (`body`, `severity`, `attributes`) | arranques, errores, RUM | medio |
| **Baggage/Profiles** | contexto propagado / perfiles continuos | correlación, profiling (4ª señal) | experimental |

Un punto fuerte: los logs instrumentados heredan **`trace_id`/`span_id`** automáticamente, así saltar de log a traza es un clic.

## ⚙️ Ejemplo mínimo con el Collector

```yaml
# collector.yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:

processors:
  batch:                       # agrupa datos para eficiencia
  memory_limiter:
    check_interval: 1s

exporters:
  debug:
    verbosity: basic
  otlphttp/metrics:
    endpoint: http://prometheus:9090/api/v1/otlp
  otlphttp/traces:
    endpoint: http://tempo:4318  # puerto OTLP HTTP de Tempo

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlphttp/metrics]
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlphttp/traces]
```

```bash
# Instalación rápida (Linux amd64)
curl -L https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.162.0/otelcol_0.162.0_linux_amd64.tar.gz -o otelcol.tar.gz
tar xzf otelcol.tar.gz
./otelcol --config collector.yaml
```

## 🧪 Instrumentación

### Auto-instrumentación (recomendada para empezar)
- **Java**: `-javaagent:opentelemetry-javaagent.jar`
- **Python**: `opentelemetry-instrumentation` (con los paquetes `opentelemetry-instrumentation-*`).
- **Node**: paquetes `@opentelemetry/instrumentation-*`.
- **eBPF** (sin tocar código, binarios legacy): Beyla, Coroot, OTel eBPF Collector.

### Manual (Python)

```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

trace.set_tracer_provider(TracerProvider())
tp = trace.get_tracer_provider()
tp.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4317")))

tracer = trace.get_tracer("mi-app")
with tracer.start_as_current_span("procesar_pago") as span:
    span.set_attribute("pago.importe", 19.50)   # nombres con barra de dominio
```

Regla de oro en nombres de span: **sin parámetros de URL**: `/api/customer/{id}/orders`, no `/api/customer/1763/orders`.

## 🎯 Muestreo (sampling): el coste lo controlas tú

Las trazas son caras; no necesitas el 100%. Estrategias:
- **Head sampling**: decisión al inicio del trace (probabilístico). Barato, pierde trazas raras.
- **Tail sampling** (en el Collector): decide tras ver la traza completa; **sesgada a errores** → mantienes el 100% de fallos y una fracción del tráfico sano.

```yaml
# segmento de tail_sampling en el Collector
processors:
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: guardar-errores
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: muestra-del-10pct
        type: probabilistic
        probabilistic: { sampling_percentage: 10 }
```

## 📏 SLI / SLO y alertas por burn rate

- **SLI**: el ratio medido que importa (disponibilidad, latencia p99, tasa de error).
- **SLO**: objetivo, p. ej. "disponibilidad 99,9% en 30 días".
- **Error budget**: el 0,1% sobrante de presupuesto. La alerta por **burn rate** dispara cuando consumes el presupuesto demasiado deprisa (p. ej. 2% presupuesto/hora ≥ y un múltiplo), avisando antes del fallo, no después.

```promql
# Disponibilidad sintética de un SLO de 99,9% (burn rate)
sum(rate(http_requests_total{route="/api"}[1h])) -
  sum(rate(http_requests_total{route="/api", status=~"5.."}[1h]))
# Negativo y por debajo de un umbral = consumes el budget
```

## 💸 Control de cardinalidad y costes

Los valores únicos de las etiquetas explotan los recursos y la factura:
- `service.name` obligatorio (si falta, el SDK cae a `unknown_service:java`).
- Más atributos no es gratis: cada combinación única es una serie más en el backend.
- Prefiere **nombres de span estandarizados** y limita etiquetas de alto cardialidad (IDs de usuario sueltos).
- En el Collector, `attributesprocessor` puede **borrar/transformar** atributos sensibles o ruidosos antes de exportar.

```yaml
processors:
  attributes:
    actions:
      - key: database.connection.id   # alto cardinalidad, de poco valor
        action: delete
```

## 🧩 Stack open source de referencia

| Componente | Backend | Para qué |
|---|---|---|
| **Prometheus** / **Mimir** / **VictoriaMetrics** | métricas | TSDB y consultas (PromQL) |
| **Grafana** 13.2 | visualización | dashboards, alerting, incidentes |
| **Loki** 3.7 | logs | agregación de logs indexados por labels |
| **Tempo** 3.1 | trazas | almacenar y consultar spans (OTLP) |

Monta el Collector junto a tu API y exporta oltp a ese stack; en lugar de 3 agentes por servicio mantienes uno.

## ❓ FAQ

**❓ ¿OpenTelemetry sustituye a Prometheus?**
➡ No. OTel emite/transporta métricas; Prometheus/Mimir/VictoriaMetrics las almacenan y consultan. Se complementan (Prometheus también recibe OTLP desde 3.x).

**❓ ¿Necesito los tres SDK de trazas, métricas y logs?**
➡ No: un solo SDK y un mismo Collector manejan los tres. Los SDK se intercambian sin tocar la API.

**❓ ¿Cuándo uso tail sampling?**
➡ Cuando tu tráfico es alto y quieres conservar el 100% de errores sin pagar todas las trazas sanas.

**❓ ¿Qué señal me conviene para alertar?**
➡ Métricas (baratas, siempre activas). Trazas para diagnóstico; logs para incidentes concretos.

## 🔗 Enlaces

- [OpenTelemetry docs](https://opentelemetry.io/docs/)
- [Collector (config, install)](https://opentelemetry.io/docs/collector/)
- [Semantic conventions](https://opentelemetry.io/docs/specs/semconv/)
- [Collector releases](https://github.com/open-telemetry/opentelemetry-collector-releases/releases)
- [OTLP spec](https://opentelemetry.io/docs/specs/otel/protocol/)

## 🧩 Ver también

- [manual_prometheus.md](./manual_prometheus.md): el backend de métricas (complementario, sin duplicar)
- [manual_kubectl.md](./manual_kubectl.md): donde suele correr Collector y el stack
- [manual_terraform.md](./manual_terraform.md): provisionar el stack como código
- [manual_helm.md](./manual_helm.md): desplegar Collector/stack con charts

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
