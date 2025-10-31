# Kubernetes: Architecture and History

## The Problem Before Orchestration

### Managing Containers at Scale

**The Challenge** (Post-Docker Era):
- Docker solved containerization (isolated, portable apps)
- But running containers in production revealed new problems:
  - How do you run containers across multiple servers?
  - What happens when a container crashes?
  - How do you scale when traffic increases?
  - How do containers find and communicate with each other?
  - How do you update apps without downtime?
  - How do you handle server failures?

**Early Solutions**:

1. **Manual Management**:
   - SSH into servers, run `docker run`
   - Write scripts to manage containers
   - **Problem**: Doesn't scale, error-prone, manual

2. **Docker Compose**:
   - Good for single-machine deployments
   - Define multi-container apps in YAML
   - **Problem**: Only works on one machine, no orchestration

3. **Docker Swarm**:
   - Docker's native orchestration
   - Simple, works with Docker CLI
   - **Problem**: Less features than Kubernetes, smaller ecosystem

## The Birth of Kubernetes

### Google's Internal Systems

**Borg (2003-2014)**:
- Google's internal cluster manager
- Ran millions of containers across thousands of machines
- Handled Google's internal services (Search, Gmail, etc.)
- **Not public**: Internal Google technology

**Omega (2013)**:
- Next-generation cluster manager
- Learned from Borg's limitations
- More flexible scheduling

**What Google Learned**:
- Container orchestration at scale is complex
- Need for:
  - Automatic scheduling
  - Self-healing (restart failed containers)
  - Auto-scaling (add/remove containers based on load)
  - Rolling updates (zero-downtime deployments)
  - Service discovery (containers find each other)
  - Load balancing (distribute traffic)

### Kubernetes (2014-Present)

**The Origins**:
- Google engineers wanted to share container orchestration knowledge
- Created Kubernetes (Greek for "helmsman" or "pilot")
- Open-sourced in 2014
- Donated to Cloud Native Computing Foundation (CNCF) in 2015

**Why Google Open-Sourced It**:
- Competition with AWS (container orchestration market)
- Build ecosystem around container orchestration
- Share internal knowledge with community
- Influence cloud-native computing

**The Evolution**:
- **2014**: Initial release (v1.0)
- **2015**: Donated to CNCF, industry adoption begins
- **2016**: Major cloud providers add Kubernetes support (GKE, AKS, EKS)
- **2018**: Kubernetes 1.11, widespread production adoption
- **2020+**: De facto standard for container orchestration

## Kubernetes Architecture

### High-Level Architecture

A Kubernetes cluster consists of:
- **Control Plane (Master)**: Manages the cluster (API Server, etcd, Scheduler, Controller Manager)
- **Worker Nodes**: Run your applications (kubelet, kube-proxy, container runtime, Pods)

The control plane manages worker nodes, schedules pods, monitors cluster state, and ensures desired state matches actual state.

### Control Plane Components

**1. API Server**:
- **Purpose**: Entry point for all operations
- **Responsibilities**:
  - Validates requests
  - Processes and stores objects in etcd
  - Watches for changes and notifies components
- **How it works**:
  - Clients (kubectl, dashboard) send requests to API Server
  - API Server validates and stores in etcd
  - Other components watch API Server for changes

**2. etcd**:
- **Purpose**: Distributed key-value database
- **Stores**:
  - Cluster state (pods, services, deployments, etc.)
  - Configuration
  - Desired state vs actual state
- **Characteristics**:
  - Highly available (clustered)
  - Consistent (single source of truth)
  - Watch API (components get notified of changes)

**3. Scheduler**:
- **Purpose**: Decides which node runs a pod
- **Process**:
  1. Pod created, needs scheduling
  2. Scheduler evaluates all nodes
  3. Filters nodes (resources, constraints)
  4. Scores nodes (best fit)
  5. Assigns pod to node
- **Considers**:
  - Resource requirements (CPU, memory)
  - Node affinity/anti-affinity
  - Taints and tolerations
  - Pod affinity/anti-affinity

