# kubectl – Administrar clústeres Kubernetes

CLI oficial de Kubernetes para consultar y gestionar recursos del clúster: despliegues, pods, servicios, configuraciones, diagnóstico y acceso a los contenedores. Idónea en flujos declarativos (apply) y en tareas imperativas rápidas.

> 🎯 **Nivel**: intermedio · **Requisitos**: clúster Kubernetes activo y un `kubeconfig` válido · **Revisado**: octubre 2026

## 🔧 Versión y política de compatibilidad

La versión vigente es **Kubernetes 1.37** (Garhwal, 26 ago. 2026). Se mantienen los tres minors recientes (1.37, 1.36 y 1.35).

```bash
kubectl version --client     # versión del cliente (kubectl)
kubectl version              # versión de cliente y de API server
```

> 📌 **Estado**: `kubectl` solo se garantiza dentro de **±1 minor** respecto al `kube-apiserver`. Un kubectl 1.38 con un clúster 1.36 puede dar resultados inesperados; usa la versión de kubectl más cercana a tu clúster.

## 🌐 Contextos, namespaces y kubeconfig

```bash
kubectl config get-contexts                # listar contextos (clúster + usuario)
kubectl config current-context             # contexto activo
kubectl config use-context minikube        # cambiar de contexto
kubectl config set-context --current --namespace=prod   # namespace por defecto

kubectl get nodes                          # nodos del clúster
kubectl cluster-info                       # endpoints de servicios del control plane
kubectl -n kube-system get pods            # pods de otro namespace
kubectl get pods -A                        # en todos los namespaces
```

## 📦 Consultar recursos

```bash
kubectl get pods                    # pods del namespace actual
kubectl get pods -l app=api         # filtrar por label
kubectl get all                     # deployments, services, statefulsets, replicasets y pods
kubectl get pods,svc,cm,secret      # varios tipos a la vez (secret NO muestra valores)
kubectl get pods -o wide            # con IP y nodo
kubectl get pods --watch            # en streaming

kubectl describe pod mi-pod         # detalle + eventos asociados
kubectl explain deployment.spec     # documentación embebida de cada campo
```

Los secrets se leen con `kubectl get secret mi-secreto -o jsonpath='{.data.API_KEY}' | base64 -d`. `get all` **no** incluye secrets, configmaps ni PVCs.

## 🚀 Aplicar configuración (declarativo)

```bash
kubectl apply -f deployment.yaml            # crear o actualizar idempotente
kubectl apply -f ./manifests/               # aplicar un directorio
kubectl apply -k ./overlays/prod            # aplicar salida de Kustomize
kubectl delete -f deployment.yaml           # borrar lo descrito en el fichero

# Validate previa
kubectl apply -f deployment.yaml --dry-run=client     # solo sintaxis
kubectl apply -f deployment.yaml --dry-run=server     # validar contra el API server
kubectl diff -f deployment.yaml              # ver el diff real
```

> 📌 **Estado.** El **apply client-side** (con las anotaciones `kubectl.kubernetes.io/last-applied-configuration`) sigue funcionando, pero para production GitOps se recomienda el **server-side apply** con field manager:
> ```bash
> kubectl apply --server-side --field-manager=flux-client deploy/deployment.yaml
> ```
> `--server-side` delega el cálculo de la "última aplicación" al propio API server, con menor riesgo de conflictos cuando varios equipos/agentes gestionan el mismo objeto.

## 📝 Comandos imperativos (rápidos)

```bash
kubectl create deployment api --image=mi-api:latest        # deployment on the fly
kubectl expose deployment api --port=80 --type=ClusterIP   # crear Service
kubectl set image deployment/api api=mi-api:v2             # actualizar imagen
kubectl scale deployment api --replicas=5                  # escalar
kubectl annotate pod mi-pod desc="mi pod"                  # añadir anotación
```

> ⚠️ **Obsoleto / en desuso (oct. 2026).** Los generadores de `kubectl run`, como `kubectl run --generator=run-pod/v1`, se eliminaron en Kubernetes 1.18. Hoy `kubectl run` crea un Pod simple:
> ```bash
> kubectl run nginx --image=nginx                          # solo crea un Pod
> ```

## 🩺 Diagnóstico y depuración

