# Red, puertos y DNS – Diagnóstico de conectividad

Comandos y técnicas para diagnosticar conectividad de red, resolver nombres DNS, encontrar puertos abiertos y analizar tráfico en Linux (con matices para macOS).

> 🎯 **Nivel**: intermedio · **Requisitos**: Linux con herramientas de red (`ip`, `ss`, `dig`, `tcpdump`); sudo para tcpdump/nmap · **Revisado**: octubre 2026

## 🧭 Herramientas en desuso (Linux)

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: en **Linux**, `ifconfig`, `netstat`, `arp`, `route` e `iwconfig` están reemplazados por `ip` / `ss` (paquete `iproute2`). Sustituido por: `ip addr`, `ip route`, `ip neigh`, `ss`. **En macOS `ifconfig` sigue vigente** (no lo marques como obsoleto en este entorno).

| En su lugar (Linux) | En lugar de | Nota |
|---|---|---|
| `ip addr` / `ip -br addr` | `ifconfig` | Ver interfaces |
| `ip route` | `route -n` | Ver rutas |
| `ip neigh` | `arp -a` | Tabla ARP/vecinos |
| `ss -tlnp` | `netstat -tlnp` | Puertos y sockets |
| `iw dev` | `iwconfig` | Wireless en Linux |

## 🌐 Consultas DNS

```bash
dig ejemplo.com                          # consulta completa (registros + respuestas)
dig ejemplo.com A                        # solo IPv4
dig ejemplo.com AAAA                     # solo IPv6
dig ejemplo.com MX NS SOA TXT            # varios tipos
dig ejemplo.com @1.1.1.1 +short          # contra un servidor concreto, salida corta
dig -x 8.8.8.8                           # reverse (IP → nombre)
dig +trace ejemplo.com                   # recorre la delegación desde la raíz (ver ACL)
dig +dnssec example.com                  # ver RRSIG / AD flag (DNSSEC)

# DNS cifrado: DoH y DoT (BIND 9.18+)
dig +https @https://cloudflare-dns.com/dns-query ejemplo.com    # DNS over HTTPS
dig +tls @1.1.1.1 ejemplo.com                                   # DNS over TLS

# systemd-resolved (gestor DNS del sistema)
resolvectl status                 # servidores DNS activos (interfaz)
resolvectl query ejemplo.com      # resolver usando el sistema
resolvectl statistics             # hits de caché y ratio de error

# macOS: DNS del sistema
scutil --dns                      # toda la config/resolución (incluye DoH de iOS/macOS)
networksetup -getdnsservers Wi-Fi # DNS por interfaz
```

### Ficheros de configuración

```bash
cat /etc/resolv.conf   # servidores DNS usados (a menudo gestionado por systemd-resolved)
cat /etc/hosts         # resolución local estática
```

## 📡 Interfaces y rutas (iproute2)

```bash
ip addr                      # direcciones de todas las interfaces
ip -br addr                  # resumen compacto en una línea por interfaz
ip -br link                  # estado de los enlaces (UP/DOWN)
ip route                     # tabla de rutas
ip route show default        # solo la ruta por defecto (gateway)
ip neigh                     # tabla ARP/NDP (vecinos)
ip link set eth0 up          # levantar/derribar una interfaz
```

## 🔌 Puertos y conexiones (ss + lsof)

```bash
ss -tln                      # TCP en escucha (números, sin nombres)
ss -tlnp                     # + proceso dueño (sudo para todos)
ss -tuln                     # TCP + UDP en escucha
ss -tua                      # todas las conexiones activas
ss -s                        # resumen de la pila TCP (conexiones totales/estados)

# Alternativa por proceso (funciona en Linux y macOS)
sudo lsof -i :8080           # qué proceso ocupa el puerto 8080
sudo lsof -i TCP:22          # qué escucha en SSH
lsof -i                      # todas las conexiones de red
```

## 🩺 Conectividad y ruta

```bash
ping -c 4 8.8.8.8                 # test ICMP (4 paquetes)

# traceroute (Linux); en macOS usa `traceroute` igual, y Windows `tracert`
traceroute -I google.com          # ICMP (evita filtros UDP)
traceroute -T -p 443 google.com   # TCP hacia el puerto 443

# MTR = ping + traceroute continuo, ideal para diagnóstico sostenido
mtr -rwzbwi 1 google.com          # -r salida por reporte, -b ASN, -i intervalo

# Comprobar si un puerto está abierto
nc -zvw 3 google.com 443          # netcat: -z scan, -v verbose, -w timeout
nc -zv google.com 80
curl -v https://ejemplo.com       # diagnóstico HTTP completo (handshake, DNS, TLS)
curl -s -o /dev/null -w "%{http_code}\n" https://ejemplo.com
```