**4. Controller Manager**:
- **Purpose**: Runs controllers (control loops)
- **Controllers**:
  - **Deployment Controller**: Ensures desired number of replicas
  - **ReplicaSet Controller**: Manages pod replicas
  - **Service Controller**: Manages load balancers
  - **Namespace Controller**: Manages namespaces
  - **And many more...**
- **How they work**:
  - Watch desired state (from API Server/etcd)
  - Compare with actual state
  - Take action to reconcile (create/delete/update)

**5. Cloud Controller Manager** (Optional):
- **Purpose**: Integrates with cloud providers
- **Functions**:
  - Node controller (manage cloud instances)
  - Route controller (manage cloud load balancers)
  - Service controller (manage cloud services)

### Worker Node Components

**1. kubelet**:
- **Purpose**: Agent running on each node
- **Responsibilities**:
  - Registers node with cluster
  - Watches API Server for pods assigned to node
  - Creates pods via container runtime
  - Reports node and pod status to API Server
  - Executes health checks (liveness, readiness probes)
- **Key Point**: kubelet is the "supervisor" that ensures pods run correctly

**2. kube-proxy**:
- **Purpose**: Network proxy for service networking
- **Functions**:
  - Maintains network rules on nodes
  - Enables service discovery (DNS)
  - Load balances traffic to pods
  - Implements Service abstraction
- **Modes**:
  - **iptables** (default): Uses Linux iptables for routing
  - **IPVS**: More efficient for large clusters
  - **userspace**: Legacy mode

**3. Container Runtime**:
- **Purpose**: Actually runs containers
- **Runtimes**:
  - **containerd** (most common)
  - **CRI-O** (Kubernetes-focused)
  - **Docker** (legacy, via containerd)
- **Interface**: Container Runtime Interface (CRI)
  - Standard API for Kubernetes to talk to runtimes
  - Allows pluggable runtimes

### Pod Architecture

**What is a Pod**:
- **Smallest deployable unit** in Kubernetes
- Contains one or more containers
- Containers in pod share:
  - Network namespace (same IP, can communicate via localhost)
  - Storage volumes
  - IPC namespace (can communicate via localhost)

**Why Pods (Not Just Containers)**:
- Pods represent a cohesive unit of work
- Example: Web server + log sidecar container
- Example: App container + monitoring agent
- Containers in same pod work together

**Pod Lifecycle**:

Pods move through these states:
- **Pending**: Scheduled but not yet running
- **ContainerCreating**: Pulling image and creating containers
- **Running**: Pod is running (containers started)
- **Succeeded**: All containers exited successfully (one-time jobs)
- **Failed**: At least one container exited with error

If a container crashes, Kubernetes automatically restarts it (restart policy).

**Pod States**:
- **Pending**: Scheduled but not yet running
- **ContainerCreating**: Pulling image, creating containers
- **Running**: Pod is running (containers started)
- **Succeeded**: All containers exited successfully (one-time jobs)
- **Failed**: At least one container exited with error
- **Unknown**: Can't determine state (node communication issue)

### Networking Architecture

**Kubernetes Networking Model**:

1. **Pod Network**:
   - Each pod gets unique IP address
   - Pods can communicate directly via IP
   - No NAT for pod-to-pod communication

2. **Service Network**:
   - **ClusterIP** (default): Internal IP, pods access via service name
   - **NodePort**: Exposes service on node IP:port
   - **LoadBalancer**: Cloud provider load balancer
   - **ExternalName**: Maps to external DNS name

3. **Network Plugins** (CNI):
   - **Flannel**: Simple overlay network
   - **Calico**: Policy-driven networking
   - **Weave**: Encrypted networking
   - **Cilium**: eBPF-based networking

**How Services Work**:

