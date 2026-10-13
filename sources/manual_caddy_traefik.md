# Caddy y Traefik – Proxies inversos con HTTPS automático

Dos alternativas modernas a [Nginx](./manual_nginx.md): **Caddy** (configuración mínima en un `Caddyfile`, HTTPS automático) y **Traefik** (descubre servicios solo, ideal con Docker y Kubernetes).

> 🎯 **Nivel**: intermedio · **Requisitos**: Docker básico, un dominio que apunte al servidor y puertos 80/443 accesibles · **Revisado**: noviembre 2026

> ⚠️ Las configuraciones son ejemplos mínimos. Fija versiones de imagen y contrasta las opciones con la documentación de tu versión. Las direcciones de correo de los ejemplos son marcadores.

## ⚖️ Cuál elegir

| | Nginx | Caddy | Traefik |
|---|---|---|---|
| Configuración | Ficheros, más manual | `Caddyfile` muy corto | Etiquetas/proveedores + estática |
| HTTPS (Let's Encrypt) | Con certbot u otras herramientas | Automático por defecto | Resolvers ACME integrados |
| Descubrimiento de servicios | No | No (config estática) | Sí (Docker, Kubernetes…) |
| Ideal para | Máximo control y rendimiento probado | Sitios y proxies sencillos | Muchos contenedores que cambian |

## 🟢 Caddy

Caddy obtiene y renueva certificados de forma automática para los dominios que configuras y redirige HTTP a HTTPS. Para ello el dominio debe apuntar al servidor y deben estar accesibles los puertos 80 y 443 ([Automatic HTTPS](https://caddyserver.com/docs/automatic-https)).

```
# Caddyfile: proxy inverso con HTTPS automático
example.com {
    reverse_proxy localhost:3000
}
```

```
# Varios sitios, estáticos y API
example.com {
    root * /var/www/example
    encode zstd gzip
    file_server
}

api.example.com {
    reverse_proxy localhost:8080 localhost:8081    # balanceo entre varios upstreams
    log
}

# Rutas dentro de un mismo dominio
app.example.com {
    handle_path /api/* {
        reverse_proxy localhost:8080
    }
    handle {
        reverse_proxy localhost:3000
    }
}
```

```bash
caddy validate --config Caddyfile         # comprobar sintaxis
caddy fmt --overwrite Caddyfile           # formatear
caddy run --config Caddyfile              # en primer plano
caddy start --config Caddyfile            # en segundo plano
caddy reload --config Caddyfile           # recargar sin cortar conexiones
caddy stop

# Atajos sin fichero
caddy reverse-proxy --from :2016 --to localhost:9000
caddy file-server --browse --listen :8000
```

- **Desarrollo local**: `tls internal` usa la CA interna de Caddy en lugar de Let's Encrypt (el navegador tendrá que confiar en ella).
- **Certificados comodín** (`*.example.com`) requieren el desafío DNS, que se añade con un *plugin* de tu proveedor DNS (Caddy compilado con `xcaddy`).
- **Backend con HTTPS**: usa un upstream `https://` en `reverse_proxy` ([guía rápida](https://caddyserver.com/docs/quick-starts/reverse-proxy)).
- Referencia de la directiva: [`reverse_proxy`](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).

### Caddy en Docker Compose

```yaml
services:
  caddy:
    image: caddy:<version>
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data          # certificados: persístelos o volverás a pedirlos
      - caddy_config:/config
  app:
    image: miapp:1.0
volumes:
  caddy_data:
  caddy_config:
```

```
# Caddyfile (en la red de Compose, el upstream se llama por nombre de servicio)
example.com {
    reverse_proxy app:3000
}
```

## 🔵 Traefik v3

Traefik lee la configuración de **proveedores** (Docker, Kubernetes, ficheros…) y crea **routers** y **servicios** dinámicamente. Con Docker, el routing se declara con **etiquetas** en cada contenedor ([proveedor Docker](https://doc.traefik.io/traefik/v3.3/routing/providers/docker/)).

```yaml
# compose.yaml
services:
  traefik:
    image: traefik:v3              # fija una versión concreta en producción
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false     # solo expone los contenedores con traefik.enable=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.le.acme.email=admin@example.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.le.acme.tlschallenge=true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  whoami:
    image: traefik/whoami
    labels:
      - traefik.enable=true
      - traefik.http.routers.whoami.rule=Host(`whoami.example.com`)
      - traefik.http.routers.whoami.entrypoints=websecure
      - traefik.http.routers.whoami.tls.certresolver=le

volumes:
  letsencrypt:
```

- **Etiquetas**: `traefik.http.routers.<nombre>.` configura el router (regla, entrypoints, TLS); Traefik crea un servicio y un router por contenedor.
- **`exposedByDefault`** vale `true` por defecto: ponlo en `false` para que solo se expongan los contenedores que lo pidan con `traefik.enable=true`.
- **Entrypoints**: puntos de entrada (puertos). Un router los elige con `traefik.http.routers.<nombre>.entrypoints=websecure`.
- **Middlewares** (redirecciones, cabeceras, autenticación básica, límites de tasa) se declaran también con etiquetas y se encadenan en el router.
- **Seguridad del socket de Docker**: montar `docker.sock` da acceso a la API de Docker; `:ro` no impide abusarla. En producción considera un proxy de socket con permisos limitados o un proveedor de ficheros ([Docker avanzado](./manual_docker_avanzado.md)).
- **Panel de control**: no lo expongas sin autenticación.
- Referencia completa de etiquetas: [proveedor Docker (v3)](https://doc.traefik.io/traefik/v3.8/reference/routing-configuration/other-providers/docker/).

## ❓ FAQ

**❓ Caddy no obtiene el certificado.**
➡ Comprueba que el DNS apunta al servidor, que los puertos 80 y 443 llegan desde Internet (cortafuegos, NAT) y que no hay otro servicio usándolos. Mira los registros con `caddy run` o `docker compose logs caddy`.

**❓ Traefik devuelve 404.**
➡ Normalmente falta `traefik.enable=true` (con `exposedByDefault=false`), la regla `Host(...)` no coincide, o el contenedor no comparte red con Traefik. Con varias redes, indica la red con la etiqueta `traefik.docker.network`.

**❓ ¿Puedo usarlos detrás de otro proxy o Cloudflare?**
➡ Sí, pero el desafío ACME HTTP/TLS necesita llegar a Caddy/Traefik. Con un proxy delante usa el desafío DNS.

**❓ ¿Y en Kubernetes?**
➡ Traefik tiene proveedor de Kubernetes (Ingress y CRDs propios); Caddy se usa menos allí. Revisa [kubectl](./manual_kubectl.md) y [Helm](./manual_helm.md) para el despliegue.

## 🔗 Enlaces
- [Caddy: documentación](https://caddyserver.com/docs/)
- [Caddy: HTTPS automático](https://caddyserver.com/docs/automatic-https)
- [Caddy: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Traefik: documentación](https://doc.traefik.io/traefik/)
- [Traefik: proveedor Docker](https://doc.traefik.io/traefik/v3.3/routing/providers/docker/)

## 🧩 Ver también
- [Nginx](./manual_nginx.md) · [Docker avanzado](./manual_docker_avanzado.md) · [OpenSSL](./manual_openssl.md) · [Red, puertos y DNS](./manual_red_dns.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
