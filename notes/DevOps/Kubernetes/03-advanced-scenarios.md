# Advanced Kubernetes Scenarios & Thought Experiments

## Scenario 1: The Mysterious Memory Leak

**Situation**: Your application runs fine for 2 hours, then crashes. You notice memory usage gradually increases until the pod is OOMKilled.

**What you investigate**:
1. Check pod logs: `kubectl logs <pod-name>`
2. Check resource usage: `kubectl top pod <pod-name>`
3. Check pod description: `kubectl describe pod <pod-name>`
4. Check events: `kubectl get events --sort-by='.lastTimestamp'`

**Possible causes**:
- Memory leak in application code
- Resource limits too low
- Too many concurrent requests (connection pooling issues)
- Caching without expiration
- Goroutine leak (for Go applications)

**Solutions**:
```yaml
# Increase memory limit
resources:
  limits:
    memory: "1Gi"
  requests:
    memory: "512Mi"

# Add memory monitoring
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Questions to think about**:
- How would you distinguish between a memory leak and insufficient resources?
- What metrics would you monitor to detect memory issues early?
- How would you design an application to prevent memory leaks?
- What's the tradeoff between setting high memory limits vs investigating the root cause?

## Scenario 2: The Cascading Failure

**Situation**: One microservice starts failing, causing all dependent services to fail. The entire application is down.

**Architecture**:
- Frontend → API Gateway → Auth Service
- Frontend → API Gateway → Order Service → Payment Service
- Frontend → API Gateway → Product Service

**What happened**:
- Auth Service fails (can't connect to database)
- All requests fail (401 Unauthorized)
- Retries overwhelm Auth Service
- Circuit breaker trips → More retries → Cascading failure

**Solutions**:

**1. Circuit Breaker Pattern**:
```yaml
# Implement circuit breaker in service code
# Or use service mesh (Istio, Linkerd)
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: auth-service
spec:
  host: auth-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 10
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

**2. Health Checks and Readiness Probes**:
```yaml
spec:
  containers:
  - name: auth
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

**3. Timeouts and Retries**:
```yaml
# Service mesh configuration
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: auth-service
spec:
  hosts:
  - auth-service
  http:
  - timeout: 5s
    retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: "5xx,reset"
    route:
    - destination:
        host: auth-service
```

**4. Graceful Degradation**:
```yaml
# Cache authentication tokens
# If Auth Service fails, use cached tokens
# Degrade to read-only mode
```

**Questions to think about**:
- How do you prevent a single service failure from taking down the entire system?
- What's the difference between liveness and readiness probes? When would you use each?
- How do you balance between availability (retries) and preventing cascading failures?
- What metrics would you monitor to detect cascading failures early?
- How would you design a system to gracefully degrade when dependencies fail?

## Scenario 3: The Database Connection Pool Exhaustion

**Situation**: Your application uses a connection pool of 10 connections to PostgreSQL. During peak traffic, pods start failing with "too many connections" errors.

**What happened**:
- Database max_connections: 100
- 10 pods × 10 connections = 100 connections
- When HPA scales to 11 pods → 110 connections → Exhaustion

**Solutions**:

**1. Optimize Connection Pool Size**:
```yaml
# Reduce per-pod connections
# Connection pool configuration in application
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=5

# Total: 10 pods × 10 connections = 100 (fits in 100 limit)
# With buffer: 9 pods × 10 connections = 90 (10 connection buffer)
```

**2. Use Connection Pooling Service** (PgBouncer):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: pgbouncer
        image: pgbouncer/pgbouncer:latest
        env:
        - name: DATABASE_URL
          value: "postgres://user:pass@postgres:5432/dbname"
        - name: POOL_MODE
          value: "transaction"
        - name: MAX_CLIENT_CONN
          value: "100"
        - name: DEFAULT_POOL_SIZE
          value: "25"
---
# Application connects to PgBouncer (not PostgreSQL directly)
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_URL: "postgres://user:pass@pgbouncer:6432/dbname"
```

**3. Increase Database Connections**:
```yaml
# PostgreSQL configuration
# But: Each connection uses memory (consider resource limits)
postgresql.parameters.max_connections: "200"
```

**4. Use Read Replicas**:
```yaml
# Route read queries to read replicas
# Write queries to primary
# Reduces load on primary database
```

