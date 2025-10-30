# Docker Fundamentals

## What Docker Is (Simple Terms)

Think of Docker like **shipping containers** for code:

- **Shipping containers** = Standardized boxes that work anywhere (ships, trucks, trains)
- **Docker containers** = Standardized boxes for code that work anywhere (your laptop, AWS, Azure, GCP)

**Before Docker**: "Works on my machine" problem
- Developer's laptop: Has Python 3.9, specific libraries, specific OS
- Production server: Has Python 3.11, different libraries, different OS
- Result: Code breaks in production

**With Docker**: Same environment everywhere
- Developer builds container with Python 3.9, specific libraries, specific OS
- Same container runs on laptop, staging, production
- Result: Works everywhere (no more "works on my machine")

## Why Docker Matters

- **Consistency**: Same environment everywhere (dev, staging, production)
- **Isolation**: One app can't break another (separate containers)
- **Portability**: Build once, run anywhere (laptop, AWS, Azure, GCP)
- **Resource efficiency**: Containers share the OS kernel (unlike VMs)
- **Fast deployment**: Containers start in seconds (not minutes like VMs)
- **Scaling**: Spin up more containers when traffic increases

## Core Concepts

### Images vs Containers

**Image** = Blueprint/recipe (like a cookie recipe)
- **Immutable**: Once built, doesn't change
- **Layered**: Each Dockerfile instruction creates a layer
- **Reusable**: Build once, use many times
- **Example**: `python:3.11-slim`, `node:20-alpine`, `postgres:15`

**Container** = Running instance from an image (like cookies baked from recipe)
- **Ephemeral**: Can be deleted and recreated instantly
- **Isolated**: Separate filesystem, network, processes
- **Fast**: Starts in seconds (not minutes)
- **Example**: Running container from `python:3.11-slim` image

**Key Point**: Image is the blueprint, container is the running thing.

**Lifecycle**:
1. Build image from Dockerfile → `docker build -t myapp:1.0 .`
2. Run container from image → `docker run -d --name web myapp:1.0`
3. Container runs (processes execute)
4. Container stops → `docker stop web`
5. Container can be deleted → `docker rm web`

### Dockerfile Basics

**Dockerfile** = Recipe for building an image

**Simple example**:
```dockerfile
# Base image (like starting from a base cake mix)
FROM python:3.11-slim

# Working directory (where commands run)
WORKDIR /app

# Copy requirements first (for layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (documentation, not enforcement)
EXPOSE 8000

# Run command when container starts
CMD ["python", "app.py"]
```

**Layer caching**:
- Docker caches each layer
- If `requirements.txt` doesn't change, Docker reuses cached layer
- Put frequently changing files (your code) last
- Put rarely changing files (dependencies) first

### Building Images

**Build image**:
```bash
docker build -t myapp:1.0 .
```

**What happens**:
1. Docker reads Dockerfile
2. Executes each instruction (creates a layer)
3. Caches layers for future builds
4. Tags image as `myapp:1.0`

**Best practices**:
- **Pin base images**: `python:3.11-slim` not `python:latest`
- **Multi-stage builds**: Build and final stages (smaller final image)
- **Layer order**: Dependencies before code (better caching)
- **.dockerignore**: Exclude unnecessary files (like `.git`)

### Running Containers

**Run container**:
```bash
docker run -d --name web -p 8080:8000 myapp:1.0
```

**Common flags**:
- `-d`: Detached mode (run in background)
- `--name web`: Name the container
- `-p 8080:8000`: Map port 8080 (host) to 8000 (container)
- `-e VAR=value`: Set environment variable
- `--env-file .env`: Load environment variables from file
- `-v /host/path:/container/path`: Mount volume
- `--restart unless-stopped`: Auto-restart on failure

**ENTRYPOINT vs CMD**:
- **ENTRYPOINT**: The executable (always runs)
  ```dockerfile
  ENTRYPOINT ["python"]
  ```
- **CMD**: Default arguments (can be overridden)
  ```dockerfile
  CMD ["app.py"]
  ```
- **Combined**: `docker run myapp` runs `python app.py`
- **Override CMD**: `docker run myapp python server.py` overrides CMD

### Volumes

**Volume** = Persistent storage that survives container deletion

**Types**:
1. **Named volume** (Docker-managed):
   ```bash
   docker volume create mydata
   docker run -v mydata:/app/data myapp
   ```
   - Docker manages it
   - Location: `/var/lib/docker/volumes/mydata`

2. **Bind mount** (host path):
   ```bash
   docker run -v /home/user/data:/app/data myapp
   ```
   - Points to specific host path
   - Useful for development (see changes immediately)

