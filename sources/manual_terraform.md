# Terraform / OpenTofu – Infraestructura como código

Herramientas de infraestructura como código (IaC) declarativas que definen, provisionan y gestionan recursos cloud desde código. OpenTofu es el fork comunitario (MPL-2.0) nacido del cambio de licencia de Terraform; ambos comparten sintaxis HCL y flujo de trabajo.

> 🎯 **Nivel**: avanzado · **Requisitos**: credenciales de un proveedor cloud (AWS, GCP, Azure…) · **Revisado**: octubre 2026

## 📋 Tabla de Contenidos

- [Terraform vs OpenTofu (oct. 2026)](#️-terraform-vs-opentofu-oct-2026)
- [Instalación](#-instalación)
- [Estructura típica](#-estructura-típica)
- [Ejemplo: AWS EC2](#-ejemplo-aws-ec2)
- [Flujo de trabajo](#-flujo-de-trabajo)
- [Estado (state)](#-estado-state)
- [Workspaces vs directorios](#-workspaces-vs-directorios)
- [Módulos (reutilización)](#-módulos-reutilización)
- [Herramientas de seguridad del ecosistema](#️-herramientas-de-seguridad-del-ecosistema)
- [Pulumi: la alternativa programática](#-pulumi-la-alternativa-programática)
- [FAQ](#-faq)
- [Enlaces](#-enlaces)
- [Ver también](#-ver-también)

## ⚖️ Terraform vs OpenTofu (oct. 2026)

| | Terraform | OpenTofu |
|---|---|---|
| Versión estable | **1.16.5** | **1.13.1** |
| Licencia | **BUSL-1.1**, licenciatario IBM (IBM compró HashiCorp en feb. 2025) | **MPL-2.0** (libre) |
| Gobernanza | HashiCorp/IBM | **CNCF Sandbox** (desde abr. 2025) |
| Diferencial | `action` blocks, `terraform query` | Cifrado nativo de state/plan, `provider for_each` |

```bash
terraform version      # o: tofu version
terraform --help
```

> 🧪 **Alternativa moderna.** Si tu restricción es licencia libre y gobernanza comunitaria, **OpenTofu** es hoy el sustituto directo: misma sintaxis, `tofu` en lugar de `terraform`, y la mayoría de los módulos del registry funcionan con ambos. Terraform conserva herramientas exclusivas (`action` blocks, `terraform query`) y soporte comercial IBM.

## 🔧 Instalación

```bash
# Terraform
brew install terraform          # macOS
sudo apt install terraform      # Linux (repo HashiCorp)

# OpenTofu
brew install opentofu           # macOS
sudo apt install tofuenv && tofuenv install   # gestor de versiones en Linux
```

## 📁 Estructura típica

```text
proyecto/
├── main.tf          # recursos principales + backend
├── variables.tf     # inputs tipados
├── outputs.tf       # outputs útiles (IPs, DNS)
├── terraform.tfvars # valores de variables (no commitear)
└── modules/         # módulos reutilizables
```

## 📝 Ejemplo: AWS EC2

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {                 # estado remoto con bloqueo de locks nativo
    bucket         = "mi-tfstate"
    key            = "infra/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-locks"  # el API server de S3 usa DynamoDB para locks
  }
}

provider "aws" { region = var.region }

resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
  tags = { Name = "servidor-web" }
}
```

```hcl
# variables.tf
variable "region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}
```

```hcl
# outputs.tf
output "public_ip" {
  description = "IP pública del servidor"
  value       = aws_instance.web.public_ip
}
```

## 🚀 Flujo de trabajo

```bash
terraform init                 # descargar providers + inicializar backend
terraform fmt                  # formatear HCL
terraform validate             # validar sintaxis sin tocar cloud
terraform plan -out=plan.tfplan # plan solo-lectura guardado
terraform apply plan.tfplan    # aplicar ese plan exacto
terraform show plan.tfplan     # ver qué cambiaría antes de aplicar

tofu init && tofu plan && tofu apply   # OpenTofu: idéntico
```

> ⚠️ **Aviso de seguridad**: **`terraform destroy` elimina recursos en producción literalmente de golpe**. Con **agentes IA** generando o autoaplicando planes: revisa SIEMPRE el diff con `terraform plan` antes de `apply`/`destroy`, limita permisos de la credencial (scopes mínimos) y usa **state locking** (S3+DynamoDB, backend de GCS…). Un agente con `--auto-approve` + creen en exceso puede tumbar infraestructura entera sin intención.

## 📊 Estado (state)

```bash
terraform state list                      # recursos bajo gestión
terraform state show aws_instance.web     # detalle de un recurso
terraform state rm aws_instance.web       # sacar del estado (no destruye)
terraform import aws_instance.web i-12345 # adoptar un recurso existente
```

- **Siempre backend remoto** (s3, gcs, azurerm, terraform cloud) en equipo; nunca `.tfstate` local.
- **Locking nativo**: S3 usa una tabla DynamoDB; así dos `apply` concurrentes no corrompen el estado.
- **Cifrado**: OpenTofu cifra state y plan **nativamente** (`tofu init -backend-config` / `state_encryption`); en Terraform hay que depender del cifrado del propio bucket.

## 🔄 Workspaces vs directorios

```bash
terraform workspace new dev && terraform workspace select dev   # workspaces
terraform workspace list
```

Para entornos dev/staging/prod con el **mismo código**, los workspaces comparten módulo y difieren en estado aislado. Para configuraciones **diferentes** (otra cuenta, otra región, otro backend) mejor **directorios separados** con su propio `main.tf`.

## 🧩 Módulos (reutilización)

```hcl
# principal.tf: usar un módulo del registry
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  name = "mi-vpc"
  cidr = "10.0.0.0/16"
  azs  = ["us-east-1a", "us-east-1b"]
}
```

```bash
terraform get          # descargar módulos tras añadir/modificar un source
```

## ⚠️ Herramientas de seguridad del ecosistema

| Herramienta | Estado (oct. 2026) | Alternativa |
|---|---|---|
| **tfsec** | absorbida por Trivy (no actualiza) | [Trivy](https://trivy.dev/) `trivy config .` |
| **Terrascan** | archivada (nov. 2025) | Trivy / Checkov |
| **Checkov** | activa (3.3.21) | |
| **CDK for Terraform (CDKTF)** | archivada (dic. 2025) | escribir HCL, o control en TypeScript con Pulumi |
| **Atlantis** | activa (0.48) | CI pull-requests con `plan`/`apply` en comentario |

> ⚠️ **Obsoleto / en desuso (oct. 2026)**: **tfsec** dejó de evolucionar al integrarse en Trivy; **Terrascan** está archivada sin mantenimiento; **CDKTF** (generar Terraform desde TypeScript/Python) fue archivado en dic. 2025. Para SCAN sintáctico de seguridad usa `trivy config` o `checkov`.

## 🧪 Pulumi: la alternativa programática

| | Terraform / OpenTofu | Pulumi |
|---|---|---|
| Lenguaje | HCL declarativo | TS/Go/Python/C# (lógica imperativa/compleja) |
| Estado | `terraform state` (HCL) | estado en backend Pulumi Cloud / self-hosted |
| Puerta de entrada | estándar, enorme registry | potente para lógica condicional y reutilización de código |
| Versión | 1.16.x / 1.13.x | **3.267.0** |

**¿Qué engine elijo?** → Infra en HCL declarativa pura: **OpenTofu**. Necesitas soporte comercial IBM o `action`/`terraform query`: **Terraform**. Quieres lógica de programación y bucles en el lenguaje: **Pulumi**.

## ❓ FAQ

**❓ ¿`plan` y `apply`?**
➡ `plan` solo lee y muestra; `apply` ejecuta. Aplica siempre un `plan` guardado para reproducibilidad.

**❓ ¿OpenTofu es compatible con mis módulos de Terraform?**
➡ Sí, sintaxis idéntica; el registry de providers funciona igual. Solo difieren ciertas features propias de cada uno.

**❓ ¿Cómo protejo el estado?**
➡ Backend remoto + locking + cifrado (OpenTofu lo hace nativo) y nunca commits del `.tfstate`.

**❓ ¿Motor HCL o Pulumi?**
➡ HCL es el estándar y más simple; Pulumi gana cuando necesitas lógica compleja en el lenguaje.

## 🔗 Enlaces

- [Terraform docs](https://developer.hashicorp.com/terraform/docs)
- [OpenTofu docs](https://opentofu.org/docs/)
- [OpenTofu: cifrado de estado](https://opentofu.org/docs/language/state/encryption/)
- [Terraform Registry (módulos)](https://registry.terraform.io/)
- [Trivy (sustituye a tfsec/Terrascan)](https://trivy.dev/)
- [Pulumi](https://www.pulumi.com/)

## 🧩 Ver también

- [manual_kubectl.md](./manual_kubectl.md): deploy sobre la infra que provisionas
- [manual_helm.md](./manual_helm.md): empaquetar aplicaciones en el clúster
- [manual_github_actions.md](./manual_github_actions.md): CI para `plan`/`apply` (Atlantis)
- [manual_observabilidad.md](./manual_observabilidad.md): monitorizar lo provisionado

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
