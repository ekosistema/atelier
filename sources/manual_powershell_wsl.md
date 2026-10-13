# PowerShell y WSL2 – Terminal moderno en Windows

Guía para trabajar con la línea de comandos en Windows: PowerShell 7 como shell nativo, `winget` para instalar herramientas y WSL2 para ejecutar un Linux completo integrado con Windows. Sirve de puente con el resto de la colección, que asume bash.

> 🎯 **Nivel**: básico-intermedio · **Requisitos**: Windows 10/11 con permisos de administrador para instalar WSL · **Revisado**: noviembre 2026

> 📌 **Dos PowerShell distintos**: `powershell.exe` es **Windows PowerShell 5.1** (viene con Windows, solo se mantiene por compatibilidad) y `pwsh.exe` es **PowerShell 7+** (multiplataforma, el que debes usar). La versión estable cambia con frecuencia: consulta el [ciclo de vida oficial](https://learn.microsoft.com/powershell/scripting/install/powershell-support-lifecycle) en lugar de fiarte de un número fijo.

## 🔧 Instalación

```powershell
# PowerShell 7 (documentado por Microsoft)
winget install --id Microsoft.PowerShell --source winget
pwsh --version

# Terminal recomendado: Windows Terminal (perfiles para pwsh y WSL)
winget install --id Microsoft.WindowsTerminal

# WSL2 con la distribución por defecto (Ubuntu); reinicia al terminar
wsl --install
wsl --install -d Ubuntu          # elegir distribución explícitamente
wsl --list --online              # distribuciones disponibles
```

## 📦 winget: gestor de paquetes de Windows

```powershell
winget search git
winget install --id Git.Git
winget list                      # lo instalado
winget upgrade                   # ver actualizaciones pendientes
winget upgrade --all             # actualizar todo
winget uninstall --id Git.Git
```

> Equivale a `brew`/`apt` en Windows. Comprueba siempre el `--id` exacto con `winget search` antes de instalar.

## 🧠 Cómo piensa PowerShell: objetos, no texto

En bash las tuberías pasan texto; en PowerShell pasan **objetos** con propiedades. Por eso casi nunca necesitas `awk`/`cut`/`sed`:

```powershell
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU, Id
Get-ChildItem -Recurse -Filter *.log | Where-Object Length -gt 1MB | Select-Object FullName, Length
Get-Service | Where-Object Status -eq 'Running' | Measure-Object

# Descubrir qué propiedades tiene un objeto
Get-Process | Get-Member
Get-Help Get-ChildItem -Examples     # ayuda con ejemplos
Get-Command *json*                   # buscar cmdlets
```

Los cmdlets siguen el patrón `Verbo-Sustantivo` (`Get-`, `Set-`, `New-`, `Remove-`, `Test-`).

## 🔁 Equivalencias con bash

| bash | PowerShell | Notas |
|---|---|---|
| `ls -la` | `Get-ChildItem -Force` (alias `ls`, `gci`) | |
| `cat f` | `Get-Content f` (alias `cat`, `gc`) | |
| `grep -r txt .` | `Select-String -Path *.* -Pattern txt -Recurse` o `Get-ChildItem -Recurse \| Select-String txt` | `rg` también funciona si lo instalas |
| `find . -name '*.md'` | `Get-ChildItem -Recurse -Filter *.md` | |
| `echo $VAR` | `$env:VAR` | Variables de entorno con `$env:` |
| `export VAR=x` | `$env:VAR = 'x'` | Solo para la sesión actual |
| `which git` | `Get-Command git` | |
| `rm -rf dir` | `Remove-Item dir -Recurse -Force` | Añade `-WhatIf` para simular |
| `curl url` | `Invoke-WebRequest url` / `Invoke-RestMethod url` | En Windows PowerShell 5.1 `curl` es un alias de `Invoke-WebRequest`: usa `curl.exe` para el programa real |
| `cmd1 && cmd2` | `cmd1 && cmd2` | Operadores disponibles en PowerShell 7+ |
| `export -p` | `Get-ChildItem Env:` | |

## 📜 Scripting

```powershell
# deploy.ps1
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)] [string] $Environment,
    [int] $Retries = 3
)
$ErrorActionPreference = 'Stop'      # equivale a `set -e`

try {
    if ($PSCmdlet.ShouldProcess($Environment, 'Desplegar')) {
        Write-Host "Desplegando en $Environment"
    }
}
catch {
    Write-Error "Fallo: $($_.Exception.Message)"
    exit 1
}
```

```powershell
# JSON y APIs
$r = Invoke-RestMethod https://api.github.com/repos/PowerShell/PowerShell
$r.stargazers_count
Get-Content config.json | ConvertFrom-Json
@{ nombre = 'app'; puerto = 8080 } | ConvertTo-Json
```

- **Política de ejecución**: los scripts `.ps1` pueden estar bloqueados. `Get-ExecutionPolicy` la muestra; `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` es una opción habitual para uso personal. No la bajes a `Unrestricted` por costumbre.
- **Perfil**: `$PROFILE` es la ruta de tu script de arranque (alias, funciones, prompt). Créalo con `New-Item -Path $PROFILE -Force`.
- **Comillas**: `'texto'` es literal; `"texto $var"` interpola variables. El carácter de escape es la comilla invertida (`` ` ``), no la barra invertida.

## 🐧 WSL2: Linux dentro de Windows

```powershell
wsl -l -v                         # distros instaladas y versión de WSL
wsl                               # abrir la distro por defecto
wsl -d Ubuntu -- ls -la           # ejecutar un comando y volver a PowerShell
wsl --set-default Ubuntu
wsl --update                      # actualizar el kernel de WSL
wsl --shutdown                    # apagar la VM (necesario tras cambiar la configuración)
wsl --terminate Ubuntu            # parar una sola distro

# Copias de seguridad / clonado de una distro (consulta `wsl --help` y https://learn.microsoft.com/windows/wsl/basic-commands)
wsl --export Ubuntu C:\backup\ubuntu.tar
wsl --import Ubuntu-dev C:\wsl\ubuntu-dev C:\backup\ubuntu.tar
wsl --unregister Ubuntu-dev       # ⚠️ borra la distro y sus datos
```

### Archivos entre Windows y Linux

```bash
# Desde Linux: las unidades de Windows están en /mnt
cd /mnt/c/Users/$USER/Desktop
explorer.exe .                    # abrir la carpeta actual en el Explorador
```

```powershell
# Desde Windows: el sistema de archivos de Linux
explorer.exe \\wsl.localhost\Ubuntu\home
```

> **Rendimiento**: trabaja con tus proyectos **dentro del sistema de archivos de Linux** (`~/proyectos`), no en `/mnt/c`: el acceso cruzado es bastante más lento (git, `npm install`, compilaciones).

## ⚙️ Configuración

Dos ficheros distintos:

```ini
# %UserProfile%\.wslconfig  → global, afecta a la VM de WSL2 (créalo si no existe)
[wsl2]
memory=8GB
processors=4
swap=2GB
networkingMode=mirrored          # requiere Windows 11 22H2 o posterior
```

```ini
# /etc/wsl.conf  → dentro de cada distro
[boot]
systemd=true                     # habilita systemd (servicios, docker, etc.)
```

- Los cambios se aplican tras `wsl --shutdown` y reabrir la distro.
- Con `networkingMode=mirrored`, `localhost` y la red del host se comparten (IPv6 y acceso desde la LAN); en ese modo `localhostForwarding` se ignora.
- Referencia completa: [Configuración avanzada de WSL](https://learn.microsoft.com/windows/wsl/wsl-config).

## 🧩 Flujo de trabajo recomendado

- **PowerShell 7** para tareas de Windows (winget, servicios, registro, administración).
- **WSL2** para todo lo que asume Linux: los manuales de bash, Git, Docker, Python, Node, Ansible (su nodo de control no funciona en Windows nativo), etc.
- **Docker**: Docker Desktop puede integrarse con WSL2, o puedes instalar el motor dentro de tu distro (con `systemd=true`).
- **VS Code**: la extensión *WSL* abre carpetas de Linux directamente (`code .` desde la distro).
- **Git**: instala Git dentro de WSL para repos de Linux; para repos en Windows usa Git for Windows. No mezcles el mismo repo en ambos lados sin cuidado con los finales de línea ([Git](./manual_git.md)).

## ❓ FAQ

**❓ `wsl --install` no hace nada o falla.**
➡ Ejecuta PowerShell como administrador, comprueba que la virtualización está activada en la BIOS/UEFI y reinicia. Con `wsl --status` ves la configuración actual.

**❓ ¿Cómo sé si una distro usa WSL 1 o 2?**
➡ `wsl -l -v` muestra la columna `VERSION`. Para convertir: `wsl --set-version Ubuntu 2`.

**❓ ¿PowerShell 7 reemplaza a Windows PowerShell 5.1?**
➡ No: conviven. Algunos módulos antiguos solo funcionan en 5.1; PowerShell 7 puede cargarlos con compatibilidad en muchos casos (`Import-Module -UseWindowsPowerShell`).

**❓ Mi script `.ps1` dice «la ejecución de scripts está deshabilitada».**
➡ Es la política de ejecución. Ver la sección de scripting; evita ejecutar scripts de origen desconocido.

## 🔗 Enlaces
- [Instalar PowerShell en Windows](https://learn.microsoft.com/powershell/scripting/install/install-powershell-on-windows)
- [Ciclo de vida de PowerShell](https://learn.microsoft.com/powershell/scripting/install/powershell-support-lifecycle)
- [Configuración avanzada de WSL](https://learn.microsoft.com/windows/wsl/wsl-config)
- [Documentación de WSL](https://learn.microsoft.com/windows/wsl/)

## 🧩 Ver también
- [Shell Productivity](./manual_shell_productivity.md) · [Bash Scripting](./manual_bash_scripting.md) · [Git](./manual_git.md) · [Docker y Compose](./manual_docker_compose.md) · [Ansible](./manual_ansible.md)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
