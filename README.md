# 📚 Colección de Manuales y Cheatsheets

Colección de **manuales y hojas de referencia** para desarrollo, servidores, multimedia y herramientas de programación, revisada y ampliada entre **octubre y noviembre de 2026**, con el estado de cada tecnología actualizado y las alternativas modernas señaladas.

---

## 🏷️ Navegación rápida
[![Firma y seguridad](https://img.shields.io/badge/🔐-Firma%20y%20seguridad-blue)](#-firma-cifrado-y-seguridad)
[![Git](https://img.shields.io/badge/🔀-Git-lightgrey)](#-git-y-control-de-versiones)
[![Python](https://img.shields.io/badge/🐍-Python%20y%20entornos-green)](#-python-y-entornos)
[![Web](https://img.shields.io/badge/🌐-Desarrollo%20web-orange)](#-desarrollo-web-y-backend)
[![Contenedores](https://img.shields.io/badge/🐳-Contenedores%20y%20despliegue-lightblue)](#-contenedores-y-despliegue)
[![Terminal](https://img.shields.io/badge/⚙️-Terminal%20y%20servidores-darkgreen)](#️-terminal-servidores-y-automatización)
[![Datos](https://img.shields.io/badge/📊-Datos%20y%20Regex-teal)](#-expresiones-regulares-y-herramientas-de-datos)
[![IA](https://img.shields.io/badge/🤖-IA%20y%20LLMs-orange)](#-ia-y-llms)
[![Agentes](https://img.shields.io/badge/🧠-Agentes-yellow)](#-agentes-y-automatización)
[![Automatización](https://img.shields.io/badge/⚡-Automatización%20visual-purple)](#-automatización-visual)
[![DevOps](https://img.shields.io/badge/☁️-DevOps%20y%20cloud-blue)](#️-devops-y-cloud)
[![Multimedia](https://img.shields.io/badge/🎛️-Multimedia%20y%20creativos-purple)](#️-multimedia-y-entornos-creativos)
[![Legacy](https://img.shields.io/badge/📟-Legacy%20x86_64-brown)](#-legacy--arquitectura-x86_64-rosetta)
[![Rutas](https://img.shields.io/badge/🧭-Rutas%20de%20aprendizaje-red)](#-rutas-de-aprendizaje)
[![Estado](https://img.shields.io/badge/🧹-Estado%20del%20software-lightyellow)](#-estado-del-software-octubre-2026)

---

## 📑 Tabla de Contenidos
- [🧭 Rutas de aprendizaje](#-rutas-de-aprendizaje)
- [🔐 Firma, cifrado y seguridad](#-firma-cifrado-y-seguridad)
- [🔀 Git y control de versiones](#-git-y-control-de-versiones)
- [🐍 Python y entornos](#-python-y-entornos)
- [🌐 Desarrollo web y backend](#-desarrollo-web-y-backend)
- [🐳 Contenedores y despliegue](#-contenedores-y-despliegue)
- [⚙️ Terminal, servidores y automatización](#️-terminal-servidores-y-automatización)
- [🔤 Expresiones regulares y herramientas de datos](#-expresiones-regulares-y-herramientas-de-datos)
- [🤖 IA y LLMs](#-ia-y-llms)
- [🧠 Agentes y automatización](#-agentes-y-automatización)
- [⚡ Automatización visual](#-automatización-visual)
- [☁️ DevOps y cloud](#️-devops-y-cloud)
- [🎛️ Multimedia y entornos creativos](#️-multimedia-y-entornos-creativos)
- [📟 Legacy / x86_64](#-legacy--arquitectura-x86_64-rosetta)
- [🧹 Estado del software (octubre 2026)](#-estado-del-software-octubre-2026)
- [🔗 Enlaces generales](#-enlaces-generales)

---

## 🧭 Rutas de aprendizaje

Si no sabes por dónde empezar, estas rutas encadenan los manuales por orden de utilidad.

- **🔰 De cero (desarrollo y tooling)**: Git → Bash scripting → Productividad en Shell → Makefile → Docker Compose → Nginx → SQL → SQLite → curl → Regex → sed/awk → Systemd/cron.
- **📈 Produce y despliega**: Git avanzado → Conventional Commits → GitHub Actions → Terraform/OpenTofu → kubectl → Helm → Prometheus → Observabilidad (OpenTelemetry) → Tempo → Docker avanzado → Python (uv + Calidad de código) → Node.js.
- **🚀 IA y agentes**: Prompt Engineering → LLM APIs → Ollama → Function Calling → MCP → Embeddings → RAG → Agentes con scripts → Agentes de coding IA.
- **🎛️ Creativo / multimedia**: Pure Data → Max/MSP y Jitter → TouchDesigner → ffmpeg → ImageMagick → (Ableton Live Extensions).
- **🔐 Seguridad, firma y red**, SSH → GPG → OpenSSL → Firma y Notarización (macOS) → Cadena de suministro y secretos → Red, puertos y DNS.
- **🪟 Si trabajas en Windows**: PowerShell y WSL2 → Git → Docker Compose → Docker avanzado → Bash scripting (dentro de WSL).

---

## 🔐 Firma, cifrado y seguridad
- [Firma y Notarización (Apple)](./sources/manual_firma_notarizacion.md) → `codesign`, hardened runtime, Universal 2 y `notarytool` (incluye `pkgbuild`/`productbuild`).
- [OpenSSL](./sources/manual_openssl.md) → OpenSSL 3.5 LTS: `genpkey`, CSR con SAN, TLS 1.3 y alternativas modernas (mkcert, certbot, Caddy).
- [GPG](./sources/manual_gpg.md) → Cifrado asimétrico, firmas digitales, firma de commits y alternativa moderna `age`.
- [SSH](./sources/manual_ssh.md) → Claves Ed25519/FIDO2, `~/.ssh/config` (ProxyJump), túneles, hardening y mallas (Tailscale/WireGuard).
- [Cadena de suministro y secretos](./sources/manual_supply_chain.md) → Trivy, SBOM (CycloneDX/SPDX), firma con Cosign/Sigstore y secretos cifrados con SOPS + age.

## 🔀 Git y control de versiones
- [Git](./sources/manual_git.md) → `switch`/`restore`, configuración moderna, worktrees, `git maintenance` y firma de commits con GPG/SSH.
- [Git avanzado](./sources/manual_git_avanzado.md) → Rebase interactivo, reflog, `bisect run`, cherry-pick, worktree y `git filter-repo`.
- [Conventional Commits y SemVer](./sources/manual_conventional_commits.md) → spec v1.0.0, herramientas de release (`release-please`, `git-cliff`) y changelogs.
- [GitHub CLI (`gh`)](./sources/manual_github_cli.md) → Operar GitHub desde el terminal: PRs, issues, releases, `gh api`.
- [GitHub Actions](./sources/manual_github_actions.md) → CI/CD moderno con `actions/checkout@v5`, matrices, OIDC y reusable workflows. *(también indexado en DevOps)*

## 🐍 Python y entornos
- [uv](./sources/manual_uv.md) → Gestor moderno de dependencias, entornos y proyectos (Astral): `uv add/sync/lock/run`.
- [Conda](./sources/manual_conda_entornos.md) → Gestión de entornos con conda 26, `conda-forge`/Miniforge y comparativa con mamba/pixi/uv.
- [pip y PyInstaller](./sources/manual_pip_pyinstaller.md) → Instalación de paquetes, PEP 668, `pipx` y empaquetado de ejecutables (PyInstaller/Nuitka).
- [pyenv](./sources/manual_pyenv.md) → Múltiples versiones de Python y sus alternativas modernas (`uv python`, `mise`).
- [Calidad del código Python](./sources/manual_python_calidad.md) → `ruff`, `mypy`/`pyright`, `pytest` y `pre-commit`.
- [Conda x86_64 en Mac Apple Silicon](./sources/environment_conda_x86_64.md) (→ ver 📟 Legacy): workaround `osx-64`, marcado como **obsoleto** por el fin de Rosetta.

## 🌐 Desarrollo web y backend
- [Node.js](./sources/manual_nodejs.md) → Node 24/26 LTS, `fnm`/`mise`, npm, workspaces y alternativas (Bun/Deno).
- [SQL](./sources/manual_sql.md) → Consultas, transacciones, CTEs, funciones ventana, `MERGE` y diferencias entre dialectos.
- [PostgreSQL](./sources/manual_postgresql.md) → PostgreSQL 18: roles, `EXPLAIN`, indexación, JSONB, `pgvector` y backups con pgBackRest/WAL-G.
- [MongoDB](./sources/manual_mongodb.md) → Base de datos NoSQL documental: colecciones, índices, agregaciones y replicación.
- [SQLite](./sources/manual_sqlite.md) → Base de datos embebida: WAL, `STRICT`, JSON, FTS5, backups y cuándo elegir otra.
- [Redis](./sources/manual_redis.md) → Almacenamiento en memoria: caching, colas, sesiones y pub/sub.
- [Nginx](./sources/manual_nginx.md) → Servidor web, proxy inverso, TLS moderno, HTTP/3 y alternativas (Caddy/Traefik).
- [Caddy y Traefik](./sources/manual_caddy_traefik.md) → Proxies inversos con HTTPS automático: Caddyfile, etiquetas Docker y comparativa con Nginx.
- [curl y depuración HTTP](./sources/manual_curl_http.md) → Peticiones, headers, `--json`, HTTP/3, diagnóstico de APIs y `hurl` para tests.

## 🐳 Contenedores y despliegue
- [Docker y Docker Compose](./sources/manual_docker_compose.md) → Contenedores, multi-stage, healthchecks y Compose v2 moderno (+ Podman/OrbStack como alternativas).
- [Docker avanzado](./sources/manual_docker_avanzado.md) → BuildKit (cachés y secretos), Bake, endurecimiento, redes, volúmenes, limpieza y Podman.

## ⚙️ Terminal, servidores y automatización
- [PowerShell y WSL2](./sources/manual_powershell_wsl.md) → PowerShell 7, `winget`, equivalencias con bash y WSL2 (configuración y flujo de trabajo).
- [Linux Cheatsheet](./sources/cheatsheet_comandos_linux.md) → Comandos modernos: `ip`/`ss`, `systemctl`, nftables, `apt`/`dnf` y herramientas actuales (`rg`, `eza`, `btop`).
- [Homebrew](./sources/manual_brew.md) → Gestor de paquetes en macOS/Linux: fórmulas, casks, `brew bundle` y `brew services`.
- [Bash Scripting](./sources/manual_bash_scripting.md) → `set -euo pipefail`, arrays, funciones, `trap`, `getopts` y shellcheck.
- [Shell Productivity](./sources/manual_shell_productivity.md) → Atajos, alias, historial (`fzf`/`atuin`), `pushd/popd`, starship y `direnv`.
- [tmux](./sources/manual_tmux.md) → Sesiones persistentes, paneles y `.tmux.conf` moderno (+ zellij).
- [Systemd](./sources/manual_systemd.md) → Servicios, unit files, `journalctl`, hardening y timers.
- [cron](./sources/manual_cron.md) → Sintaxis crontab, casos prácticos y por qué `systemd timers` es su alternativa moderna.
- [Makefile](./sources/manual_makefile.md) → Automatización de tareas con GNU Make (+ `just`/`Task`/`Ninja`).
- [Vim y Nano](./sources/manual_vim_nano.md) → Editores de terminal: Vim/Neovim, LSP y alternativas (Helix/micro).
- [Red, puertos y DNS](./sources/manual_red_dns.md) → `ip`/`ss`, `dig`, `tcpdump`, `nmap` y diagnóstico moderno (DoH/DoT).
- [sed y awk](./sources/manual_sed_awk.md) → Edición de flujos y procesamiento por columnas (GNU sed/gawk 5.4).

## 🔤 Expresiones regulares y herramientas de datos
- [Regex](./sources/manual_regex.md) → Motores (BRE/ERE/PCRE2/RE2), compatibilidad por herramienta y errores comunes.
- [jq](./sources/manual_jq.md) → Procesar y filtrar JSON desde terminal (jq 1.8, `yq`, `dasel`, `jless`).

## 🤖 IA y LLMs
- [Prompt Engineering](./sources/manual_prompt_engineering.md) → System/developer prompt, structured output, evals y mitigación de prompt injection.
- [LLM APIs desde CLI](./sources/manual_llm_apis.md) → OpenAI (Responses API), Anthropic, Gemini, Groq, DeepSeek y OpenRouter con `curl`.
- [Ollama](./sources/manual_ollama.md) → LLMs locales: descargar, ejecutar, Modelfile y API REST/OpenAI-compatible.
- [Embeddings y búsqueda semántica](./sources/manual_embeddings.md) → Vectores, similitud coseno, chunking, modelos vigentes y vector stores.
- [RAG práctico](./sources/manual_rag.md) → Recuperación híbrida, rerankers, evaluación y cuándo (no) usar RAG.

## 🧠 Agentes y automatización
- [Function Calling](./sources/manual_function_calling.md) → LLMs que ejecutan herramientas: ciclos tool-call, llamadas paralelas y structured outputs.
- [MCP (Model Context Protocol)](./sources/manual_mcp.md) → Especificación **2026-07-28**: primitivas, transports y seguridad para agentes ↔ herramientas.
- [Agentes con scripts](./sources/manual_agent_scripts.md) → Loop agente en Bash/Python sin frameworks y cuándo pasar a un framework (Agent SDK, LangGraph, PydanticAI).
- [Agentes de coding IA](./sources/manual_ai_coding_agents.md) → Claude Code, Codex, OpenCode, Aider; ficheros de contexto (`AGENTS.md`/`CLAUDE.md`) y buenas prácticas.

## ⚡ Automatización visual

Manuales para plataformas visuales de automatización de flujos de trabajo (workflow automation).

| Plataforma | Modelo | Licencia | Ideal para |
|---|---|---|---|
| [n8n](./sources/manual_n8n.md) | Self-hosted / Cloud | Sustainable Use (fair-code) | Flujos complejos, desarrolladores, AI agents |
| [Make.com](./sources/manual_make_com.md) | SaaS (cloud) | Propietaria | Transformación de datos, data stores, agregación |
| [Node-RED](./sources/manual_node_red.md) | Self-hosted | Apache 2.0 | IoT, APIs, Node.js, dispositivos |
| [Zapier](./sources/manual_zapier.md) | SaaS (cloud) | Propietaria | No-code, usuarios no técnicos, MCP/agentes |
| [ActivePieces](./sources/manual_activepieces.md) | Self-hosted / Cloud | Open core (MIT core + EE) | Automatización open-source, AI nativo |

- [n8n](./sources/manual_n8n.md) → Automatización visual con nodos, IA/agentes, error handling y self-hosting (n8n 2.x).
- [Make.com (ex-Integromat)](./sources/manual_make_com.md) → Escenarios, routers, data stores, agregadores y funciones.
- [Node-RED](./sources/manual_node_red.md) → Programación visual con Node.js (5.x), MQTT/HTTP, Function node y Dashboard 2.0.
- [Zapier](./sources/manual_zapier.md) → Zaps, filters/paths, Tables/Forms, webhooks, MCP y Next Gen Zaps.
- [ActivePieces](./sources/manual_activepieces.md) → Open core, pieces, self-hosting y alternativa ligera (verifica licencia EE).

## ☁️ DevOps y cloud
- [Observabilidad (OpenTelemetry)](./sources/manual_observabilidad.md) → Los tres pilares (métricas, trazas, logs) con OTel, SLI/SLO y el stack Prometheus/Grafana/Loki/Tempo.
- [Tempo](./sources/manual_tempo.md) → Trazas distribuidas con OTLP y TraceQL, y su integración con Grafana, Loki y Prometheus.
- [kubectl](./sources/manual_kubectl.md) → Gestionar Kubernetes (1.37): pods, deployments, server-side apply, `kubectl debug` y k9s.
- [GitHub Actions](./sources/manual_github_actions.md) → CI/CD: matrices, artefactos, OIDC, reusable workflows y entornos. *(también indexado en Git)*
- [Terraform / OpenTofu](./sources/manual_terraform.md) → IaC actualizado: diferencias de licencia (BUSL vs MPL), cifrado de state y gestión de cambios.
- [Helm](./sources/manual_helm.md) → Gestor de paquetes Kubernetes (Helm 4): charts, templates, repos OCI y GitOps.
- [ArgoCD](./sources/manual_argocd.md) → GitOps para Kubernetes: sincroniza clusters directamente desde el repo.
- [Ansible](./sources/manual_ansible.md) → Automatización de configuración y despliegue (agent-less, playbooks YAML).
- [AWS CLI](./sources/manual_aws_cli.md) → Gestión de servicios AWS desde terminal (`s3`, `ec2`, IAM, perfiles).
- [GitLab CI/CD](./sources/manual_gitlab_ci.md) → Pipelines con `.gitlab-ci.yml`, runners y caché.
- [Prometheus](./sources/manual_prometheus.md) → Monitoreo: métricas, PromQL, alertas y el ecosistema Mimir/VictoriaMetrics.
- [Grafana](./sources/manual_grafana.md) → Dashboards y alertas para métricas (complementa Prometheus).
- [Loki](./sources/manual_loki.md) → Logging centralizado estilo Prometheus (complementa la observabilidad).

## 🎛️ Multimedia y entornos creativos
- [Pure Data](./sources/manual_puredata.md) → Pd Vanilla/Purr Data/plugdata, objetos de audio, externals, GEM y Raspberry Pi (Pd-extended marcado como obsoleto).
- [Max/MSP y Jitter](./sources/manual_max_msp_jitter.md) → Max 9: MSP, patching, Max for Live, RNBO y Jitter (vídeo/3D).
- [TouchDesigner](./sources/referencia_touchdesigner.md) → Nodos TOP, CHOP, SOP, DAT, COMP y MAT; vídeo mapping y señales/OSC para directo.
- [Ableton Live Extensions](./sources/manual_ableton_extensions.md) → Extiende Live 12.2+ con JavaScript/TypeScript: automatizar sesiones, clips y renders.
- [ffmpeg](./sources/manual_ffmpeg.md) → Procesamiento de audio/vídeo: convertir, cortar, escalar, HLS y códecs modernos.
- [ImageMagick](./sources/manual_imagemagick.md) → Procesamiento de imágenes desde CLI: `magick` v7, formatos modernos y seguridad.

## 📟 Legacy / Arquitectura x86_64 (Rosetta)

> ⚠️ **Fin de Rosetta 2**: macOS 27 (sept. 2026) es la **última versión con soporte completo** de Rosetta. A partir de **macOS 28 (otoño 2027)** la mayoría de las aplicaciones Intel dejarán de ejecutarse (Apple ha indicado que mantendrá Rosetta para juegos antiguos sin mantenimiento y para binarios Intel dentro de máquinas virtuales Linux, según su [aviso a desarrolladores](https://developer.apple.com/news/?id=w5ngl9k2)). Estos manuales documentan el flujo legacy para mantener compatibilidad x86_64, pero **la migración a arm64 nativo es la única vía a futuro** (alternativas: contenedores `linux/amd64` o CI).

- [Conda x86_64 en Mac Apple Silicon](./sources/environment_conda_x86_64.md) → Workaround `osx-64` (legacy) y rutas nativas arm64.
- [Homebrew Dual Architecture](./sources/gestionar_brew_x86_64_arm64.md) → Homebrew ARM64 + x86_64 sin conflictos (legacy) y checklist de migración.
- [Node.js Dual Architecture](./sources/nodejs-dual-architecture.md) → Node arm64 + x86_64 en paralelo (legacy) y tabla de decisión contenedor/CI.

---

## 🧹 Estado del software (octubre 2026)

Tecnologías revisadas: su estado actual y la alternativa recomendada en esta colección.

| Tecnología | Estado (oct. 2026) | Alternativa recomendada |
|---|---|---|
| Rosetta 2 / apps Intel | 🔴 Fin con macOS 28 (2027) | Binarios arm64/Universal; contenedores en CI |
| Terraform (>1.6) | 🟠 BUSL-1.1 (licenciatario IBM) | [OpenTofu (MPL-2.0)](./sources/manual_terraform.md) para licencia libre/cifrado |
| CDK for Terraform | 🔴 Archivado (dic. 2025) | HCL / Pulumi |
| tfsec · Terrascan | 🔴 Archivados/fusionado | [Trivy](./sources/manual_supply_chain.md) / Checkov |
| `standard-version` | 🔴 Deprecado en npm | release-please · semantic-release · git-cliff |
| `git filter-branch` · BFG | 🔴 Obsoleto | [git filter-repo](https://github.com/newren/git-filter-repo) |
| Helm 2 · Helm 3 | 🔴 EOL / 🟠 apoyo hasta feb. 2027 | [Helm 4](./sources/manual_helm.md) |
| `docker-compose` v1 | 🔴 EOL | [`docker compose` v2](./sources/manual_docker_compose.md) |
| `altool` (Apple) | 🔴 Deprecado | [`notarytool`](./sources/manual_firma_notarizacion.md) |
| OpenSSL 3.0 | 🔴 EOL (sept. 2026) | OpenSSL **3.5 LTS** |
| `easy_install` · `setup.py install` | 🔴 Obsoletos | [pip / uv](./sources/manual_uv.md) |
| `pip install --user` | 🟠 Desaconsejado | venv · pipx · `uv tool` |
| rye | 🔴 Archivado (feb. 2026) | [uv](./sources/manual_uv.md) |
| Canales `default` de Anaconda | 🟠 ToS comercial | Miniforge + conda-forge / pixi |
| `nodemon` | 🟠 Sustituido | `node --watch` (integrado) |
| `nvm` (JS) | 🟠 Clásico | fnm / mise (más rápidos) |
| SQL `SERIAL` · `uuid-ossp` | 🟠 Antiguos | `GENERATED AS IDENTITY` · `gen_random_uuid()` |
| `ifconfig`/`netstat` (Linux) · `yum` · `iptables` legacy | 🔴 Obsoletos | `ip`/`ss` · `dnf` · `nftables` |
| `service`/`init.d` (SysV) | 🔴 Retirado | [systemd systemctl/timers](./sources/manual_systemd.md) |
| GNU Screen · `vi` clásico | 🟠 En desuso práctico | [tmux/zellij](./sources/manual_tmux.md) · [vim/nvim](./sources/manual_vim_nano.md) |
| `at`/`batch` | 🟠 De nicho | `systemd-run --on-calendar` / timers |
| ImageMagick v6 (`convert`) | 🟠 En retirada | `magick` (v7) · libvips |
| ffmpeg `libfaac`/`libxvid`/VP8 para web | 🔴 Desaconsejados | `-c:a aac` · libx264/libx265/SVT-AV1 |
| Regex **BRE** · PCRE1 | 🔴 Obsoletos | `grep -E`/PCRE2/ripgrep |
| MCP spec 2024-11-05 · HTTP+SSE | 🔴 Obsoletos | [MCP 2026-07-28](./sources/manual_mcp.md) |
| `sqlite-vss` | 🔴 Abandonado | `sqlite-vec` |
| OpenAI Chat Completions | 🟠 Se recomienda migrar | [Responses API](./sources/manual_llm_apis.md) |
| Node-RED Dashboard 1.0 | 🔴 Deprecado (2024) | Dashboard 2.0 (FlowFuse) |
| ActivePieces | 🟠 MIT → open core | Verifica licencia EE por uso |
| Pd-extended (Pure Data) | 🔴 Abandonado (2013) | Pd Vanilla + deken · Purr Data · plugdata |
| Promtail (Loki) · Grafana Agent | 🔴 Promtail EOL 2 mar. 2026 | [Grafana Alloy](./sources/manual_loki.md) |
| GitLab CI `only`/`except` · registration token | 🟠 En desuso | `rules:` · runner authentication token ([GitLab CI](./sources/manual_gitlab_ci.md)) |
| Redis (licencia BSD) | 🟠 Source-available de 7.4 a 7.8; Redis 8 añade AGPLv3 | [Valkey](./sources/manual_redis.md) (BSD) |
| Ansible módulos sin FQCN · `pip install ansible` global | 🟠 Desaconsejado | [FQCN + pipx](./sources/manual_ansible.md) |
| Claves de acceso AWS de larga duración | 🟠 Desaconsejadas | [SSO / roles / OIDC](./sources/manual_aws_cli.md) |

---

## 🔗 Enlaces generales
- [Documentación oficial de Python](https://docs.python.org/3/)
- [Documentación de Node.js](https://nodejs.org/en/docs)
- [Documentación oficial de Docker](https://docs.docker.com/)
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación de uv (Astral)](https://docs.astral.sh/uv/)
- [Página oficial de Pure Data](https://puredata.info/)
- [Max/MSP – Cycling '74](https://cycling74.com/)
- [TouchDesigner Docs](https://docs.derivative.ca/)
- [Homebrew Documentation](https://docs.brew.sh/)
- [Pro Git Book](https://git-scm.com/book/es/v2)
- [Regex101: tester interactivo](https://regex101.com/)
- [jq play (sandbox online)](https://jqplay.org/)
- [crontab.guru](https://crontab.guru/)
- [Explain Shell](https://explainshell.com/)
- [Ollama](https://ollama.com/)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Kubernetes docs](https://kubernetes.io/docs/)
- [Prometheus docs](https://prometheus.io/docs/)
- [OpenTelemetry](https://opentelemetry.io/)
- [OpenTofu](https://opentofu.org/)

---

📌 **Nota**: Cada manual está diseñado como guía rápida y práctica, con ejemplos de comandos, resolución de problemas y enlaces útiles verificados.

---

## 🤝 Cómo contribuir

1. **Nuevo manual**: copia [`templates/plantilla_manual.md`](./templates/plantilla_manual.md) a `sources/manual_<tema>.md` y enlázalo desde la sección correspondiente de este README (y desde la ruta de aprendizaje o la tabla de estado si procede).
2. **Verifica los datos**: versiones, fechas de fin de vida y licencias deben comprobarse en la fuente oficial y, si cambian con el tiempo, citarse con enlace. Si no puedes comprobar algo, no lo afirmes.
3. **Fecha "Revisado"**: actualízala solo cuando revises de verdad el contenido de ese manual.
4. **Comprueba antes de enviar**: `node scripts/check-docs.mjs` valida enlaces, anclas, cabeceras, bloques de código y tablas de contenidos (`--fix-toc` regenera estas últimas). Requiere Node 18 o posterior y no instala dependencias.
5. **Commits**: [Conventional Commits](./sources/manual_conventional_commits.md) en español (`docs: …`, `fix: …`).

Revisa la tabla de **Estado del software** al menos cada trimestre.

---

## 📝 Créditos

Colección creada y mantenida por **CeleroLab** ([celerolab.com](https://celerolab.com)).  
Distribuida bajo [MIT License](LICENSE). Revisión y ampliación: octubre y noviembre de 2026.

¿Preguntas, sugerencias o correcciones?  
Abre un [issue](https://github.com/ekosistema/atelier/issues) o envía un Pull Request.