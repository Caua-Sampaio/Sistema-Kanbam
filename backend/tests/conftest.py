import os
import pathlib
import sys

# Banco de testes separado do banco real (forçado, para nunca apagar dados de uso)
os.environ["DATABASE_URL"] = "sqlite:///./test_prospeccao.db"
os.environ["ADMIN_PASSWORD"] = "senha-teste"
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    import main
    from database import Base, engine
    Base.metadata.drop_all(engine)
    with TestClient(main.app) as c:
        yield c
