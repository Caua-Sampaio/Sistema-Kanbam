# ProspecDash

Painel de prospecção comercial e gestão de leads B2B. Permite importar listas de empresas (CSV ou XLSX), organizar os leads em um Kanban, registrar o histórico de contatos com lembretes de retorno e acompanhar indicadores em um dashboard.

## Funcionalidades

- **Autenticação:** login com senha protegida por bcrypt e sessão via token JWT (expira em 8 horas).
- **Kanban:** colunas customizáveis, com arrastar e soltar entre colunas (ou seletor de coluna no detalhe, para dispositivos móveis).
- **Lista completa:** tabela paginada (50 registros por página).
- **Importação em lote:** CSV ou XLSX, com reconhecimento de cabeçalhos com ou sem acento. Leads duplicados (mesmo telefone ou Instagram) são ignorados automaticamente.
- **Histórico de contatos:** registro, edição e exclusão de contatos, com data opcional de retorno.
- **Lembretes:** cards com retorno vencido são destacados, e há um filtro para exibir apenas retornos pendentes.
- **WhatsApp:** botão que abre a conversa com o número do lead e uma mensagem de abordagem pré-preenchida.
- **Filtros e busca:** por texto, status do site, bairro, nicho, origem, lista e avaliações mínimas.
- **Exclusão reversível:** leads excluídos podem ser restaurados por alguns segundos após a ação.
- **Exportação:** CSV com os leads filtrados e backup completo do banco SQLite.
- **Dashboard:** total de leads, taxa de conversão, leads sem site, retornos pendentes, funil do Kanban e distribuição por número de avaliações.

## Stack

| Camada    | Tecnologias                                                  |
|-----------|--------------------------------------------------------------|
| Back-end  | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic 2, PyJWT, bcrypt |
| Banco     | SQLite (padrão), compatível com PostgreSQL via `DATABASE_URL` |
| Front-end | React 18, Vite 5, Tailwind CSS 3, SheetJS (leitura de XLSX)  |
| Testes    | pytest, httpx (back-end); `node:test` (front-end)            |

## Estrutura

```
prospecdash-v2/
├── backend/
│   ├── main.py            # rotas da API e regras de negócio
│   ├── models.py          # modelos ORM
│   ├── database.py        # engine, sessão e migração
│   ├── auth.py            # hash de senha e tokens JWT
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── .env.example
│   └── tests/             # testes de integração da API
└── frontend/
    ├── src/
    │   ├── App.jsx        # estado global e fluxo principal
    │   ├── api.js         # cliente HTTP
    │   ├── csvParser.js   # leitura de CSV (funções puras)
    │   ├── leitorArquivo.js  # leitura de XLSX
    │   ├── utils.js       # datas, WhatsApp, exportação
    │   └── components/    # Kanban, Tabela, Dashboard, modais, etc.
    ├── tests/             # testes unitários do parser e utilitários
    └── package.json
```

## Pré-requisitos

- Python 3.12 (o 3.13 e o 3.14 ainda não têm pacotes binários prontos para todas as dependências)
- Node.js 18 ou superior

## Instalação e execução

### Back-end

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows (Git Bash): source .venv/Scripts/activate
python -m pip install -r requirements.txt
cp .env.example .env               # defina SECRET_KEY e ADMIN_PASSWORD
export $(grep -v '^#' .env | xargs)
uvicorn main:app --reload
```

A documentação interativa da API fica em `http://localhost:8000/docs`.

### Front-end

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. As requisições para `/api` são redirecionadas automaticamente para o back-end na porta 8000.

## Configuração

Variáveis de ambiente do back-end (`backend/.env`):

| Variável         | Descrição                                                    | Padrão                         |
|------------------|--------------------------------------------------------------|--------------------------------|
| `SECRET_KEY`     | Chave usada para assinar os tokens JWT. **Obrigatória em produção.** | `dev-only-troque-em-producao`  |
| `ADMIN_USER`     | Usuário criado no primeiro uso do banco                      | `admin`                        |
| `ADMIN_PASSWORD` | Senha do usuário inicial (só é aplicada se o banco ainda não tiver usuários) | `admin`                        |
| `DATABASE_URL`   | URL de conexão do banco                                      | `sqlite:///./prospeccao.db`    |
| `CORS_ORIGINS`   | Origens permitidas, separadas por vírgula                    | `http://localhost:5173`        |

Para alterar a senha depois do primeiro uso, utilize o botão **Senha** no cabeçalho da aplicação.

## Formato de importação

Cabeçalho (primeira linha) com as colunas abaixo. Somente **Empresa** é obrigatória. Os nomes aceitam variações com ou sem acento.

```
Empresa;Dono(a);Avaliações;Horário;Telefone;Instagram;Status do site;Bairro;Nicho;Origem
```

- **Status do site** aceita `Sem site`, `Possui site` ou `Em construção`. Outros valores são tratados como `Sem site`.
- Textos de preenchimento como `não encontrado`, `não informado`, `n/a` ou `-` são tratados como campo vazio.
- Arquivos XLSX são lidos pela primeira planilha. Para CSV, o separador `;` ou `,` é detectado automaticamente.

## Testes

```bash
# back-end
cd backend
python -m pytest

# front-end
cd frontend
npm test
```

Os testes do back-end usam um banco separado (`test_prospeccao.db`), definido em `tests/conftest.py`, e não afetam os dados de uso.

## Migrações

Ao iniciar, o back-end cria as tabelas que não existem e adiciona as colunas novas em bancos de versões anteriores, sem apagar dados. A migração automática é aplicada apenas para SQLite. Para PostgreSQL, recomenda-se adotar Alembic.

## Backup

O botão **Backup** gera uma cópia consistente do banco SQLite em formato `.db`, pronta para download. Para bancos que não sejam SQLite, a rota retorna erro.

## Segurança

- Senhas são armazenadas apenas como hash bcrypt.
- Todas as rotas de dados exigem token JWT válido.
- O token é guardado no `localStorage` do navegador. Em produção, recomenda-se migrar para cookie `httpOnly`.
- Não há limite de tentativas de login. Antes de expor a aplicação publicamente, adicione um mecanismo de bloqueio temporário.
- Altere `SECRET_KEY` e `ADMIN_PASSWORD` antes de qualquer uso fora da máquina local.

## Licença

Uso privado. Todos os direitos reservados.
