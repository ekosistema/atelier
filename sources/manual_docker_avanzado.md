# Docker avanzado – Builds, seguridad, redes y volúmenes

Complemento del manual de [Docker y Compose](./manual_docker_compose.md): construcción eficiente con BuildKit, endurecimiento de contenedores, redes y volúmenes, limpieza y depuración, y Podman como alternativa sin demonio.

> 🎯 **Nivel**: intermedio-avanzado · **Requisitos**: Docker básico (imágenes, contenedores, Compose) · **Revisado**: noviembre 2026

## 📋 Tabla de Contenidos
- [BuildKit: cachés y secretos en el build](#️-buildkit-cachés-y-secretos-en-el-build)
- [Buenas prácticas de imagen](#-buenas-prácticas-de-imagen)
- [Endurecer contenedores en ejecución](#️-endurecer-contenedores-en-ejecución)
- [Redes](#-redes)
- [Volúmenes y datos](#-volúmenes-y-datos)
- [Depuración y diagnóstico](#-depuración-y-diagnóstico)
- [Limpieza](#-limpieza)
- [Podman: alternativa sin demonio](#-podman-alternativa-sin-demonio)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🏗️ BuildKit: cachés y secretos en el build

BuildKit es el constructor actual de Docker. Sus `RUN --mount` evitan descargar dependencias en cada build y permiten usar secretos sin dejarlos en las capas.

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.13-slim AS build
WORKDIR /app
COPY requirements.txt .

# Caché persistente entre builds para el gestor de paquetes
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Secreto disponible solo durante este RUN: no queda en ninguna capa
RUN --mount=type=secret,id=pip_token \
    PIP_INDEX_URL="https://__token__:$(cat /run/secrets/pip_token)@pypi.example.com/simple" \
    pip install paquete-privado
```

```bash
# Pasar el secreto al build desde un fichero o una variable de entorno
docker build --secret id=pip_token,src=./pip_token.txt -t miapp .
docker build --secret id=pip_token,env=PIP_TOKEN -t miapp .
```

> Nunca uses `ARG`/`ENV` para secretos: quedan en el historial de la imagen (`docker history`). Referencia: [Build secrets](https://docs.docker.com/build/building/secrets/).

### buildx y multi-plataforma

```bash
docker buildx create --name multi --use           # crear un builder (una sola vez)
docker buildx build --platform linux/amd64,linux/arm64 \
  -t registro.example.com/miapp:1.0 --push .       # imagen multi-arquitectura
docker buildx ls                                   # builders disponibles
```

### Bake: varios builds declarativos

`docker buildx bake` lee un fichero `docker-bake.hcl` (también JSON o YAML; busca por defecto `docker-bake.hcl`, `docker-bake.json` o los ficheros de Compose):

```hcl
# docker-bake.hcl
group "default" { targets = ["api", "web"] }

target "api" {
  context   = "./api"
  tags      = ["registro.example.com/api:dev"]
  platforms = ["linux/amd64", "linux/arm64"]
}

target "web" {
  context = "./web"
  tags    = ["registro.example.com/web:dev"]
}
```

```bash
docker buildx bake              # construye el grupo default
docker buildx bake api --push   # solo el target api
```

Referencia: [Bake](https://docs.docker.com/build/bake/reference/).

## 🧱 Buenas prácticas de imagen

```dockerfile
FROM node:24-slim                          # etiqueta concreta, nunca :latest
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN useradd --system --uid 10001 app
USER 10001                                 # no ejecutar como root
HEALTHCHECK --interval=30s --timeout=3s CMD node healthcheck.js
CMD ["node", "server.js"]
```

- **`.dockerignore`**: excluye `.git`, `node_modules`, `.env`, logs. Acelera el build y evita filtrar ficheros.
- **Orden de capas**: copia primero los ficheros de dependencias y después el código; así la caché se reutiliza.
- **Fijar por digest** cuando necesites reproducibilidad total: `FROM node:24-slim@sha256:<digest>` (`docker buildx imagetools inspect node:24-slim` muestra el digest).
- **Multi-stage** para dejar fuera compiladores y herramientas de build (ver el [manual de Docker](./manual_docker_compose.md)).

## 🛡️ Endurecer contenedores en ejecución

```bash
# --read-only + --tmpfs      → sistema de ficheros inmutable con scratch en memoria
# --cap-drop ALL + --cap-add → quitar todas las capabilities y devolver solo las necesarias
# --security-opt             → impedir escalada de privilegios
# --memory/--cpus/--pids     → límites de recursos
# -p 127.0.0.1:...           → publicar solo en localhost si no hace falta más
docker run -d --name api \
  --read-only --tmpfs /tmp:rw,noexec,nosuid \
  --cap-drop ALL --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges \
  --user 10001:10001 \
  --memory 512m --cpus 1 --pids-limit 200 \
  -p 127.0.0.1:8080:8080 \
  miapp:1.0
```

La combinación `--cap-drop ALL`, `--read-only` y `no-new-privileges` es la recomendada por la [hoja de seguridad de OWASP para Docker](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html). Añade solo lo que tu aplicación necesite y pruébalo: algunas imágenes con binarios `setuid` o con capabilities de fichero no arrancan con `no-new-privileges`.

Otras reglas de higiene:

- **No montes `/var/run/docker.sock`** en contenedores: equivale a dar root sobre el host.
- **No uses `--privileged`** salvo que sepas exactamente por qué.
- **No metas secretos en variables de entorno** del Compose en claro; usa `secrets:` o un gestor ([Cadena de suministro y secretos](./manual_supply_chain.md)).
- **Escanea las imágenes** (Trivy) y fíjalas por versión.

### Modo rootless

En el modo *rootless* el demonio y los contenedores se ejecutan sin privilegios de root, lo que reduce el impacto de una vulnerabilidad del demonio o del runtime. A diferencia de `userns-remap`, ni siquiera el demonio corre como root. Tiene limitaciones (p. ej. contenedores con binarios `setuid`). Guía oficial: [Rootless mode](https://docs.docker.com/engine/security/rootless/).

## 🌐 Redes

```bash
docker network create backend                       # red bridge definida por el usuario
docker run -d --name db  --network backend postgres:18
docker run -d --name api --network backend miapp:1.0
# En una red de usuario los contenedores se resuelven por nombre: api → db:5432

docker network create --internal aislada            # sin salida a Internet
docker network ls
docker network inspect backend                      # contenedores, subred, gateway
docker network connect backend otro-contenedor      # unir un contenedor existente
```

- La red `bridge` por defecto **no** resuelve nombres; usa siempre redes definidas por el usuario (o Compose, que crea una por proyecto).
- `--network host` comparte la red del host: sin aislamiento y con comportamiento distinto según el sistema (en Docker Desktop no equivale a la red de tu máquina).
- Publica puertos solo donde haga falta (`-p 127.0.0.1:...`).

## 💾 Volúmenes y datos

```bash
docker volume create datos
docker run -d --name db -v datos:/var/lib/postgresql postgres:18        # volumen con nombre
docker run --rm -v "$PWD":/app:ro miapp:1.0                              # bind mount de solo lectura
docker run --rm --mount type=bind,src="$PWD",dst=/app,readonly miapp:1.0 # sintaxis explícita, más clara
docker run --rm --tmpfs /cache miapp:1.0                                 # datos en memoria

# Copia de seguridad de un volumen a un tar
docker run --rm -v datos:/datos:ro -v "$PWD":/backup alpine \
  tar czf /backup/datos.tgz -C /datos .

# Restaurar
docker run --rm -v datos:/datos -v "$PWD":/backup alpine \
  tar xzf /backup/datos.tgz -C /datos
```

- Los **volúmenes con nombre** los gestiona Docker (mejor para bases de datos); los **bind mounts** dependen de la ruta del host.
- Para bases de datos usa además sus herramientas de backup lógicas (`pg_dump`, etc.): una copia en caliente del directorio puede quedar inconsistente.

## 🔍 Depuración y diagnóstico

```bash
docker logs -f --tail 100 api
docker exec -it api sh                         # shell dentro del contenedor
docker inspect --format '{{.State.Health.Status}}' api
docker stats                                   # CPU/memoria en vivo
docker top api                                 # procesos del contenedor
docker events                                  # eventos del demonio en tiempo real
docker history miapp:1.0                       # capas y su tamaño
docker diff api                                # ficheros cambiados respecto a la imagen
```

## 🧹 Limpieza

```bash
docker system df                 # espacio usado por imágenes, contenedores, volúmenes y caché
docker image prune               # imágenes huérfanas (dangling)
docker builder prune             # caché de build
docker system prune              # ⚠️ contenedores parados, redes sin uso e imágenes huérfanas
docker system prune -a --volumes # ⚠️⚠️ además imágenes sin uso y volúmenes: puede borrar datos
```

Revisa qué se va a eliminar antes de confirmar; los volúmenes no tienen papelera.

## 🦭 Podman: alternativa sin demonio

Podman usa una CLI casi idéntica a la de Docker pero **sin demonio central** y con contenedores *rootless* por defecto.

```bash
podman run -d --name web -p 8080:80 docker.io/library/nginx:1.27-alpine
podman ps
alias docker=podman              # la mayoría de comandos funcionan igual
podman compose up                # delega en docker-compose o podman-compose si están instalados
```

- Los nombres de imagen suelen requerir el registro completo (`docker.io/...`).
- Para ejecutar contenedores como servicios de systemd, `podman generate systemd` está **marcado como obsoleto** (solo recibe correcciones urgentes) y se recomienda **Quadlet**: ficheros `.container`, `.pod`, `.volume`, `.network` o `.kube` que systemd convierte en servicios; requiere Podman 4.6 o posterior. Consulta la página de manual `podman-systemd.unit(5)` en la [documentación de Podman](https://docs.podman.io/).
- Docker Desktop y Podman Desktop son opciones de escritorio; en Windows, ambas funcionan sobre [WSL2](./manual_powershell_wsl.md).

## ❓ FAQ

**❓ ¿Por qué mi build no usa la caché?**
➡ Se invalida desde la primera capa que cambia. Mueve los `COPY` del código al final y comprueba que `.dockerignore` excluye ficheros que cambian a cada build (logs, `.git`).

**❓ ¿Cómo evito que un secreto quede en la imagen?**
➡ `RUN --mount=type=secret` en el build, y variables o `secrets:` en tiempo de ejecución. Verifica con `docker history --no-trunc`.

**❓ `permission denied` al escribir con `--read-only`.**
➡ Añade un `--tmpfs` o un volumen en las rutas donde la aplicación necesita escribir (`/tmp`, `/var/run`, cachés).

## 🔗 Enlaces
- [Build secrets](https://docs.docker.com/build/building/secrets/)
- [Bake: referencia](https://docs.docker.com/build/bake/reference/)
- [Rootless mode](https://docs.docker.com/engine/security/rootless/)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [Podman](https://docs.podman.io/)

## 🧩 Ver también
- [Docker y Compose](./manual_docker_compose.md) · [Cadena de suministro y secretos](./manual_supply_chain.md) · [Caddy y Traefik](./manual_caddy_traefik.md) · [PowerShell y WSL2](./manual_powershell_wsl.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