## 📊 Captura de tráfico (tcpdump)

```bash
sudo tcpdump -i eth0                     # todo el tráfico de la interfaz
sudo tcpdump -i eth0 port 80             # solo HTTP
sudo tcpdump -i eth0 port 443 -w tls.pcap  # a archivo (para abrir en Wireshark)
sudo tcpdump -i eth0 host 192.168.1.1    # tráfico de/hacia una IP
sudo tcpdump -i eth0 dst port 53 or src port 53   # tráfico DNS
sudo tcpdump -i any -c 100 'tcp[tcpflags] & (tcp-syn) != 0'  # solo paquetes SYN
sudo tcpdump -i eth0 -n -l port 22       # sin resolución de nombres, sin buffer
```

`-n` evita la resolución DNS (más rápido y evita consultas raras), `-l` libera la salida línea a línea (útil con `| grep`).

## 🗺️ Escaneo de puertos (nmap)

```bash
nmap -sn 192.168.1.0/24         # descubrimiento de hosts (ping scan), no necesita root
nmap -sV google.com             # versiones de servicios en puertos habituales
nmap -sS -p 1-1000 host         # SYN scan de un rango de puertos (necesita root)
nmap -p- host                   # los 65535 puertos TCP (lento, usa con cuidado)
nmap --top-ports 100 host       # los 100 puertos más habituales
```

## 📋 Puertos habituales

| Puerto | Servicio |
|---|---|
| 22 | SSH |
| 53 | DNS |
| 80 / 443 | HTTP / HTTPS |
| 3306 | MySQL / MariaDB |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 27017 | MongoDB |
| 8080 / 8443 | HTTP(S) alternativo (proxies, dev) |

## 🛡️ Firewall

```bash
# Linux moderno: nftables
sudo nft list ruleset                 # todas las reglas
sudo nft list table inet filter      # una tabla concreta

# Linux en transición: iptables todavía común en distros con wrappers
sudo iptables -L -n                   # reglas IPv4

# macOS
sudo pfctl -s rules                   # reglas del firewall PF
sudo pfctl -s info                    # estado
```

> 📌 **Estado**: `iptables` está en **transición** hacia nftables (marco oficial desde el taller Netfilter de 2018; `iptables-nft` es el shim que traduce la sintaxis de `iptables` al kernel `nft`). Si empiezas de cero, usa `nft`.

## ❓ FAQ

**❓ ¿Diferencia entre `dig` y `nslookup`?**
➡ `dig` es mucho más detallado y scriptable (`+short`, `+trace`, DNSSEC). `nslookup` es suficiente para consultas rápidas.

**❓ ¿Por qué algunos host no responden a `ping`?**
➡ Muchos filtran ICMP. Prueba `nc -zv host 443` o `traceroute -T -p 443`.

**❓ ¿Qué proceso escucha en el puerto 8080?**
➡ `sudo ss -tlnp | grep 8080`, o en macOS `sudo lsof -i :8080`.

**❓ ¿`ifconfig` no existe en mi Linux?**
➡ Es normal: muchas distros modernas ya solo traen `ip` (iproute2). Instálalo con `net-tools` solo si lo necesitas para scripts legacy.

**❓ ¿Norma DNS cifrado en Android/móviles o macOS?**
➡ Para comprobar qué DNS usa el sistema, `scutil --dns` en macOS y `resolvectl status` en Linux con systemd.

## 🔗 Enlaces

- [IPRoute2 (ip/ss): kernel.org](https://wiki.linuxfoundation.org/networking/iproute2)
- [nftables wiki: Netfilter](https://wiki.nftables.org/wiki-nftables/index.php/What_is_nftables%3F)
- [tcpdump manpage](https://www.tcpdump.org/manpages/tcpdump.1.html)
- [nmap documentation](https://nmap.org/docs.html)
- [MTR (GitHub)](https://github.com/traviscross/mtr)
- [systemd-resolved / resolvectl manpage](https://www.freedesktop.org/software/systemd/man/latest/resolvectl.html)
- [How DNS works](https://howdns.works/)

## 🧩 Ver también

- [Cheat Sheet de comandos Linux](./cheatsheet_comandos_linux.md)
- [Manual de cURL/HTTP](./manual_curl_http.md)
- [Manual de SSH](./manual_ssh.md)
- [Manual de Systemd](./manual_systemd.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
