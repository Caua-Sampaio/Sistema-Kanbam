import datetime as dt
import os

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

SECRET = os.getenv("SECRET_KEY", "dev-only-troque-em-producao")
ALG = "HS256"
HORAS_SESSAO = 8
bearer = HTTPBearer()


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode(), bcrypt.gensalt()).decode()


def verifica_senha(senha: str, hash_: str) -> bool:
    return bcrypt.checkpw(senha.encode(), hash_.encode())


def criar_token(username: str) -> str:
    exp = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=HORAS_SESSAO)
    return jwt.encode({"sub": username, "exp": exp}, SECRET, algorithm=ALG)


def usuario_atual(cred: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    try:
        return jwt.decode(cred.credentials, SECRET, algorithms=[ALG])["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessão inválida ou expirada")
