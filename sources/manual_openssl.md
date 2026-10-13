# OpenSSL – Certificados y operaciones criptográficas

Biblioteca criptográfica y CLI para generar claves, CSR y certificados, cifrar y firmar, convertir formatos y diagnosticar conexiones TLS.

> 🎯 **Nivel**: intermedio · **Requisitos**: OpenSSL 3.x (verifica con `openssl version`) · **Revisado**: octubre 2026

## 🚨 Versiones y obsolescencias

> 📌 **Estado**: **OpenSSL 3.5 es la rama LTS actual** (soporte garantizado hasta el 8 de abril de 2030). **OpenSSL 3.0 llegó a su fin de vida (EOL) el 7 de septiembre de 2026** y ya no recibe fixes de seguridad: migra a 3.5.

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `genrsa` quedó deprecado en favor de `genpkey`, y las claves RSA < 2048 bits son inseguras. Actualiza a `genpkey` y usa RSA 3072/4096, P-256/P-384 o Ed25519.

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: TLS 1.0 y TLS 1.1 fueron **deprecados formalmente por el IETF en la RFC 8996 (marzo 2021)**. Solo servicios heredados los aceptan. Algoritmo por defecto: TLS 1.2+ (`-tls1_2`, `-tls1_3`).

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: SHA-1 como firma o en certificados nuevos está en desuso (colisiones conocidas). Usa SHA-256/SHA-384. Resumen alternativo: ver [manual de GPG](./manual_gpg.md).

## 🔑 Generar claves (genpkey)

```bash
# RSA 3072 (recomendado; 2048 mínimo aceptable)
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out clave_rsa.pem

# ECDSA sobre curva P-256 (moderna, rápida)
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out clave_ec.pem

# Ed25519 (curva firma de Twitter; clave corta y segura)
openssl genpkey -algorithm ED25519 -out clave_ed25519.pem

# Clave cifrada con contraseña (AES-256 + PBKDF2)
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 \
  -aes-256-cbc -out clave_cifrada.pem

openssl pkey -in clave.pem -text -noout   # inspeccionar: tipo y tamaño
openssl pkey -pubout -in clave.pem -out publica.pem   # extraer clave pública
```

## 📜 Generar un CSR con SAN

Los certificados modernos exigen **Subject Alternative Names**; el `CN` ya no basta.

```bash
# CSR con SAN y clave nueva (todo en un comando)
openssl req -new -newkey rsa:3072 -nodes \
  -keyout clave.pem -out solicitud.csr \
  -subj "/C=ES/ST=Madrid/L=Madrid/O=MiEmpresa/CN=midominio.com" \
  -addext "subjectAltName=DNS:midominio.com,DNS:www.midominio.com"

# A partir de una clave ya existente
openssl req -new -key clave.pem -out solicitud.csr \
  -subj "/C=ES/ST=Madrid/O=MiEmpresa/CN=midominio.com" \
  -addext "subjectAltName=DNS:midominio.com,IP:192.168.1.10"

# Ver el contenido del CSR
openssl req -in solicitud.csr -noout -text
```

## 📄 Autofirmado y CA local (desarrollo/pruebas)

```bash
# Cert autofirmado con SAN (navegadores modernos lo exigen)
openssl req -x509 -newkey rsa:3072 -nodes \
  -keyout clave.pem -out cert.pem -days 365 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:midominio.local,IP:192.168.1.100"

# Primera CA raíz autofirmada
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes \
  -keyout ca-key.pem -out ca-cert.pem -days 3650 \
  -subj "/CN=Mi CA Local" \
  -addext "basicConstraints=critical,CA:true" \
  -addext "keyUsage=critical,keyCertSign,cRLSign"

# Firmar una hoja (CSR) con la CA raíz
openssl x509 -req -in solicitud.csr -days 825 \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out hoja.pem \
  -copy_extensions copy
```

## 🔍 Inspeccionar certificados

```bash
openssl x509 -in cert.pem -noout -text            # todo el detalle
openssl x509 -in cert.pem -noout -dates           # valid from/to
openssl x509 -in cert.pem -noout -enddate         # fecha de expiración
openssl x509 -in cert.pem -noout -subject -issuer # sujeto y emisor
openssl x509 -in cert.pem -noout -ext subjectAltName
openssl x509 -in cert.pem -noout -fingerprint -sha256
openssl x509 -in cert.pem -noout -pubkey          # clave pública (PEM)
```

## 🔄 Convertir formatos (PEM/DER/PKCS#12)

```bash
# PEM → DER (binario) y DER → PEM
openssl x509 -in cert.pem -outform DER -out cert.der
openssl x509 -inform DER -in cert.der -out cert.pem

# Exportar PKCS#12 (para Windows/IIS) con cifrado moderno (AES + PBKDF2)
openssl pkcs12 -export -in cert.pem -inkey clave.pem -out cert.p12 \
  -name "MiCertificado" -certfile cadena.pem

# PKCS#12 → PEM (clave + certificado)
openssl pkcs12 -in cert.p12 -out cert_con_clave.pem -nodes

# Cadena PEM ordenada: hoja → intermedio(s) → raíz
cat cert.pem intermedio.pem raiz.pem > cert-chain.pem
```

