# Docker Operations Skill

Use this skill when working with Docker and docker-compose operations.

## Quick Start

```bash
# Start all services
npm run dev

# Stop all services
npm run stop

# Clean restart (delete volumes and data)
npm run dev:clean

# Rebuild containers
npm run dev:build
```

## Services

The project runs 3 services in Docker:

1. **firebase-emulator** - Firebase Emulator Suite
2. **api** - Node.js API server
3. **frontend** - Vite development server

## Docker Compose Commands

### Start services
```bash
docker-compose up
```

### Start in detached mode
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes
```bash
docker-compose down -v
```

### Rebuild specific service
```bash
docker-compose up --build firebase-emulator
docker-compose up --build api
docker-compose up --build frontend
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f firebase-emulator
docker-compose logs -f api
docker-compose logs -f frontend
```

### Execute command in container
```bash
docker-compose exec firebase-emulator sh
docker-compose exec api sh
docker-compose exec frontend sh
```

### Check service status
```bash
docker-compose ps
```

### Restart single service
```bash
docker-compose restart api
```

## Health Checks

All services have health checks configured:

### Firebase Emulator
- Checks: `http://localhost:4000`
- Interval: 30s
- Start period: 60s (emulator takes time to start)

### API
- Checks: `/health` endpoint
- Interval: 30s
- Start period: 10s

### Frontend
- No health check (development server)

## Networking

Services communicate via `teamnotes-network`:

- **Host → Services**: Uses localhost with exposed ports
- **Service → Service**: Uses service names (e.g., `api` → `firebase-emulator:8080`)

Example internal URLs:
```
frontend → api: http://api:3000 (not used, frontend runs in browser)
api → firestore: firebase-emulator:8080
api → auth: firebase-emulator:9099
```

## Volumes

### Named Volumes (for performance)
```yaml
volumes:
  firebase_functions_node_modules:
  frontend_node_modules:
```

These prevent syncing node_modules on Mac/Windows, improving performance.

### Bind Mounts (for hot reload)
```yaml
volumes:
  - ./frontend/src:/app/src           # Frontend source
  - ./api/src:/app/src                 # API source
  - ./firebase/functions:/firebase/functions  # Functions source
```

## Port Mapping

| Service | Internal Port | External Port | Purpose |
|---------|--------------|---------------|---------|
| firebase-emulator | 4000 | 4000 | Emulator UI |
| firebase-emulator | 4400 | 4400 | Emulator Hub |
| firebase-emulator | 5001 | 5001 | Cloud Functions |
| firebase-emulator | 5002 | 5002 | Hosting |
| firebase-emulator | 8080 | 8080 | Firestore |
| firebase-emulator | 9099 | 9099 | Auth |
| api | 3000 | 3000 | REST API |
| frontend | 5173 | 5173 | Vite dev server |

## Troubleshooting

### Port already in use
```bash
# Find process using port
lsof -ti:4000

# Kill process
lsof -ti:4000 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "4001:4000"  # Maps external 4001 to internal 4000
```

### Container won't start
```bash
# View logs
docker-compose logs firebase-emulator

# Check health
docker-compose ps

# Restart service
docker-compose restart firebase-emulator
```

### Changes not reflecting
```bash
# Rebuild and restart
docker-compose up --build

# For frontend/API, they mount source directly, so changes should reflect
# If not, check volumes are mounted correctly
docker-compose exec frontend ls -la /app/src
```

### Clean slate
```bash
# Remove everything
docker-compose down -v
rm -rf firebase/data
docker-compose up --build
```

### Out of disk space
```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Nuclear option (removes ALL Docker data)
docker system prune -a --volumes
```

## Development Workflow

1. **First time setup**:
   ```bash
   npm install              # Install root dependencies
   npm run dev:build        # Build containers
   npm run seed            # Seed test data (separate terminal)
   ```

2. **Daily development**:
   ```bash
   npm run dev             # Start services
   # Make changes - hot reload enabled
   npm run logs:api        # View logs if needed
   ```

3. **Debugging**:
   ```bash
   docker-compose logs -f api        # View specific service logs
   docker-compose exec api sh        # Shell into container
   ```

## Environment Variables

Set in `docker-compose.yml` per service:

```yaml
environment:
  - NODE_ENV=development
  - FIREBASE_PROJECT_ID=teamnotes-demo
```

Override with `.env` file:
```bash
# .env (root directory)
NODE_ENV=production
FIREBASE_PROJECT_ID=my-project
```

## Production Build

For production, modify Dockerfiles:

### API Production Dockerfile
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
USER node
CMD ["node", "src/index.js"]
```

### Frontend Production Dockerfile
```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Tips

1. **Use named volumes** for node_modules (already configured)
2. **Don't mount node_modules** from host (already excluded)
3. **Use .dockerignore** to exclude unnecessary files
4. **Multi-stage builds** for smaller production images
5. **Layer caching** - Copy package.json before source code

## Security Tips

1. **Run as non-root** user (already configured for API)
2. **Use specific image tags** not `latest`
3. **Scan images** with `docker scan`
4. **Limit resources** with `--memory` and `--cpus`
5. **Use secrets** for sensitive data (not environment variables)

## Docker Compose Best Practices

✅ **Do**:
- Use named volumes for performance
- Set health checks for dependencies
- Use service names for internal networking
- Mount only necessary files
- Set restart policies

❌ **Don't**:
- Mount node_modules from host
- Use `latest` tags in production
- Expose unnecessary ports
- Run as root (unless required)
- Hardcode secrets in docker-compose.yml
