# Kubernetes Fundamentals

## What Kubernetes Is (Simple Terms)

Think of Kubernetes like **an orchestra conductor** for containers:

- **Containers** = Individual musicians (each plays their part)
- **Kubernetes** = Conductor (ensures everyone plays together, in tune, at the right time)

**Before Kubernetes**: Managing containers manually
- Run containers on multiple servers manually
- If container crashes, manually restart it
- If traffic increases, manually start more containers
- If server dies, manually move containers
- Result: Too much manual work, prone to errors

**With Kubernetes**: Automated container orchestration
- Kubernetes automatically runs containers across servers
- If container crashes, Kubernetes automatically restarts it
- If traffic increases, Kubernetes automatically scales up
- If server dies, Kubernetes automatically moves containers
- Result: Automated, reliable, scalable

## Why Kubernetes Matters

- **Automated orchestration**: Manages containers across multiple servers
- **Self-healing**: Automatically restarts failed containers
- **Auto-scaling**: Automatically scales based on traffic
- **Rolling updates**: Updates containers without downtime
- **Rollback**: Instantly reverts to previous version if something breaks
- **Service discovery**: Containers find each other automatically
- **Load balancing**: Distributes traffic across containers
- **Resource management**: Ensures containers get the resources they need

## Core Concepts

### Cluster Architecture

**Cluster** = Collection of nodes (servers) running Kubernetes

**Components**:
1. **Control Plane** (master nodes):
   - **API Server**: Entry point for all operations
   - **etcd**: Database storing cluster state
   - **Scheduler**: Decides which node runs which pod
   - **Controller Manager**: Manages controllers (deployments, services, etc.)
   - **Cloud Controller Manager**: Manages cloud-specific resources

2. **Worker Nodes**:
   - **kubelet**: Agent running on each node
   - **kube-proxy**: Network proxy for service networking
   - **Container Runtime**: Docker, containerd, CRI-O (runs containers)
   - **Pods**: The smallest deployable units

**Key Point**: Control plane manages worker nodes, worker nodes run containers.

### Pods

**Pod** = Smallest deployable unit in Kubernetes (one or more containers)

**Think of it like**:
- Pod = A room with one or more containers
- Containers in same pod share network and storage

**Characteristics**:
- Pods are **ephemeral**: Created, live, die (like containers)
- Pods are **scheduled**: Kubernetes decides which node runs pod
- Pods share **network**: Containers in pod can communicate via `localhost`
- Pods share **storage**: Containers in pod share volumes

**Example**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
spec:
  containers:
  - name: web
    image: nginx:1.21
    ports:
    - containerPort: 80
```

**Common pattern**: One container per pod (simplifies management)

### Deployments

**Deployment** = Manages pods (ensures desired number of pods running)

**Why deployments?**:
- Pods are ephemeral (die and restart)
- Need to ensure X pods are always running
- Need rolling updates (update without downtime)
- Need rollback (revert if update fails)

**Example**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
spec:
  replicas: 3                    # Always run 3 pods
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: nginx:1.21
        ports:
        - containerPort: 80
```

**What deployment does**:
1. Creates 3 pods (replicas: 3)
2. If pod dies, creates new one (ensures 3 always running)
3. Manages pod lifecycle (start, stop, restart)

**Rolling update**:
```bash
kubectl set image deployment/web-deployment web=nginx:1.22
```

**What happens**:
1. Creates new pod with nginx:1.22
2. Waits for new pod to be ready
3. Destroys old pod with nginx:1.21
4. Repeats until all pods updated
5. Zero downtime (always at least one pod running)

**Rollback**:
```bash
kubectl rollout undo deployment/web-deployment
```

### Services

**Service** = Network abstraction that provides stable IP and DNS for pods

**Problem**: Pods are ephemeral (created, destroyed, recreated)
- IP addresses change when pods recreated
- How do other services find pods?

**Solution**: Service provides stable endpoint (IP + DNS name)

**Types of services**:

1. **ClusterIP** (default): Internal only
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: web-service
   spec:
     type: ClusterIP
     selector:
       app: web
     ports:
     - port: 80
       targetPort: 80
   ```
   - Only accessible within cluster
   - Gets DNS name: `web-service.default.svc.cluster.local`
   - Other pods can connect using DNS name

2. **NodePort**: Expose on each node's IP
   ```yaml
   spec:
     type: NodePort
     ports:
     - port: 80
       nodePort: 30080
   ```
   - Accessible via `<node-ip>:30080`
   - Useful for development/testing

3. **LoadBalancer**: Cloud provider load balancer
   ```yaml
   spec:
     type: LoadBalancer
   ```
   - Cloud provider creates load balancer
   - Gets external IP
   - Production-ready

4. **Ingress**: HTTP/HTTPS routing
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: web-ingress
   spec:
     rules:
     - host: example.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: web-service
               port:
                 number: 80
   ```
   - Routes HTTP/HTTPS traffic to services
   - Supports SSL/TLS termination
   - Path-based routing (example.com/api → api-service)

