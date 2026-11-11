import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

URL = os.getenv("DATABASE_URL", "sqlite:///./prospeccao.db")
engine = create_engine(URL, connect_args={"check_same_thread": False} if URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def caminho_sqlite():
    """Caminho do arquivo quando o banco é SQLite (usado no backup)."""
    return URL[len("sqlite:///"):] if URL.startswith("sqlite:///") else None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
