# 🐧 Linux Cheat Sheet – Comandos esenciales de CLI y servidores

La terminal de Linux es el entorno fundamental para administrar servidores, automatizar tareas y ejecutar herramientas de desarrollo. Esta guía cubre los comandos modernos del día a día sobre distros systemd.

> 🎯 **Nivel**: básico · **Requisitos**: una distro Linux (Debian/Ubuntu, RHEL/Fedora o Arch) · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Obsolescencias (leer primero)](#-obsolescencias-leer-primero)
- [Navegación](#-navegación)
- [Archivos y directorios](#-archivos-y-directorios)
- [Ver contenido](#-ver-contenido)
- [Búsqueda](#-búsqueda)
- [Procesos y sistema](#️-procesos-y-sistema)
- [Gestión de paquetes](#-gestión-de-paquetes)
- [Compresión y sincronización](#-compresión-y-sincronización)
- [Red](#-red)
- [Permisos y usuarios](#-permisos-y-usuarios)
- [Firewall](#️-firewall)
- [Docker (si instalado)](#-docker-si-instalado)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🚨 Obsolescencias (leer primero)

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: en distros con systemd, `service`, `/etc/init.d/<svc>` y `chkconfig` quedaron reemplazados por `systemctl`. `journalctl` sustituye al manejo manual de logs.

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `yum` está deprecado en RHEL/Fedora en favor de `dnf` (compatible con su sintaxis). `netstat`/`ifconfig` se reemplazan por `ss`/`ip` (ver [manual de red](./manual_red_dns.md)).

> 📌 **Estado**: `exa` (sustituto de `ls`) dejó de mantenerse: el fork vigente es `eza`. `iptables` está en transición hacia `nftables`.

| En su lugar | En lugar de | Ventaja |
|---|---|---|
| `systemctl` | `service`, `init.d` | Servicios con estado, dependencias, logs unificados |
| `dnf` | `yum` | Dependencias y rendimiento mejores (RHEL/Fedora) |
| `eza` | `exa`/`ls` | Fork mantenido, árbol y git integrados |
| `nft` | `iptables` | Marco oficial del kernel (desde 2018) |
| `ss` | `netstat` | Más rápido, sockets y proceso en un solo comando |
| `ip` | `ifconfig` | Interfaz unificada para enlaces, rutas y vecinos |

## 📂 Navegación

```bash
pwd                     # directorio actual
ls -lah                 # listado detallado con tamaños legibles
cd ~ && cd /ruta        # al home o a una ruta absoluta
cd -                    # volver al directorio anterior
tree -L 2 /ruta         # árbol con profundidad 2
```

```bash
# Modo moderno: eza (fork de exa) y zoxide (cd "inteligente")
eza -lah --git --icons   # como ls -lah con estado git e iconos
zoxide init bash         # usa `z` para saltar a directorios frecuentes
z proyectos              # cd directo a ~/proyectos si ya lo visitaste
```

## 📁 Archivos y directorios

```bash
touch archivo.txt              # crear vacío
mkdir -p ruta/subcarpeta       # crear árbol
cp -r dir1 dir2                # copiar directorio
mv origen destino              # mover/renombrar
rm -rf carpeta                 # eliminar recursivo y forzado (con cuidado)
ln -s /ruta/real enlace        # enlace simbólico
du -sh carpeta                 # tamaño de un directorio
```

## 📖 Ver contenido

```bash
cat archivo.txt        # mostrar completo
less archivo.txt       # paginar (q para salir)
head -n 20 archivo.txt # primeras 20 líneas
tail -f app.log        # seguir las últimas líneas (logs en vivo)
tail -n 100 app.log    # última líneas de un log

bat archivo.py         # cat con resaltado de sintaxis y numeración (bat)
```

## 🔎 Búsqueda

```bash
rg "patrón" .              # ripgrep: grep recursivo rápido y moderno
rg -l "patrón" src/        # solo nombres de fichero
rg "error" -n --glob '*.log' # números de línea y filtro por tipo

fd "config" ~              # find moderno: búsqueda de ficheros por nombre
find /ruta -name "*.conf" -type f   # find clásico (sigue siendo útil)
grep "texto" archivo.txt   # grep simple
```

## ⚙️ Procesos y sistema

```bash
ps aux                # todos los procesos
top                   # monitor interactivo
btop                  # monitor moderno (CPU/RAM/red/disk) con gráficos
kill -9 PID           # forzar cierre
pkill -f "nodo"       # matar por patrón de línea de comandos
jobs && fg %1         # procesos en segundo plano; traer a primero
uptime && whoami && uname -a   # estado y contexto del sistema
systemctl status nginx        # estado de un servicio systemd
journalctl -u nginx -f        # logs del servicio en vivo
journalctl -xe                # últimos errores del sistema
```

## 📦 Gestión de paquetes

```bash
# Debian/Ubuntu: apt
sudo apt update && sudo apt upgrade
sudo apt install paquete
sudo apt remove paquete

# RHEL/Fedora: dnf (sucesor de yum)
sudo dnf update && sudo dnf install paquete
sudo dnf remove paquete

# Arch: pacman
sudo pacman -Syu           # actualizar todo el sistema
sudo pacman -S paquete
```

## 🧰 Compresión y sincronización

```bash
# tar con zstd (compresión moderna, mucho mejor ratio que gzip)
tar -I zstd -cf archivo.tar.zst carpeta/
tar -I zstd -xf archivo.tar.zst
tar --zstd -xf archivo.tar.zst      # atajo equivalente
tar -czf archivo.tar.gz carpeta/    # clásico gzip
tar -xzf archivo.tar.gz

zip -r archivo.zip dir/ && unzip archivo.zip

# rsync: copia incremental con cifrado SSH
rsync -avz --progress dir/ user@host:/destino/
rsync -avz -e "ssh -p 2222" user@host:/origen/ ./local/
```

## 🌐 Red

```bash
ping -c 4 google.com        # conectividad
curl ifconfig.me            # IP pública saliente
curl -s -o /dev/null -w "%{http_code}\n" https://host  # estado HTTP
ssh user@host               # sesión remota
scp archivo user@host:/destino             # copiar con SSH
rsync -avz dir/ user@host:/destino/        # sincronizar con SSH
ip addr && ip route          # interfaces y rutas (ver manual de red)
ss -tlnp                     # puertos en escucha
```

## 🔐 Permisos y usuarios

```bash
chmod 644 archivo        # rw-r--r--
chmod +x script.sh       # hacer ejecutable
chmod -R g+w carpeta     # añadir escritura al grupo recursivo
chown user:group archivo # cambiar propietario
useradd -m -s /bin/bash usuario && passwd usuario
usermod -aG docker usuario   # añadir al grupo docker
id && who                 # contexto del usuario y quién está conectado
```

## 🛡️ Firewall

```bash
sudo nft list ruleset      # reglas nftables (marco moderno)
sudo iptables -L -n        # reglas IPv4 (transición; usado por wrappers)
```

## 🐳 Docker (si instalado)

```bash
docker ps -a
docker images
docker exec -it CONTENEDOR bash
docker logs -f CONTENEDOR
docker compose up -d     # levantar stack desde docker-compose.yml
```

## ❓ FAQ

**❓ ¿Por qué no tengo `yum` en la distribución nueva?**
➡ En RHEL 8+/Fedora `yum` es un alias de `dnf`. Usa directamente `dnf`.

**❓ `netstat`: no encontrado.**
➡ Es normal; usa `ss -tlnp`. En Debian puedes instalarlo con `apt install net-tools`, pero no es el camino moderno.

**❓ ¿Cómo veo los logs de un solo servicio?**
➡ `journalctl -u <servicio> -f` (seguir) o `--since "1 hour ago"`.

**❓ ¿Cómo leo un `.tar.zst` sin saber si era gzip o zstd?**
➡ `tar` detecta el algoritmo por autodetección: `tar -xf archivo.tar.zst` funciona igual que `tar -xf archivo.tar.gz`.

**❓ ¿Cuál es la diferencia entre `apt update` y `upgrade`?**
➡ `update` refresca la lista de paquetes; `upgrade` instala las actualizaciones disponibles.

## 🔗 Enlaces

- [iproute2 (ip/ss): kernel.org](https://wiki.linuxfoundation.org/networking/iproute2)
- [eza: GitHub](https://github.com/eza-community/eza)
- [ripgrep: GitHub](https://github.com/BurntSushi/ripgrep)
- [fd: GitHub](https://github.com/sharkdp/fd)
- [bat: GitHub](https://github.com/sharkdp/bat)
- [btop: GitHub](https://github.com/aristocratos/btop)
- [zoxide: GitHub](https://github.com/ajeetdsouza/zoxide)
- [ncdu (analizador de disco por terminal)](https://dev.yorhel.nl/ncdu)
- [systemd documentation](https://systemd.io/)
- [nftables wiki: Netfilter](https://wiki.nftables.org/wiki-nftables/index.php/What_is_nftables%3F)

## 🧩 Ver también

- [Manual de Red, puertos y DNS](./manual_red_dns.md)
- [Manual de Productividad en Shell](./manual_shell_productivity.md)
- [Manual de Systemd](./manual_systemd.md)
- [Manual de SSH](./manual_ssh.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
