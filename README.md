# ProspecDash v2

## Back-end (FastAPI)
    cd backend
    python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    cp .env.example .env        # defina SECRET_KEY e ADMIN_PASSWORD antes de usar
    export $(grep -v '^#' .env | xargs) && uvicorn main:app --reload
Docs da API: http://localhost:8000/docs

## Front-end (Vite)
    cd frontend
    npm install
    npm run dev                 # http://localhost:5173 (proxy /api -> 8000)

Login inicial: ADMIN_USER / ADMIN_PASSWORD (padrão admin/admin, troque antes de publicar).