Traffic flow:
1. Client Pod sends request to Service (ClusterIP)
2. Service has stable IP that doesn't change
3. kube-proxy maintains network rules (iptables/IPVS)
4. Traffic is routed to healthy pod endpoints
5. Load balancing distributes traffic across multiple pods

### Storage Architecture

**Volume Types**:

1. **emptyDir**:
   - Temporary storage (lifetime of pod)
   - Shared between containers in pod
   - Lost when pod deleted

2. **hostPath**:
   - Mounts node filesystem into pod
   - Persistent across pod restarts
   - **Warning**: Ties pod to specific node

3. **PersistentVolume (PV)**:
   - Cluster-wide storage resource
   - Created by admin
   - Independent of pod lifecycle

4. **PersistentVolumeClaim (PVC)**:
   - User request for storage
   - Binds to available PV
   - Pod uses PVC for storage

5. **StorageClass**:
   - Dynamic provisioning of storage
   - Create PVC → automatically creates PV
   - Supported by cloud providers (AWS EBS, GCP PD, Azure Disk)

### Declarative Configuration

**The Kubernetes Philosophy**:
- **Declarative**: Describe desired state, Kubernetes makes it happen
- **Not Imperative**: Don't tell Kubernetes HOW to do it

**Example**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3  # Desired state: 3 replicas
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
```

**What Kubernetes Does**:
1. Reads desired state (3 replicas)
2. Checks actual state (maybe 2 running)
3. Reconciles (creates 1 more pod)
4. Continues watching (if pod dies, recreates it)

## Design Principles

### Why Kubernetes Succeeded

1. **Declarative Configuration**:
   - Describe what you want, not how to do it
   - Kubernetes figures out how to achieve it
   - Easier to reason about and maintain

2. **Self-Healing**:
   - Automatically restarts failed containers
   - Automatically recreates deleted pods
   - Automatically reschedules pods on failed nodes
   - Reduces manual intervention

3. **Scaling**:
   - Horizontal scaling (add/remove pods)
   - Automatic scaling based on metrics (HPA)
   - Manual scaling via kubectl
   - Handle traffic spikes automatically

4. **Rolling Updates**:
   - Update apps without downtime
   - Gradual rollout (new pods, then delete old)
   - Automatic rollback if health checks fail
   - Canary deployments supported

5. **Abstraction Layers**:
   - **Pods**: Container abstraction
   - **Deployments**: Pod management abstraction
   - **Services**: Networking abstraction
   - **ConfigMaps/Secrets**: Configuration abstraction
   - Each layer solves specific problems

6. **Portability**:
   - Works on any cloud (AWS, GCP, Azure)
   - Works on-premises
   - Standard API means skills transfer
   - Avoid vendor lock-in

7. **Extensibility**:
   - **Custom Resources**: Define your own objects
   - **Operators**: Extend Kubernetes behavior
   - **CNI Plugins**: Pluggable networking
   - **CSI Plugins**: Pluggable storage

### Kubernetes Ecosystem

**The CNCF Landscape**:
- **Service Mesh**: Istio, Linkerd (traffic management)
- **Monitoring**: Prometheus, Grafana
- **Logging**: Fluentd, Loki
- **CI/CD**: Argo CD, Flux, Tekton
- **Security**: Falco, OPA
- **Storage**: Rook, Longhorn
- **And many more...**

## Summary

**Kubernetes solved**:
- Manual container management
- Container crashes and failures
- Scaling challenges
- Service discovery
- Rolling updates
- Multi-server coordination

**How Kubernetes works**:
- Control plane manages worker nodes
- Declarative configuration (describe desired state)
- Controllers reconcile desired vs actual state
- Pods are the unit of deployment
- Services provide networking abstraction

**Why Kubernetes matters**:
- Industry standard for orchestration
- Runs anywhere (cloud, on-premises)
- Huge ecosystem
- Enables cloud-native applications
- Self-healing, auto-scaling, rolling updates

**The result**:
- Automated container management
- Scalable applications
- Zero-downtime deployments
- Multi-cloud portability
- Cloud-native development