**Questions to think about**:
- What's the relationship between connection pool size, pod count, and database connections?
- How would you calculate the optimal connection pool size?
- What's the tradeoff between connection pool size and database performance?
- How would you monitor connection pool usage?
- What happens if your connection pool is too small? Too large?
- How would you handle database connection failures gracefully?

## Scenario 4: The Slow Pod Mystery

**Situation**: All pods are running, but some requests take 10 seconds while others take 100ms. The slow requests are random, not consistent.

**What you investigate**:
1. Check pod resource usage: `kubectl top pods`
2. Check node resource usage: `kubectl top nodes`
3. Check pod distribution: `kubectl get pods -o wide`
4. Check events: `kubectl get events`

**Possible causes**:
- Node resource contention (CPU throttling)
- Network latency (pods on different nodes/availability zones)
- Storage I/O contention (shared storage)
- Anti-affinity issues (pods on same node)
- Resource limits too low (CPU throttling)

**Solutions**:

**1. Pod Anti-Affinity** (spread pods across nodes):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - app
              topologyKey: kubernetes.io/hostname
```

**2. Resource Limits**:
```yaml
spec:
  containers:
  - name: app
    resources:
      requests:
        cpu: "500m"
        memory: "512Mi"
      limits:
        cpu: "2000m"           # Burstable (2x request)
        memory: "1Gi"
```

**3. Node Selectors** (specific node types):
```yaml
spec:
  template:
    spec:
      nodeSelector:
        instance-type: "compute-optimized"
```

**4. Topology Spread Constraints** (spread across zones):
```yaml
spec:
  template:
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: app
```

**Questions to think about**:
- How would you diagnose whether slowness is due to CPU, memory, network, or I/O?
- What's the difference between resource requests and limits? When would you set limits higher?
- How do you ensure pods are distributed evenly across nodes?
- What metrics would you monitor to detect slow pods early?
- How would you design a system to handle variable load across pods?
- What's the tradeoff between spreading pods (better availability) vs consolidating pods (lower cost)?

## Scenario 5: The Rolling Update Gone Wrong

**Situation**: You deploy a new version of your application. The rolling update starts, but new pods fail health checks. The update is stuck halfway (50% old version, 50% new version).

**What happened**:
1. Rolling update creates new pods with v2
2. New pods fail readiness probe (application needs 30s to initialize)
3. Readiness probe timeout is 10s → Pod marked unready
4. Kubernetes waits for new pods to be ready
5. Update stuck (can't proceed, can't rollback automatically)

**Solutions**:

**1. Fix Readiness Probe**:
```yaml
spec:
  containers:
  - name: app
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 30      # Wait 30s before first check
      periodSeconds: 10             # Check every 10s
      timeoutSeconds: 5
      failureThreshold: 3
      successThreshold: 1
```

**2. Add Startup Probe** (for slow-starting apps):
```yaml
spec:
  containers:
  - name: app
    startupProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 0
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 30        # Allow 150s for startup (30 × 5s)
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
```

**3. Rollout Strategy**:
```yaml
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2                  # Create 2 extra pods during update
      maxUnavailable: 1            # Allow 1 pod unavailable during update
```

**4. Manual Rollback**:
```bash
# If update stuck, manual rollback
kubectl rollout undo deployment/app

# Or pause/resume rollout
kubectl rollout pause deployment/app
kubectl rollout resume deployment/app
```

**5. Canary Deployment** (gradual rollout):
```yaml
# Deploy 10% traffic to new version first
# Monitor metrics
# If OK, increase to 50%, then 100%
```

**Questions to think about**:
- How do you balance between fast rollouts and safe rollouts?
- What's the difference between liveness, readiness, and startup probes?
- How do you handle applications with long startup times?
- What metrics would you monitor during a rolling update?
- How would you design a deployment strategy that minimizes risk?
- What's the tradeoff between maxSurge and maxUnavailable?

## Scenario 6: The Storage Disaster

**Situation**: You have a StatefulSet with 3 PostgreSQL replicas, each with 10Gi persistent volumes. One node fails, and you can't access the data on that node's persistent volume.

**Architecture**:
- StatefulSet: `postgres-0`, `postgres-1`, `postgres-2`
- Pods on different nodes
- Each pod has persistent volume

**What happened**:
- Node running `postgres-0` fails
- Persistent volume is bound to that node
- Kubernetes can't reschedule pod to different node (volume not accessible)

**Solutions**:

**1. Use Storage Class with Node Affinity**:
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  fsType: ext4
volumeBindingMode: WaitForFirstConsumer  # Wait for pod before binding
```

