# Kubernetes Notes Overview

This section contains comprehensive Kubernetes notes covering architecture through advanced topics.

## Contents

1. **Kubernetes Architecture and History** (`00-architecture-and-history.md`)
   - The problem before orchestration
   - The birth of Kubernetes (Borg, Omega, Google's evolution)
   - Kubernetes architecture deep dive (control plane, worker nodes, pods, networking)
   - Design principles and reasoning
   - Kubernetes ecosystem

2. **Kubernetes Fundamentals** (`01-fundamentals.md`)
   - What Kubernetes is and why it matters
   - Core concepts: Pods, Deployments, Services
   - Cluster architecture overview
   - ConfigMaps, Secrets, Namespaces
   - Resource Limits and Requests
   - Common commands and patterns

3. **Kubernetes Advanced Topics** (`02-advanced.md`)
   - StatefulSets, DaemonSets, Jobs, CronJobs
   - Horizontal Pod Autoscaler (HPA)
   - Persistent Volumes and Storage
   - Network Policies
   - RBAC (Role-Based Access Control)
   - Helm (Package Manager)
   - Operators
   - Service Mesh
   - Monitoring and Observability

4. **Kubernetes Advanced Scenarios** (`03-advanced-scenarios.md`)
   - Real-world troubleshooting scenarios
   - Advanced deployment patterns
   - Performance optimization
   - Security hardening
   - Disaster recovery
   - Multi-cluster management

## Quick Reference

**Essential Commands**:
```bash
kubectl get pods                        # List pods
kubectl get deployments                # List deployments
kubectl get services                    # List services
kubectl apply -f deployment.yaml       # Apply configuration
kubectl describe pod <name>             # Describe pod
kubectl logs <pod-name>                 # View logs
kubectl exec -it <pod-name> -- sh       # Get shell
kubectl port-forward <pod-name> 8080:80 # Port forward
kubectl scale deployment <name> --replicas=3 # Scale
```

**Common Operations**:
```bash
# Apply configuration
kubectl apply -f deployment.yaml

# Update deployment
kubectl set image deployment/web nginx=nginx:1.22

# Rollback
kubectl rollout undo deployment/web

# Check rollout status
kubectl rollout status deployment/web

# View resource usage
kubectl top nodes
kubectl top pods
```

**Debugging**:
```bash
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl describe pod <pod-name>
kubectl logs <pod-name> -c <container-name>
kubectl exec -it <pod-name> -- <command>
kubectl get pod <pod-name> -o yaml
```

## Best Practices

- Use Deployments for stateless apps
- Use StatefulSets for stateful apps
- Set resource requests and limits
- Use Namespaces to organize resources
- Store secrets in Kubernetes Secrets (not in config files)
- Use ConfigMaps for configuration
- Implement health checks (liveness, readiness probes)
- Use labels and selectors effectively
- Follow principle of least privilege (RBAC)
- Use Helm charts for complex applications

## Related Topics

- See **Docker** notes for container fundamentals
- See **DevOps** notes for CI/CD integration
- See **Security** notes for Kubernetes security best practices

