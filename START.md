# 🚀 Snabbstart - Portalen

## Med Docker (Rekommenderat)

```bash
# Starta allt
docker-compose up --build

# I bakgrunden
docker-compose up -d --build
```

Öppna sedan:
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Lokalt (utan Docker)

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend (med Bun)
```bash
cd frontend
bun install
bun run dev
```

### Frontend (med npm)
```bash
cd frontend
npm install
npm run dev
```

## Stoppa

**Docker:**
```bash
docker-compose down
```

**Lokalt:**
Tryck `Ctrl+C` i terminalerna