## ⛓️ Verificación de cadenas y TLS

```bash
# Verificar una hoja contra su CA raíz
openssl verify -CAfile ca-cert.pem cert.pem

# Verificar con un intermedio explícito (sin cruzar confianza)
openssl verify -untrusted intermedio.pem -CAfile raiz.pem cert.pem

# Conexión TLS real y validación de cadena (SNI + verificación estricta)
openssl s_client -connect midominio.com:443 -servername midominio.com \
  -verify_return_error </dev/null

# Forzar TLS 1.3 y ver la negociación
openssl s_client -connect midominio.com:443 -tls1_3 -brief </dev/null

# Mostrar todo el chain y estado OSCP
openssl s_client -connect midominio.com:443 -showcerts -status </dev/null
```

## 🔒 Cifrado y firmas

```bash
# Cifrar un fichero con AES-256 y PBKDF2 (iteraciones explícitas)
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -in secreto.txt -out secreto.enc
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in secreto.enc -out secreto.txt

# Firmar y verificar con clave asimétrica
openssl dgst -sha256 -sign clave.pem -out firma.bin fichero.txt
openssl pkey -in clave.pem -pubout -out publica.pem
openssl dgst -sha256 -verify publica.pem -signature firma.bin fichero.txt
```

> 🧪 **Alternativa moderna**: para cifrar/descifrar **ficheros y secretos en config**, prefiere [`age`](https://github.com/FiloSottile/age) o [`sops`](https://github.com/getsops/sops) antes que `openssl enc`. Ver abajo.

## 🧪 Alternativas modernas (certificados y secretos)

| En su lugar | Ventaja | Manual |
|---|---|---|
| [mkcert](https://github.com/FiloSottile/mkcert) | CA local de desarrollo; certificados de confianza sin alertas | |
| [certbot](https://certbot.eff.org/) | ACME/Let's Encrypt con renovación automática | |
| [Caddy](https://caddyserver.com/) | TLS automático y renovación sin configuración | [manual_nginx](./manual_nginx.md) |
| Smallstep [`step`](https://smallstep.com/docs/step-cli/) | PKI interna, CA propia y mTLS para servicios | |
| [`age`](https://github.com/FiloSottile/age) / [`sops`](https://github.com/getsops/sops) | Secretos y ficheros cifrados con claves explícitas | [manual_gpg](./manual_gpg.md) |

## ❓ FAQ

**❓ ¿Cómo sé qué versión de OpenSSL tengo?**
➡ `openssl version` (en 3.5.x verás además el estado de los módulos FIPS/proveedor como `OpenSSL 3.5.x` al ejecutar cualquier comando).

**❓ ¿`genrsa` sigue funcionando?**
➡ Sí, pero está deprecado. Los comandos de genpkey emiten avisos de `DEPRECATED` en 3.x y en el futuro pueden eliminarse. Usa `genpkey`.

**❓ ¿Por qué mi certificado autofirmado genera alertas en el navegador?**
➡ Los navegadores no confían en certificados sin una CA reconocida y exigen SAN. Para desarrollo local usa `mkcert`; para producción, una CA como Let's Encrypt.

**❓ ¿Puedo exportar a PKCS#12 para Windows?**
➡ Sí: `openssl pkcs12 -export`. Si la aplicación es antigua y no soporta AES/PBKDF2, añade `-legacy`.

**❓ ¿Cómo sabes si un servidor soporta TLS 1.3?**
➡ `openssl s_client -connect host:443 -tls1_3 -brief </dev/null`; si negocia, no devolverá error de protocolo.

## 🔗 Enlaces

- [OpenSSL (proyecto y documentación)](https://openssl-library.org/)
- [Release Strategy: OpenSSL](https://openssl-library.org/policies/releasestrat/)
- [OpenSSL 3.5 será la rama LTS](https://openssl-library.org/post/2025-02-20-openssl-3.5-lts/)
- [OpenSSL 3.0 EOL (sept. 2026)](https://openssl-library.org/post/2026-09-16-eol30)
- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446)
- [RFC 8996: Deprecare TLS 1.0 y 1.1](https://www.rfc-editor.org/info/rfc8996/)
- [mkcert (GitHub)](https://github.com/FiloSottile/mkcert)
- [Certbot (EFF)](https://certbot.eff.org/)
- [Smallstep step CLI](https://smallstep.com/docs/step-cli/)
- [age (GitHub)](https://github.com/FiloSottile/age)
- [sops (GitHub)](https://github.com/getsops/sops)

## 🧩 Ver también

- [Manual de GPG](./manual_gpg.md)
- [Manual de SSH](./manual_ssh.md)
- [Manual de Nginx (certbot/Caddy)](./manual_nginx.md)
- [Manual de cURL/HTTP](./manual_curl_http.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