**Service discovery**:
- Services get DNS names automatically
- Format: `<service-name>.<namespace>.svc.cluster.local`
- Example: `web-service.default.svc.cluster.local`
- Short form: `web-service` (same namespace)

### ConfigMaps and Secrets

**ConfigMap** = Stores configuration data (non-sensitive)

**Example**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: "postgres://db:5432/mydb"
  log_level: "info"
```

**Use in pod**:
```yaml
spec:
  containers:
  - name: app
    envFrom:
    - configMapRef:
        name: app-config
```

**Secret** = Stores sensitive data (passwords, API keys)

**Example**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  password: <base64-encoded>
```

**Create secret**:
```bash
kubectl create secret generic app-secret \
  --from-literal=password=secret123
```

**Use in pod**:
```yaml
spec:
  containers:
  - name: app
    envFrom:
    - secretRef:
        name: app-secret
```

**Best practices**:
- Use ConfigMaps for non-sensitive config
- Use Secrets for sensitive data
- Don't commit secrets to Git
- Rotate secrets regularly

### Namespaces

**Namespace** = Logical separation of resources

**Why namespaces?**:
- Multiple teams using same cluster
- Different environments (dev, staging, prod)
- Resource isolation (quota, limits)

**Default namespaces**:
- `default`: Default namespace (if not specified)
- `kube-system`: Kubernetes system components
- `kube-public`: Public resources
- `kube-node-lease`: Node heartbeat

**Create namespace**:
```bash
kubectl create namespace production
```

**Use namespace**:
```bash
kubectl get pods -n production
kubectl apply -f deployment.yaml -n production
```

**Resource quotas**:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: quota
  namespace: production
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
```

### Resource Limits

**Resource requests** = Minimum resources needed
**Resource limits** = Maximum resources allowed

**Example**:
```yaml
spec:
  containers:
  - name: app
    resources:
      requests:
        cpu: "100m"           # 0.1 CPU core
        memory: "128Mi"       # 128 MB RAM
      limits:
        cpu: "500m"           # 0.5 CPU core
        memory: "512Mi"       # 512 MB RAM
```

**Why it matters**:
- **Prevents resource hogging**: Pod can't starve others
- **Better scheduling**: Kubernetes knows where to place pods
- **Cost control**: Limits cloud costs
- **Predictable performance**: Guaranteed resources

**Units**:
- **CPU**: `100m` = 0.1 core, `1` = 1 core, `2` = 2 cores
- **Memory**: `128Mi` = 128 MB, `1Gi` = 1 GB, `2Gi` = 2 GB

## Common Commands

**Deployments**:
```bash
kubectl apply -f deployment.yaml       # Apply configuration
kubectl get deployments                # List deployments
kubectl get pods                       # List pods
kubectl describe pod <pod-name>        # Pod details
kubectl logs <pod-name>                # Pod logs
kubectl exec -it <pod-name> sh         # Execute command in pod
kubectl delete pod <pod-name>          # Delete pod (deployment recreates)
kubectl rollout status deployment/web  # Check rollout status
kubectl rollout undo deployment/web    # Rollback deployment
```

**Services**:
```bash
kubectl get services                   # List services
kubectl describe service <service>     # Service details
kubectl port-forward service/web 8080:80  # Port forward
```

**ConfigMaps/Secrets**:
```bash
kubectl get configmaps                 # List configmaps
kubectl get secrets                    # List secrets
kubectl create secret generic mysecret \
  --from-literal=key=value
```

**Namespaces**:
```bash
kubectl get namespaces                 # List namespaces
kubectl create namespace <name>        # Create namespace
kubectl get pods -n <namespace>       # List pods in namespace
```

**Debugging**:
```bash
kubectl get events                     # View events
kubectl top nodes                      # Resource usage (nodes)
kubectl top pods                       # Resource usage (pods)
kubectl get pods -o wide               # Pods with IPs and nodes
```

## Common Patterns

**1. Deployment + Service**:
- Deployment manages pods
- Service provides stable endpoint
- Standard pattern for most applications

**2. ConfigMap + Secret**:
- ConfigMap for non-sensitive config
- Secret for sensitive data
- Mounted as environment variables or files

**3. Namespace per environment**:
- `dev`, `staging`, `production` namespaces
- Same code, different configs per namespace

**4. Resource limits**:
- Always set requests and limits
- Prevents resource starvation
- Enables better scheduling

## Best Practices

**Deployments**:
- Always use deployments (never bare pods)
- Set resource requests and limits
- Use health checks (liveness/readiness probes)
- Use rolling updates for zero downtime

**Services**:
- Use ClusterIP for internal communication
- Use LoadBalancer or Ingress for external access
- Use selector labels properly

**ConfigMaps/Secrets**:
- Don't commit secrets to Git
- Rotate secrets regularly
- Use separate ConfigMaps per environment

**Namespaces**:
- Use namespaces for logical separation
- Set resource quotas per namespace
- Use different namespaces for different environments

**Resource Management**:
- Always set resource requests and limits
- Monitor resource usage
- Set resource quotas per namespace

