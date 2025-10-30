# Docker Notes Overview

This section contains comprehensive Docker notes covering fundamentals through advanced topics.

## Contents

1. **Docker Fundamentals** (`01-fundamentals.md`)
   - What Docker is and why it matters
   - Core concepts: Images, Containers, Dockerfiles
   - Building, running, volumes, networks
   - Health checks, resource limits
   - Best practices

2. **Docker Advanced Topics** (`02-advanced.md`)
   - Multi-stage builds
   - Docker Compose
   - Layer caching strategies
   - Security best practices
   - Performance optimization
   - Troubleshooting
   - Advanced patterns

## Quick Reference

**Essential Commands**:
```bash
docker build -t myapp:1.0 .           # Build image
docker run -d --name web myapp:1.0    # Run container
docker ps                             # List containers
docker logs -f web                    # Follow logs
docker exec -it web sh                # Get shell
docker stop web                       # Stop container
docker rm web                         # Delete container
```

**Docker Compose**:
```bash
docker-compose up -d                  # Start services
docker-compose down                   # Stop services
docker-compose logs -f web            # Follow logs
```

**Cleanup**:
```bash
docker system prune                   # Remove unused resources
docker system prune -a                # Remove everything unused
```

## Best Practices

- Use multi-stage builds for smaller images
- Pin base images (avoid `latest`)
- Set resource limits
- Use health checks
- Run as non-root user
- Don't bake secrets into images
- Use `.dockerignore`

## Related Topics

- See **Kubernetes** notes for container orchestration
- See **DevOps** notes for CI/CD integration
