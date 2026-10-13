# systemd – Gestión de servicios y del sistema

Sistema de inicio y gestor de servicios estándar en Linux moderno. Controla servicios, temporizadores, sockets, montajes y centraliza los logs mediante journald.

> 🎯 **Nivel**: intermedio · **Requisitos**: Linux con systemd (Debian/Ubuntu/Arch/Fedora/RHEL y derivadas) · **Revisado**: octubre 2026

## 🔧 Gestionar servicios

```bash
sudo systemctl start nginx           # iniciar servicio
sudo systemctl stop nginx            # detener servicio
sudo systemctl restart nginx         # reiniciar
sudo systemctl reload nginx          # recargar configuración sin cortar el servicio (envía SIGHUP)
sudo systemctl enable --now nginx    # activar al arranque y arrancar ahora
sudo systemctl disable nginx         # desactivar al arranque
systemctl status nginx               # estado y últimas líneas de log
systemctl cat nginx                  # ver la configuración efectiva de la unidad
```

## 📝 Unit files: service

Archivo: `/etc/systemd/system/mi-app.service`

```ini
[Unit]
Description=Mi aplicación
After=network.target          # arrancar después de que la red esté lista

[Service]
Type=simple                   # ejecutable en primer plano (el valor más común)
User=www-data                 # ejecutar con usuario sin privilegios, NUNCA root si se puede evitar
WorkingDirectory=/opt/mi-app
ExecStart=/usr/bin/node /opt/mi-app/index.js
Restart=on-failure            # reintentar si muere por error
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target    # activo en el arranque multiusuario
```

Activar: `sudo systemctl daemon-reload && sudo systemctl enable --now mi-app`

### Seguridad: endurecer servicios

```ini
[Service]
User=www-data                # usuario sin privilegios
DynamicUser=yes              # usuario efímero (alternativa al User= fijo)
ProtectSystem=strict         # sistema de ficheros montado en solo lectura (/usr, /etc, /var...)
ProtectHome=yes              # ocultar /home, /root y /run/user
PrivateTmp=yes               # /tmp y /var/tmp privados
NoNewPrivileges=yes          # bloquear subida de privilegios (setuid, capacidades)
PrivateDevices=yes           # bloquear acceso a dispositivos físicos
ReadWritePaths=/var/lib/mi-app   # abrir solo lo que el servicio deba escribir
```

Verifica el nivel de endurecimiento con `sudo systemd-analyze security mi-app`.

## 📊 Logs con journalctl

```bash
journalctl -u nginx              # logs de un servicio
journalctl -u nginx -f           # seguir en tiempo real
journalctl -b                    # logs del arranque actual
journalctl -b -1                 # logs del arranque anterior
journalctl -u nginx --since "1 hour ago"   # desde hace una hora
journalctl -u nginx -p err       # solo errores
journalctl --disk-usage          # espacio ocupado por los logs
journalctl --vacuum-size=100M    # limpiar logs hasta 100 MB
```

`-b` es la forma rápida de aislar lo ocurrido en el último reinicio, fundamental para diagnosticar problemas de arranque.

## ⏱️ Timers: alternativa moderna a cron

Archivo: `/etc/systemd/system/mi-backup.timer`

```ini
[Unit]
Description=Backup diario

[Timer]
OnCalendar=daily                  # expresiones similares a cron: OnCalendar=*-*-* 02:00:00
Persistent=true                   # si el equipo estaba apagado, ejecutar al arrancar
RandomizedDelaySec=15m            # evitar picos cuando muchos timers coinciden
Unit=mi-backup.service            # qué servicio dispara

[Install]
WantedBy=timers.target
```

Archivo: `/etc/systemd/system/mi-backup.service`

```ini
[Unit]
Description=Ejecutar backup

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

Activar: `sudo systemctl enable --now mi-backup.timer`

## 🧬 Otros tipos de unidad

```bash
# socket: activación bajo demanda (el servicio arranca cuando se conectan)
# /etc/systemd/system/api.socket
# [Socket]
# ListenStream=8080
#   con el .service correspondiente

# path: dispara cuando cambia un fichero o directorio
# /etc/systemd/system/monitor.path
# [Path]
# PathModified=/etc/nginx/nginx.conf

# target: agrupa unidades (multi-user.target, network.target...)
systemctl list-units --type=socket
systemctl list-units --type=path
```

## 👤 Servicios por usuario (`systemd --user`)

```bash
# Unidad de usuario (sin root): ~/.config/systemd/user/mi-servicio.service
systemctl --user enable --now mi-servicio   # como root o usuario normal

# Permitir que los servicios de usuario sobrevivan al cierre de sesión
sudo loginctl enable-linger $USER

systemctl --user list-units                 # unidades del usuario
journalctl --user -u mi-servicio            # logs del usuario
```

`enable-linger` marca el arranque automático de los servicios `--user` aunque no haya sesión abierta.

## 🧰 Diagnóstico

```bash
systemctl list-units --type=service --state=running   # servicios activos
systemctl list-units --type=service --state=failed    # servicios que fallaron
systemctl list-timers                                 # timers y próxima ejecución
systemd-analyze                                       # tiempo de arranque total
systemd-analyze blame                                 # qué unidades tardan más
systemd-analyze security mi-app                       # informe de endurecimiento
systemctl is-enabled nginx                            # ¿está activado al arranque?
```

Timers vs cron: los timers ofrecen dependencias, retardo aleatorio, persistencia tras apagado y logs integrados en journald, sin necesidad de MTA para alertas.

## ❓ FAQ

**❓ Diferencia entre `reload` y `restart`?**
➡ `reload` envía `SIGHUP` sin cortar el servicio (solo si el daemon lo soporta); `restart` lo detiene y lo inicia de nuevo.

**❓ Error "Unit not found"?**
➡ Casi siempre falta `sudo systemctl daemon-reload` tras crear o editar un `.service`.

**❓ Mi servicio muere de inmediato, cómo depuro?**
➡ `journalctl -u mi-app -b -e -f` y revisa `Type=`; con `Type=simple` el proceso debe quedarse en primer plano, no hacer doble fork.

## 🔗 Enlaces
- [Documentación systemd (systemd.io)](https://systemd.io/)
- [systemd.service: man](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)
- [systemd.exec: directivas de proceso/seguridad](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)
- [systemd.timer: man](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html)
- [journalctl: man](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html)

## 🧩 Ver también
- [cron](./manual_cron.md)
- [Nginx](./manual_nginx.md)
- [Docker Compose](./manual_docker_compose.md)
- [Bash Scripting](./manual_bash_scripting.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
