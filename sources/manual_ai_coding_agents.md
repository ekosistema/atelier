# Agentes de coding IA – Asistentes de programación en CLI/IDE

El panorama de agentes que escriben código en 2026: Claude Code, Codex CLI, Gemini CLI, OpenCode, Aider y los del IDE (Cursor/Windsurf/Copilot), cómo configurarlos con ficheros de contexto del repo, permisos y `git worktree`.

> 🎯 **Nivel**: intermedio · **Requisitos**: git y un repo propio · **Revisado**: octubre 2026

## 🧠 ¿Qué es un agente de coding en 2026?

Herramientas que leen tu repo, ejecutan comandos, editan archivos y revisan diffs, tipificadas para trabajar en la terminal o el IDE. A fecha de oct. 2026 el ecosistema está consolidado en CLIs (open source y propietarios) y asistentes de editor.

> 📌 **Estado** (oct. 2026): el mercado maduró; **Windsurf pasó a ser "Devin Desktop"** y **Gemini CLI está migrando a Antigravity CLI** (anuncio de mayo 2026). Verifica cada producto en su web oficial antes de decidir.

## 🖥️ CLIs de terminal (principales)

| Herramienta | Licencia | Nota (oct. 2026) |
|---|---|---|
| **Claude Code** | Propietaria (Anthropic) | El más conocido; nativo de Claude, extensible con MCP y agent SDK |
| **Codex CLI** | Apache-2.0 (openai/codex) | Agente de OpenAI para terminal; sandbox y AGENTS.md |
| **Gemini CLI** | Open; migrando a Antigravity CLI | Google; multi-provider de pago |
| **OpenCode** | MIT (opencode-ai/opencode) | El open source más popular; ~75+ modelos/MCP/LSP |
| **Aider** | Apache-2.0 (Aider-AI/aider) | EL clásico "pair programmer" orientado a git |

```bash
# Ejemplos de instalación (COMANDOS ILUSTRATIVOS: verifica en cada repo oficial)
npm install -g @anthropic-ai/claude-code        # Claude Code
npm install -g @openai/codex                    # Codex CLI
# OpenCode: brew install opencode / descarga binario; Aider: pip install aider-chat
```

## 🖼️ Asistentes de IDE

| Producto | Qué es |
|---|---|
| **Cursor** | Editor con IA integrada (basado en VS Code) |
| **Windsurf (→ Devin Desktop)** | El editor Windsurf se está fusionando en Devin Desktop |
| **GitHub Copilot** | Asistente en VS Code/JetBrains; integrado con agentes |

> 📌 A fecha de oct. 2026 la oferta de IDE cambia rápido (renombres/fusiones). Enlazamos su web oficial en `## 🔗 Enlaces`; no damos versiones ni licencias que no estén verificadas al día.

## 📄 Ficheros de contexto del repo

Son instrucciones para el agente que leen automáticamente al trabajar en tu repo.

| Fichero | Qué es |
|---|---|
| **`AGENTS.md`** | Estándar abierto (Linux Foundation/Agentic AI Foundation); lo leen varios agentes |
| **`CLAUDE.md`** | Memoria de proyecto de Claude Code (usa `AGENTS.md` como fallback) |
| **`.cursor/rules/*.mdc`** | Reglas de Cursor (mecanismo actual; `.cursorrules` quedó **legacy**) |

```markdown
<!-- AGENTS.md (raíz del repo): reglas que el agente debe seguir -->
# Reglas del repo
- Usa el estilo de este manual: comentarios en español, `set -euo pipefail`.
- Ejecuta `./scripts/lint.sh` antes de declarar una tarea terminada.
- No edites ficheros fuera de `src/` sin decirlo.
```

> 📌 **Estado**: el `.cursorrules` (un solo fichero) quedó en desuso frente a `.cursor/rules/*.mdc`; el estándar transversal es `AGENTS.md`. Claude Code prioriza `CLAUDE.md` y cae a `AGENTS.md`.

## 🔐 Modos de permisos / sandbox

Los CLIs ofrecen niveles de permiso para qué puede ejecutar el agente:

- **Plan / read-only**: solo lee y propone; tú apruebas cada cambio.
- **Auto-edit**: edita archivos; las acciones de más candado piden confirmación.
- **Máximo**: ejecuta comandos libremente (p. ej. dentro de un sandbox/shell acotado, como hace Codex).

