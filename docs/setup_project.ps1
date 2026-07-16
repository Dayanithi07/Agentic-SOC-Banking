$ErrorActionPreference = 'Stop'

# Create folder structure
New-Item -ItemType Directory -Force -Path "backend/app/api"
New-Item -ItemType Directory -Force -Path "backend/app/models"
New-Item -ItemType Directory -Force -Path "backend/app/services"
New-Item -ItemType Directory -Force -Path "frontend"

# Write backend files
@'
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Agentic SOC Copilot Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Backend running"}
'@ | Set-Content -Path "backend/app/main.py"

@'
from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
'@ | Set-Content -Path "backend/app/api/health.py"

@'
from fastapi import APIRouter

router = APIRouter()

@router.post("/telemetry", tags=["Agents"])
async def ingest(event: dict):
    # Placeholder – forward to service layer
    return {"received": True}
'@ | Set-Content -Path "backend/app/api/agents.py"

# Write backend Dockerfile
@'
FROM python:3.12-slim AS builder
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY backend/app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
'@ | Set-Content -Path "backend/Dockerfile"

# Write backend requirements
@'
fastapi==0.111.0
uvicorn[standard]==0.30.1
pydantic==2.8.2
httpx==0.27.0
python-dotenv==1.0.1
'@ | Set-Content -Path "backend/requirements.txt"

# Initialize frontend via Vite (requires npm). We'll generate package.json and minimal files.
Set-Location -Path "frontend"
npx -y create-vite@latest . --template react-ts --skipGit

# Write frontend Dockerfile
Set-Location -Path ".."
@'
# Stage 1 – build
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/. ./
RUN npm run build

# Stage 2 – serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
'@ | Set-Content -Path "frontend/Dockerfile"

# Write docker-compose.yml
@'
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - .env
  frontend:
    build: ./frontend
    ports:
      - "5173:80"
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
'@ | Set-Content -Path "docker-compose.yml"

# Write .env example
@'
# Backend
FRONTEND_ORIGIN=http://localhost:5173
# Add your real‑time data source URLs and credentials below
# IAM_ENDPOINT=
# PAM_ENDPOINT=
# EDR_ENDPOINT=
'@ | Set-Content -Path ".env.example"

Write-Host "Project scaffold created. You can now run 'docker-compose up --build' to start the services."
