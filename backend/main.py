"""API ProspecDash v2. Execute: uvicorn main:app --reload"""
import datetime as dt
import os
import re
import sqlite3
import tempfile
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from auth import criar_token, hash_senha, usuario_atual, verifica_senha
from database import Base, SessionLocal, caminho_sqlite, engine, get_db
from models import Coluna, Contato, Lead, Lista, User, novo_id

COLUNAS_PADRAO = [
    ("prospectado", "Prospectado", "normal"),
    ("primeiro-contato", "Primeiro Contato", "normal"),
    ("negociacao", "Em Negociação", "normal"),
    ("fechado", "Fechado / Cliente", "ganho"),
    ("sem-retorno", "Sem Retorno", "perdido"),
]
DATA = r"^\d{4}-\d{2}-\d{2}$"
COLUNAS_NOVAS_LEADS = [
    ("bairro", "VARCHAR(80) DEFAULT ''"),
    ("nicho", "VARCHAR(60) DEFAULT ''"),
    ("origem", "VARCHAR(60) DEFAULT ''"),
    ("excluido_em", "VARCHAR(25)"),
]


def migrar_banco():
    """Adiciona colunas novas em bancos de versões anteriores, sem apagar dados (SQLite)."""
    if engine.dialect.name != "sqlite":
        return
    with engine.begin() as conn:
        existentes = {linha[1] for linha in conn.exec_driver_sql("PRAGMA table_info(leads)")}
        for nome, tipo in COLUNAS_NOVAS_LEADS:
            if nome not in existentes:
                conn.exec_driver_sql(f"ALTER TABLE leads ADD COLUMN {nome} {tipo}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)  # cria tabelas novas sem apagar dados
    migrar_banco()
    with SessionLocal() as db:
        if not db.scalar(select(User)):
            db.add(User(username=os.getenv("ADMIN_USER", "admin"),
                        password_hash=hash_senha(os.getenv("ADMIN_PASSWORD", "admin"))))
        if not db.scalar(select(Coluna)):
            db.add_all([Coluna(id=i, nome=n, tipo=t, ordem=o) for o, (i, n, t) in enumerate(COLUNAS_PADRAO)])
        db.commit()
    yield


app = FastAPI(title="ProspecDash API", version="2.2.0", lifespan=lifespan)
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
    bairro: str = Field("", max_length=80)
    nicho: str = Field("", max_length=60)
    origem: str = Field("", max_length=60)
    coluna_id: str = "prospectado"
    lista_id: str | None = None


class ListaIn(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    nicho: str = ""
    cidade: str = ""
    linhas: list[LeadIn] = []


class ColunaIn(BaseModel):
    nome: str = Field(min_length=1, max_length=60)


class ContatoIn(BaseModel):
    nota: str = Field(min_length=1, max_length=2000)
    proximo_contato: str | None = Field(default=None, pattern=DATA)


class SenhaIn(BaseModel):
    atual: str = Field(min_length=1)
    nova: str = Field(min_length=6)


def agora() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


PLACEHOLDERS = {"não encontrado", "nao encontrado", "não informado", "nao informado", "n/a", "-", "—"}


def limpo(texto: str) -> str:
    """Trata textos de preenchimento (ex.: 'não encontrado') como campo vazio."""
    t = (texto or "").strip()
    return "" if t.lower() in PLACEHOLDERS else t


def so_digitos(texto: str) -> str:
    return re.sub(r"\D", "", texto or "")


def chave_insta(texto: str) -> str:
    return limpo(texto).lower()


def lead_out(l: Lead) -> dict:
    return {"id": l.id, "listaId": l.lista_id, "colunaId": l.coluna_id, "empresa": l.empresa,
            "dono": l.dono, "avaliacoes": l.avaliacoes, "horario": l.horario,
            "telefone": l.telefone, "instagram": l.instagram, "statusSite": l.status_site,
            "bairro": l.bairro, "nicho": l.nicho, "origem": l.origem}


def contato_out(c: Contato) -> dict:
    return {"id": c.id, "leadId": c.lead_id, "criadoEm": c.criado_em,
            "nota": c.nota, "proximoContato": c.proximo_contato}


def campos_lead(p: LeadIn, db: Session, lista_id: str) -> dict:
    if not db.get(Coluna, p.coluna_id):
        raise HTTPException(400, "Coluna inexistente")
    return {"lista_id": lista_id, "coluna_id": p.coluna_id, "empresa": p.empresa, "dono": limpo(p.dono),
            "avaliacoes": p.avaliacoes, "horario": limpo(p.horario), "telefone": limpo(p.telefone),
            "instagram": limpo(p.instagram), "status_site": p.status_site,
            "bairro": limpo(p.bairro), "nicho": limpo(p.nicho), "origem": limpo(p.origem)}


def lead_ativo(db: Session, lead_id: str) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead or lead.excluido_em:
        raise HTTPException(404, "Lead não encontrado")
    return lead


@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == form.username))
    if not user or not verifica_senha(form.password, user.password_hash):
        raise HTTPException(401, "Usuário ou senha inválidos")
    return {"access_token": criar_token(user.username), "token_type": "bearer"}


