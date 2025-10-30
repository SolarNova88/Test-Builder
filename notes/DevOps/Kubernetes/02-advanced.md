# Kubernetes Advanced Topics

## StatefulSets

**Problem**: Deployments don't work well for stateful applications (databases)
- Pods are interchangeable (no identity)
- Storage isn't persistent per pod
- Pods can be recreated with new IPs

**Solution**: StatefulSet (pods with identity and persistent storage)

**Characteristics**:
- Pods have **stable identity**: `web-0`, `web-1`, `web-2`
- Pods created in **order** (0, then 1, then 2)
- Pods destroyed in **reverse order** (2, then 1, then 0)
- Each pod gets **persistent volume**

**Example**:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

**Key differences from Deployment**:
- Pods have stable names: `postgres-0`, `postgres-1`, `postgres-2`
- Each pod gets its own persistent volume
- Pods created sequentially (not in parallel)

**When to use**:
- Databases (PostgreSQL, MySQL, MongoDB)
- Message queues (RabbitMQ, Kafka)
- Any application needing stable identity

## DaemonSets

**Problem**: Need pod running on **every node** (monitoring, logging)

**Solution**: DaemonSet (ensures pod runs on every node)

**Example**:
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        ports:
        - containerPort: 9100
```

**Characteristics**:
- Pod runs on every node
- New nodes automatically get pod
- Pod deleted when node removed

**When to use**:
- Monitoring agents (Prometheus node-exporter)
- Logging agents (Fluentd, Filebeat)
- Security agents (Falco, OPA)
- Network plugins

## Jobs and CronJobs

**Job** = One-time task (runs until completion)

**Example**:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: backup-job
spec:
  template:
    spec:
      containers:
      - name: backup
        image: postgres:15
        command: ["pg_dump", "-U", "postgres", "mydb"]
      restartPolicy: OnFailure
```

**CronJob** = Scheduled job (runs on schedule)

**Example**:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-cronjob
spec:
  schedule: "0 2 * * *"          # Run at 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command: ["pg_dump", "-U", "postgres", "mydb"]
          restartPolicy: OnFailure
```

**Schedule syntax** (cron):
- `0 2 * * *` = Daily at 2 AM
- `*/5 * * * *` = Every 5 minutes
- `0 0 * * 0` = Weekly on Sunday

**When to use**:
- Backup jobs
- Data cleanup
- Report generation
- Database migrations

## Horizontal Pod Autoscaler (HPA)

**Problem**: Traffic varies (low during night, high during day)
- Too many pods = wasted resources
- Too few pods = slow responses

**Solution**: HPA (automatically scales pods based on metrics)

**Example**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**How it works**:
1. HPA monitors CPU usage
2. If CPU > 70%, scale up (add pods)
3. If CPU < 70%, scale down (remove pods)
4. Respects min/max replicas

**Supported metrics**:
- CPU utilization
- Memory utilization
- Custom metrics (via metrics API)

**Best practices**:
- Set realistic min/max replicas
- Use CPU and memory metrics together
- Monitor scaling events
- Test scaling behavior

## Persistent Volumes

**Problem**: Pods are ephemeral (storage lost when pod deleted)

**Solution**: Persistent Volumes (PV) + Persistent Volume Claims (PVC)

**Persistent Volume** = Cluster-wide storage resource

**Example**:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: fast-ssd
  hostPath:
    path: /mnt/data
```

**Persistent Volume Claim** = Request for storage (pod requests storage)

**Example**:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd
```

**Use in pod**:
```yaml
spec:
  containers:
  - name: postgres
    volumeMounts:
    - name: data
      mountPath: /var/lib/postgresql/data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: postgres-pvc
```

**Storage Classes** = Dynamic provisioning

**Example**:
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
```

**Dynamic provisioning**:
- PVC created → Storage class provisions PV automatically
- No manual PV creation needed
- Cloud provider specific (AWS EBS, Azure Disk, GCP PD)

## Network Policies

**Network Policy** = Firewall rules for pods

**Problem**: By default, all pods can communicate with all pods (security risk)

**Solution**: Network policies (restrict pod-to-pod communication)

**Example** (deny all, allow specific):
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

**Example** (allow specific):
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

**Key concepts**:
- **Ingress**: Traffic coming into pods
- **Egress**: Traffic going out of pods
- **PodSelector**: Which pods the policy applies to
- **from/to**: Which pods can communicate

