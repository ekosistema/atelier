# Nginx – Servidor web, proxy inverso y terminador TLS

Servidor web de alto rendimiento que ejerce de proxy inverso, balanceador de carga, caché y terminador SSL/TLS. Configuración declarativa con `nginx.conf` y server blocks.

> 🎯 **Nivel**: intermedio · **Requisitos**: un servidor Linux o macOS con `sudo` · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Instalación y versiones: mainline vs stable](#-instalación-y-versiones-mainline-vs-stable)
- [Estructura de configuración](#-estructura-de-configuración)
- [Server block estático y SPA (`try_files`)](#-server-block-estático-y-spa-try_files)
- [Proxy inverso (headers correctos)](#-proxy-inverso-headers-correctos)
- [TLS moderno](#-tls-moderno)
- [HTTP/3 (QUIC) y HTTP/2](#-http3-quic-y-http2)
- [Compresión: gzip y Brotli](#️-compresión-gzip-y-brotli)
- [Rate limiting](#-rate-limiting)
- [Logs](#-logs)
- [Configuración obsoleta (no la uses)](#️-configuración-obsoleta-no-la-uses)
- [Alternativas modernas a Nginx](#-alternativas-modernas-a-nginx)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 Instalación y versiones: mainline vs stable

```bash
# Debian / Ubuntu (ofrece stable y mainline por repo oficial)
sudo apt update && sudo apt install nginx

# macOS
brew install nginx && brew services start nginx

nginx -v                     # versión (p. ej. nginx/1.30.x)
sudo systemctl status nginx  # estado del servicio (Linux)
```

Nginx publica dos ramas:

| Rama | Versión (oct. 2026) | Cuándo usarla |
|---|---|---|
| **Stable** | **1.30.5** | Par e impar opuesto; solo backports críticos. Entornos conservadores. |
| **Mainline** | **1.31.6** | Parte impar (1.29/1.31); nuevas funciones y parches cada 1-2 meses. Recomendada para la mayoría en producción. |

> 📌 **Estado.** Ambas llevan los mismos parches de seguridad; la stable se actualiza unas pocas veces al año y la mainline con más cadencia. Para características nuevas (HTTP/3, Early Hints, sticky sessions) usa **mainline**.

## 📁 Estructura de configuración

```
/etc/nginx/
├── nginx.conf          # fichero principal
├── sites-available/    # server blocks disponibles
├── sites-enabled/      # activos (enlaces simbólicos)
├── conf.d/             # fragmentos incluidos desde nginx.conf
└── modules-enabled/    # módulos dinámicos activos
```

## 🌐 Server block estático y SPA (`try_files`)

```nginx
server {
    listen 80;
    server_name midominio.com www.midominio.com;
    root /var/www/mi-sitio;
    index index.html;

    # SPA: sirve el index.html si no existe ruta física (rutas del router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Estáticos con caché agresiva
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activar un sitio y recargar:

```bash
sudo ln -s /etc/nginx/sites-available/mi-sitio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx   # valida sintaxis y recarga sin cortar
```

## 🔄 Proxy inverso (headers correctos)

```nginx
server {
    listen 80;
    server_name app.midominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;            # backend de tu app
        proxy_http_version 1.1;
        proxy_set_header Host $host;                  # nombre original de la petición
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;   # http/https de llegada
        proxy_set_header Upgrade $http_upgrade;       # websockets
        proxy_set_header Connection "upgrade";
    }
}
```

Escribe siempre `X-Forwarded-*`; si tu app gestiona sesiones o websockets, necesitas los encabezados `Upgrade`/`Connection`.

## 🔐 TLS moderno

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name midominio.com;

    ssl_certificate     /etc/letsencrypt/live/midominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/midominio.com/privkey.pem;

    # TLS 1.2 y 1.3 únicamente (1.0/1.1 obsoletos desde 2020)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS: fuerza HTTPS en el navegador (solo cuando ya no quede tráfico HTTP)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # OCSP stapling: el servidor presenta el estado del certificado sin consultas externas
    ssl_stapling on;
    ssl_stapling_verify on;
}
```

Renovación con Certbot (Let's Encrypt):

```bash
sudo certbot --nginx -d midominio.com -d www.midominio.com   # redirección HTTP->HTTPS y certificado
```

## 🚀 HTTP/3 (QUIC) y HTTP/2

HTTP/3 sobre UDP/QUIC reduce latencia; HTTP/2 habilita multiplexación.

```nginx
server {
    listen 443 http3 reuseport;
    listen 443 ssl;
    ssl_protocols TLSv1.3;
    add_header Alt-Svc 'h3=":443"; ma=86400' always;   # anuncia HTTP/3 a los navegadores
}
```

## 🗜️ Compresión: gzip y Brotli

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript image/svg+xml;
gzip_min_length 1024;
```

Brotli requiere el módulo de terceros compilado (no viene por defecto en `apt`). Si está disponible, es más eficiente que gzip.

```nginx
brotli on;                      # requiere ngx_http_brotli_module
brotli_types text/plain text/css application/json application/javascript;
```

## 🚦 Rate limiting

Protege la API de abuso limitando peticiones por cliente.

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://127.0.0.1:3000;
}
```

## 📋 Logs

```nginx
log_format main '$remote_addr - [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"';
access_log /var/log/nginx/access.log;
error_log  /var/log/nginx/error.log warn;
```

```bash
sudo tail -f /var/log/nginx/access.log   # tráfico en tiempo real
sudo tail -f /var/log/nginx/error.log    # errores de configuración/upstream
```

## ⚠️ Configuración obsoleta (no la uses)

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `ssl on;` (directiva del bloque `server`, sustituida por `listen 443 ssl;`). Los cifrados débiles (RC4, DES, 3DES, `CBC-SHA`) y **TLS 1.0 / 1.1** (en desuso desde 2020 y 2021, respectivamente) deben eliminarse.

```nginx
# ❌ Antiguo / inseguro                        # ✅ Moderno
ssl on;                                        listen 443 ssl;
ssl_protocols TLSv1 TLSv1.1;                   ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ALL:!aNULL:!SSLv2;                 # lista cerrada de ECDHE AES-GCM
```

## 🔀 Alternativas modernas a Nginx

| En su lugar | Ventaja | Caso de uso |
|---|---|---|
| [Caddy](https://caddyserver.com/) 2.11 | TLS automático con Let's Encrypt, configuración minimalista (`Caddyfile`) | pequeñas apps, puerta de entrada sin fricción |
| [Traefik](https://traefik.io/) 3.7 | Autodetección de contenedores (Docker/K8s), paneles, enrutado declarativo | entornos containerizados / microservicios |
| [Envoy](https://www.envoyproxy.io/) | Extensible al máximo, observabilidad, gRPC, mesh de servicios | infraestructura de servicio y edge proxy a gran escala |

> 🧪 **Alternativa moderna.** Si priorizas **menos configuración y TLS automático**, Caddy; si tus cargas viven en **Docker/Kubernetes**, Traefik describe lo que expones en las etiquetas del contenedor. Nginx sigue siendo la opción por defecto sólida y de mayor despliegue.

## ❓ FAQ

**❓ ¿Cómo pruebo la configuración antes de recargar?**
➡ `sudo nginx -t` valida sintaxis; solo recarga con `systemctl reload` si no da errores.

**❓ ¿`return` o `rewrite`?**
➡ `return` corta el procesamiento y devuelve el código; `rewrite` reescribe la URI internamente. Prefiere `return`.

**❓ ¿Cómo veo el tráfico en tiempo real?**
➡ `sudo tail -f /var/log/nginx/access.log`.

**❓ ¿Mainline o stable en producción?**
➡ Mainline para la mayoría (funciones nuevas y parches frecuentes); stable solo si necesitas un conservadurismo estricto.

## 🔗 Enlaces

- [Documentación oficial de nginx](https://nginx.org/en/docs/)
- [nginx: descargas y versiones](https://nginx.org/en/download.html)
- [Certbot (Let's Encrypt)](https://certbot.eff.org/)
- [Caddy](https://caddyserver.com/) · [Traefik](https://traefik.io/) · [Envoy](https://www.envoyproxy.io/)

## 🧩 Ver también

- [Manual de curl y HTTP (probar el proxy)](./manual_curl_http.md)
- [Manual de PostgreSQL (backend típico)](./manual_postgresql.md)
- [Manual de Node.js (apps de servidor)](./manual_nodejs.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
