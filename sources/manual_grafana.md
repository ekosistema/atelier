# Grafana – Dashboards y alertas para métricas

Plataforma open-source de observabilidad. Visualiza métricas de Prometheus, Loki, CloudWatch, y +50 fuentes. Crea dashboards, alertas y paneles compartibles.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: Docker o Linux, nociones de Prometheus · **Revisado**: noviembre 2026

> 📌 **Estado (nov. 2026)**: el antiguo **Grafana Agent** está reemplazado por **[Grafana Alloy](https://grafana.com/docs/alloy/latest/)** como recolector de métricas, logs y trazas. Para logs, ver [Loki](./manual_loki.md).

## 📋 Tabla de Contenidos

- [Instalación](#-instalación)
- [Primer login y datasource](#-primer-login-y-datasource)
- [Crear dashboard y paneles](#-crear-dashboard-y-paneles)
- [Panel Query (PromQL)](#-panel-query-promql)
- [Variables y templates](#️-variables-y-templates)
- [Alertas](#-alertas)
- [Usuarios y permisos](#-usuarios-y-permisos)
- [API y provisioning](#-api-y-provisioning)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)

## 🔧 Instalación

```bash
# Docker (con volumen para conservar dashboards y ajustes)
docker run -d --name grafana -p 3000:3000 -v grafana-data:/var/lib/grafana grafana/grafana

# Con Prometheus (red de usuario; `--link` está obsoleto)
docker network create monitoring
docker run -d --name prometheus --network monitoring -p 9090:9090 prom/prometheus
docker run -d --name grafana --network monitoring -p 3000:3000 -v grafana-data:/var/lib/grafana grafana/grafana
# En Grafana, el datasource de Prometheus es http://prometheus:9090

# Linux (apt)
sudo apt install -y gnupg software-properties-common
sudo mkdir -p /etc/apt/keyrings
wget -q -O- https://packages.grafana.com/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/grafana.gpg
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt update && sudo apt install grafana
sudo systemctl enable --now grafana-server

# macOS
brew install grafana && brew services start grafana
```

Acceso: `http://localhost:3000`, usuario/contraseña por defecto: `admin` / `admin` (Grafana te obliga a cambiarla en el primer login; en producción define `GF_SECURITY_ADMIN_PASSWORD` o usa secretos).

## 🔌 Primer login y datasource

```bash
# 1. Login en http://localhost:3000 (admin/admin → cambiar contraseña)
# 2. Ir a Connections → Add new connection
# 3. Buscar y seleccionar "Prometheus"
# 4. Configurar URL: http://prometheus:9090 (Docker) o localhost:9090
# 5. Click "Save & test"
```

Datasources comunes: Prometheus, Loki (logs), CloudWatch, PostgreSQL, Graphite, InfluxDB, Elasticsearch, Jaeger (traces).

## 📊 Crear dashboard y paneles

```bash
# 1. Dashboards → New dashboard → Add visualization
# 2. Seleccionar datasource (Prometheus)
# 3. Escribir query PromQL
# 4. Configurar: título, tipo de gráfico, leyendas, ejes
# 5. Save dashboard
```

Tipos de panel: Time series (líneas), Bar chart, Stat (número grande), Gauge, Table, Pie chart, Heatmap, Logs (Loki).

## 🔍 Panel Query (PromQL)

```promql
# CPU usage (%)
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage (%)
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk space (%)
100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)

# HTTP requests per second (from app metrics)
rate(http_requests_total[5m])

# P99 latency (from app metrics)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Up/down status
up{job="node"}
```

Opciones del panel: leyenda `{{instance}}`, unit `percent (0-100)`, `Min step` auto.

## 🎛️ Variables y templates

Dashboards reutilizables con filtros dinámicos:

```bash
# 1. Dashboard settings → Variables → New variable
# 2. Name: instance
# 3. Type: Query
# 4. Query: label_values(node_boot_time_seconds, instance)
# 5. Refresh: On dashboard load
# 6. Multi-value: yes, Include All: yes

# Usar en queries PromQL:
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle", instance=~"$instance"}[5m])) * 100)

# Variable de intervalo ($__auto, $__interval)
rate(http_requests_total[$__interval])
```

Otras variables útiles: `label_values(up{job="$job"}, instance)`, `query_result(count by(job) (up == 1))`.

## 🚨 Alertas

Alertas nativas de Grafana (Grafana Alerting, reemplaza Alertmanager en algunos casos):

```bash
# 1. Alerting → Alert rules → New alert rule
# 2. Nombre: "CPU alta en servidor {{ $labels.instance }}"
# 3. Query: avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) < 0.2
# 4. Condition: cuando el valor sea < 20 (cpu idle)
# 5. Evaluation: every 1m, for 5m (5 minutos sostenido)
# 6. Folder: Production
# 7. Contact point: email, Slack, PagerDuty, Webhook

# Notificaciones
# Alerting → Contact points → New contact
# Slack: https://hooks.slack.com/services/...
# Email: smtp config en grafana.ini
```

Canales: Slack, Email, PagerDuty, Telegram, Webhook (para conectar con Alertmanager, n8n, Make).

## 👥 Usuarios y permisos

```bash
# Admin → Users → Invite / New user
# Roles: Admin, Editor (crea dashboards), Viewer (solo lectura)

# Folders para organizar dashboards
# Dashboard settings → Folder → Production / Staging / Development

# Permisos por folder
# Folder → Manage permissions → Add permission
# Ej: folder "Infra" → Team "SRE" → Editor
```

## 📡 API y provisioning

Configurar dashboards y datasources por código (reproducible):

```yaml
# provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true
```

```yaml
# provisioning/dashboards/dashboard.yml
apiVersion: 1
providers:
  - name: "default"
    folder: "Production"
    type: file
    options:
      path: /var/lib/grafana/dashboards
```

```bash
# API REST: usa un token de service account (Administration → Users and access → Service accounts)
export GRAFANA_TOKEN="glsa_..."
curl -H "Authorization: Bearer $GRAFANA_TOKEN" "http://localhost:3000/api/search?query="   # buscar dashboards
curl -H "Authorization: Bearer $GRAFANA_TOKEN" http://localhost:3000/api/folders            # listar folders
```

> Evita `-u admin:admin` en scripts: los service accounts permiten permisos mínimos y revocación. Para gestionar Grafana como código, mira también el provider de Terraform/OpenTofu o `grafana-operator`.

## ❓ FAQ

**❓ Diferencia entre Grafana y Prometheus?**
➡ Prometheus almacena métricas y las consulta con PromQL. Grafana visualiza métricas de Prometheus (y otras fuentes) en dashboards.

**❓ Cómo resetear la contraseña de admin?**
➡ `grafana-cli admin reset-admin-password --homepath /usr/share/grafana nuevapass`

**❓ Cómo exportar un dashboard?**
➡ Dashboard settings → JSON Model → Copy JSON. Para importar: Dashboards → New → Import.

**❓ Cómo conectar Grafana con Loki?**
➡ Añadir datasource Loki (tipo: Loki), URL: `http://loki:3100`. Luego crear panel de tipo "Logs".

**❓ Error "Datasource not found"?**
➡ Verificar que el nombre del datasource en el panel coincide exactamente con el nombre configurado.

## 🔗 Enlaces
- [Documentación Grafana](https://grafana.com/docs/)
- [Grafana Dashboards (community)](https://grafana.com/grafana/dashboards/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)
- [Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Grafana Play (demo)](https://play.grafana.org/)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
