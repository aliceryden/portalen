# 🐴 Portalen - Bokningsplattform för Hovslagare

En fullstack-applikation som kopplar samman hästägare med hovslagare för enkel bokning av hovvård.

## 🏗️ Projektstruktur

```
portalen/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── core/      # Konfiguration, säkerhet
│   │   ├── models/    # Databasmodeller
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Affärslogik
│   └── requirements.txt
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   └── package.json
└── docker-compose.yml
```

## 🚀 Funktioner

### Hästägare
- Skapa konto och logga in
- Registrera hästar med information
- Sök och filtrera hovslagare på karta
- Boka tider
- Lämna omdömen och betyg

### Hovslagare
- Skapa professionell profil
- Ange tjänster och priser
- Hantera schema och tillgänglighet
- Definiera arbetsområden
- Hantera bokningar

### Admin
- Hantera användare
- Övervaka bokningar
- Se statistik och rapporter

## 🛠️ Teknisk Stack

- **Frontend:** React 18, Vite, TailwindCSS, React Query, Leaflet, Bun
- **Backend:** FastAPI, SQLAlchemy, Pydantic
- **Databas:** PostgreSQL (produktion) / SQLite (utveckling)
- **Autentisering:** JWT
- **Container:** Docker & Docker Compose

## 🚀 Snabbstart med Docker

Det enklaste sättet att starta projektet är med Docker Compose:

```bash
# Starta alla tjänster (backend, frontend, databas)
docker-compose up --build

# Eller i bakgrunden
docker-compose up -d --build
```

Efter start:
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8000
- **API Dokumentation**: http://localhost:8000/docs

För att stoppa:
```bash
docker-compose down
```

## 📦 Lokal utveckling (utan Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend körs på http://localhost:8000

### Frontend (med Bun)

```bash
cd frontend

# Installera Bun om du inte har det
curl -fsSL https://bun.sh/install | bash

# Installera dependencies
bun install

# Starta utvecklingsserver
bun run dev
```

Frontend körs på http://localhost:5174

### Frontend (med npm - alternativ)

```bash
cd frontend
npm install
npm run dev
```

## 🔧 Miljövariabler

### Backend (.env)

Skapa `backend/.env`:

```env
DATABASE_URL=sqlite:///./portalen.db  # För utveckling
# DATABASE_URL=postgresql://user:password@localhost:5432/portalen  # För produktion
SECRET_KEY=din-hemliga-nyckel
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (.env)

Skapa `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## 🐳 Docker-kommandon

```bash
# Bygga om alla containers
docker-compose build

# Starta i bakgrunden
docker-compose up -d

# Visa loggar
docker-compose logs -f

# Stoppa alla services
docker-compose down

# Stoppa och ta bort volumes (raderar databas)
docker-compose down -v

# Starta endast databas
docker-compose up db

# Starta endast backend
docker-compose up backend

# Starta endast frontend
docker-compose up frontend
```

## 📝 Licens

MIT
