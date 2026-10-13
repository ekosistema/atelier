# Prometheus – Métricas y alertas

Sistema open source de monitorización que recopila métricas de servicios e infraestructura en series temporales, las consulta con **PromQL** y dispara alertas vía **Alertmanager**, integrándose con Grafana. Es el estándar de métricas del ecosistema Kubernetes.

> 🎯 **Nivel**: intermedio · **Requisitos**: un endpoint `/metrics` que exponga métricas · **Revisado**: octubre 2026

## 🏷️ Versión y ciclo de lanzamiento

Prometheus tiene releases **LTS** y de corta vida. La estable actual es **3.14.0** (ago. 2026); la línea **LTS 3.13.3** (jul. 2026–jul. 2027) es la recomendada para producción por su ventana de soporte más larga. La serie 3.x popularizó los **histogramas nativos**.

```bash
prometheus --version          # comprobar versión instalada
prometheus --config.file=prometheus.yml --web.listen-address=:9090
```

## 🔧 Configuración mínima (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 30s     # cada cuánto evalúa las reglas de alerta

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node"
    static_configs:
      - targets: ["localhost:9100"]   # node_exporter (por defecto: 9100)

rule_files:
  - "rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["localhost:9093"]
```

## 🔍 PromQL: consultas

```promql
up                                            # 1 si el target responde
node_cpu_seconds_total{mode!="idle"}          # filtro por label (negación)
rate(node_cpu_seconds_total{mode="idle"}[5m]) # incremento por segundo (5 min)
sum by (job) (rate(http_requests_total[5m]))  # agregación por job
topk(3, node_memory_MemFree_bytes)            # top 3 de memoria libre
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))  # p99
```

### Consultas prácticas

```promql
# CPU usado (%): 100 - idle
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memoria usada (%)
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Tasa de errores HTTP (%)
sum(rate(http_requests_total{status=~"5.."}[5m])) /
sum(rate(http_requests_total[5m])) * 100
```

`rate()` es la función correcta para counters: da la tasa por segundo. **`irate()`** útil solo para picos instantáneos/paneles sensibles (más ruido). `increase()` = `rate() * ventana`; para SLA usa histogramas + `histogram_quantile`, no PromQL sobre percetiles aproximados.

## 🚨 Alertas y Alertmanager

```yaml
# rules.yml
groups:
  - name: infra
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 5m                      # debe mantenerse 5 min antes de disparar
        labels: { severity: critical }
        annotations:
          summary: "Instancia {{ $labels.instance }} caída"
      - alert: ApiErrorRate
        expr: |-
          sum(rate(http_requests_total{status=~"5.."}[5m])) /
          sum(rate(http_requests_total[5m])) > 0.02
        for: 10m
        annotations:
          summary: "Más del 2% de errores en {{ $labels.job }}"
```

Alertmanager es el encargado de enrutar, agrupar, silenciar y deduplicar:

```yaml
# alertmanager.yml
route:
  group_by: ["alertname", "job"]
  group_wait: 10s
  repeat_interval: 4h
  receiver: slack
receivers:
  - name: slack
    slack_configs:
      - channel: "#alerts"
        api_url: "https://hooks.slack.com/services/XXX"
```

```bash
promtool check rules rules.yml      # validar la sintaxis de las reglas
```

> 📌 **Estado.** Para alertas **basadas en síntomas** (SLO/burn rate), consulta [manual_observabilidad.md](./manual_observabilidad.md): se dispara por el ritmo de consumo del presupuesto de error, no por umbrales estáticos.

## 📦 Exporters (para métricas de terceros)

| Exporter | Puerto | Métricas |
|---|---|---|
| [node_exporter](https://github.com/prometheus/node_exporter) | 9100 | CPU, RAM, disco, red (sistema) |
| [blackbox_exporter](https://github.com/prometheus/blackbox_exporter) | 9115 | HTTP/TCP/ICMP (probecas) |
| [postgres_exporter](https://github.com/prometheus-community/postgres_exporter) | 9187 | PostgreSQL |
| [mysqld_exporter](https://github.com/prometheus/mysqld_exporter) | 9104 | MySQL |
| [nginx-prometheus-exporter](https://github.com/nginxinc/nginx-prometheus-exporter) | 9113 | Nginx |

> 📌 **Estado**: **node_exporter NO está obsoleto**; sigue siendo el estándar para métricas de host. Lo que sí está en desuso es mantener muchos exporters monoespecíficos como agentes separados: el **OpenTelemetry Collector Contrib** (hostmetrics, redis, mysql, k8s… receivers) puede consolidarlos en un único agente. El patrón `pushgateway` para jobs batch se desaconseja salvo casos puntuales (pérdida de la marca de tiempo).

```bash
# Instalar y arrancar node_exporter (Linux amd64)
wget https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-*.linux-amd64.tar.gz
tar xzf node_exporter-*.linux-amd64.tar.gz && ./node_exporter
curl http://localhost:9100/metrics
```

## 📡 Remote write y retención

El TSDB local fija la retención (por defecto 15 días con `--storage.tsdb.retention.time`). Para largo plazo, **remote write** envía las series a un almacén escalable:

```yaml
remote_write:
  - url: http://victoriametrics:8428/api/v1/write
```

## 🌍 Ecosistema 2026: ¿dónde persistir?

| Opción | Rol | Nota |
|---|---|---|
| **Prometheus solo** | short-term local | retención corta, no multiusuario |
| **Grafana Mimir** 3.2 | backend scale-out (remote write) | reemplaza el TSDB de Prometheus; HA, multi-tenant |
| **VictoriaMetrics** 1.154 | backend de alto rendimiento | remoto, `vmagent` para scrape |
| **Thanos** | largo plazo sobre Prometheus | sidecar + bucket object storage |
| **Loki / Tempo** | logs / trazas (Grafana stack) | ver [manual_observabilidad.md](./manual_observabilidad.md) |

## ❓ FAQ

**❓ ¿`gauge`, `counter`, `histogram`?**
➡ **counter**: solo crece (peticiones). **gauge**: sube y baja (CPU/memoria). **histogram**: distribución (latencia, para percentiles).

**❓ ¿Por qué `rate()` y no promediar counters?**
➡ Un counter acumula desde el arranque; `rate()` da el incremento por segundo real, insensible a reinicios.

**❓ ¿Para qué `irate()`?**
➡ Para tasas instantáneas de los dos últimos puntos (picos). Más sensible pero más ruidoso; en alertas usa `rate`.

**❓ ¿Cuánto retener datos?**
➡ Por defecto unos 15 días en local. Para más, remote write a Mimir/VictoriaMetrics/Thanos.

## 🔗 Enlaces

- [Prometheus docs](https://prometheus.io/docs/)
- [PromQL: conceptos](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Release notes Prometheus](https://github.com/prometheus/prometheus/releases)
- [Awesome Prometheus alerts](https://awesome-prometheus-alerts.grep.to/)
- [Grafana dashboards compartidos](https://grafana.com/grafana/dashboards/)

## 🧩 Ver también

- [manual_observabilidad.md](./manual_observabilidad.md): los tres pilares + OpenTelemetry (complementario)
- [manual_terraform.md](./manual_terraform.md): provisionar Prometheus/Grafana como código
- [manual_kubectl.md](./manual_kubectl.md): sobre el clúster donde suele correr
- [manual_github_actions.md](./manual_github_actions.md): CI para validar reglas y dashboards

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
