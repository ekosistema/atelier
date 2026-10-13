# Cadena de suministro y secretos – Trivy, SBOM, Cosign y SOPS/age

Cómo saber qué contiene tu software (escaneo y SBOM), demostrar de dónde viene (firmas con Sigstore/Cosign) y guardar secretos cifrados en el repositorio (SOPS con age).

> 🎯 **Nivel**: intermedio · **Requisitos**: Docker, Git y nociones de CI · **Revisado**: noviembre 2026

> ⚠️ Las herramientas de esta guía cambian flags y comportamiento entre versiones. Fija la versión que uses (también en CI) y contrasta con la referencia de tu versión. Los números de versión no se citan a propósito.

## 🔍 Trivy: escanear vulnerabilidades, secretos y configuración

[Trivy](https://trivy.dev) escanea imágenes, sistemas de ficheros y repositorios. Sustituye a `tfsec` y Terrascan en la tabla de estado del README.

```bash
trivy image miapp:1.0                          # imagen local o de un registro
trivy fs .                                     # dependencias y configuración del directorio actual
trivy config .                                 # errores de configuración (Dockerfile, Terraform, Kubernetes)

# Filtrar y controlar el resultado
trivy image --severity HIGH,CRITICAL miapp:1.0
trivy image --ignore-unfixed miapp:1.0         # ocultar fallos sin parche disponible
trivy image --exit-code 1 --severity CRITICAL miapp:1.0   # devuelve error → falla el pipeline

# Elegir qué buscar (vulnerabilidades, secretos, configuración, licencias)
trivy fs --scanners vuln,secret,misconfig .
trivy fs --scanners license .
```

En CI, escanea **después** de construir la imagen y **antes** de publicarla, y trata `CRITICAL` como bloqueante. Un `.trivyignore` permite aceptar hallazgos concretos con motivo documentado: revísalo periódicamente.

## 📋 SBOM: inventario de componentes

Un **SBOM** (*Software Bill of Materials*) lista las dependencias de un artefacto. Los formatos habituales son **CycloneDX** y **SPDX**.

```bash
# Generar un SBOM en CycloneDX con Trivy
trivy image -f cyclonedx -o sbom.cdx.json miapp:1.0

# Escanear ese SBOM más tarde: sin necesitar la imagen
trivy sbom sbom.cdx.json

# Alternativa: Syft para generar (formato de salida cyclonedx-json) y Grype para escanear
syft miapp:1.0 -o cyclonedx-json=sbom.cdx.json
grype sbom:./sbom.cdx.json        # comprueba la sintaxis con `grype --help` en tu versión
```

Guarda el SBOM junto a cada release: cuando aparezca una vulnerabilidad nueva podrás saber si te afecta sin reconstruir nada.

## ✍️ Cosign y Sigstore: firmar y verificar

Cosign firma imágenes de contenedor (y otros artefactos) y guarda la firma en el registro. Lo recomendable es la firma **sin claves** (*keyless*): la identidad es la de tu CI (OIDC), no una clave privada que custodiar.

```bash
# Firmar siempre por DIGEST, no por tag (un tag puede apuntar a otra imagen más tarde)
cosign sign registro.example.com/miapp@sha256:<digest>

# Verificar: hay que indicar quién firmó (identidad) y quién lo certificó (emisor OIDC)
cosign verify registro.example.com/miapp@sha256:<digest> \
  --certificate-identity "https://github.com/ORG/REPO/.github/workflows/release.yml@refs/heads/main" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
```

- En modo *keyless*, `verify` exige `--certificate-identity` (o `--certificate-identity-regexp`) **y** `--certificate-oidc-issuer` (o su variante regexp).
- Evita expresiones regulares amplias como `.*`: los ejemplos de inicio rápido las usan, pero en producción aceptarían firmas de cualquiera. Usa la identidad exacta de tu workflow.
- Si el resultado es `no signatures found`, el digest o la identidad no coinciden con lo firmado.
- En GitLab CI la identidad apunta al `.gitlab-ci.yml` y el emisor es la instancia de GitLab ([guía de GitLab](https://docs.gitlab.com/ci/yaml/signing_examples/)).

Alternativa con par de claves, si no puedes usar OIDC:

```bash
cosign generate-key-pair                      # crea cosign.key (protégela) y cosign.pub
cosign sign --key cosign.key registro.example.com/miapp@sha256:<digest>
cosign verify --key cosign.pub registro.example.com/miapp@sha256:<digest>
```

Referencias: [documentación de Sigstore](https://docs.sigstore.dev/) y [verificación de firmas](https://docs.sigstore.dev/cosign/verifying/verify/). Para OIDC en GitHub Actions, ver el [manual de GitHub Actions](./manual_github_actions.md).

## 🔐 Secretos en Git: SOPS + age

**age** es una herramienta de cifrado sencilla (la alternativa moderna a GPG para ficheros); **SOPS** cifra solo los *valores* de un YAML/JSON/ENV, dejando las claves legibles: los diffs de Git siguen siendo útiles. El propio proyecto SOPS recomienda age frente a PGP cuando es posible.

```bash
# 1. Crear un par de claves age (guarda keys.txt fuera del repo y con copia de seguridad)
age-keygen -o key.txt                        # imprime la clave pública: age1...

# 2. Decirle a SOPS para qué claves cifrar: .sops.yaml en la raíz del repo
cat > .sops.yaml <<'EOF'
creation_rules:
  - path_regex: secrets/.*\.yaml$
    age: age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # clave pública (placeholder)
EOF

# 3. Cifrar, editar y descifrar
sops --encrypt --in-place secrets/db.yaml     # cifra los valores (mira `sops --help` de tu versión)
sops secrets/db.yaml                          # abre el editor con el contenido descifrado y recifra al guardar
sops --decrypt secrets/db.yaml                # imprime el contenido en claro

# 4. Indicar dónde está la clave privada para descifrar
export SOPS_AGE_KEY_FILE=$HOME/.config/sops/age/keys.txt
```

- SOPS busca por defecto la clave privada de age en `~/.config/sops/age/keys.txt`; `SOPS_AGE_KEY_FILE` indica otra ruta.
- Cada regla de `creation_rules` puede usar `path_regex` para aplicar claves distintas por entorno (`dev`, `prod`).
- `encrypted_regex` en `.sops.yaml` limita el cifrado a las claves que coincidan (por defecto se cifran todos los valores).
- Para añadir o quitar destinatarios: edita `.sops.yaml` y ejecuta `sops updatekeys secrets/db.yaml`.
- **Nunca subas `key.txt`** (la clave privada). La clave pública sí puede estar en el repo.

### age sin SOPS: cifrar ficheros sueltos

```bash
age -r age1xxxxxxxx... -o secreto.txt.age secreto.txt     # cifrar para una clave pública
age -d -i key.txt secreto.txt.age > secreto.txt           # descifrar con la clave privada
age -p -o secreto.txt.age secreto.txt                     # cifrar con contraseña
```

> Para gestionar secretos dinámicos, rotación y auditoría a escala se suele usar un servicio dedicado (p. ej. HashiCorp Vault o el gestor de tu nube). SOPS/age encaja mejor para configuración cifrada versionada con el código.

## ✅ Prácticas para reducir riesgo

- **Dependencias reproducibles**: usa los lockfiles (`npm ci`, `uv sync`, `pip install --require-hashes`) y no instales con rangos abiertos en CI.
- **Actualizaciones controladas**: Dependabot o Renovate para proponer cambios, con revisión y tests.
- **Fija por digest o SHA**: imágenes base con `@sha256:` y actions de terceros por SHA de commit en lugar de por tag móvil.
- **Menos privilegios en CI**: tokens de corta duración (OIDC) en vez de secretos de larga duración; permisos mínimos por job.
- **Escanea y firma en el pipeline**: build → Trivy → publicar por digest → Cosign → verificar en el despliegue.
- **Rota lo expuesto**: si un secreto llegó a Git, considéralo comprometido y rótalo aunque borres el commit ([Git avanzado](./manual_git_avanzado.md) explica `git filter-repo`).

## ❓ FAQ

**❓ ¿Trivy o Grype/Syft?**
➡ Trivy cubre imagen, repo, configuración, secretos y licencias con una sola herramienta. Syft genera SBOM y Grype escanea; es una combinación más modular. Cualquiera sirve: lo importante es automatizarlo en CI.

**❓ ¿Firmar con clave o sin clave?**
➡ Sin clave (OIDC) cuando tu CI lo permita: no hay clave privada que robar ni rotar, y la identidad queda registrada. Con clave si estás en un entorno aislado sin acceso a OIDC.

**❓ ¿Por qué firmar por digest?**
➡ Un tag (`:1.0`) puede reapuntarse a otra imagen; el digest identifica exactamente el contenido firmado.

**❓ ¿SOPS o `git-crypt`/GPG?**
➡ SOPS cifra por valor y funciona bien con diffs y con age; GPG añade más complejidad de claves. Ver el [manual de GPG](./manual_gpg.md) si necesitas compatibilidad con PGP.

## 🔗 Enlaces
- [Trivy](https://trivy.dev)
- [Sigstore: documentación](https://docs.sigstore.dev/)
- [Cosign: verificar firmas](https://docs.sigstore.dev/cosign/verifying/verify/)
- [SOPS](https://getsops.io/)
- [age](https://github.com/FiloSottile/age)
- [CycloneDX](https://cyclonedx.org/) · [SPDX](https://spdx.dev/)

## 🧩 Ver también
- [Docker avanzado](./manual_docker_avanzado.md) · [GitHub Actions](./manual_github_actions.md) · [GPG](./manual_gpg.md) · [Git avanzado](./manual_git_avanzado.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
