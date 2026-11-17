LEAD = lambda empresa, tel, **extra: {"empresa": empresa, "telefone": tel, **extra}


def token(c, senha="senha-teste"):
    r = c.post("/api/auth/login", data={"username": "admin", "password": senha})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def importar(c, h, linhas):
    return c.post("/api/listas", json={"nome": "Lista", "nicho": "", "cidade": "", "linhas": linhas}, headers=h)


def test_login_invalido(client):
    r = client.post("/api/auth/login", data={"username": "admin", "password": "errada"})
    assert r.status_code == 401


def test_rota_protegida_exige_token(client):
    assert client.get("/api/dados").status_code in (401, 403)


def test_importacao_ignora_duplicados(client):
    h = token(client)
    r = importar(client, h, [LEAD("A", "(15) 99999-0001"), LEAD("B", "(15) 99999-0002")])
    assert r.json()["importados"] == 2
    r = importar(client, h, [LEAD("C", "(15) 99999-0001"), LEAD("D", "(15) 98888-0000")])
    assert r.json()["importados"] == 1
    assert r.json()["duplicados"] == 1


def test_campos_novos_e_contatos(client):
    h = token(client)
    importar(client, h, [LEAD("Clínica X", "(15) 97777-1111", bairro="Campolim", nicho="Estética", origem="Instagram")])
    lead = client.get("/api/dados", headers=h).json()["leads"][0]
    assert lead["bairro"] == "Campolim" and lead["nicho"] == "Estética" and lead["origem"] == "Instagram"

    r = client.post(f"/api/leads/{lead['id']}/contatos", json={"nota": "Ligou", "proximo_contato": "2030-01-10"}, headers=h)
    assert r.status_code == 201
    cid = r.json()["id"]
    r = client.put(f"/api/contatos/{cid}", json={"nota": "Ligou e combinou", "proximo_contato": None}, headers=h)
    assert r.json()["nota"] == "Ligou e combinou"
    assert client.delete(f"/api/contatos/{cid}", headers=h).status_code == 204
    assert client.get("/api/dados", headers=h).json()["contatos"] == []


def test_exclusao_e_restauracao(client):
    h = token(client)
    importar(client, h, [LEAD("Y", "(15) 96666-2222")])
    lead = client.get("/api/dados", headers=h).json()["leads"][0]
    assert client.delete(f"/api/leads/{lead['id']}", headers=h).status_code == 204
    assert client.get("/api/dados", headers=h).json()["leads"] == []
    assert client.post(f"/api/leads/{lead['id']}/restaurar", headers=h).status_code == 200
    assert len(client.get("/api/dados", headers=h).json()["leads"]) == 1


def test_troca_de_senha(client):
    h = token(client)
    assert client.post("/api/auth/senha", json={"atual": "errada", "nova": "nova-senha"}, headers=h).status_code == 400
    assert client.post("/api/auth/senha", json={"atual": "senha-teste", "nova": "nova-senha"}, headers=h).status_code == 204
    assert client.post("/api/auth/login", data={"username": "admin", "password": "nova-senha"}).status_code == 200


def test_backup_sqlite(client):
    h = token(client)
    r = client.get("/api/backup", headers=h)
    assert r.status_code == 200
    assert r.content[:16] == b"SQLite format 3\x00"


def test_placeholder_nao_gera_duplicado(client):
    h = token(client)
    linhas = [LEAD(f"Empresa {i}", f"(15) 9{i:04d}-0000", instagram="não encontrado") for i in range(5)]
    r = importar(client, h, linhas)
    assert r.json()["importados"] == 5
    assert r.json()["duplicados"] == 0


def test_site_do_lead_e_salvo(client):
    h = token(client)
    importar(client, h, [LEAD("Com Site", "(15) 95555-0001", site="https://clinica.com.br")])
    lead = client.get("/api/dados", headers=h).json()["leads"][0]
    assert lead["site"] == "https://clinica.com.br"


def test_exclusao_e_restauracao_em_lote(client):
    h = token(client)
    importar(client, h, [LEAD("P", "(15) 91111-0001"), LEAD("Q", "(15) 91111-0002"), LEAD("R", "(15) 91111-0003")])
    ids = [l["id"] for l in client.get("/api/dados", headers=h).json()["leads"][:2]]
    assert client.post("/api/leads/excluir-em-lote", json={"ids": ids}, headers=h).json()["excluidos"] == 2
    assert len(client.get("/api/dados", headers=h).json()["leads"]) == 1
    assert len(client.post("/api/leads/restaurar-em-lote", json={"ids": ids}, headers=h).json()) == 2
    assert len(client.get("/api/dados", headers=h).json()["leads"]) == 3


def test_nota_e_salva(client):
    h = token(client)
    importar(client, h, [{"empresa": "Com Nota", "telefone": "(15) 94444-0001", "nota": 4.8, "avaliacoes": 120}])
    lead = client.get("/api/dados", headers=h).json()["leads"][0]
    assert lead["nota"] == 4.8
    assert lead["avaliacoes"] == 120


def test_link_do_site_longo_e_aceito(client):
    h = token(client)
    url = "https://www.google.com/maps/place/" + "x" * 300
    importar(client, h, [LEAD("Longo", "(15) 93333-0001", site=url)])
    assert client.get("/api/dados", headers=h).json()["leads"][0]["site"] == url