**When to use**:
- Multi-tenant clusters
- Microservices security
- Compliance requirements
- Network segmentation

## RBAC (Role-Based Access Control)

**RBAC** = Authorization system (who can do what)

**Components**:
1. **Role**: Permissions within namespace
2. **ClusterRole**: Permissions cluster-wide
3. **RoleBinding**: Grants role to user/group
4. **ClusterRoleBinding**: Grants cluster role to user/group

**Example Role**:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

**Example RoleBinding**:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: production
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

**Common roles**:
- **View**: Read-only access
- **Edit**: Read + write access (no delete)
- **Admin**: Full access within namespace
- **Cluster-admin**: Full cluster access

**Best practices**:
- Principle of least privilege (minimum permissions needed)
- Separate namespaces per team
- Use roles (not cluster roles) when possible
- Regular access reviews

## Helm

**Helm** = Package manager for Kubernetes

**Problem**: Managing multiple YAML files is complex
- Deployments, services, configmaps, secrets, etc.
- Different configurations per environment
- Version management

**Solution**: Helm charts (packaged Kubernetes applications)

**Chart structure**:
```
myapp/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default values
├── templates/              # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
└── charts/                 # Dependencies
```

**Install chart**:
```bash
helm install myapp ./myapp
```

**Upgrade chart**:
```bash
helm upgrade myapp ./myapp
```

**Customize values**:
```bash
helm install myapp ./myapp \
  --set replicaCount=5 \
  --set image.tag=v1.2.3
```

**Helm Hub** = Public chart repository (like Docker Hub)

**Benefits**:
- Package complex applications
- Parameterize configurations
- Version management
- Dependency management
- Easy upgrades/rollbacks

## Operators

**Operator** = Kubernetes controller that manages complex applications

**Problem**: Some applications need complex lifecycle management (databases, monitoring)

**Solution**: Operator (custom controller)

**How it works**:
1. Define Custom Resource (CR) (e.g., `PostgreSQLCluster`)
2. Operator watches CRs
3. Operator creates/manages Kubernetes resources based on CR
4. Operator handles lifecycle (backup, restore, updates)

**Example** (PostgreSQL operator):
```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
spec:
  instances: 3
  postgresql:
    parameters:
      max_connections: "200"
```

**Operator creates**:
- StatefulSet for PostgreSQL
- Services for connectivity
- ConfigMaps for configuration
- Persistent volumes for storage
- Backups, restores, updates

**Popular operators**:
- **PostgreSQL**: CloudNativePG, Zalando
- **MySQL**: MySQL Operator
- **MongoDB**: MongoDB Enterprise Operator
- **Prometheus**: Prometheus Operator
- **Elasticsearch**: Elastic Cloud on Kubernetes

## Service Mesh

**Service Mesh** = Infrastructure layer for service-to-service communication

**Problem**: Microservices communication complexity
- Service discovery
- Load balancing
- TLS/encryption
- Observability (traces, metrics)
- Traffic management (canary, A/B testing)
- Security (mTLS, authorization)

**Solution**: Service mesh (sidecar proxy handles communication)

**How it works**:
- Each pod gets sidecar proxy (Envoy, Linkerd proxy)
- All traffic goes through proxy
- Proxy handles: TLS, load balancing, routing, metrics, traces

**Popular service meshes**:
- **Istio**: Feature-rich (Envoy-based)
- **Linkerd**: Simple, fast (Rust-based)
- **Consul Connect**: HashiCorp service mesh

**Istio example**:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: web
spec:
  hosts:
  - web
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: web
        subset: v2
  - route:
    - destination:
        host: web
        subset: v1
      weight: 90
    - destination:
        host: web
        subset: v2
      weight: 10
```

## Monitoring and Observability

**Key components**:

1. **Metrics**: Prometheus (collects metrics)
2. **Logs**: ELK stack (Elasticsearch, Logstash, Kibana)
3. **Traces**: Jaeger, Zipkin (distributed tracing)
4. **Dashboards**: Grafana (visualization)

**Prometheus example**:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web-monitor
spec:
  selector:
    matchLabels:
      app: web
  endpoints:
  - port: metrics
    interval: 30s
```

**Best practices**:
- Monitor all services
- Set up alerts (Prometheus Alertmanager)
- Use dashboards (Grafana)
- Track SLIs/SLOs (Service Level Indicators/Objectives)