3. **Anonymous volume** (temporary):
   ```bash
   docker run -v /app/data myapp
   ```
   - Docker creates temporary volume
   - Lost when container removed

**Why volumes matter**:
- **Databases**: Data persists when container restarts
- **Logs**: Store logs outside container
- **User uploads**: Files survive container deletion
- **Configuration**: Shared config files

**Common pitfalls**:
- **Permission issues**: Container runs as user 1000, host folder owned by different user
- **Not using volumes**: Database data lost when container deleted
- **Exposing host paths**: Security risk (container can access host filesystem)

### Networks

**Network** = Virtual network where containers communicate

**Types**:
1. **Bridge** (default):
   - Containers on same network can communicate
   - Isolated from host network
   - Example: `docker network create mynet`

2. **Host**:
   - Container uses host's network directly
   - Faster (no network translation)
   - Less secure (container exposed to host)

3. **None**:
   - No network (completely isolated)
   - Rarely used

**Service discovery**:
- Containers on same network can use service names as DNS
- Example: `http://db:5432` instead of `http://172.17.0.5:5432`
- Docker Compose automatically creates network with service names

**Example**:
```bash
# Create network
docker network create appnet

# Run database
docker run -d --name db --network appnet postgres:15

# Run app (can connect to db using 'db' as hostname)
docker run -d --name app --network appnet -e DB_HOST=db myapp
```

### Health Checks

**Health check** = Docker automatically checks if container is healthy

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:8000/health || exit 1
```

**What it does**:
- Docker runs command every 30 seconds
- If command succeeds → container healthy
- If command fails → container unhealthy
- Used by orchestration (Kubernetes, Docker Swarm)

**Common checks**:
- HTTP endpoint: `curl -f http://localhost:8000/health`
- TCP port: `nc -z localhost 5432`
- File exists: `test -f /app/ready`

### Resource Limits

**Limit resources**:
```bash
docker run --cpus="1.5" --memory="512m" myapp
```

**Why it matters**:
- **Prevents resource hogging**: One container can't starve others
- **Cost control**: Limits cloud costs
- **Predictable performance**: Guaranteed resources

**Common limits**:
- **CPU**: `--cpus="1.5"` (1.5 CPU cores)
- **Memory**: `--memory="512m"` (512 MB RAM)
- **Swap**: `--memory-swap="1g"` (1 GB swap)

## Common Commands

**Build and run**:
```bash
docker build -t myapp:1.0 .           # Build image
docker run -d --name web myapp:1.0    # Run container
docker ps                              # List running containers
docker ps -a                           # List all containers
docker logs -f web                     # Follow logs
docker stop web                         # Stop container
docker start web                        # Start container
docker rm web                           # Delete container
docker rmi myapp:1.0                   # Delete image
```

**Debugging**:
```bash
docker exec -it web sh                  # Get shell in container
docker exec -it web python              # Run command in container
docker inspect web                       # Inspect container config
docker logs web                          # View logs
docker events                            # Watch container events
docker stats                             # Resource usage
```

**Volumes**:
```bash
docker volume create mydata             # Create volume
docker volume ls                         # List volumes
docker volume inspect mydata            # Inspect volume
docker volume rm mydata                 # Delete volume
```

**Networks**:
```bash
docker network create appnet            # Create network
docker network ls                       # List networks
docker network inspect appnet          # Inspect network
docker network rm appnet                # Delete network
```

**Cleanup**:
```bash
docker system prune                     # Remove unused containers/networks/images
docker system prune -a                 # Remove everything (including images)
docker container prune                  # Remove stopped containers
docker image prune                      # Remove unused images
docker volume prune                     # Remove unused volumes
```

## Best Practices

**Building**:
- Pin base images: `python:3.11-slim` not `python:latest`
- Multi-stage builds: Separate build and runtime stages
- Layer order: Dependencies before code (better caching)
- Use `.dockerignore`: Exclude unnecessary files
- Minimize layers: Combine RUN commands when possible

**Security**:
- Run as non-root user:
  ```dockerfile
  RUN useradd -m appuser
  USER appuser
  ```
- Don't bake secrets into images (use environment variables)
- Scan images for vulnerabilities: `docker scan myapp:1.0`
- Keep base images updated (security patches)
- Use minimal base images (alpine, slim)

**Performance**:
- Use layer caching effectively
- Multi-stage builds (smaller final images)
- Exclude unnecessary files (.dockerignore)
- Health checks for readiness
- Resource limits prevent overconsumption