**2. Replication** (database replication, not just Kubernetes):
```yaml
# PostgreSQL with replication
# If one replica fails, use another
# Kubernetes handles pod scheduling
# Database handles data replication
```

**3. Backup and Restore Strategy**:
```yaml
# Regular backups (CronJob)
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"          # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command: ["pg_dump"]
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
```

**4. Use Cloud-Native Storage** (auto-replication):
```yaml
# Use managed database service (RDS, Cloud SQL)
# Or use replicated storage (EBS with replication)
```

**Questions to think about**:
- How do you ensure data availability when nodes fail?
- What's the difference between Kubernetes replication and database replication?
- How do you balance between data durability and performance?
- What's your backup and disaster recovery strategy?
- How would you test disaster recovery?
- What's the tradeoff between persistent volumes and stateless applications?

## Scenario 7: The Multi-Tenant Security Breach

**Situation**: You have a multi-tenant cluster where different teams share the same cluster. Team A accidentally deploys a pod that can access Team B's secrets.

**Architecture**:
- Namespaces: `team-a`, `team-b`, `team-c`
- RBAC: Each team has access to their namespace only
- Secrets: Each team has secrets in their namespace

**What happened**:
- Team A deploys pod with cluster-admin service account (by mistake)
- Pod can access secrets from all namespaces
- Security breach

**Solutions**:

**1. Network Policies** (restrict network access):
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: team-a
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
# Allow only specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-internal
  namespace: team-a
spec:
  podSelector:
    matchLabels:
      app: app
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: team-a
    - podSelector:
        matchLabels:
          app: allowed-app
```

**2. RBAC** (principle of least privilege):
```yaml
# Don't use cluster-admin
# Use namespace-specific roles
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: team-a
  name: team-a-role
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "create", "update"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
  resourceNames: ["team-a-secret"]  # Only specific secret
```

**3. Pod Security Standards**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-a
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**4. Admission Controllers** (prevent unsafe configurations):
```yaml
# Use OPA Gatekeeper or Kyverno
# Policy: Prevent pods from running as root
# Policy: Prevent pods with hostNetwork: true
# Policy: Require resource limits
```

**Questions to think about**:
- How do you ensure multi-tenancy security?
- What's the relationship between RBAC, network policies, and pod security?
- How do you balance between security and usability?
- What's your strategy for detecting security violations?
- How would you design a secure multi-tenant cluster?
- What's the tradeoff between isolation (separate clusters) and efficiency (shared cluster)?

## Scenario 8: The Cost Optimization Dilemma

**Situation**: Your cluster costs $10,000/month. You want to reduce costs by 50% without affecting performance.

**Current state**:
- 50 nodes × $200/month = $10,000/month
- Average CPU usage: 30%
- Average memory usage: 40%

**Analysis**:
- Lots of unused resources
- Over-provisioned nodes
- No resource limits on pods

**Solutions**:

**1. Set Resource Requests and Limits**:
```yaml
# Current (no limits = unlimited)
spec:
  containers:
  - name: app
    # No resources specified

# Optimized (realistic limits)
spec:
  containers:
  - name: app
    resources:
      requests:
        cpu: "100m"
        memory: "128Mi"
      limits:
        cpu: "500m"
        memory: "512Mi"
```

**2. Cluster Autoscaler** (scale nodes based on demand):
```yaml
# Automatically add/remove nodes
# When pods can't be scheduled → add node
# When node utilization < threshold → remove node
```

**3. Vertical Pod Autoscaler (VPA)**:
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  updatePolicy:
    updateMode: "Auto"
```

**4. Use Spot Instances** (for fault-tolerant workloads):
```yaml
# Use spot instances for stateless workloads
# 50-90% cost savings
# But: Can be terminated with 2-minute notice
```

**5. Right-Size Nodes**:
```yaml
# Use smaller, cheaper nodes
# Better bin-packing (more pods per node)
# But: More nodes to manage
```

**6. Consolidate Namespaces**:
```yaml
# Merge dev/staging onto smaller cluster
# Production gets dedicated cluster
```

