// Catálogo editorial del sitio: categorías y rutas de aprendizaje.
// Las referencias son slugs (nombre del fichero en sources/ sin "manual_" y con "-" en vez de "_").
// El README sigue siendo la fuente de verdad del contenido; esto solo ordena la navegación.
//
// El orden de `categories` es el del menú lateral: de lo más básico (terminal, git) a lo más
// especializado (multimedia, legacy). Mantén ese criterio al añadir categorías.

export const slugOf = (file) =>
  file.replace(/\.md$/, '').replace(/^manual_/, '').replace(/_/g, '-');

export const categories = [
  {
    id: 'terminal', emoji: '⚙️', title: 'Terminal y servidores',
    blurb: 'Shell, scripting, systemd y diagnóstico de red.',
    slugs: [
      'powershell-wsl', 'cheatsheet-comandos-linux', 'bash-scripting', 'shell-productivity', 'brew',
      'tmux', 'vim-nano', 'makefile', 'sed-awk', 'systemd', 'cron', 'red-dns',
    ],
  },
  {
    id: 'git', emoji: '🔀', title: 'Git y versiones',
    blurb: 'Del primer commit al flujo de release automatizado.',
    slugs: ['git', 'git-avanzado', 'conventional-commits', 'github-cli', 'github-actions'],
  },
  {
    id: 'datos', emoji: '🔤', title: 'Regex y datos',
    blurb: 'Expresiones regulares y procesado de JSON.',
    slugs: ['regex', 'jq'],
  },
  {
    id: 'python', emoji: '🐍', title: 'Python y entornos',
    blurb: 'Entornos reproducibles, dependencias y calidad de código.',
    slugs: ['uv', 'python-calidad', 'pyenv', 'conda-entornos', 'pip-pyinstaller'],
  },
  {
    id: 'web', emoji: '🌐', title: 'Web y backend',
    blurb: 'Node.js, bases de datos, proxies y depuración HTTP.',
    slugs: ['nodejs', 'curl-http', 'sql', 'sqlite', 'postgresql', 'mongodb', 'redis', 'nginx', 'caddy-traefik'],
  },
  {
    id: 'contenedores', emoji: '🐳', title: 'Contenedores',
    blurb: 'Docker, Compose y buenas prácticas de imágenes.',
    slugs: ['docker-compose', 'docker-avanzado'],
  },
  {
    id: 'devops', emoji: '☁️', title: 'DevOps y cloud',
    blurb: 'Infraestructura como código, Kubernetes y observabilidad.',
    slugs: [
      'terraform', 'ansible', 'kubectl', 'helm', 'argocd', 'gitlab-ci', 'aws-cli',
      'observabilidad', 'prometheus', 'grafana', 'loki', 'tempo',
    ],
  },
  {
    id: 'seguridad', emoji: '🔐', title: 'Seguridad y cifrado',
    blurb: 'Claves, certificados, firma de código y cadena de suministro.',
    slugs: ['ssh', 'gpg', 'openssl', 'firma-notarizacion', 'supply-chain'],
  },
  {
    id: 'ia', emoji: '🤖', title: 'IA y LLMs',
    blurb: 'Prompts, APIs, modelos locales, embeddings y RAG.',
    slugs: ['prompt-engineering', 'llm-apis', 'ollama', 'embeddings', 'rag'],
  },
  {
    id: 'agentes', emoji: '🧠', title: 'Agentes',
    blurb: 'Function calling, MCP y agentes de coding.',
    slugs: ['function-calling', 'mcp', 'agent-scripts', 'ai-coding-agents'],
  },
  {
    id: 'automatizacion', emoji: '⚡', title: 'Automatización visual',
    blurb: 'Plataformas de workflows: n8n, Make, Node-RED y más.',
    slugs: ['n8n', 'make-com', 'node-red', 'zapier', 'activepieces'],
  },
  {
    id: 'multimedia', emoji: '🎛️', title: 'Multimedia y creativos',
    blurb: 'Audio, vídeo, imagen y programación visual.',
    slugs: ['puredata', 'max-msp-jitter', 'referencia-touchdesigner', 'ableton-extensions', 'ffmpeg', 'imagemagick'],
  },
  {
    id: 'legacy', emoji: '📟', title: 'Legacy x86_64',
    blurb: 'Compatibilidad Intel en Apple Silicon y su migración.',
    slugs: ['environment-conda-x86-64', 'gestionar-brew-x86-64-arm64', 'nodejs-dual-architecture'],
  },
];

// `short` es la etiqueta corta del menú y las migas de pan; `title` el nombre completo.
export const paths = [
  {
    id: 'de-cero', short: 'De cero', emoji: '🔰', title: 'De cero a desarrollador con tooling',
    audience: 'Empiezas o vienes de otro campo',
    goal: 'Moverte con soltura en terminal, versionar tu trabajo, levantar servicios y consultar datos.',
    accent: '#34d399',
    steps: ['git', 'bash-scripting', 'shell-productivity', 'makefile', 'docker-compose', 'nginx', 'sql', 'sqlite', 'curl-http', 'regex', 'sed-awk', 'systemd', 'cron'],
  },
  {
    id: 'produce-y-despliega', short: 'Producción', emoji: '📈', title: 'Produce y despliega',
    audience: 'Ya programas y quieres llevar código a producción',
    goal: 'Automatizar releases, definir infraestructura como código y observar lo que despliegas.',
    accent: '#60a5fa',
    steps: ['git-avanzado', 'conventional-commits', 'github-actions', 'terraform', 'kubectl', 'helm', 'prometheus', 'observabilidad', 'tempo', 'docker-avanzado', 'uv', 'python-calidad', 'nodejs'],
  },
  {
    id: 'ia-y-agentes', short: 'IA y agentes', emoji: '🚀', title: 'IA y agentes',
    audience: 'Quieres integrar LLMs en tus propias herramientas',
    goal: 'Pasar de un prompt suelto a un agente con herramientas, recuperación de contexto y MCP.',
    accent: '#c084fc',
    steps: ['prompt-engineering', 'llm-apis', 'ollama', 'function-calling', 'mcp', 'embeddings', 'rag', 'agent-scripts', 'ai-coding-agents'],
  },
  {
    id: 'creativo', short: 'Creativo', emoji: '🎛️', title: 'Creativo y multimedia',
    audience: 'Trabajas con audio, vídeo o visuales en directo',
    goal: 'Construir sistemas audiovisuales interactivos y automatizar el procesado de medios.',
    accent: '#f472b6',
    steps: ['puredata', 'max-msp-jitter', 'referencia-touchdesigner', 'ffmpeg', 'imagemagick', 'ableton-extensions'],
  },
  {
    id: 'seguridad-y-red', short: 'Seguridad y red', emoji: '🔐', title: 'Seguridad, firma y red',
    audience: 'Administras máquinas, claves y distribuyes software',
    goal: 'Proteger accesos, firmar y verificar artefactos y diagnosticar problemas de red.',
    accent: '#fbbf24',
    steps: ['ssh', 'gpg', 'openssl', 'firma-notarizacion', 'supply-chain', 'red-dns'],
  },
  {
    id: 'windows', short: 'Windows', emoji: '🪟', title: 'Si trabajas en Windows',
    audience: 'Tu máquina principal es Windows',
    goal: 'Un entorno Linux-compatible con PowerShell, WSL2 y contenedores sin fricción.',
    accent: '#38bdf8',
    steps: ['powershell-wsl', 'git', 'docker-compose', 'docker-avanzado', 'bash-scripting'],
  },
];
