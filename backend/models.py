import uuid
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def novo_id(prefixo: str) -> str:
    return f"{prefixo}-{uuid.uuid4().hex[:8]}"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(200))


class Lista(Base):
    __tablename__ = "listas"
    id: Mapped[str] = mapped_column(String(20), primary_key=True, default=lambda: novo_id("l"))
    nome: Mapped[str] = mapped_column(String(120))
    nicho: Mapped[str] = mapped_column(String(60), default="")
    cidade: Mapped[str] = mapped_column(String(60), default="")
    ativa: Mapped[bool] = mapped_column(Boolean, default=True)


class Coluna(Base):
    __tablename__ = "colunas"
    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    nome: Mapped[str] = mapped_column(String(60))
    tipo: Mapped[str] = mapped_column(String(10), default="normal")
    ordem: Mapped[int] = mapped_column(Integer, default=0)


class Lead(Base):
    __tablename__ = "leads"
    id: Mapped[str] = mapped_column(String(20), primary_key=True, default=lambda: novo_id("lead"))
    lista_id: Mapped[str] = mapped_column(ForeignKey("listas.id", ondelete="CASCADE"))
    coluna_id: Mapped[str] = mapped_column(ForeignKey("colunas.id"), default="prospectado")
    empresa: Mapped[str] = mapped_column(String(160))
    dono: Mapped[str] = mapped_column(String(120), default="")
    avaliacoes: Mapped[int] = mapped_column(Integer, default=0)
    horario: Mapped[str] = mapped_column(String(120), default="")
    telefone: Mapped[str] = mapped_column(String(40), default="")
    instagram: Mapped[str] = mapped_column(String(80), default="")
    status_site: Mapped[str] = mapped_column(String(20), default="Sem site")
    bairro: Mapped[str] = mapped_column(String(80), default="")
    nicho: Mapped[str] = mapped_column(String(60), default="")
    origem: Mapped[str] = mapped_column(String(60), default="")
    excluido_em: Mapped[str | None] = mapped_column(String(25), nullable=True)  # exclusão lógica (permite desfazer)


class Contato(Base):
    """Histórico de contatos de um lead, com data opcional de próximo retorno."""
    __tablename__ = "contatos"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_id: Mapped[str] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"))
    criado_em: Mapped[str] = mapped_column(String(25))
    nota: Mapped[str] = mapped_column(Text)
    proximo_contato: Mapped[str | None] = mapped_column(String(10), nullable=True)
