# cron – Programación de tareas periódicas

Programador de tareas periódicas nativo de Linux y macOS. Ejecuta comandos o scripts según una expresión de cinco campos (minuto, hora, día del mes, mes, día de la semana), con un mínimo de herramientas y dependencias.

> 🎯 **Nivel**: básico/intermedio · **Requisitos**: Linux (cron daemon) o macOS · **Revisado**: octubre 2026

## 📝 Sintaxis de crontab

```cron
* * * * * comando
┬ ┬ ┬ ┬ ┬
│ │ │ │ └── día de la semana (0-7, 0=domingo)
│ │ │ └──── mes (1-12)
│ │ └────── día del mes (1-31)
│ └──────── hora (0-23)
└────────── minuto (0-59)
```

### Expresiones útiles

```cron
0 2 * * *              # todos los días a las 02:00
*/5 * * * *            # cada 5 minutos
0 9 * * 1-5            # lunes a viernes a las 09:00
0 0 1 * *              # primer día de mes a medianoche
0 3 * * 1              # cada lunes a las 03:00
@reboot                # al iniciar el sistema
@daily / @weekly / @monthly / @hourly   # atajos de las equivalentes numéricas
```

Valida cualquier expresión en [crontab.guru](https://crontab.guru).

## 🔧 Gestionar el crontab

```bash
crontab -l                          # listar tareas del usuario actual
crontab -e                          # editar (abre $EDITOR o vi)
crontab -r                          # eliminar TODAS las tareas (¡sin confirmar!)
crontab -u otro -l                  # ver tareas de otro usuario (root)
crontab -l -u otro - > /tmp/backup.cron   # exportar un crontab como copia
```

No edites `/var/spool/cron/...` a mano: usa `crontab -e`, que valida y conserva permisos.

## ⚙️ Variables de entorno y PATH mínimo

cron ejecuta con un entorno mínimo (PATH casi vacío, sin `~/.bashrc`). Define lo que necesites al principio del archivo:

```cron
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
HOME=/home/usuario
MAILTO=alguien@ejemplo.com          # enviar la salida por email si hay output

0 2 * * * /home/usuario/scripts/mi-script.sh
```

Regla: usa siempre la **ruta absoluta** al script y a los binarios, o el script fallará con "command not found".

## 🔍 Logs, `@reboot` y solapamientos

```bash
grep CRON /var/log/syslog              # Debian/Ubuntu
journalctl -u cron -b                  # cuando cron corre bajo systemd
sudo tail -50 /var/spool/mail/usuario  # salida que crond capturó para MAILTO/notificación

# Con MAILTO vacío: descartar la salida en lugar de intentar enviarla
MAILTO=""
```

Protege las tareas largas contra solapamiento con `flock` (evita que dos ejecuciones coincidan):

```cron
0 1 * * * flock -n /tmp/backup.lock /usr/local/bin/backup.sh
```

## 🕐 Zonas horarias

```cron
# Forzar una zona horaria concreta para todo el crontab (IANA)
CRON_TZ=Europe/Madrid
0 2 * * * /usr/local/bin/tarea.sh

# También funciona por línea en el formato extendido
TZ=America/New_York
0 8 * * * /usr/local/bin/tarea.sh
```

La zona horaria del cron se aplica según el daemon; si el servidor cambia de zona, tus tareas se desplazan. Valida el nombre con `timedatectl list-timezones` (systemd).

## ⚠️ Limitaciones de cron

> ⚠️ **En desuso / limitado (oct. 2026)**: `at` y `batch` cubren el caso de ejecución única, pero siguen en desuso práctico: sin logs estructurados ni reintentos. Para una tarea puntual usa [`systemd-run --on-active`](https://www.freedesktop.org/software/systemd/man/latest/systemd-run.html).

cron es simple y ubicuo, pero adolece de:
- **Sin logs estructurados**: la salida va al MTA o a un fichero; no hay retención ni indexado.
- **Sin dependencias**: no modela "si falló A, no corras B", ni reintentos, ni timeout.
- **Sin retardo/ventanas**: cada trabajo dispara exacto, sin `RandomizedDelaySec`.

Para tareas con requisitos de robustez, los **timers de systemd** son la alternativa natural (ver más abajo).

## 🧪 Alternativa moderna: systemd timers

```ini
# /etc/systemd/system/mi-backup.timer
[Unit]
Description=Backup diario

[Timer]
OnCalendar=*-*-* 02:15:00          # equivalente a 15 2 * * *
Persistent=true                    # si el equipo estaba apagado, corre al arrancar
RandomizedDelaySec=20m
Unit=mi-backup.service

[Install]
WantedBy=timers.target
```

Con su `mi-backup.service` (`Type=oneshot`), se activa con `sudo systemctl enable --now mi-backup.timer`. Los logs quedan en journald (`journalctl -u mi-backup`), listos para filtrar. Consulta [./manual_systemd.md](./manual_systemd.md).

**MacOS**: en lugar de cron usa **launchd** (`~/Library/LaunchAgents/*.plist` con `StartCalendarInterval` y `launchctl load`). **Anacron** (Linux) complementa cron para equipos que no están encendidos 24/7: ejecuta las tareas atrasadas al arrancar; los timers con `Persistent=true` cubren ese mismo caso sin software extra.

## ❓ FAQ

**❓ Mi script funciona en terminal pero no en cron?**
➡ cron usa un PATH mínimo. Pon la ruta absoluta al script y a los binarios, o define `PATH=` al inicio del crontab.

**❓ Cómo recibir avisos cuando falla una tarea?**
➡ `MAILTO=tu@correo` envía la salida estándar del trabajo. Alternativa moderna: loguear a archivo o `journalctl` y monitorizar aparte.

**❓ Cómo ejecutar algo cada 30 segundos?**
➡ cron tiene granularidad mínima de 1 minuto. Usa dos líneas con `sleep 30` o, mejor, un servicio systemd con `watch`.

**❓ Cron o systemd timers?**
➡ cron para tareas simples de un equipo fijo. systemd timers cuando necesitas reintentos, retardo aleatorio, persistencia, dependencias o logs integrados.

## 🔗 Enlaces
- [crontab(5): man7](https://man7.org/linux/man-pages/man5/crontab.5.html)
- [crontab.guru: validador y generador](https://crontab.guru/)
- [systemd.timer: man](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html)
- [launchd / launchctl (Apple)](https://github.com/apple-oss-distributions/launchd)

## 🧩 Ver también
- [Systemd](./manual_systemd.md)
- [Bash Scripting](./manual_bash_scripting.md)
- [Nginx](./manual_nginx.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
