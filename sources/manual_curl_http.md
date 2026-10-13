# curl – Cliente HTTP y diagnóstico desde terminal

Cliente HTTP de línea de comandos para probar APIs REST, inspeccionar cabeceras y cuerpos, gestionar cookies, subir archivos y automatizar comprobaciones en CI. Accesible en prácticamente cualquier sistema.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: `curl` instalado (curl 8.22.0 a oct. 2026) · **Revisado**: octubre 2026

## 🔧 Uso básico

```bash
curl https://api.example.com            # GET (método por defecto)
curl -O https://sitio.com/archivo.zip   # descargar y guardar con nombre original
curl -o salida.json https://api.ej.com  # guardar con otro nombre
curl -I https://ejemplo.com             # solo cabeceras de respuesta (HEAD)
curl -L https://bit.ly/ejemplo          # seguir redirecciones
```

## 📤 Enviar datos y JSON

```bash
# POST JSON con el atajo --json (POST, Content-Type json y body en uno)
curl --json '{"nombre":"Juan","email":"juan@ej.com"}' https://api.ej.com/data

# Equivalente explícito
curl -X POST https://api.ej.com/data \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Juan","email":"juan@ej.com"}'

# Datos desde archivo
curl --json @payload.json https://api.ej.com/data
```

```bash
# Otros métodos
curl -X PUT    https://api.ej.com/data/1
curl -X DELETE https://api.ej.com/data/1
curl -X PATCH  https://api.ej.com/data/1
```

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `curl -X GET https://…` es innecesario: `GET` es el método por defecto y la `-X` no aporta nada salvo confundir. Escribe la URL directamente.

## 🎯 Cabeceras, autenticación y cookies

```bash
curl -H 'Authorization: Bearer TOKEN' https://api.ej.com/protegido
curl -H 'X-Custom: valor' https://api.ej.com/endpoint
curl -u user:clave https://api.ej.com/login     # autenticación básica

# Cookies: enviar (-b) y guardar (-c)
curl -b 'session=abc123' https://api.ej.com/profile
curl -c cookies.txt https://api.ej.com/login
curl -b cookies.txt https://api.ej.com/profile   # reutilizar las guardadas
```

## 🔁 Reintentos y robustez

```bash
curl --retry 3  https://api.ej.com/          # reintenta fallos transitorios
curl --retry 5 --retry-all-errors https://... # reintenta también errores 4xx/5xx
curl --retry-delay 2 --retry-max-time 60 https://...
```

> 📌 **Estado**: `--retry-all-errors` (curl 7.71+, 2020) reintenta **todos** los errores, no solo los de red. Útil en despliegues y CI, pero ten cuidado con endpoints que dan 4xx estables.

## 🌐 DNS y resolución forzada

```bash
# Conectarse a una IP concreta manteniendo el Host (tests contra balanceador)
curl --resolve api.midominio.com:443:10.0.0.5 https://api.midominio.com/

# Forzar versión HTTP
curl --http2 https://api.ej.com       # HTTP/2
curl --http3 https://api.ej.com       # HTTP/3 (QUIC)
curl --compressed https://api.ej.com  # pide y descomprime gzip/brotli
```

## 🧪 Diagnóstico y tiempos

```bash
curl -v https://api.ej.com          # verbose: handshake TLS, cabeceras, tiempos
curl -i https://api.ej.com          # incluye cabeceras de respuesta
curl -sS https://api.ej.com         # silencioso pero muestra errores
curl -s -o /dev/null -w '%{http_code}\n' https://api.ej.com   # solo código

# Desglose de tiempos (TTFB, etc.)
curl -s -o /dev/null -w 'dns:%{time_namelookup}s connect:%{time_connect}s tls:%{time_appconnect}s total:%{time_total}s status:%{http_code}\n' https://api.ej.com

curl --trace trace.txt https://api.ej.com   # log detallado de la petición
```

### Tiempos de espera

```bash
curl --connect-timeout 5 https://api.ej.com   # max seg para conectar
curl --max-time 30 https://api.ej.com          # max seg total
curl --limit-rate 100K https://api.ej.com/archivo   # límite de ancho de banda
```

## 📝 Formularios

