# Employee Management System

A containerized Employee Management System using React/Vite, FastAPI, MySQL and Nginx.

## Features

- Add employee
- Update employee
- Delete employee
- Search employees
- Employee listing
- Health endpoint
- Docker health checks
- Persistent MySQL volume
- Separate Docker networks
- Non-root backend/frontend execution
- Multi-stage Docker builds
- GitHub Actions CI/CD
- Trivy image scanning
- Docker Hub push

## Architecture

```text
Internet
   |
   v
 Nginx :80
   |
   +----> Frontend :3000
   |
   +----> Backend :8000 ----> MySQL :3306
```

MySQL has **no host port mapping**. Only the backend can reach MySQL over the internal `backend-net`.

## Start

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Open:

```text
http://localhost
```

## Verify MySQL is not exposed

```bash
docker ps
nc -zv localhost 3306
```

The second command should fail because MySQL port 3306 is not published to the host.

## Verify Backend -> MySQL

```bash
docker exec employee-backend python -c "import socket; s=socket.create_connection(('mysql',3306),5); print('MYSQL ACCESS OK'); s.close()"
```

## Verify networks

```bash
docker network ls
docker network inspect employee-management_backend-net
docker network inspect employee-management_frontend-net
```

## Verify non-root execution

```bash
docker exec employee-backend whoami
docker exec employee-frontend whoami
```

Expected backend user:

```text
appuser
```

## API

```text
GET    /api/employees
GET    /api/employees/search?q=john
GET    /api/employees/{id}
POST   /api/employees
PUT    /api/employees/{id}
DELETE /api/employees/{id}
GET    /health
```

## CI/CD

GitHub Actions pipeline:

```text
Checkout
   |
Lint
   |
Test
   |
Docker Build
   |
Docker Scan
   |
Docker Hub Push
```

Create GitHub repository secrets:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```

Then push to `main`.
# employee-management-docker
