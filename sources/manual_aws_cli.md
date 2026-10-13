# AWS CLI – Gestión de servicios AWS desde terminal

Interfaz de línea de comandos oficial de Amazon Web Services. Permite gestionar recursos (S3, EC2, IAM, Lambda, etc.) desde scripts, CI/CD y automatizaciones.

> 🎯 **Nivel**: intermedio · **Requisitos**: cuenta AWS, nociones de IAM · **Revisado**: noviembre 2026

> 🔐 **Seguridad primero**: prefiere credenciales **temporales** (IAM Identity Center/SSO, roles, OIDC en CI) a claves de acceso de larga duración (`AKIA…`). Las claves fijas filtradas son una causa habitual de incidentes. Los ejemplos con `--force`, `--delete` o `terminate` son destructivos: pruébalos primero con `--dryrun`/`--dry-run` y en una cuenta de pruebas.

## 📋 Tabla de Contenidos

- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Formatos de salida](#-formatos-de-salida)
- [Perfiles y autenticación](#-perfiles-y-autenticación)
- [S3: Almacenamiento de objetos](#-s3-almacenamiento-de-objetos)
- [EC2: Servidores virtuales](#️-ec2-servidores-virtuales)
- [IAM: Identidad y acceso](#-iam-identidad-y-acceso)
- [SSM: Session Manager](#-ssm-session-manager)
- [Lambda: Funciones serverless](#-lambda-funciones-serverless)
- [Tips y troubleshooting](#-tips-y-troubleshooting)
- [Enlaces](#-enlaces)

## 🔧 Instalación

```bash
# Linux/macOS (recomendado)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# macOS (Homebrew)
brew install awscli

# Windows (PowerShell)
winget install Amazon.AWSCLI

# Verificar
aws --version
```

## ⚙️ Configuración

```bash
# Recomendado: SSO / IAM Identity Center (credenciales temporales)
aws configure sso                     # Asistente: URL de inicio, región, cuenta y rol
aws sso login --profile mi-sso

# Alternativa: claves de acceso (solo si no hay otra opción)
aws configure                         # Asistente interactivo
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: (no la compartas ni la subas a Git)
# Default region: us-east-1
# Default output format: json

# O con variables de entorno (útil en CI; mejor con credenciales temporales de OIDC/STS)
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...          # presente si son credenciales temporales
export AWS_DEFAULT_REGION=us-east-1

# Configurar solo campos específicos
aws configure set region us-west-2
aws configure set cli_pager ""
```

## 📄 Formatos de salida

```bash
aws ec2 describe-vpcs                 # Formato por defecto: json (configurable con `output`)
aws s3 ls --output json               # JSON (ideal para scripts con jq; `s3 ls` ignora --output en algunos casos)
aws s3 ls --output text               # Texto plano (columnas)
aws s3 ls --output table              # Tabla formateada

# Filtrado con --query (JMESPath)
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType]' --output table
aws s3api list-buckets --query 'Buckets[?contains(Name, `prod`)].Name'
```

## 👤 Perfiles y autenticación

```bash
# Múltiples perfiles (dev/prod/cuenta diferente)
aws configure --profile dev
aws configure --profile prod

# Usar un perfil específico
aws s3 ls --profile prod

# Alternar perfil temporal con variable
export AWS_PROFILE=prod

# Asumir rol (STS)
aws sts assume-role --role-arn arn:aws:iam::123456:role/DeployRole --role-session-name deploy-session

# SSO (AWS IAM Identity Center)
aws configure sso                    # Configurar sesión SSO
aws sso login --profile my-sso       # Iniciar sesión SSO
aws sso logout                       # Cerrar la sesión

# Asumir un rol de forma persistente: ~/.aws/config
# [profile prod]
# role_arn       = arn:aws:iam::123456789012:role/DeployRole
# source_profile = my-sso
# mfa_serial     = arn:aws:iam::123456789012:mfa/usuario

# Ver identidad actual
aws sts get-caller-identity
```

## 🪣 S3: Almacenamiento de objetos

```bash
# Listar buckets
aws s3 ls

# Operaciones con objetos
aws s3 ls s3://mi-bucket/                     # Listar objetos
aws s3 cp archivo.txt s3://mi-bucket/         # Subir archivo
aws s3 cp s3://mi-bucket/archivo.txt ./       # Descargar archivo
aws s3 sync ./carpeta/ s3://mi-bucket/        # Sincronizar (solo cambios)
aws s3 mv s3://origen/ s3://destino/          # Mover/renombrar
aws s3 rm s3://mi-bucket/archivo.txt          # Eliminar objeto
aws s3 mb s3://mi-nuevo-bucket                # Crear bucket
aws s3 rb s3://mi-bucket --force              # ⚠️ Elimina bucket Y todo su contenido (irreversible)

# Presigned URL (acceso temporal)
aws s3 presign s3://mi-bucket/archivo.pdf --expires-in 3600

# S3 API avanzada
aws s3api list-buckets --query 'Buckets[].Name'
aws s3api get-bucket-versioning --bucket mi-bucket
aws s3api put-bucket-policy --bucket mi-bucket --policy file://policy.json
aws s3api get-bucket-acl --bucket mi-bucket

# Espejo con --delete (⚠️ borra en destino lo que no está en origen; prueba antes con --dryrun)
aws s3 sync ./local/ s3://mi-bucket/ --delete --dryrun
aws s3 sync s3://mi-bucket/ ./local/ --delete --dryrun

# Subir con metadatos y cifrado en reposo
aws s3 cp build/ s3://mi-bucket/ --recursive \
  --cache-control "max-age=3600" --sse AES256 \
  --metadata proyecto=web
```

> No uses ACL públicas (`--acl public-read`, `AllUsers`). Mantén activado *Block Public Access* y comparte con URLs prefirmadas o CloudFront.

## 🖥️ EC2: Servidores virtuales

```bash
# Listar instancias
aws ec2 describe-instances
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value | [0],InstanceType,PublicIpAddress]' --output table

# Crear instancia
# (AMI vigente de Amazon Linux 2023 vía parámetro público de SSM; los ids de AMI cambian por región)
AMI=$(aws ssm get-parameter \
  --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --query 'Parameter.Value' --output text)
aws ec2 run-instances \
  --image-id "$AMI" \
  --instance-type t3.micro \
  --key-name mi-clave \
  --security-group-ids sg-12345 \
  --subnet-id subnet-12345 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=web-server}]'

# Gestionar instancias
aws ec2 start-instances --instance-ids i-12345
aws ec2 stop-instances --instance-ids i-12345
aws ec2 terminate-instances --instance-ids i-12345
aws ec2 reboot-instances --instance-ids i-12345

# Security Groups
aws ec2 describe-security-groups
aws ec2 authorize-security-group-ingress --group-id sg-12345 --protocol tcp --port 443 --cidr 0.0.0.0/0   # 443 público; nunca abras SSH/22 a 0.0.0.0/0 (usa SSM)

# AMIs
aws ec2 describe-images --owners self
aws ec2 create-image --instance-id i-12345 --name "backup-$(date +%Y%m%d)"

# Elastic IP
aws ec2 allocate-address
aws ec2 associate-address --instance-id i-12345 --public-ip x.x.x.x
```

## 🔐 IAM: Identidad y acceso

> Para personas usa IAM Identity Center; para cargas de trabajo, **roles** (EC2/ECS/Lambda) u OIDC en CI. Crea usuarios IAM con claves solo como último recurso, con permisos mínimos y rotación.

```bash
# Usuarios
aws iam list-users
aws iam create-user --user-name deploy-bot
aws iam delete-user --user-name deploy-bot

# Claves de acceso (larga duración: evítalas; rota y elimina las que no uses)
aws iam create-access-key --user-name deploy-bot
aws iam list-access-keys --user-name deploy-bot
aws iam delete-access-key --user-name deploy-bot --access-key-id AKIA...

# Políticas
aws iam list-policies --scope AWS --only-attached
aws iam create-policy --policy-name S3ReadOnly --policy-document file://policy.json
aws iam attach-user-policy --user-name deploy-bot --policy-arn arn:aws:iam::123456:policy/S3ReadOnly
aws iam attach-role-policy --role-name DeployRole --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Roles
aws iam list-roles
aws iam create-role --role-name LambdaExecution --assume-role-policy-document file://trust-policy.json

# Simular permisos
aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456:user/deploy-bot --action-names s3:PutObject
```

## 🔌 SSM: Session Manager

Acceso SSH sin abrir puertos ni gestionar claves:

```bash
# Iniciar sesión en instancia (requiere SSM Agent + IAM Role)
aws ssm start-session --target i-12345

# Ejecutar comando en una instancia
aws ssm send-command \
  --instance-ids i-12345 \
  --document-name "AWS-RunShellScript" \
  --parameters commands="uptime && df -h"

# Listar instancias con SSM disponible
aws ssm describe-instance-information --query 'InstanceInformationList[*]'
```

## ⚡ Lambda: Funciones serverless

```bash
# Listar funciones
aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime,MemorySize]' --output table

# Invocar función
aws lambda invoke --function-name mi-funcion \
  --cli-binary-format raw-in-base64-out \
  --payload '{"key":"value"}' output.json     # en CLI v2 el flag es necesario para JSON en claro

# Desplegar código
aws lambda update-function-code --function-name mi-funcion --zip-file fileb://function.zip

# Ver logs (CloudWatch Logs)
aws logs tail /aws/lambda/mi-funcion --follow --since 10m     # CLI v2
aws logs filter-log-events --log-group-name /aws/lambda/mi-funcion --limit 10
```

## 💡 Tips y troubleshooting

```bash
# Depuración
aws s3 ls --debug                      # Salida detallada de la petición HTTP
aws ec2 describe-instances --no-cli-pager   # No usar paginador (less)

# Dry-run (validar permisos sin ejecutar)
aws ec2 terminate-instances --instance-ids i-12345 --dry-run

# Esperar a que un recurso esté listo
aws ec2 wait instance-running --instance-ids i-12345
aws s3api wait bucket-exists --bucket mi-bucket

# Limpieza de objetos antiguos: usa una regla de ciclo de vida en vez de scripts
aws s3api put-bucket-lifecycle-configuration --bucket mi-bucket \
  --lifecycle-configuration file://lifecycle.json
# lifecycle.json (ejemplo): expira en 30 días los objetos con prefijo logs/
# {"Rules":[{"ID":"logs-30d","Status":"Enabled","Filter":{"Prefix":"logs/"},"Expiration":{"Days":30}}]}

# Autocompletado en bash/zsh
aws_completer=$(which aws_completer)
complete -C "$aws_completer" aws
```

## 🔗 Enlaces
- [AWS CLI Command Reference](https://awscli.amazonaws.com/v2/documentation/api/latest/index.html)
- [JMESPath: query language](https://jmespath.org/)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
- [AWS CLI SSO](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