```bash
# Ejemplo ilustrativo (flags según cada CLI)
claude --permission-mode acceptEdits      # edita pero no ejecuta sin pedir
codex --sandbox danger-full-access         # full access solo si lo decides
```

Empieza siempre en modo permisivo, aprobando tú los primeros turnos; súbelo gradualmente cuando confíes.

## 🔌 MCP como extensión

Los CLIs y agentes modernos consumen **MCP** para añadir tools (búsqueda web, acceso a una API interna, SSO...). Declaras el servidor en la config del agente, como en [MCP](./manual_mcp.md), y el agente lista e invoca sus tools de forma nativa.

```json
// config de MCP en tu agente (mcpServers en claude.json / .mcp.json...)
{
  "mcpServers": {
    "github": {"command": "npx", "args": ["@modelcontextprotocol/server-github"]}
  }
}
```

## 🌿 Git worktree para paralelizar

Con `git worktree` puedes tener varios agentes/editando ramas en el **mismo repo sin pisotearse** (cada worktree es un checkout en una carpeta distinta).

```bash
git worktree add ../feature-a -b feature-a   # segundo tree en la rama feature-a
git worktree add ../feature-b -b feature-b   # tercero en feature-b
# cada agente trabaja en su carpeta; luego merges desde el repo principal
git worktree list
git worktree prune
```

## 👀 Revisión de diffs

Nunca mergees a ciegas: revisa lo que generó el agente. Usa `git diff` y añade una review manual (y/o un segundo agente) como guard:

```bash
git diff --stat main..mi-rama       # qué ficheros cambió
git diff main..mi-rama              # el contenido completo
# protege la rama principal y exige PR/approval en equipos
```

## 💸 Coste y límites

- Cada herramienta tiene un **plan y límites** (mensajes/día, tokens, o BYO-API key). Consulta su web.
- Con tu propia API key pagas por token real; con planes de suscripción es un coste fijo.
- Si el agente se bloquea o da vueltas, baja el alcance de la tarea y divide el problema.

## 🚫 Cuándo NO delegar

- Cambios críticos de seguridad, datos o producción sensible: revísalos tú.
- Refactors enormes sin tests: el agente puede "arreglar" sin romper aparentemente y esconder regresiones.
- Decisiones de arquitectura (no es tan bueno eligiendo trade-offs); usalo para ejecutarlos, no para decidirlas.
- Base de código sin build/tests locales: el agente no puede validar y alucina "todo bien".

## ❓ FAQ

**❓ ¿Cuál elijo?**
➡ Empieza por un CLI open (OpenCode o Aider) para tu stack; prueba Claude Code/Codex si ya usas esos modelos. No hay el "mejor" absoluto: depende del idioma, tu modelo y tu presupuesto.

**❓ ¿AGENTS.md o CLAUDE.md?**
➡ Escribe `AGENTS.md` (estándar) y, si usas Claude Code, un `CLAUDE.md` con lo específico. Evita duplicar reglas contradictorias.

**❓ ¿Es seguro darle permisos máximos?**
➡ No a la primera. Empieza en read-only auto-éxito y sube solo lo que necesites, idealmente en sandbox.

**❓ ¿Puedo usar varios agentes a la vez?**
➡ Sí, con `git worktree` por rama/carpeta; cada agente no pisa el trabajo del otro.

## 🔗 Enlaces
- [Claude Code](https://code.claude.com/docs)
- [Codex CLI](https://github.com/openai/codex)
- [Gemini CLI](https://geminicli.com/)
- [Google Antigravity CLI](https://github.com/google-antigravity/antigravity-cli)
- [OpenCode](https://opencode.ai/docs)
- [Aider](https://aider.chat/)
- [Cursor](https://cursor.com/)
- [GitHub Copilot](https://github.com/features/copilot)
- [Antigravity (anuncio de migración)](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)

## 🧩 Ver también
- [MCP](./manual_mcp.md)
- [Git avanzado (worktrees)](./manual_git_avanzado.md)
- [GitHub CLI](./manual_github_cli.md)
- [Agentes con scripts](./manual_agent_scripts.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
