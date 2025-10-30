# Docker Notes (Expanded)

## Images vs Containers

- Images: immutable, layered artifacts; tag and push to registries
- Containers: ephemeral runtimes; keep immutable; configuration via env/flags

## Building

- Multi-stage Dockerfiles; cache-friendly order (deps before app code)
- Pin base images; avoid `latest`; prefer slim/alpine when appropriate

## Running

- `ENTRYPOINT` vs `CMD`; healthchecks; resource limits (`--cpus`, `--memory`)
- Env files (`--env-file`), secrets (avoid baking into images)

## Volumes

- Named vs bind mounts; ownership and UID/GID mapping; read-only mounts when possible

## Networks

- User-defined bridge for service-name DNS; avoid exposing internal ports publicly

## Security

- Run as non-root, minimize attack surface, scan images, sign images

## Troubleshooting

- `docker logs -f`, `docker exec -it`, `docker inspect`, `docker events`