**Questions to think about**:
- How do you measure cluster efficiency?
- What's the relationship between resource requests, limits, and actual usage?
- How do you balance between cost and availability?
- What metrics would you use to optimize costs?
- How would you design a cost-optimized cluster?
- What's the tradeoff between over-provisioning (safety) and right-sizing (cost)?

## Scenario 9: The Global Deployment Challenge

**Situation**: Your application needs to serve users in North America, Europe, and Asia with <100ms latency. Current setup: Single cluster in US-East, latency to Asia is 300ms.

**Current state**:
- Single cluster: us-east-1
- Users in US: 50ms latency ✓
- Users in EU: 150ms latency ✗
- Users in Asia: 300ms latency ✗

**Requirements**:
- <100ms latency for all regions
- Data consistency across regions
- Disaster recovery (if one region fails)

**Solutions**:

**1. Multi-Region Clusters**:
```yaml
# Deploy clusters in:
# - us-east-1 (North America)
# - eu-west-1 (Europe)
# - ap-southeast-1 (Asia)

# Use Route 53 (DNS) with latency-based routing
# Users automatically routed to nearest cluster
```

**2. Global Load Balancer**:
```yaml
# Use cloud provider global load balancer
# Automatic health checks
# Automatic failover
```

**3. Database Replication**:
```yaml
# Primary database in one region
# Read replicas in each region
# Writes go to primary (cross-region latency)
# Reads go to local replica (low latency)
```

**4. CDN for Static Assets**:
```yaml
# Use CloudFlare, AWS CloudFront
# Static assets cached at edge locations
# Low latency for all users
```

**5. Service Mesh for Multi-Cluster**:
```yaml
# Istio Multi-Cluster
# Services in different clusters can communicate
# Automatic failover between clusters
```

**Questions to think about**:
- How do you balance between latency and data consistency?
- What's your disaster recovery strategy for multi-region?
- How do you handle database replication across regions?
- What's the tradeoff between regional clusters (cost) and global coverage (latency)?
- How would you test multi-region deployments?
- What metrics would you use to measure global performance?

## Scenario 10: The Zero-Downtime Migration

**Situation**: You need to migrate from a legacy monolithic application running on VMs to a microservices architecture on Kubernetes. Requirements: Zero downtime, no data loss, rollback capability.

**Current state**:
- Monolith: PHP application on 3 VMs
- Database: MySQL on 1 VM
- Traffic: 1000 req/s
- Availability: 99.9% SLA

**Target state**:
- Microservices: 5 services on Kubernetes
- Database: Managed MySQL (RDS)
- Same traffic and availability requirements

**Migration strategy**:

**Phase 1: Prepare Kubernetes Infrastructure**:
```yaml
# Deploy Kubernetes cluster
# Set up networking, ingress, monitoring
# Test with dummy services
```

**Phase 2: Database Migration**:
```yaml
# Set up read replica of existing MySQL
# Test replication
# Cut over to new database (managed service)
# Keep old database as backup
```

**Phase 3: Service-by-Service Migration**:
```yaml
# Migrate one service at a time
# Use canary deployment
# Monitor metrics
# If issues, rollback
```

**Phase 4: Traffic Migration**:
```yaml
# Use service mesh or load balancer
# Route 10% traffic to new services
# Monitor: latency, errors, resource usage
# If OK, increase to 50%, then 100%
```

**Phase 5: Cutover**:
```yaml
# Route all traffic to new services
# Keep old VMs running for 7 days (rollback window)
# Monitor: everything
```

**Questions to think about**:
- How do you ensure zero downtime during migration?
- What's your rollback strategy for each phase?
- How do you handle database schema migrations?
- What metrics would you monitor during migration?
- How do you test the migration before going live?
- What's the tradeoff between big-bang migration (risky) and gradual migration (complex)?

---

## Final Thought Experiment: The Perfect Cluster

**Question**: If you could design a Kubernetes cluster from scratch with unlimited budget and resources, what would it look like?

**Consider**:
- High availability (multi-zone, multi-region?)
- Security (network policies, RBAC, pod security?)
- Monitoring (metrics, logs, traces?)
- Cost optimization (right-sizing, spot instances?)
- Developer experience (CI/CD, Helm, operators?)
- Disaster recovery (backups, replication?)
- Compliance (audit logs, encryption?)

**Now think**: What would you prioritize if you had a **limited** budget? What are the tradeoffs?

