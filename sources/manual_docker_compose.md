# 🐳 Docker y Docker Compose – Contenedores y despliegues locales

CLI de Docker para construir, ejecutar e inspeccionar contenedores, y Compose v5 para orquestar varios servicios con un único `compose.yaml`. Es la base del desarrollo local y de gran parte de los despliegues en servidor.

> 🎯 **Nivel**: básico · **Requisitos**: Docker Engine ≥ 29 (o Docker Desktop), Linux, macOS o WSL2 · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos

- [Instalación y versiones vigentes](#-instalación-y-versiones-vigentes)
- [Imágenes y contenedores](#-imágenes-y-contenedores)
- [Volúmenes, redes y limpieza](#️-volúmenes-redes-y-limpieza)
- [Dockerfile multi-stage con cache mounts](#-dockerfile-multi-stage-con-cache-mounts)
- [Compose v5 (el fichero `compose.yaml`)](#-compose-v5-el-fichero-composeyaml)
- [`compose watch`: recarga en caliente](#️-compose-watch-recarga-en-caliente)
- [Imágenes multi-arch con Buildx](#️-imágenes-multi-arch-con-buildx)
- [Seguridad y buenas prácticas](#-seguridad-y-buenas-prácticas)
- [Alternativas en macOS (y licencia de Docker Desktop)](#-alternativas-en-macos-y-licencia-de-docker-desktop)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🔧 Instalación y versiones vigentes

Docker Engine **29.9.0** (oct. 2026) es la serie actual; la v28 fue la última que soporta armhf (Raspberry Pi OS de 32 bits). El binario `docker-compose` de Compose v1 está **EOL**.

```bash
# Linux: repositorio oficial (instala Engine + CLI + plugin de Compose)
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker --now

# Comprobar lo que hay realmente instalado
docker version              # versión de cliente y de servidor
docker compose version      # plugin de Compose (serie v5.x)

# Modo rootless (demonio sin privilegios de root)
dockerd-rootless-setuptool.sh install
```

> ⚠️ **Obsoleto / en desuso (oct. 2026).** El binario `docker-compose` (Compose v1) llegó a EOL y ya no se actualiza. Usa siempre `docker compose` (subcomando, con espacio).

## 📦 Imágenes y contenedores

```bash
docker pull nginx:1.27-alpine          # descargar imagen concreta
docker images                          # listar imágenes locales
docker image prune -f                  # borrar imágenes colgantes (<none>)

docker run -d --name web -p 8080:80 nginx:1.27-alpine   # crear y arrancar
docker ps                              # contenedores en marcha
docker ps -a                           # incluidos los parados
docker stop web && docker rm web       # parar y borrar
docker logs -f --tail=100 web          # logs en streaming
docker exec -it web sh                 # entrar al contenedor
docker inspect web                     # metadatos JSON completos
```

## 🛠️ Volúmenes, redes y limpieza

```bash
docker volume create datos             # volumen con nombre (persistente)
docker volume ls
docker volume inspect datos
docker volume rm datos

docker network create app-net          # red definida por el usuario (DNS integrado)
docker network ls

docker system df                       # espacio que ocupa cada cosa
docker system prune -a --volumes       # limpieza total (¡borra volúmenes huérfanos!)
```

## 🐳 Dockerfile multi-stage con cache mounts

El patrón habitual en 2026: un stage para dependencias, otro mínimo para runtime, y cache mounts para no rehacer descargas en cada build.

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.14-slim AS deps
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --prefix=/install -r requirements.txt

FROM python:3.14-slim AS runtime
WORKDIR /app
COPY --from=deps /install /usr/local
COPY . .
USER nobody                            # nunca correr como root en runtime
CMD ["python", "app.py"]
```

```bash
docker build -t mi_app:1.0 .                                  # build normal
docker build --target deps -t mi_app:deps .                   # solo hasta un stage
docker build --no-cache --progress=plain -t mi_app:1.0 .      # forzar rebuild
```

## 🧩 Compose v5 (el fichero `compose.yaml`)

Compose saltó de la v2 a la **v5** (se evitó el 3 y el 4 para no confundirlos con las versiones del formato de fichero heredadas de v1). Última publicada: **v5.6.0** (oct. 2026).

```yaml
# compose.yaml
services:
  web:
    build: .
    ports:
      - "8080:80"
    depends_on:
      db:
        condition: service_healthy      # arranca solo si el healthcheck pasa
  db:
    image: postgres:18
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_pass
      POSTGRES_DB: mydb
    secrets:
      - pg_pass
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 3s
      retries: 10
    profiles: ["dev"]                   # solo arranca si se pide el perfil dev
volumes:
  db_data:
secrets:
  pg_pass:
    file: ./secrets/pg_pass.txt
```

Comandos habituales:

```bash
docker compose up -d                    # levantar en segundo plano
docker compose up -d --build            # reconstruir imágenes antes
docker compose ps                       # estado de los servicios
docker compose logs -f web              # logs de un servicio
docker compose exec web sh              # shell dentro de un servicio
docker compose down                     # parar y borrar contenedores y red
docker compose down -v                  # además borra los volúmenes
docker compose --profile dev up -d      # arrancar un perfil concreto
```

> ⚠️ **Obsoleto / en desuso (oct. 2026).** La clave `version:` dentro del fichero Compose está obsoleta: Compose v2+ la ignora y avisa. Elimínala.
> 📌 **Estado**: `links` está en desuso: la red por defecto ya resuelve los servicios por nombre. `network_mode: host` (Linux) anula el DNS interno y el aislamiento de red → úsalo solo si necesitas acceso literal a la pila de red del host.

## 👁️ `compose watch`: recarga en caliente

```bash
docker compose watch                    # aplica rebuild/sync según las reglas watch
```

```yaml
services:
  web:
    build: .
    develop:
      watch:
        - action: sync                  # copia ficheros sin reiniciar
          path: ./src
          target: /app/src
        - action: rebuild               # reconstruye al cambiar requirements
          path: requirements.txt
```

## 🏗️ Imágenes multi-arch con Buildx

```bash
docker buildx create --name multi --use       # builder con soporte multiplataforma
docker buildx inspect --bootstrap

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t usuario/mi_app:1.0 --push .              # publica una imagen por arquitectura
```

## 🔒 Seguridad y buenas prácticas

```text
✓ Imagen base mínima (slim / distroless) y etiqueta fija, nunca :latest
✓ USER no-root en el Dockerfile
✓ .dockerignore para no copiar .git, .env ni entornos virtuales
✓ Secrets vía fichero (/run/secrets/) o env_file, nunca hard-coded
✓ docker scout quickview mi_app:1.0        # escaneo de CVEs de la imagen
✓ --read-only + --cap-drop=ALL en producción cuando sea posible
```

## 🍎 Alternativas en macOS (y licencia de Docker Desktop)

Docker Desktop **no es gratis para toda empresa**: es gratuito para uso personal, educación, OSS no comercial y pequeñas empresas (**< 250 empleados Y < 10 M USD de facturación anual**); por encima, y para entidades gubernamentales, exige suscripción (Pro 9 USD/usuario/mes, Team 15, Business 24, en plan anual).

| Alternativa | Licencia / coste | Nota |
|---|---|---|
| [Podman](https://podman.io/) 6.1.3 + Podman Desktop 1.29 | Apache-2.0, gratis | CLI compatible (`alias docker=podman`), rootless, sin demonio |
| [Colima](https://github.com/abiosoft/colima) | MIT, gratis | Solo terminal, muy ligero, `colima start` |
| [OrbStack](https://orbstack.dev/) | Gratis uso personal; Pro 8 USD/usuario/mes (comercial) | Muy rápido, solo macOS |

## ❓ FAQ

**❓ ¿`docker compose` o `docker-compose`?**
➡ `docker compose` (v5, plugin del CLI). El `docker-compose` v1 está EOL.

**❓ ¿Hace falta `version:` en el `compose.yaml`?**
➡ No; está obsoleto desde v2 y se ignora.

**❓ ¿Cómo espero a que la base de datos esté lista?**
➡ `depends_on` con `condition: service_healthy` más un `healthcheck` en el servicio.

**❓ ¿Cómo paso secretos a un servicio?**
➡ Con el bloque `secrets:` (se montan como ficheros en `/run/secrets/`), no con variables en el YAML.

**❓ ¿Dónde se usa Docker Desktop de pago?**
➡ Empresas ≥ 250 empleados o ≥ 10 M USD de ingresos, y entidades gubernamentales.

## 🔗 Enlaces

- [Docker Engine 29: release notes](https://docs.docker.com/engine/release-notes/29/)
- [Docker Compose: releases (v5.x)](https://github.com/docker/compose/releases)
- [Compose file reference](https://docs.docker.com/reference/compose-file/)
- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [Licencia de Docker Desktop](https://docs.docker.com/subscription/desktop-license/)
- [Podman](https://podman.io/) · [Colima](https://github.com/abiosoft/colima) · [OrbStack](https://orbstack.dev/)

## 🧩 Ver también

- [manual_kubectl.md](./manual_kubectl.md): desplegar esos contenedores en Kubernetes
- [manual_helm.md](./manual_helm.md): empaquetar servicios para el clúster
- [manual_observabilidad.md](./manual_observabilidad.md): métricas y trazas de lo que ejecutas
- [manual_nginx.md](./manual_nginx.md): proxy inverso por delante de los servicios

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
