# GPG – Cifrado y firmas digitales

Herramienta de cifrado asimétrico y firmas digitales. Se usa para cifrar archivos, verificar integridad y autenticidad, y firmar commits de Git.

> 🎯 **Nivel**: intermedio · **Requisitos**: GnuPG instalado · **Revisado**: octubre 2026

## 🔧 Instalación

```bash
# macOS
brew install gnupg

# Debian/Ubuntu
sudo apt install gnupg

# Verificar
gpg --version
```

## 🔑 Gestión de claves

```bash
gpg --full-generate-key                      # generar un par de claves
gpg --list-keys                              # listar claves públicas
gpg --list-keys --keyid-format LONG          # con ID largo
gpg --list-secret-keys                       # listar claves privadas

gpg --export --armor -o mi-clave.pgp tu@email.com        # exportar pública
gpg --export-secret-keys --armor -o backup.asc tu@email.com  # exportar privada
gpg --import clave-publica.pgp               # importar clave de otra persona
```

## 📤 Cifrar y descifrar

```bash
gpg --encrypt --armor --recipient tu@email.com archivo.txt   # cifrar para un destinatario
gpg --decrypt archivo.txt.asc                                # descifrar

gpg --symmetric --armor secreto.txt        # cifrado con contraseña (sin claves)
gpg --decrypt secreto.txt.asc
```

## ✍️ Firmar y verificar

```bash
gpg --clear-sign archivo.txt        # firma legible (crea archivo.txt.asc)
gpg --verify archivo.txt.asc        # verificar firma
gpg --encrypt --sign --armor --recipient tu@email.com archivo.txt   # firmar + cifrar
```

## 🌐 keys.openpgp.org

Servidor de claves público y respetuoso con la privacidad (no guarda UIDs no verificados por correo).

```bash
gpg --keyserver keys.openpgp.org --search-keys "email@ejemplo.com"  # buscar clave
gpg --keyserver keys.openpgp.org --send-keys <KEY_ID>               # publicar la tuya
gpg --keyserver keys.openpgp.org --recv-keys <KEY_ID>               # importar una específica
```

## 🔐 Firmar commits de Git

```bash
# Con GPG
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true
git commit -S -m "mensaje firmado"
git tag -s v1.0.0 -m "versión firmada"

# Con SSH (más simple, usa tu clave existente): ver manual_git.md
git config --global gpg.format ssh
```

### gpg-agent y YubiKey

`gpg-agent` gestiona tus claves privadas. En macOS con Touch ID o llaves en YubiKey, autoriza la firma:

```bash
gpgconf --kill gpg-agent && gpgconf --launch gpg-agent   # reiniciar el agente
gpg --card-status        # detectar una YubiKey insertada (OpenPGP card)
```

Disponer las claves en una YubiKey (hardware) impide que las claves privadas abandonen el dispositivo; Yubico documenta SSH/PGP por hardware.

## 🛡️ Confianza y seguridad

```bash
gpg --edit-key <KEY_ID>      # editar confianza
> trust                      # asignar nivel de confianza (5 = plena)
> quit

gpg --gen-revoke --armor <KEY_ID> > cert-revocacion.asc   # certificado de revocación
gpg --import cert-revocacion.asc
```

## 🧪 Complejidad de GnuPG y alternativas modernas

> 📌 **Estado**: GnuPG funciona, pero su gestión de claves (anillos, confianza, web of trust, agentes) es compleja y frágil. Para casos concretos hay herramientas más simples.

| En su lugar | Para qué | Ventaja | Manual |
|---|---|---|---|
| [age](https://github.com/FiloSottile/age) | Cifrado de archivos moderno | Claves pequeñas, sin configuración | manual_gpg.md |
| [rage](https://github.com/str4d/rage) | Implementación en Rust de age | Binario único, rápida | manual_gpg.md |
| [minisign](https://jedisct1.github.io/minisign) | Firmar y verificar archivos | Simple, Ed25519 | manual_gpg.md |
| [cosign](https://github.com/sigstore/cosign) | Firmar contenedores e imágenes | Sigstore, transitividad pública | manual_gpg.md |
| [pass](https://passwordstore.org/) | Gestor de contraseñas (usa GPG) | CLI Unix con ~/.password-store | manual_gpg.md |

```bash
# age: cifrado sencillo sin anillos de claves
age-keygen -o clave.txt                    # generar identidad
age -r $(age-keygen -y clave.txt) -o a.age archivo   # cifrar
age -d -i clave.txt a.age > archivo        # descifrar

# minisign: firmar un archivo
minisign -G && minisign -Sm archivo        # generar par y firmar
minisign -Vm archivo -p minisign.pub       # verificar
```

## ❓ FAQ

**❓ Diferencia entre cifrado simétrico y asimétrico?**
➡ **Simétrico** (`--symmetric`): misma contraseña para cifrar y descifrar. **Asimétrico**: clave pública cifra, privada descifra.

**❓ Cómo guardar copia de seguridad de mis claves?**
➡ Exporta la privada (`--export-secret-keys`) y guárdala offline (USB, gestor). Sin copia, pierdes la clave.

**❓ Perdí mi clave privada, puedo recuperarla?**
➡ No. Por eso guarda el certificado de revocación para invalidarla públicamente.

**❓ ¿Puedo firmar commits sin GPG?**
➡ Sí, con tu clave SSH (`gpg.format ssh`). Ver el manual de [Git](./manual_git.md).

**❓ ¿Vale la pena la YubiKey para GPG?**
➡ Sí si firmas en equipos múltiples o exiges que la clave privada nunca salga del hardware.

## 🔗 Enlaces
- [GNU Privacy Guard](https://gnupg.org/)
- [keys.openpgp.org](https://keys.openpgp.org/)
- [Git: firmar tu trabajo](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work)
- [Keyoxide: verificar identidades](https://keyoxide.org/)

## 🧩 Ver también
- [Git: comandos esenciales](./manual_git.md)
- [SSH: conexión segura](./manual_ssh.md)
- [OpenSSL](./manual_openssl.md)
- [Firma y notarización](./manual_firma_notarizacion.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
