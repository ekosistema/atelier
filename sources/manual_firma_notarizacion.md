# 📦 Firma y Notarización en macOS – Developer ID, hardened runtime y notarytool

Guía del flujo completo para distribuir software macOS fuera de la App Store: identidad Developer ID, firma con hardened runtime, empaquetado (.app/.dmg/.pkg), notarización y verificación con Gatekeeper.

> 🎯 **Nivel**: intermedio · **Requisitos**: macOS con Xcode Command Line Tools, cuenta Apple Developer de pago · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos
- [Qué ha cambiado (leer primero)](#-qué-ha-cambiado-leer-primero)
- [Credenciales de notarización](#-credenciales-de-notarización)
- [Firmar con Developer ID y hardened runtime](#️-firmar-con-developer-id-y-hardened-runtime)
- [Binarios Universal 2 (arm64 + x86_64)](#-binarios-universal-2-arm64--x86_64)
- [Empaquetar (.zip, .dmg, .pkg)](#-empaquetar-zip-dmg-pkg)
- [Notarizar](#-notarizar)
- [Stapling](#-stapling)
- [Verificación](#-verificación)
- [Automatización en CI (GitHub Actions)](#-automatización-en-ci-github-actions)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## 🚨 Qué ha cambiado (leer primero)

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `altool` está **deprecado y el servicio de notarización de Apple dejó de aceptarlo el 1 de noviembre de 2023**. Sustituido por `notarytool`, incluido en Xcode 13+. Alternativa recomendada: usar `xcrun notarytool` en todo el flujo.

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: `codesign --deep` como estrategia de firma: firma en profundidad sin control y en orden impredecible. Firma los binarios anidados uno a uno, y luego el bundle exterior.

> ⚠️ **Fin del soporte Intel.** Rosetta 2 mantiene soporte completo hasta macOS 27 (Golden Gate, septiembre 2026). macOS 28 (otoño 2027) **no ejecutará apps solo-Intel** (salvo juegos antiguos emulados). macOS 26 (Tahoe) fue la última versión compatible con Macs Intel. Consecuencia práctica: **compila siempre arm64 o Universal 2**.

## 🔑 Credenciales de notarización

`notarytool` acepta dos formas de autenticación: **API Key (.p8)** (recomendada para CI) o **Apple ID + app-specific password**.

### Opción A: API Key (.p8)

1. [App Store Connect → Users and Access → Integrations → Team Keys](https://appstoreconnect.apple.com/access/integrations/api).
2. Crea la clave, descarga el `.p8` (solo se puede descargar una vez) y anota **Key ID** e **Issuer ID**.

```bash
# Guarda el perfil en el llavero (no repite credenciales en cada comando)
xcrun notarytool store-credentials "mi-notary" \
  --key /ruta/AuthKey_ABC123DEF.p8 \
  --key-id ABC123DEF \
  --issuer 01234567-89AB-CDEF-0123-456789ABCDEF
```

### Opción B: Apple ID + app-specific password

```bash
# Crea la contraseña en https://account.apple.com → Iniciar sesión y seguridad
xcrun notarytool store-credentials "mi-notary-asp" \
  --apple-id "tu@correo.com" \
  --password "abcd-efgh-ijkl-mnop" \
  --team-id RXXXXXXXXX
```

El Team ID aparece en [Developer Account → Membership](https://developer.apple.com/account/#/membership).

## ✍️ Firmar con Developer ID y hardened runtime

```bash
# Identidades disponibles (busca "Developer ID Application: ...")
security find-identity -v -p codesigning

# Firma de un binario/ejecutable con hardened runtime y timestamp seguro
codesign --force --options runtime --timestamp \
  --sign "Developer ID Application: Tu Nombre (TEAMID)" \
  MiApp.app/Contents/MacOS/MiApp

# Firma del bundle completo (los anidados primero, este al final)
codesign --force --options runtime --timestamp \
  --sign "Developer ID Application: Tu Nombre (TEAMID)" \
  MiApp.app
```

- `--options runtime` activa el **hardened runtime**, obligatorio para notarizar.
- `--timestamp` incrusta un sello de tiempo seguro (la firma sigue válida cuando el certificado caduca).
- `--entitlements` solo si tu app necesita capacidades extra (JIT, cámara, micrófono, Apple Events).

```bash
# Firma con entitlements (p. ej. una app Electron con JIT)
codesign --force --options runtime --timestamp \
  --entitlements MiApp.entitlements \
  --sign "Developer ID Application: Tu Nombre (TEAMID)" \
  MiApp.app
```

Ejemplo mínimo de `MiApp.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
</dict>
</plist>
```

## 🧬 Binarios Universal 2 (arm64 + x86_64)

```bash
# Swift/Clang: compila y enlaza ambos slices en un único binario
swift build -c release --arch arm64 --arch x86_64

clang -arch arm64 -arch x86_64 -o miapp main.c

# Comprueba las arquitecturas de un binario ya construido
lipo -info MiApp.app/Contents/MacOS/MiApp
file MiApp.app/Contents/MacOS/MiApp
```

Si tu toolchain no soporta builds universales, distribuye al menos **arm64** nativo: es lo único garantizado en macOS 28.

## 📦 Empaquetar (.zip, .dmg, .pkg)

```bash
# .zip para notarizar una .app (conserva permisos y estructura)
ditto -c -k --keepParent MiApp.app MiApp.zip

# .dmg comprimido (UDZO = zlib, el formato habitual de distribución)
hdiutil create -volname "MiApp" -srcfolder MiApp.app -ov -format UDZO MiApp.dmg

# .pkg para instalar en /Applications
pkgbuild --root ./payload \
         --identifier com.celerolab.miapp \
         --version 1.0.0 \
         --install-location /Applications \
         MiApp.pkg

# Firmar el paquete con el certificado de instalador (distinto del de aplicación)
productsign --sign "Developer ID Installer: Tu Nombre (TEAMID)" MiApp.pkg MiApp-firmado.pkg

# Entitlements/scripts → producto con distribución personalizada
productbuild --distribution distribution.xml --package-path ./build MiApp.pkg
```

## 🚀 Notarizar

```bash
# .zip y .dmg se notarizan como Developer ID Application
xcrun notarytool submit MiApp.zip --keychain-profile "mi-notary" --wait
xcrun notarytool submit MiApp.dmg --keychain-profile "mi-notary" --wait

# .pkg se notariza como Developer ID Installer (usa el pkg ya firmado)
xcrun notarytool submit MiApp-firmado.pkg --keychain-profile "mi-notary" --wait

# Historial de envíos
xcrun notarytool history --keychain-profile "mi-notary"

# Detalle de un envío
xcrun notarytool info <UUID> --keychain-profile "mi-notary"

# Log JSON (obligatorio para depurar rechazos)
xcrun notarytool log <UUID> --keychain-profile "mi-notary"
```

`--wait` bloquea hasta que Apple responde. Sin él, el comando devuelve un UUID y hay que consultar con `info`.

## 📎 Stapling

Fijar el ticket en el artefacto permite a Gatekeeper validarlo **sin conexión**.

```bash
xcrun stapler staple MiApp.dmg      # .app, .dmg o .pkg
xcrun stapler validate MiApp.dmg    # comprueba que el ticket está fijado
```

Si modificas la app después de notarizar, el ticket queda inválido: vuelve a firmar y notarizar.

## ✅ Verificación

```bash
# Firma de un .app/.dmg
codesign --verify --strict --verbose=2 MiApp.app
codesign -dv --verbose=4 MiApp.app        # detalle: identidad, flags, timestamp

# Gatekeeper sobre una .app ejecutable
spctl -a -vvv -t execute MiApp.app        # debe imprimir "accepted"

# Gatekeeper sobre un instalador .pkg
spctl -a -vvv -t install MiApp.pkg
pkgutil --check-signature MiApp.pkg       # estado de firma del paquete

# Simula lo que ve el usuario: marca la app en cuarentena
xattr -w com.apple.quarantine "0081;00000000;Safari;" MiApp.app
```

## 🤖 Automatización en CI (GitHub Actions)

```bash
# 1) Crea un llavero temporal
security create-keychain -p "$KEYCHAIN_PASS" build.keychain
security default-keychain -s build.keychain
security unlock-keychain -p "$KEYCHAIN_PASS" build.keychain

# 2) Importa el .p12 del certificado Developer ID
security import cert.p12 -k build.keychain -P "$P12_PASS" -T /usr/bin/codesign
security set-key-partition-list -S apple-tool:,apple: -k "$KEYCHAIN_PASS" build.keychain

# 3) Guarda credenciales de notarización y firma/notariza como en local
xcrun notarytool store-credentials "ci-notary" \
  --key AuthKey.p8 --key-id "$KEY_ID" --issuer "$ISSUER_ID"
```

Guarda todos los secretos (`$KEYCHAIN_PASS`, `$P12_PASS`, contenido del `.p8`) en los secrets del repositorio, nunca en el código.

## ❓ FAQ

**❓ ¿Por qué me rechaza `altool`?**
➡ Está deprecado y el servicio dejó de soportarlo el 1-nov-2023. Migra a `notarytool` (ver TN3147 de Apple).

**❓ "The binary is not signed with a Developer ID certificate"**
➡ Usas un certificado de App Store o de desarrollo. Necesitas **Developer ID Application** (para .app/.dmg) o **Developer ID Installer** (para .pkg).

**❓ La app se firma pero Gatekeeper la bloquea**
➡ Falta el staple, falta `--options runtime`, o algún framework/binario anidado no está firmado. Firma los anidados primero y notariza de nuevo.

**❓ ¿`--deep` no basta para firmar todo?**
➡ No. Aunque `codesign --deep` firma recursivamente, el orden y las opciones no son fiables. Firma explícitamente cada binario con `--options runtime --timestamp`.

**❓ ¿Qué binarios hay que firmar dentro de una app?**
➡ Todo ejecutable y biblioteca propia: `.dylib`, `.so`, helpers, `.framework`. Los de sistema no (Apple ya los firma).

**❓ ¿Puedo notarizar sin conexión?**
➡ No: la notarización es un servicio en línea. El *staple* es lo que permite validar después sin conexión.

**❓ ¿Cómo paso el certificado a un pipeline?**
➡ Exporta el certificado como `.p12` protegido, impórtalo en un llavero temporal del runner y guarda la contraseña como secreto.

## 🔗 Enlaces

- [Notarizing macOS software before distribution: Apple](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
- [Customizing the notarization workflow: Apple](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow)
- [TN3147: Migrating to the latest notarization tool (Apple)](https://developer.apple.com/documentation/technotes/tn3147-migrating-to-the-latest-notarization-tool)
- [Configuring the hardened runtime: Apple](https://developer.apple.com/documentation/xcode/configuring-the-hardened-runtime)
- [Resolving common notarization issues: Apple](https://developer.apple.com/documentation/security/resolving-common-notarization-issues)
- [TN2206: macOS Code Signing In Depth (Apple)](https://developer.apple.com/library/archive/technotes/tn2206/_index.html)
- [App Store Connect: Team API Keys](https://appstoreconnect.apple.com/access/integrations/api)

## 🧩 Ver también

- [Manual de Brew](./manual_brew.md)
- [Manual de GPG](./manual_gpg.md)
- [Manual de GitHub Actions](./manual_github_actions.md)
- [Gestión de Homebrew en dos arquitecturas](./gestionar_brew_x86_64_arm64.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
