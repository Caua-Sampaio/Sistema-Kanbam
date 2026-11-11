"""API ProspecDash v2. Execute: uvicorn main:app --reload"""
import os
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import criar_token, hash_senha, usuario_atual, verifica_senha
from database import Base, SessionLocal, engine, get_db
from models import Coluna, Lead, Lista, User

COLUNAS_PADRAO = [
    ("prospectado", "Prospectado", "normal"),
    ("primeiro-contato", "Primeiro Contato", "normal"),
    ("negociacao", "Em Negociação", "normal"),
    ("fechado", "Fechado / Cliente", "ganho"),
    ("sem-retorno", "Sem Retorno", "perdido"),
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if not db.scalar(select(User)):
            db.add(User(username=os.getenv("ADMIN_USER", "admin"),
                        password_hash=hash_senha(os.getenv("ADMIN_PASSWORD", "admin"))))
        if not db.scalar(select(Coluna)):
            db.add_all([Coluna(id=i, nome=n, tipo=t, ordem=o) for o, (i, n, t) in enumerate(COLUNAS_PADRAO)])
        db.commit()
    yield


app = FastAPI(title="ProspecDash API", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

StatusSite = Literal["Sem site", "Possui site", "Em construção"]


class LeadIn(BaseModel):
    empresa: str = Field(min_length=1, max_length=160)
    dono: str = ""
    avaliacoes: int = Field(0, ge=0)
    horario: str = ""
    telefone: str = ""
    instagram: str = ""
    status_site: StatusSite = "Sem site"
    coluna_id: str = "prospectado"
    lista_id: str | None = None


class ListaIn(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    nicho: str = ""
    cidade: str = ""
    linhas: list[LeadIn] = []


class ColunaIn(BaseModel):
    nome: str = Field(min_length=1, max_length=60)


def lead_out(l: Lead) -> dict:
    return {"id": l.id, "listaId": l.lista_id, "colunaId": l.coluna_id, "empresa": l.empresa,
            "dono": l.dono, "avaliacoes": l.avaliacoes, "horario": l.horario,
            "telefone": l.telefone, "instagram": l.instagram, "statusSite": l.status_site}


def campos_lead(p: LeadIn, db: Session, lista_id: str) -> dict:
    if not db.get(Coluna, p.coluna_id):
        raise HTTPException(400, "Coluna inexistente")
    return {"lista_id": lista_id, "coluna_id": p.coluna_id, "empresa": p.empresa, "dono": p.dono,
            "avaliacoes": p.avaliacoes, "horario": p.horario, "telefone": p.telefone,
            "instagram": p.instagram, "status_site": p.status_site}


@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == form.username))
    if not user or not verifica_senha(form.password, user.password_hash):
        raise HTTPException(401, "Usuário ou senha inválidos")
    return {"access_token": criar_token(user.username), "token_type": "bearer"}


@app.get("/api/dados")
def dados(db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    return {
        "listas": [{"id": l.id, "nome": l.nome, "nicho": l.nicho, "cidade": l.cidade, "ativa": l.ativa}
                   for l in db.scalars(select(Lista))],
        "colunas": [{"id": c.id, "nome": c.nome, "tipo": c.tipo}
                    for c in db.scalars(select(Coluna).order_by(Coluna.ordem))],
        "leads": [lead_out(l) for l in db.scalars(select(Lead))],
    }


@app.post("/api/listas", status_code=201)
def criar_lista(payload: ListaIn, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    """Importação em lote: cria a lista e todos os leads numa única transação."""
    lista = Lista(nome=payload.nome, nicho=payload.nicho, cidade=payload.cidade)
    db.add(lista)
    db.flush()
    for linha in payload.linhas:
        db.add(Lead(**campos_lead(linha, db, lista.id)))
    db.commit()
    return {"lista": {"id": lista.id, "nome": lista.nome}, "importados": len(payload.linhas)}


@app.post("/api/leads", status_code=201)
def criar_lead(payload: LeadIn, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    if not payload.lista_id:
        raise HTTPException(400, "lista_id é obrigatório")
    lead = Lead(**campos_lead(payload, db, payload.lista_id))
    db.add(lead)
    db.commit()
    return lead_out(lead)


@app.put("/api/leads/{lead_id}")
def atualizar_lead(lead_id: str, payload: LeadIn, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead não encontrado")
    for campo, valor in campos_lead(payload, db, lead.lista_id).items():
        setattr(lead, campo, valor)
    db.commit()
    return lead_out(lead)


@app.patch("/api/leads/{lead_id}/coluna")
def mover_lead(lead_id: str, coluna_id: str, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead não encontrado")
    if not db.get(Coluna, coluna_id):
        raise HTTPException(400, "Coluna inexistente")
    lead.coluna_id = coluna_id
    db.commit()
    return lead_out(lead)


@app.delete("/api/leads/{lead_id}", status_code=204)
def excluir_lead(lead_id: str, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    lead = db.get(Lead, lead_id)
    if lead:
        db.delete(lead)
        db.commit()


@app.post("/api/colunas", status_code=201)
def criar_coluna(payload: ColunaIn, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    from models import novo_id
    total = len(db.scalars(select(Coluna)).all())
    coluna = Coluna(id=novo_id("col"), nome=payload.nome, tipo="normal", ordem=total)
    db.add(coluna)
    db.commit()
    return {"id": coluna.id, "nome": coluna.nome, "tipo": coluna.tipo}