@app.post("/api/auth/senha", status_code=204)
def trocar_senha(payload: SenhaIn, db: Session = Depends(get_db), usuario: str = Depends(usuario_atual)):
    user = db.scalar(select(User).where(User.username == usuario))
    if not user or not verifica_senha(payload.atual, user.password_hash):
        raise HTTPException(400, "Senha atual incorreta")
    user.password_hash = hash_senha(payload.nova)
    db.commit()


@app.get("/api/dados")
def dados(db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    return {
        "listas": [{"id": l.id, "nome": l.nome, "nicho": l.nicho, "cidade": l.cidade, "ativa": l.ativa}
                   for l in db.scalars(select(Lista))],
        "colunas": [{"id": c.id, "nome": c.nome, "tipo": c.tipo}
                    for c in db.scalars(select(Coluna).order_by(Coluna.ordem))],
        "leads": [lead_out(l) for l in db.scalars(select(Lead).where(Lead.excluido_em.is_(None)))],
        "contatos": [contato_out(c) for c in db.scalars(select(Contato))],
    }


@app.post("/api/listas", status_code=201)
def criar_lista(payload: ListaIn, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    """Importação em lote. Ignora leads já cadastrados (mesmo telefone ou Instagram)."""
    ativos = db.scalars(select(Lead).where(Lead.excluido_em.is_(None))).all()
    tels = {so_digitos(l.telefone) for l in ativos if len(so_digitos(l.telefone)) >= 8}
    igs = {chave_insta(l.instagram) for l in ativos if chave_insta(l.instagram)}

    lista = Lista(nome=payload.nome, nicho=payload.nicho, cidade=payload.cidade)
    db.add(lista)
    db.flush()
    importados = duplicados = 0
    for linha in payload.linhas:
        tel, ig = so_digitos(linha.telefone), chave_insta(linha.instagram)
        if (len(tel) >= 8 and tel in tels) or (ig and ig in igs):
            duplicados += 1
            continue
        db.add(Lead(**campos_lead(linha, db, lista.id)))
        importados += 1
        if len(tel) >= 8:
            tels.add(tel)
        if ig:
            igs.add(ig)
    db.commit()
    return {"lista": {"id": lista.id, "nome": lista.nome}, "importados": importados, "duplicados": duplicados}


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
    lead = lead_ativo(db, lead_id)
    for campo, valor in campos_lead(payload, db, lead.lista_id).items():
        setattr(lead, campo, valor)
    db.commit()
    return lead_out(lead)


@app.patch("/api/leads/{lead_id}/coluna")
def mover_lead(lead_id: str, coluna_id: str, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    lead = lead_ativo(db, lead_id)
    if not db.get(Coluna, coluna_id):
        raise HTTPException(400, "Coluna inexistente")
    lead.coluna_id = coluna_id
    db.commit()
    return lead_out(lead)


@app.delete("/api/leads/{lead_id}", status_code=204)
def excluir_lead(lead_id: str, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    """Exclusão lógica: o lead some da tela, mas pode ser restaurado."""
    lead = lead_ativo(db, lead_id)
    lead.excluido_em = agora()
    db.commit()


@app.post("/api/leads/{lead_id}/restaurar")
def restaurar_lead(lead_id: str, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead não encontrado")
    lead.excluido_em = None
    db.commit()
    return lead_out(lead)


@app.post("/api/leads/{lead_id}/contatos", status_code=201)
def criar_contato(lead_id: str, payload: ContatoIn, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    lead_ativo(db, lead_id)
    contato = Contato(lead_id=lead_id, criado_em=agora(), nota=payload.nota.strip(),
                      proximo_contato=payload.proximo_contato)
    db.add(contato)
    db.commit()
    db.refresh(contato)
    return contato_out(contato)


@app.put("/api/contatos/{contato_id}")
def editar_contato(contato_id: int, payload: ContatoIn, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    contato = db.get(Contato, contato_id)
    if not contato:
        raise HTTPException(404, "Contato não encontrado")
    contato.nota = payload.nota.strip()
    contato.proximo_contato = payload.proximo_contato
    db.commit()
    return contato_out(contato)


@app.delete("/api/contatos/{contato_id}", status_code=204)
def excluir_contato(contato_id: int, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    contato = db.get(Contato, contato_id)
    if not contato:
        raise HTTPException(404, "Contato não encontrado")
    db.delete(contato)
    db.commit()


@app.get("/api/backup")
def backup(_: str = Depends(usuario_atual)):
    """Gera uma cópia consistente do banco SQLite para download."""
    origem_path = caminho_sqlite()
    if not origem_path:
        raise HTTPException(400, "Backup disponível apenas para SQLite")
    nome = f"prospecdash-{dt.date.today().isoformat()}.db"
    destino = os.path.join(tempfile.gettempdir(), nome)
    origem, copia = sqlite3.connect(origem_path), sqlite3.connect(destino)
    try:
        origem.backup(copia)
    finally:
        copia.close()
        origem.close()
    return FileResponse(destino, media_type="application/octet-stream", filename=nome)


@app.post("/api/colunas", status_code=201)
def criar_coluna(payload: ColunaIn, db: Session = Depends(get_db), _: str = Depends(usuario_atual)):
    total = db.scalar(select(func.count()).select_from(Coluna))
    coluna = Coluna(id=novo_id("col"), nome=payload.nome, tipo="normal", ordem=total)
    db.add(coluna)
    db.commit()
    return {"id": coluna.id, "nome": coluna.nome, "tipo": coluna.tipo}
