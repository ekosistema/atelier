# Helm – El gestor de paquetes de Kubernetes

Helm empaqueta aplicaciones de Kubernetes en **charts** (plantillas Go + YAML reutilizables) que se instalan, actualizan y revierten como una unidad, gestionando dependencias y valores de configuración. Es el estándar de facto para distribuir aplicaciones en el clúster.

> 🎯 **Nivel**: intermedio · **Requisitos**: clúster Kubernetes y kubectl configurado · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Versiones: Helm 4 vigente, Helm 3 en apoyo](#️-versiones-helm-4-vigente-helm-3-en-apoyo)
- [Conceptos](#-conceptos)
- [Estructura de un chart](#-estructura-de-un-chart)
- [Comandos básicos](#-comandos-básicos)
- [Template básico](#-template-básico)
- [Chart.yaml con dependencias](#-chartyaml-con-dependencias)
- [Desarrollo y validación](#️-desarrollo-y-validación)
- [Hooks y tests](#-hooks-y-tests)
- [Repos OCI](#-repos-oci)
- [Cuándo usar Helm vs alternativas?](#️-cuándo-usar-helm-vs-alternativas)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🛡️ Versiones: Helm 4 vigente, Helm 3 en apoyo

La versión estable actual es **Helm v4** (GA en noviembre de 2025). Helm v3 quedó en **modo apoyo**: su última release con funcionalidades fue el 9 de septiembre de 2026 (solo actualizaciones de las librerías cliente de Kubernetes) y recibirá solo parches de seguridad hasta el **10 de febrero de 2027**; después no habrá más releases ([anuncio oficial](https://helm.sh/blog/helm-v3-end-of-life)).

```bash
helm version        # comprobar la versión instalada
```

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: **Helm 2** está EOL: dependía de Tiller, un componente servidor privilegiado eliminado en Helm 3. Usa Helm 4 (o 3 de transición).
> 📌 **Estado**: **Helm 3** sigue siendo seguro mientras dura el apoyo (hasta el 10 de febrero de 2027), pero migra a Helm 4 para nuevas instalaciones.

## 📦 Conceptos

```text
Chart   → paquete Helm (directorio con Chart.yaml + templates) reutilizable
Release → una INSTANCIA instalada de un chart (nombre dentro del clúster)
Repo    → repositorio de charts (HTTP, o registry OCI)
Values  → configuración inyectada en las plantillas en tiempo de instalación
```

## 📁 Estructura de un chart

```text
mi-app/
├── Chart.yaml          # metadatos: nombre, versión, dependencies (apiVersion v2)
├── values.yaml         # valores por defecto documentados
├── charts/             # dependencias (sub-charts) empaquetadas
├── templates/          # plantillas Go + YAML
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── _helpers.tpl    # helpers reutilizables
│   └── NOTES.txt       # instrucciones al instalar
└── .helmignore         # ficheros que se excluyen del chart
```

## 🚀 Comandos básicos

```bash
# Repositorios
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm repo list

# Búsqueda
helm search repo bitnami/nginx
helm search hub nginx                 # Artifact Hub (todos los repos públicos)

# Instalar / actualizar en un solo comando (recomendado)
helm upgrade --install mi-app ./mi-app \
  --namespace prod --create-namespace \
  --values prod-values.yaml \
  --atomic                            # revierte si el deploy falla a mitad

# Ver releases y estado
helm list -A
helm status mi-app
helm get values mi-app                # valores activos tras el upgrade
helm get manifest mi-app              # YAML final generado

# Rollback
helm history mi-app
helm rollback mi-app 2                # volver a la revisión 2

# Eliminar
helm uninstall mi-app --namespace prod
```

Incluye señales de `--atomic`: si el rollout falla, Helm deshace la release y no queda medio-desplegada.

## 🧩 Template básico

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mi-app.fullname" . }}
  labels:
    app: {{ include "mi-app.name" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "mi-app.name" . }}
  template:
    metadata:
      labels:
        app: {{ include "mi-app.name" . }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.port }}
```

```yaml
# values.yaml (siempre documenta cada campo)
replicaCount: 2
image:
  repository: nginx
  tag: "1.27"        # entre comillas para que YAML no lo lea como número
service:
  port: 80
```

## 📝 Chart.yaml con dependencias

```yaml
apiVersion: v2
name: mi-app
description: Mi aplicación empaquetada con Helm
version: 0.1.0
appVersion: "1.0"
type: application

dependencies:
  - name: postgresql
    version: "~12.0"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled   # solo corre si postgresql.enabled: true
```

```bash
helm dependency update ./mi-app      # descarga y empaqueta las dependencias
```

## 🛠️ Desarrollo y validación

```bash
helm lint ./mi-app                          # validar sintaxis y convenciones
helm template ./mi-app --values prod-values.yaml   # renderizar sin instalar
helm template ./mi-app --debug              # ver el template en contexto con la salida
helm package ./mi-app                       # genera mi-app-0.1.0.tgz

helm pull oci://registry-1.docker.io/bitnamicharts/nginx   # descargar desde un repo OCI
helm show values bitnami/nginx              # ver los valores que acepta un chart
```

## 🎣 Hooks y tests

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "mi-app.fullname" . }}-test"
  annotations:
    "helm.sh/hook": test-success      # se ejecuta con helm test
spec:
  containers:
    - name: wget
      image: busybox
      command: ["wget", "{{ include "mi-app.fullname" . }}:{{ .Values.service.port }}"]
  restartPolicy: Never
```

```bash
helm test mi-app         # ejecuta los hooks de tipo test-success / test-failure
```

Los hooks (instal, upgrade, pre/post) orquestan acciones antes o después de una release; usarlos con moderación: hacen más complejo el flujo de release.

## 🔐 Repos OCI

Helm 3+ (y 4) publica charts en registries compatibles con OCI (Docker Hub, GHCR, ECR):

```bash
helm registry login ghcr.io --username tu_usuario
helm push mi-app-0.1.0.tgz oci://ghcr.io/tu_usuario/charts
helm install mi-app oci://ghcr.io/tu_usuario/charts/mi-app --version 0.1.0
```

## ⚖️ ¿Cuándo usar Helm vs alternativas?

| En su lugar | Ventaja | Cuándo |
|---|---|---|
| **Kustomize** (nativo kubectl) | Sin motor de plantillas, overrides por overlay; simple | Manifiestos propios, sin parametrización compleja |
| **Helm** | Charts reutilizables, dependencias, versionado, rollback | Aplicaciones de terceros y componentes con configuración parametrizable |
| **Argo CD / Flux** (GitOps) | Sync continuo repo→clúster, la fuente de verdad es git | Producción multi-entorno, despliegues automatizados y auditables |
| **Timoni / Carvel (ytt)** | Plantillado más moderno (CUE / ytt), menos magical | Equipos que quieren escapar de Go templates |

> 🧪 **Alternativa moderna.** Para despliegues GitOps, sustituye el `helm upgrade` manual por **Argo CD** (que además puede seguir usando charts Helm como fuente) o **Flux**: el estado del clúster converge solo desde el repo, sin comandos en terminal.

## ❓ FAQ

**❓ ¿Helm 2 o 3/4?**
➡ Helm 4, sin Tiller. Helm 2 está EOL y Helm 3 está en modo apoyo.

**❓ ¿`helm install` o `helm upgrade --install`?**
➡ `upgrade --install` hace ambas cosas (crea o actualiza) y es el comando idempotente correcto.

**❓ ¿Cómo paso valores anidados por CLI?**
➡ `--set persistence.enabled=true,persistence.size=10Gi`. Para algo complejo mejor `--values`.

**❓ ¿Qué significan los hooks?**
➡ Anotaciones que ejecutan plantillas en momentos concretos del ciclo de release (install/upgrade/pre/post), p. ej. migraciones de BD antes del despliegue.

**❓ ¿Cómo veo qué generó realmente?**
➡ `helm get manifest mi-app` (release aplicada) o `helm template` (sin tocar el clúster).

## 🔗 Enlaces

- [Helm docs](https://helm.sh/docs/)
- [Helm en GitHub (releases)](https://github.com/helm/helm/releases)
- [Artifact Hub (búsqueda de charts)](https://artifacthub.io/)
- [Helm best practices](https://helm.sh/docs/chart_best_practices/)
- [Bitnami charts](https://bitnami.com/stacks/helm)

## 🧩 Ver también

- [manual_kubectl.md](./manual_kubectl.md): el CLI sobre el que actúa Helm
- [manual_terraform.md](./manual_terraform.md): provisionar el clúster que aloja los charts
- [manual_observabilidad.md](./manual_observabilidad.md): observar lo desplegado
- [manual_docker_compose.md](./manual_docker_compose.md): contenedores sin orquestador

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
