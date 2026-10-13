# Ansible – Automatización de configuración y despliegue

Herramienta de automatización IT sin agente: gestiona servidores vía SSH usando playbooks declarativos en YAML. Ideal para configurar sistemas, desplegar aplicaciones y orquestar infraestructura.

> 🎯 **Nivel**: intermedio · **Requisitos**: SSH, YAML, nociones de Linux · **Revisado**: noviembre 2026

> 📌 **Estado (nov. 2026)**: el nodo de control de Ansible **no funciona en Windows nativo**: usa Linux, macOS o **WSL2**. Los nodos gestionados Windows se controlan con WinRM/SSH y la colección `ansible.windows`. Este manual usa **FQCN** (nombres completos de módulo, p. ej. `ansible.builtin.apt`), la forma recomendada desde ansible-core 2.10. Comprueba la versión de `ansible-core` soportada en [la matriz oficial](https://docs.ansible.com/ansible/latest/reference_appendices/release_and_maintenance.html).

## 📋 Tabla de Contenidos

- [Instalación](#-instalación)
- [Inventarios](#-inventarios)
- [Comandos ad-hoc](#-comandos-ad-hoc)
- [Playbooks](#-playbooks)
- [Handlers](#-handlers)
- [Variables](#-variables)
- [Templates (Jinja2)](#-templates-jinja2)
- [Roles](#️-roles)
- [Colecciones](#-colecciones)
- [Módulos comunes](#-módulos-comunes)
- [ℹ️ Facts](#ℹ️-facts)
- [Tags](#️-tags)
- [Secretos (Vault)](#-secretos-vault)
- [Buenas prácticas](#-buenas-prácticas)
- [Enlaces](#-enlaces)

## 🔧 Instalación

```bash
# Recomendado: aislado con pipx (evita PEP 668 y dependencias del sistema)
pipx install --include-deps ansible          # paquete completo (ansible-core + colecciones)
# o solo el motor: pipx install ansible-core   # luego instala solo las colecciones que uses

# Gestor de paquetes (versión más antigua según la distro)
sudo apt install ansible               # Debian/Ubuntu
brew install ansible                   # macOS

# Verificar
ansible --version
```

> `ansible-core` = motor + módulos `ansible.builtin`. El paquete `ansible` añade un conjunto de colecciones. Para reproducibilidad fija versiones en un `requirements.txt`.

## 📋 Inventarios

Define los servidores a gestionar (por defecto `/etc/ansible/hosts` o archivo `-i`):

```ini
# inventory.ini: formato INI
[webservers]
web1.example.com
web2.example.com ansible_user=ubuntu

[dbservers]
db1.example.com ansible_user=admin ansible_port=2222

[linux:children]
webservers
dbservers
```

```yaml
# inventory.yml: formato YAML
all:
  hosts:
    web1.example.com:
    web2.example.com:
  children:
    webservers:
      hosts:
        web1.example.com:
        web2.example.com:
```

```bash
ansible-inventory -i inventory.ini --list    # Ver inventario completo
ansible all --list-hosts -i inventory.ini    # Listar hosts del grupo
```

Para infraestructura en la nube existen plugins de **inventario dinámico** (`amazon.aws.aws_ec2`, `community.general.proxmox`, etc.).

## ⚡ Comandos ad-hoc

Ejecutar tareas sin playbook: ideal para diagnósticos rápidos:

```bash
# Ping (conexión SSH + Python)
ansible all -i inventory.ini -m ansible.builtin.ping

# Ejecutar comando
ansible webservers -m ansible.builtin.command -a "uptime"

# Instalar paquete
ansible all -m ansible.builtin.apt -a "name=nginx state=latest" --become

# Copiar archivo
ansible all -m ansible.builtin.copy -a "src=./config.conf dest=/etc/app/config.conf"

# Ver facts del sistema
ansible localhost -m ansible.builtin.setup

# Gestión de servicios
ansible dbservers -m ansible.builtin.service -a "name=postgresql state=started" --become
```

## 📝 Playbooks

Flujo declarativo en YAML: el corazón de Ansible:

```yaml
# playbook.yml
---
- name: Configurar servidor web
  hosts: webservers
  become: true
  vars:
    app_port: 3000
    domain: example.com

  tasks:
    - name: Actualizar apt cache
      ansible.builtin.apt:
        update_cache: true
        cache_valid_time: 3600

    - name: Instalar Nginx
      ansible.builtin.apt:
        name: nginx
        state: present

    - name: Copiar configuración
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: "/etc/nginx/sites-available/{{ domain }}"
        mode: "0644"
      notify: Recargar nginx

    - name: Habilitar sitio
      ansible.builtin.file:
        src: "/etc/nginx/sites-available/{{ domain }}"
        dest: "/etc/nginx/sites-enabled/{{ domain }}"
        state: link

    - name: Iniciar Nginx
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Recargar nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded
```

```bash
ansible-playbook playbook.yml                       # Ejecutar
ansible-playbook playbook.yml --check --diff        # Dry-run mostrando cambios
ansible-playbook playbook.yml --syntax-check         # Validar sintaxis
ansible-playbook playbook.yml -v                     # Modo verbose
ansible-playbook playbook.yml -l web1.example.com    # Limitar a un host
```

> En YAML usa `true`/`false` (no `yes`/`no`) y entrecomilla los valores que empiezan por `{{ }}` o los modos de fichero (`"0644"`).

## 🔁 Handlers

Tareas que solo se ejecutan si son notificadas (evitar reinicios innecesarios):

```yaml
tasks:
  - name: Actualizar configuración Nginx
    ansible.builtin.template:
      src: nginx.conf.j2
      dest: /etc/nginx/nginx.conf
    notify: Reiniciar nginx

handlers:
  - name: Reiniciar nginx
    ansible.builtin.service:
      name: nginx
      state: restarted
```

Los handlers se ejecutan al final del bloque de tareas, una sola vez, incluso si múltiples tareas los notifican. Si necesitas ejecutarlos antes: `- ansible.builtin.meta: flush_handlers`.

## 📦 Variables

```yaml
# En el playbook
vars:
  app_name: mi-app
  app_version: "2.1.0"
  puertos:
    http: 80
    https: 443
```

```ini
# En el inventario
[webservers]
web1 app_env=production
```

```yaml
# En archivo host_vars/web1.yml (o group_vars/webservers.yml)
db_host: 10.0.1.5
db_port: 5432
```

Uso en templates/tareas: `{{ app_name }}`, `{{ puertos.http }}`, `{{ ansible_facts['os_family'] }}`

## 🧩 Templates (Jinja2)

Archivos con extensión `.j2` que se procesan con variables:

```nginx
# templates/nginx.conf.j2
server {
    listen {{ puertos.http }};
    server_name {{ domain }};

    location / {
        proxy_pass http://localhost:{{ app_port }};
    }
}
```

```yaml
- name: Renderizar template
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: "/etc/nginx/sites-available/{{ domain }}"
    mode: "0644"
```

## 🏗️ Roles

Estructura reutilizable que organiza tareas, handlers, vars, templates y defaults:

```bash
ansible-galaxy role init nginx   # Crear esqueleto de rol
```

```
roles/nginx/
├── defaults/main.yml      # variables por defecto (prioridad baja, fáciles de sobrescribir)
├── files/                 # archivos estáticos
├── handlers/main.yml
├── meta/main.yml          # metadatos y dependencias
├── tasks/main.yml         # tareas principales
├── templates/             # templates Jinja2
├── tests/                 # inventory + test.yml
└── vars/main.yml          # variables internas del rol (prioridad alta)
```

Uso en playbook:
```yaml
---
- hosts: webservers
  roles:
    - common
    - nginx
    - role: postgresql
      vars:
        pg_version: 17
```

## 📚 Colecciones

Los módulos que no son del núcleo se distribuyen en **colecciones** (Docker, AWS, Kubernetes, Windows…):

```bash
ansible-galaxy collection install community.docker
ansible-galaxy collection install -r requirements.yml     # instalar las declaradas
ansible-galaxy collection list
```

```yaml
# requirements.yml
collections:
  - name: community.docker
  - name: amazon.aws
    version: ">=9.0.0"
roles:
  - name: geerlingguy.docker
```

## 🧰 Módulos comunes

```yaml
# apt: gestión de paquetes
- ansible.builtin.apt:
    name: nginx
    state: present
    update_cache: true

# copy: copiar archivo local → remoto
- ansible.builtin.copy:
    src: ./app.conf
    dest: /etc/app/app.conf
    owner: root
    mode: "0644"

# file: crear/eliminar archivos y directorios
- ansible.builtin.file:
    path: /data
    state: directory
    mode: "0755"

# template: renderizar Jinja2
- ansible.builtin.template:
    src: config.j2
    dest: /etc/app/config.json

# service: iniciar/detener/reiniciar
- ansible.builtin.service:
    name: nginx
    state: restarted
    enabled: true

# command / shell: ejecutar comandos (command NO admite pipes ni redirecciones)
- ansible.builtin.command: /usr/bin/uptime
- ansible.builtin.shell: uptime | awk '{print $3}'
- ansible.builtin.copy:                 # escribir un fichero en vez de `echo > …`
    content: "{{ app_version }}\n"
    dest: /etc/app/version.txt

# git: clonar repositorio
- ansible.builtin.git:
    repo: https://github.com/user/app.git
    dest: /opt/app
    version: main

# docker_container: gestionar contenedores (colección community.docker)
- community.docker.docker_container:
    name: redis
    image: redis:8
    ports:
      - "6379:6379"

# uri: peticiones HTTP
- ansible.builtin.uri:
    url: https://api.healthchecks.io/ping/123
    method: GET

# user: crear usuarios
- ansible.builtin.user:
    name: deploy
    groups: sudo
    shell: /bin/bash
```

> Prefiere módulos dedicados a `command`/`shell`: son idempotentes. Si usas `command`, añade `creates:`/`changed_when:` para controlar el estado.

## ℹ️ Facts

Ansible recopila automáticamente información del sistema (`ansible_facts`):

```yaml
- name: Mostrar facts útiles
  ansible.builtin.debug:
    msg: |
      SO: {{ ansible_facts.os_family }} {{ ansible_facts.distribution_version }}
      IP: {{ ansible_facts.default_ipv4.address }}
      CPU: {{ ansible_facts.processor_cores }} cores
      RAM: {{ ansible_facts.memtotal_mb }} MB
      Hostname: {{ ansible_facts.hostname }}

# Facts personalizados: copiar scripts .fact a /etc/ansible/facts.d/
```

Ejecutar solo recolección de facts: `ansible all -m ansible.builtin.setup`

## 🏷️ Tags

Etiquetar tareas para ejecutar subconjuntos del playbook:

```yaml
tasks:
  - name: Instalar Nginx
    ansible.builtin.apt:
      name: nginx
      state: present
    tags: [nginx, install]

  - name: Configurar Nginx
    ansible.builtin.template:
      src: nginx.conf.j2
      dest: /etc/nginx/nginx.conf
      mode: "0644"
    tags: [nginx, config]

  - name: Desplegar app
    ansible.builtin.copy:
      src: ./app
      dest: /opt/app
    tags: [deploy]
```

```bash
ansible-playbook playbook.yml --tags nginx          # Solo tareas con tag nginx
ansible-playbook playbook.yml --tags nginx,deploy   # Múltiples tags
ansible-playbook playbook.yml --skip-tags config    # Todo excepto config
ansible-playbook playbook.yml --list-tags           # Ver tags disponibles
```

## 🔐 Secretos (Vault)

```bash
ansible-vault create group_vars/all/vault.yml        # crear fichero cifrado
ansible-vault encrypt_string 's3cr3t' --name 'db_password'   # cifrar un valor suelto
ansible-vault edit group_vars/all/vault.yml
ansible-playbook playbook.yml --ask-vault-pass       # o --vault-password-file ./.vault_pass (fuera de git)
```

Nunca subas la contraseña del vault a Git. En equipos grandes, valora gestores externos (HashiCorp Vault, SOPS, secretos de CI) con plugins `lookup`.

## ✅ Buenas prácticas

- **Usar roles** para organizar código reutilizable y **FQCN** en todos los módulos
- **Nombres descriptivos** en todas las tareas
- **`--check --diff`** antes de ejecutar cambios reales
- **`ansible-lint`** en CI para validar playbooks (perfil `production`)
- **`defaults/`** para valores sobrescribibles y **`vars/`** para constantes internas del rol
- **`ansible-vault`** (o gestor externo) para secretos; `no_log: true` en tareas que los manejen
- **Idempotencia**: cada tarea debe poder ejecutarse varias veces sin cambiar el estado si ya está correcto
- **Versiones fijadas** de `ansible-core` y colecciones (`requirements.txt` / `requirements.yml`)
- **Molecule** para probar roles; **ansible-navigator** y *execution environments* para entornos reproducibles

## 🔗 Enlaces
- [Documentación oficial Ansible](https://docs.ansible.com/)
- [Ansible Galaxy](https://galaxy.ansible.com/)
- [ansible-lint](https://ansible-lint.readthedocs.io/)
- [Best Practices](https://docs.ansible.com/ansible/latest/tips_tricks/ansible_tips_tricks.html)
- [Ansible Vault](https://docs.ansible.com/ansible/latest/vault_guide/index.html)
- [Molecule](https://ansible.readthedocs.io/projects/molecule/)

---
*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
