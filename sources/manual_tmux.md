# tmux – Terminal multiplexer (sesiones persistentes)

Multiplexor de terminal que mantiene sesiones, ventanas y paneles vivos incluso al cerrar la conexión SSH o el terminal. Estándar de facto en servidores y en el día a día de la terminal.

> 🎯 **Nivel**: básico/intermedio · **Requisitos**: tmux instalado (actual: 3.7c, ago 2026) · **Revisado**: octubre 2026

## 🔧 Instalación y sesiones

```bash
sudo apt install tmux               # Debian/Ubuntu
brew install tmux                   # macOS
tmux -V                             # verificar versión

tmux new -s trabajo                 # crear sesión nombrada
tmux new -s web -d                  # crear y desadjuntar (útil para scripting)
tmux ls                             # listar sesiones activas
tmux attach -t trabajo              # reconectar a una sesión
tmux attach -t trabajo -d           # reconectar y expulsar otras conexiones
tmux kill-session -t trabajo        # terminar una sesión
tmux kill-server                    # terminar todas
```

## ⌨️ Atajos esenciales (prefix = `Ctrl+b`)

### Sesión y ventanas
| Atajo | Acción |
|-------|--------|
| `Ctrl+b d` | Desadjuntar (vuelves al terminal, la sesión sigue viva) |
| `Ctrl+b c` | Crear nueva ventana |
| `Ctrl+b n` / `p` | Siguiente / anterior ventana |
| `Ctrl+b w` | Lista interactiva de ventanas |
| `Ctrl+b ,` | Renombrar ventana actual |
| `Ctrl+b &` | Cerrar ventana actual |

### Paneles (splits)
| Atajo | Acción |
|-------|--------|
| `Ctrl+b "` | Split horizontal |
| `Ctrl+b %` | Split vertical |
| `Ctrl+b ← ↑ → ↓` | Navegar entre paneles |
| `Ctrl+b o` | Ciclar entre paneles |
| `Ctrl+b x` | Cerrar panel actual |
| `Ctrl+b z` | Maximizar / restaurar panel |
| `Ctrl+b !` | Convertir panel en ventana nueva |

### Scroll y copia
| Atajo | Acción |
|-------|--------|
| `Ctrl+b [` | Entrar en modo copiar (con `setw -g mode-keys vi`: `v`/`y`) |
| `Ctrl+b ]` | Pegar desde buffer |

## ⚙️ `.tmux.conf` moderno (~/.tmux.conf)

```tmux
# Prefix cómodo: Ctrl+a en lugar de Ctrl+b
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Comportamiento moderno
set -g mouse on                     # habilitar ratón (scroll y redimensionar paneles)
set -g base-index 1                 # ventanas empiezan en 1, no en 0
setw -g pane-base-index 1           # paneles también en 1
set -g default-terminal "tmux-256color"   # truecolor
set -ga terminal-overrides ",*:Tc"  # activar 24-bit colour
setw -g mode-keys vi                # navegación vi en modo copiar
set -g escape-time 10               # menor latencia de Esc en la terminal

# Plugins con TPM (Tmux Plugin Manager)
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-resurrect'    # restaurar entorno tras reinicio
set -g @plugin 'tmux-plugins/tmux-continuum'    # guardar automáticamente
run '~/.tmux/plugins/tpm/tpm'

# Atajo para recargar configuración
bind r source-file ~/.tmux.conf \; display "Config recargada"
```

Instala TPM y los plugins por primera vez con `git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm` y pulsando `Ctrl+a + I`.

## 🔄 Persistencia con resurrect y continuum

```bash
# Con tmux-resurrect instalado vía TPM:
#   prefix + Ctrl-s   -> guardar el estado (sesiones, ventanas, paneles, comandos)
#   prefix + Ctrl-r   -> restaurar tras un reinicio

# tmux-continuum guarda automáticamente cada 15 min y puede restaurar al arrancar:
set -g @continuum-restore 'on'      # añadir en ~/.tmux.conf
```

tmux-resurrect restaura hasta los procesos que corrían en cada panel (vim, ssh, etc.) y puede recuperar sesiones de vim/neovim.

## 🔄 Scripting de tmux

```bash
# Lanzar una sesión de trabajo con varias ventanas desde un script
tmux new-session -d -s dev -n editor
tmux send-keys -t dev:editor 'vim' Enter
tmux new-window -t dev -n server
tmux send-keys -t dev:server 'npm run dev' Enter
tmux select-window -t dev:editor
tmux attach -t dev
```

Esta técnica es la base de herramientas como `tmuxinator` o de scripts de bootstrap de entornos.

## ❓ FAQ

**❓ Para qué usar tmux si mi terminal ya tiene pestañas?**
➡ tmux sobrevive a que cierres el terminal o pierdas la conexión SSH: los procesos siguen corriendo y puedes reconectar cuando quieras.

**❓ Diferencia entre insertar y attach?**
➡ `attach` es reconectar; si otra conexión está activa, añade `-d` para expulsarla.

**❓ Cómo enviar el mismo comando a varios paneles a la vez?**
➡ `Ctrl+b :` → `setw synchronize-panes on` (y `off` para desactivarlo).

**❓ tmux o zellij, cuál elegir?**
➡ tmux es el estándar universal y está preinstalado en casi todo. Zellij (0.45.1, ago 2026) es más moderno y fácil de configurar, con plugin web, resurrección integrada y diseños en KDL; ideal si no te importa instalar un binario extra.

## 🔗 Enlaces
- [tmux wiki y releases (3.7c)](https://github.com/tmux/tmux)
- [tmux manual (man7)](https://man7.org/linux/man-pages/man1/tmux.1.html)
- [TPM: Tmux Plugin Manager](https://github.com/tmux-plugins/tpm)
- [tmux-resurrect](https://github.com/tmux-plugins/tmux-resurrect)
- [Zellij](https://zellij.dev)

## 🧩 Ver también
- [Bash Scripting](./manual_bash_scripting.md)
- [SSH](./manual_ssh.md)
- [Productividad en Shell](./manual_shell_productivity.md)
- [Vim y Nano](./manual_vim_nano.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