```bash
# URL-encoded
curl -X POST https://api.ej.com/login -d 'user=admin&pass=1234'

# multipart (subir archivo, ignore el método)
curl -X POST https://api.ej.com/upload -F 'imagen=@foto.jpg' -F 'nota=hola'
```

## 🖥️ Proxies

```bash
curl -x http://proxy.ej.com:8080 https://api.ej.com
curl -x http://user:pass@proxy.ej.com:8080 https://...
curl --noproxy '*.local' https://servicio.local      # salta proxy para dominios internos
```

## 🤖 curl en CI (healthchecks)

```bash
# Healthcheck de un servicio en un script de CI
curl -fsS --retry 5 --retry-all-errors --connect-timeout 5 \
  -o /dev/null http://localhost:8080/health \
  || { echo 'healthcheck falló'; exit 1; }
```

`-f` convierte errores HTTP (4xx/5xx) en código de salida distinto de 0; `-sS` evita basura de progreso conservando los errores.

## ⚠️ Buenas prácticas y malos usos a evitar

- ❌ `--insecure` / `-k` desactiva la verificación del certificado. **Solo para pruebas locales** puntuales; nunca en producción ni con datos sensibles.
- 🌐 **TLS 1.0 / 1.1** quedan **obsoletos** (2021); el servidor y la API deben hablar al menos TLS 1.2. curl 8 soporta TLS 1.2/1.3.
- 🔑 No pongas credenciales o tokens en la URL de forma persistente en el historial (`user:pass@host` queda en logs). Usa `.netrc` o variables de entorno.
- ✅ Un `.curlrc` en tu home fija opciones por defecto (p. ej. `--connect-timeout 10`).

## 🔀 Alternativas modernas

| En su lugar | Ventaja | Caso de uso |
|---|---|---|
| [xh](https://github.com/ducaale/xh) 0.26 | Sintaxis de HTTPie, salida coloreada, HTTP/2 y HTTP/3, `--curl` convierte a curl | explorar APIs de forma legible en terminal |
| [HTTPie](https://httpie.io/) | Expresivo (`http POST url k=v`), plugins, salida formateada | debugging interactivo y scripts |
| [Postman](https://www.postman.com/) / Insomnia | Interfaz gráfica, colecciones, entornos | flujos visuales de API y documentación |
| [hurl](https://hurl.dev/) 8.0 | Tests HTTP en CI con aserciones, cadena de peticiones, informes JUnit/TAP | **tests automatizados** de APIs |

> 🧪 **Alternativa moderna.** Para tests reproducibles en CI, `hurl` (Apache-2.0, escrito en Rust, usa libcurl por debajo) declara peticiones y aserciones en texto plano y genera informes; para uso interactivo en terminal, `xh`/`HTTPie` son más legibles.

```bash
# hurl: define petición + aserciones y ejecuta el test
hurl --test test/api.hurl
```

## ❓ FAQ

**❓ ¿`-v` o `-i`?**
➡ `-v` muestra todo (handshake, cabeceras, tiempos). `-i` solo añade las cabeceras de respuesta al output. Para solo el código, `-w '%{http_code}'`.

**❓ ¿Cómo no ver el progreso pero sí los errores?**
➡ `curl -sS`.

**❓ ¿curl o wget?**
➡ curl es más flexible con métodos, cabeceras y protocolos; wget es mejor para descargas recursivas o por espejo.

**❓ ¿Cómo saber la versión de curl y sus protocolos?**
➡ `curl --version` muestra la versión y los protocolos/TLS compilados (HTTP/2, HTTP/3, etc.).

**❓ ¿Por qué `--json` en vez de `-d`?**
➡ `--json` fija `Content-Type: application/json`, hace `POST` y envía el cuerpo; menos opciones que recordar.

## 🔗 Enlaces

- [curl: manual oficial](https://curl.se/docs/manpage.html)
- [curl: changelog de versiones](https://curl.se/changes.html)
- [Everything curl (libro gratuito)](https://everything.curl.dev/)
- [xh](https://github.com/ducaale/xh) · [HTTPie](https://httpie.io/) · [hurl](https://hurl.dev/)

## 🧩 Ver también

- [Manual de Node.js (probando APIs con curl)](./manual_nodejs.md)
- [Manual de Nginx (validar el proxy)](./manual_nginx.md)
- [Manual de SQL (practicar contra la API)](./manual_sql.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
