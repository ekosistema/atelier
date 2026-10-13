# GitHub Actions – CI/CD desde el repositorio

Plataforma de CI/CD integrada en GitHub. Automatiza builds, tests y despliegues con workflows YAML activados por eventos del repo (push, PR, schedule, release). Es el motor por defecto para repos en GitHub.com y GitHub Enterprise.

> 🎯 **Nivel**: intermedio · **Requisitos**: repositorio en GitHub · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Estructura y workflow básico](#-estructura-y-workflow-básico)
- [Triggers comunes](#-triggers-comunes)
- [Matrices (varias versiones/OS)](#-matrices-varias-versionesos)
- [Caché de dependencias](#-caché-de-dependencias)
- [Artefactos entre jobs](#-artefactos-entre-jobs)
- [Dependencias entre jobs y condiciones](#-dependencias-entre-jobs-y-condiciones)
- [OIDC hacia AWS / GCP (sin secretos de nube)](#-oidc-hacia-aws--gcp-sin-secretos-de-nube)
- [Reusable workflows y composite actions](#-reusable-workflows-y-composite-actions)
- [Environments, approvals y concurrency](#️-environments-approvals-y-concurrency)
- [Self-hosted runners y fin de los macos x86](#️-self-hosted-runners-y-fin-de-los-macos-x86)
- [Comandos y actions en desuso](#️-comandos-y-actions-en-desuso)
- [Alternativas a GitHub Actions](#-alternativas-a-github-actions)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 📁 Estructura y workflow básico

```text
.github/workflows/
├── test.yml
├── deploy.yml
└── lint.yml
```

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5        # Node 24, mínimo runner 2.327.1
      - uses: actions/setup-node@v5      # (setup-python@v5 para Python)
        with:
          node-version: "22"
      - run: npm ci
      - run: npm test
```

> 📌 **Estado**: `actions/checkout` usa Node 24 desde la **v5** (hoy existen también versiones posteriores: consulta la [última release](https://github.com/actions/checkout/releases/latest)). Usa **v5** o superior; las versions 1–3 quedan en desuso y fuerzan avisos de deprecación del runtime.

## 🎯 Triggers comunes

```yaml
on:
  push:                                 # cada push
  pull_request:                         # cada apertura/modificación de PR
  schedule:
    - cron: "0 6 * * 1"                # todos los lunes a las 6:00
  workflow_dispatch:                    # botón manual en la UI
  release:
    types: [published]                  # al publicar un release
```

## 📦 Matrices (varias versiones/OS)

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-14, windows-latest]
        node: [20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci && npm test
```

## 💾 Caché de dependencias

```yaml
- uses: actions/setup-node@v5
  with:
    node-version: "22"
    cache: npm            # setup-node gestiona la caché del gestor solo
- uses: actions/cache@v4  # caché manual para lo que no cubren los setup-*
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```

## 📤 Artefactos entre jobs

```yaml
# jobs/1-generar.yml
- run: npm run build
- uses: actions/upload-artifact@v4
  with:
    name: build-files
    path: dist/

# jobs/2-consumir.yml
- uses: actions/download-artifact@v4
  with:
    name: build-files
    path: dist/
```

## 🔄 Dependencias entre jobs y condiciones

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [{ run: npx eslint . }]

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps: [{ run: npm test }]

  deploy:
    needs: [lint, test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps: [{ run: ./deploy.sh }]
```

## 🔐 OIDC hacia AWS / GCP (sin secretos de nube)

Con OIDC configuras un **role en la nube** que la acción asume con un token firmado, sin guardar credenciales de larga duración:

```yaml
steps:
  - uses: actions/checkout@v5
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/github-actions
      aws-region: eu-west-1
  - uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: "projects/123/locations/global/workloadIdentityPools/github/providers/my-provider"
      service_account: "ci@sandbox.iam.gserviceaccount.com"
  - run: terraform apply -auto-approve   # con la identidad asumida, sin secrets
```

## 🧩 Reusable workflows y composite actions

**Reusable workflow** (solo se llama desde otro workflow, en el mismo repo u otro):

```yaml
# .github/workflows/build.yml
on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
    outputs:
      job_id:
        value: ${{ jobs.build.outputs.id }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: ${{ inputs.node-version }} }
      - run: npm ci && npm run build
```

**Composite action** (reutilizable entre pasos y con inputs):

```yaml
# .github/actions/setup-env/action.yml
name: "Configurar entorno"
inputs:
  node-version:
    required: true
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v5
      with: { node-version: ${{ inputs.node-version }} }
```

## 🎛️ Environments, approvals y concurrency

```yaml
jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment: production          # protección: aprobación manual + secrets del entorno
    concurrency:
      group: prod-deploy             # no permite dos deploys a la vez
      cancel-in-progress: false
    steps:
      - run: ./deploy.sh
```

`environment` añade revisores de aprobación y secrets/variables aislados por entorno.

## 🖥️ Self-hosted runners y fin de los macos x86

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, arm64]   # etiquetas de tu propio runner
    steps:
      - run: ./build.sh
```

> 📌 **Estado**: GitHub retira la imagen **macos-13** (x86) en 2026; migra a `macos-14`/`macos-15`/`macos-26`. Además, los runners exigen versión mínima **2.329.0** (jun. 2026) y **Node 20 ya no está disponible en los runners** ([aviso de GitHub, sept. 2026](https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions)); los JavaScript actions se ejecutan con Node 24. En CI: usa `actions/checkout@v5+`, evita actions que fijen Node 20, y versiona `actions/cache`/`upload-artifact` a v4+.

## ⚠️ Comandos y actions en desuso

> 📌 **Estado**: `actions/setup-node@v1` y `actions/checkout@v3-` quedan en desuso por el runtime Node. Dentro de los pasos, **`set-output` y `save-state` están obsoletos** desde 2022 (sustituidos por los ficheros de entorno):
> ```yaml
> - run: echo "version=$(node -v)" >> "$GITHUB_OUTPUT"      # antes: ::set-output
>   id: info
> - run: echo "clave=valor" >> "$GITHUB_STATE"              # antes: ::save-state
> ```

## 🧪 Alternativas a GitHub Actions

| En su lugar | Ventaja | Cuándo |
|---|---|---|
| [GitLab CI](https://docs.gitlab.com/ci/) | Pipelines nativos, runner/caché integrados | ya usas GitLab como plataforma de repo |
| [Forgejo / Gitea Actions](https://forgejo.org/) | Actions compatibles, self-hosted, sin límites | repos autohospedados y sin GitHub |
| [CircleCI](https://circleci.com/) | Orquestación madura, grandes paralelismos | equipos que vienen de CI externa |

## ❓ FAQ

**❓ ¿`push` o `pull_request`?**
➡ `push` corre al subir a la rama; `pull_request` al abrir/modificar un PR. Para CI de PR suele bastar `pull_request`.

**❓ ¿Cómo evito que un workflow corra en forks?**
➡ `if: github.repository == 'user/repo'` (y cautela con `pull_request_target`).

**❓ ¿Cómo ejecuto Actions en local?**
➡ Con `act` (nektos/act) para debug de workflows sin subirlos.

**❓ ¿Cómo paso secretos de nube sin guardarlos?**
➡ Mediante OIDC: el runner asume un role (AWS/GCP) con un token firmado.

## 🔗 Enlaces

- [GitHub Actions docs](https://docs.github.com/en/actions)
- [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Configurar OIDC en GitHub](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-cloud-providers)
- [actions/checkout releases](https://github.com/actions/checkout/releases)
- [act: Actions en local](https://github.com/nektos/act)

## 🧩 Ver también

- [manual_terraform.md](./manual_terraform.md): provisionar con `plan`/`apply` en CI
- [manual_kubectl.md](./manual_kubectl.md): desplegar al clúster desde el workflow
- [manual_helm.md](./manual_helm.md): GitOps con Argo CD / Flux como alternativa al CI-deploy manual
- [manual_docker_compose.md](./manual_docker_compose.md): construir imágenes en los runners

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
