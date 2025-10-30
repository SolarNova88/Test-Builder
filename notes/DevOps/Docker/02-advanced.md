# Docker Advanced Topics

## Multi-Stage Builds

**Problem**: Build tools and dependencies make final image huge
**Solution**: Multi-stage builds (build in one stage, copy artifacts to minimal final stage)

**Example**:
```dockerfile
# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Benefits**:
- Final image is small (only production files)
- Build tools not in final image (security)
- Faster builds (can cache build stage)

## Docker Compose

**Docker Compose** = Tool for running multiple containers together

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:8000"
    environment:
      - DB_HOST=db
    depends_on:
      - db
    networks:
      - appnet
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - dbdata:/var/lib/postgresql/data
    networks:
      - appnet

volumes:
  dbdata:

networks:
  appnet:
```

**Commands**:
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f web        # Follow logs
docker-compose ps                 # List services
docker-compose exec web sh        # Execute command in service
```

**Benefits**:
- Define entire stack in one file
- Automatic service discovery (use service names as hostnames)
- Shared networks and volumes
- Easy development environment

## Layer Caching Strategy

**Optimize Dockerfile for caching**:

```dockerfile
# BAD: Changes to code invalidate dependency layer
COPY . .
RUN pip install -r requirements.txt

# GOOD: Dependencies cached separately
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

**Why it matters**:
- Dependencies change rarely → cached layer reused
- Code changes frequently → only rebuild code layer
- Faster builds (reuse cached layers)

**Advanced caching**:
```dockerfile
# Use build cache mounts (Docker BuildKit)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

## Security Best Practices

**1. Run as non-root**:
```dockerfile
RUN useradd -m -u 1000 appuser
USER appuser
```

**2. Use minimal base images**:
```dockerfile
FROM python:3.11-alpine  # Alpine Linux = minimal (5MB)
```

**3. Don't bake secrets**:
```dockerfile
# BAD
ENV API_KEY="secret123"

# GOOD
ENV API_KEY="${API_KEY}"
```

**4. Scan images**:
```bash
docker scan myapp:1.0
```

**5. Sign images**:
```bash
docker trust sign myapp:1.0
```

**6. Limit capabilities**:
```bash
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp
```

## Performance Optimization

**1. Minimize layers**:
```dockerfile
# BAD: Many layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git

# GOOD: Combined
RUN apt-get update && \
    apt-get install -y curl git && \
    rm -rf /var/lib/apt/lists/*
```

**2. Use .dockerignore**:
```
node_modules
.git
.env
*.log
```

**3. Order instructions** (frequently changing last):
```dockerfile
# Rarely changes
COPY package.json .
RUN npm install

# Frequently changes
COPY . .
```

**4. Use BuildKit**:
```bash
DOCKER_BUILDKIT=1 docker build .
```

## Troubleshooting

**Common issues**:

**1. Container exits immediately**:
```bash
docker logs <container>           # Check logs
docker run -it myapp sh           # Interactive shell
```

**2. Permission denied**:
```bash
# Check volume permissions
docker exec -it web ls -la /app/data

# Fix ownership
docker exec -it web chown -R appuser:appuser /app/data
```

**3. Out of disk space**:
```bash
docker system df                   # Check disk usage
docker system prune -a             # Clean up
```

**4. Network issues**:
```bash
docker network inspect appnet      # Inspect network
docker exec -it web ping db        # Test connectivity
```

**5. Performance issues**:
```bash
docker stats                       # Monitor resource usage
docker top <container>            # View processes
```

## Advanced Patterns

**1. Init system** (handle signals properly):
```dockerfile
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["python", "app.py"]
```

**2. Health checks**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8000/health || exit 1
```

**3. Labels** (metadata):
```dockerfile
LABEL maintainer="dev@example.com"
LABEL version="1.0"
LABEL description="My application"
```

**4. Build arguments**:
```dockerfile
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}
```

**5. Secrets** (Docker Swarm/Kubernetes):
```dockerfile
RUN --mount=type=secret,id=api_key \
    echo "API_KEY=$(cat /run/secrets/api_key)" >> .env
```

## Dockerfile Patterns

**Python application**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
HEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

**Node.js application**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Go application**:
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o app .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/app .
EXPOSE 8080
CMD ["./app"]
```

## Production Checklist

Before deploying:
- [ ] Run as non-root user
- [ ] Use minimal base image (alpine, slim)
- [ ] Multi-stage builds for small images
- [ ] Health checks configured
- [ ] Resource limits set
- [ ] Secrets not baked into image
- [ ] Images scanned for vulnerabilities
- [ ] Images signed (if using registry)
- [ ] .dockerignore excludes unnecessary files
- [ ] Layer caching optimized

