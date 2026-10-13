# SSH – Conexión segura y administración remota

Protocolo de conexión remota cifrada para administrar servidores, transferir archivos (scp, rsync) y crear túneles. Estándar en administración de sistemas Linux/Unix.

> 🎯 **Nivel**: intermedio · **Requisitos**: OpenSSH instalado · **Revisado**: octubre 2026

## 🔑 Generar claves SSH

```bash
ssh-keygen -t ed25519 -C "tu@email.com"                    # Recomendada (Ed25519)
ssh-keygen -t ecdsa -b 256 -C "tu@email.com"                # Alternativa (ECDSA P-256)
ssh-keygen -t ed25519-sk -C "tu@email.com"                  # FIDO2: respaldada por clave de seguridad (OpenSSH ≥ 8.2)
ssh-keygen -t rsa -b 4096 -C "tu@email.com"                 # Último recurso (RSA como interop legado)
```

Por defecto se guardan en `~/.ssh/id_ed25519` (privada) y `~/.ssh/id_ed25519.pub` (pública).

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: DSA (deshabilitada por defecto desde OpenSSH 7.0) y RSA corta (1024/2048 bits, y RSA con firma SHA-1 deshabilitada en OpenSSH ≥ 8.8). Alternativa recomendada: **Ed25519** o **sk-ssh-ed25519**.

## 📤 Copiar clave pública a un servidor

```bash
ssh-copy-id usuario@servidor        # copia la clave pública automáticamente
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host   # clave específica
```

## 🔌 Conexión básica

```bash
ssh usuario@servidor
ssh -p 2222 usuario@servidor        # puerto personalizado
ssh -i ~/.ssh/id_ed25519 user@host  # clave específica
```

## ⚙️ Configuración avanzada (~/.ssh/config)

```ssh-config
# Host bastión que da acceso a la red interna
Host bastion
    HostName 34.123.45.6
    User admin
    IdentityFile ~/.ssh/id_ed25519

# ProxyJump: saltar a través del bastión
Host server-prod
    User deploy
    HostName 10.0.1.5
    ProxyJump bastion

# Include: dividir la configuración en varios ficheros
Include ~/.ssh/config.d/*

# Match: aplicar reglas según host o usuario
Match host github.com,gitlab.com
    User git
```

Uso: `ssh server-prod` conecta al objetivo a través del bastión sin más opciones.

## 🔄 Forwarding y túneles

### Agent forwarding (¡con cautela!)

```bash
ssh -A usuario@servidor
# Los git push desde el servidor usan tus claves locales
```

> ⚠️ **Riesgo**: `-A` expone tu agente al host remoto. Si este está comprometido, puede usar tus claves en tu nombre. Úsalo solo en hosts de confianza; en GitHub/GitLab usa `ProxyJump` o `ProxyCommand` en su lugar.

### Local, remote y dynamic forwarding

```bash
ssh -L 8080:localhost:80 usuario@servidor    # túnel local: localhost:8080 → puerto 80 del remoto
ssh -R 8080:localhost:3000 usuario@servidor  # túnel remoto: remoto:8080 → tu localhost:3000
ssh -D 1080 usuario@servidor                 # SOCKS5 local para navegar a través del servidor
```

## 📂 Transferencia de archivos

```bash
scp archivo.txt usuario@servidor:/ruta/          # subir
scp -r carpeta/ usuario@servidor:/ruta/          # directorio completo

rsync -avz ./carpeta/ usuario@servidor:/ruta/    # sincronizar (reanuda si falla)
rsync -avz --delete usuario@servidor:/ruta/ ./   # reflejar (borra locales no presentes en remoto)
```

## 🛡️ Hardening del servidor (sshd_config)

```ssh-config
Port 2222                 # alejar del puerto por defecto
PermitRootLogin no        # prohibir login de root
PasswordAuthentication no # solo claves
PubkeyAuthentication yes
PubkeyAcceptedAlgorithms ssh-ed25519   # solo curvas firmes
MaxAuthTries 3
```

Recarga la configuración tras cada cambio: `sudo systemctl reload sshd`.

## 🏷️ Certificados SSH

Reemplazan la copia manual de claves por certificados firmados por una CA. Ideal para flotas de servidores.

```bash
# La CA firma la clave pública del usuario, limitando su validez
ssh-keygen -s ca_key -I "alice" -n alice -V +52w id_ed25519.pub
# Resultado: id_ed25519-cert.pub, entregable al usuario (usuario@host)

# El cliente confía en la clave pública de la CA
printf '@cert-authority * ssh-ed25519 AAAA...CA\n' >> ~/.ssh/known_hosts
```

## 🧪 Malla y alternativas modernas

| En su lugar | Ventaja | Manual |
|---|---|---|
| [Tailscale](https://tailscale.com/) | VPN de malla sobre WireGuard sin abrir puertos | manual_ssh.md |
| [WireGuard](https://www.wireguard.com/) | VPN rápida y sencilla para unir redes | manual_ssh.md |
| [mosh](https://mosh.org/) | Terminal móvil: resiste caídas y roaming | manual_ssh.md |

```bash
# mosh: sesión que sobrevive a cambios de red (usa UDP tras el handshake SSH)
mosh usuario@servidor

# Tailscale SSH: autenticación de malla con la identidad de Tailscale
tailscale up --ssh
```

## ❓ FAQ

**❓ Error "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED"?**
➡ El remoto cambió su clave; verifica que no sea ataque y olvida la antigua:

```bash
ssh-keygen -R "hostname"
```

**❓ Cómo mantener sesiones activas al desconectarme?**
➡ Usa `tmux` o `screen` dentro del servidor; al reconectar: `tmux attach`.

**❓ Cómo usar una clave distinta por servicio (GitHub, GitLab)?**
➡ Crea una clave por servicio y configura `~/.ssh/config` con `Host ... IdentityFile ...`.

**❓ Me conviene `-A` (agent forwarding)?**
➡ Solo en hosts totalmente confiables. Para saltos usa `ProxyJump`; no expongas tu agente.

## 🔗 Enlaces
- [OpenSSH manual](https://www.openssh.com/manual.html)
- [GitHub: conectar con SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Yubico: FIDO2 para SSH](https://developers.yubico.com/SSH/Securing_SSH_with_FIDO2.html)
- [Mosh: mobile shell](https://mosh.org/)

## 🧩 Ver también
- [GPG: cifrado y firmas](./manual_gpg.md)
- [OpenSSL](./manual_openssl.md)
- [Git: comandos esenciales](./manual_git.md)
- [Tmux: multiplexor de terminal](./manual_tmux.md)

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
