# Containers / Images / Volumes / Networks

## What They Are (Simple Terms)

Think of Docker like shipping:

- **Image** = The blueprint/recipe (like a cookie recipe)
  - Contains everything needed to run an app: code, dependencies, OS
  - It's a file you can save, share, and version
- **Container** = The actual running instance (like cookies baked from the recipe)
  - Started from an image; can be stopped, deleted, and restarted
  - Isolated from other containers (like separate kitchens)
- **Volume** = Shared storage (like a shared refrigerator)
  - Data persists even when containers are deleted
  - Used for databases, logs, user uploads
- **Network** = Virtual network connecting containers (like intercoms between kitchens)
  - Containers can talk to each other using service names
  - Isolated from the host network for security

## Why This Matters

- **Consistency**: "Works on my machine" becomes "works everywhere" because the environment is identical
- **Isolation**: One app can't break another (they're in separate containers)
- **Portability**: Build once, run anywhere (your laptop, AWS, Azure, etc.)
- **Scalability**: Spin up more containers when traffic increases
- **Resource efficiency**: Containers share the OS kernel (unlike VMs which need their own OS)

## Real-World Example

**Building and running a web app**:

```bash
# 1. Build an image (create the blueprint)
docker build -t myapp:1.0 .

# 2. Run a container (bake cookies from recipe)
docker run -d -p 8080:80 --name web myapp:1.0

# 3. Check it's running
curl http://localhost:8080
```

**What happened**:
1. You created an **image** called `myapp:1.0` from a Dockerfile
2. You started a **container** named `web` from that image
3. The container maps port 8080 (your laptop) to port 80 (inside container)
4. Your app is now running, isolated from everything else

## Images

**Image** = Blueprint for creating containers

- Layered, immutable filesystem snapshots built from a Dockerfile
  - Each Dockerfile instruction creates a layer
  - Layers are cached, so rebuilds are fast
- Tagging: `myapp:1.2.3`; avoid `latest` in prod; pin bases (`node:20.10-alpine`)
  - Tags let you version images: `myapp:1.0`, `myapp:1.1`, `myapp:latest`
- Multi-stage builds to reduce size; keep dependency steps early for caching
  - First stage: build the app
  - Second stage: copy only what's needed (smaller final image)

**Key point**: Images are **immutable**. Once built, they don't change. To update, build a new image.

## Containers

**Container** = Running instance from an image

- Ephemeral runtime from an image; fast start/stop; isolated namespaces/cgroups
  - Containers can be deleted and recreated instantly
  - They're isolated: changes inside don't affect the host
- `ENTRYPOINT` vs `CMD`: executable vs default args; healthchecks for readiness
  - `ENTRYPOINT` = the program to run
  - `CMD` = default arguments to that program

**Lifecycle**:
1. `docker create` - Create container (doesn't start)
2. `docker start` - Start it
3. `docker stop` - Stop it (data remains)
4. `docker rm` - Delete it (data lost unless in volume)

## Volumes

**Volume** = Persistent storage that survives container deletion

- **Named** volumes (managed by Docker) vs **Bind** mounts (host path)
  - Named volume: Docker manages it (`docker volume create mydata`)
  - Bind mount: Point to specific folder on your host (`-v /home/user/data:/app/data`)
- Persist DB/data across container restarts; be mindful of permissions/UIDs
  - Database data lives in volumes, so deleting the container doesn't lose data
  - Permission issues are common: container might run as user 1000, but host folder is owned by different user

**When to use volumes**:
- Database files (PostgreSQL data directory)
- User uploads
- Logs you want to keep
- Configuration files

**When NOT to use volumes**:
- Temporary files
- Build artifacts
- Application code (should be in image)

## Networks

**Network** = Virtual network where containers communicate

- Drivers: `bridge` (default), `host`, `none`, user-defined bridges (with service-name DNS)
  - Bridge: Isolated network (default)
  - Host: Uses host's network directly (faster, less secure)
  - None: No network (completely isolated)
- Compose puts services on a network; use service names (e.g., `db:5432`)
  - Instead of `localhost:5432`, use `db:5432` (Docker resolves `db` to the database container's IP)

**Why this matters**: 
- Containers on the same network can talk to each other
- Containers on different networks are isolated (can't communicate)
- Service names act like DNS: `http://api:3000` instead of needing to know IP addresses

## Common Commands

```
docker build -t myapp:1.0 .              # Build image
docker run -d --name web -p 8080:80 myapp:1.0  # Run container
docker volume create appdata             # Create volume
docker network create appnet             # Create network
docker exec -it web sh                   # Get shell inside container
docker logs -f web                       # Follow logs
docker ps                                # List running containers
docker stop web                          # Stop container
docker rm web                            # Delete container
docker images                            # List images
```

## Common Pitfalls

- **Forgetting volumes**: Database data gets deleted when container is removed
- **Port conflicts**: Trying to use port 8080 when something else is using it
- **Permission issues**: Container can't write to volume (check UID/GID)
- **Network isolation**: Containers can't talk because they're on different networks
- **Using `latest` tag in production**: Tag might change, breaking deployments
- **Not cleaning up**: Old containers and images eat disk space (`docker system prune`)

## Best Practices

- **Use specific tags**: `myapp:1.2.3` instead of `myapp:latest`
- **Multi-stage builds**: Keep final images small
- **Health checks**: Verify containers are actually ready
- **Resource limits**: Set memory/CPU limits to prevent one container from hogging resources
- **Read-only filesystems**: Mount volumes as read-only when possible
- **Non-root users**: Don't run containers as root for security