```bash
kubectl logs mi-pod                              # logs del contenedor
kubectl logs mi-pod -c contenedor --tail=200     # logs de un contenedor concreto
kubectl logs deployment/api                      # logs de todos los pods del deployment
kubectl logs -l app=api -f                        # streaming por label
kubectl logs mi-pod --previous                   # logs del contenedor que murió

kubectl exec -it mi-pod -- sh                    # shell en el contenedor
kubectl exec mi-pod -- cat /etc/hosts            # ejecutar un comando
kubectl port-forward svc/api 8080:80             # túnel al Service desde local
kubectl cp ./local.txt mi-pod:/tmp/              # copiar fichero al pod

kubectl top pods                                 # CPU/memoria por pod (Metrics API)
kubectl top nodes                                # CPU/memoria por nodo
kubectl events                                   # eventos agrupados del namespace
kubectl events --for pod=mi-pod                  # eventos de un recurso concreto
kubectl describe node minikube                   # estado del nodo
```

Para depurar un pod sin tocar su imagen de producción (`kubectl debug` añade un contenedor efímero):

```bash
kubectl debug -it mi-pod --image=busybox --target=web   # contenedor efímero compartiendo el pod
kubectl debug node/minikube -it --image=busybox          # sesión de debug en el nodo
```

## 📊 Rollouts y despliegues

```bash
kubectl rollout status deployment/api           # esperar a que termine el rollout
kubectl rollout history deployment/api          # historial de revisiones
kubectl rollout undo deployment/api             # volver a la revisión anterior
kubectl rollout restart deployment/api          # reiniciar pods sin cambiar la imagen
```

Con la Metrics API (`metrics.k8s.io/v1`) ya **GA** desde 1.37, `kubectl top` y el autoscaler horizontal no dependen de nada extra.

## 🧩 Kustomize integrado

```bash
kubectl kustomize ./overlays/prod       # renderizar la salida sin aplicar
kubectl apply -k ./overlays/prod        # aplicar directamente
```

## 📚 CRDs y extensibilidad

```bash
kubectl get crds                        # CustomResourceDefinitions instaladas
kubectl get <crd>                       # instancias de un recurso custom, p. ej. kubectl get certificates
kubectl api-resources | grep <nombre>   # descubrir API groups y verbs
```

## 🖥️ Herramientas del ecosistema

| Herramienta | Para qué | Versión |
|---|---|---|
| [k9s](https://k9scli.io/) | TUI de navegación y gestión del clúster | 0.51 (jun. 2026) |
| [kubectx / kubens](https://github.com/ahmetb/kubectx) | cambiar de contexto/namespace rápido | estable |
| [kind](https://kind.sigs.k8s.io/) | clúster local con contenedores como nodos | 0.33 (K8s 1.37) |
| [k3s](https://k3s.io/) | clúster ligero para edge/CI | 1.37 |
| [minikube](https://minikube.sigs.k8s.io/) | clúster local de aprendizaje | estable |
| [Helm](https://helm.sh/) | empaquetar aplicaciones | 4.x |

## ⚠️ Sobre `--prune`

> 📌 **Estado**: `kubectl apply --prune -l app=api` borra recursos que ya no están en los manifiestos. Requiere etiquetas consistentes y puede eliminar recursos no gestionados por error. Para sincronización hacia la realidad en producción es más seguro un flujo GitOps (Argo CD / Flux), donde el pruner entiende el estado completo del repo.

## ❓ FAQ

**❓ ¿`apply` crea o actualiza?**
➡ Ambas: es idempotente. `create` falla si el recurso ya existe.

**❓ ¿Qué hace `get all`?**
➡ Muestra pods, deployments, statefulsets, services y replicasets. No incluye secrets, configmaps ni PVCs.

**❓ ¿Cómo veo el valor de un secret?**
➡ `kubectl get secret mi-secreto -o jsonpath='{.data.API_KEY}' | base64 -d`.

**❓ ¿Cómo reinicio un deployment sin cambiar nada?**
➡ `kubectl rollout restart deployment api`.

**❓ ¿Puedo entrar en un pod con OTRA imagen?**
➡ Sí, con `kubectl debug -it mi-pod --image=busybox --target=web` (contenedor efímero).

## 🔗 Enlaces

- [kubectl cheatsheet oficial](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Política de versiones (version-skew)](https://kubernetes.io/docs/setup/release/version-skew-policy/)
- [Release 1.37 (blog)](https://kubernetes.io/blog/2026/08/26/kubernetes-v1-37-release/)
- [kubectl debug](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/)
- [Server-side apply](https://kubernetes.io/docs/reference/using-api/server-side-apply/)

## 🧩 Ver también

- [manual_helm.md](./manual_helm.md): empaquetar y versionar tus manifiestos
- [manual_docker_compose.md](./manual_docker_compose.md): contenedores en local antes del clúster
- [manual_observabilidad.md](./manual_observabilidad.md): métricas y logs del clúster
- [manual_terraform.md](./manual_terraform.md): provisionar el clúster como código

---

*Parte de la [Colección de Manuales y Cheatsheets](../README.md), por CeleroLab*
