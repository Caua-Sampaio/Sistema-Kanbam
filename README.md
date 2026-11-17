# ProspecDash

Painel de prospecção comercial e gestão de leads B2B. Permite importar listas de empresas (CSV, XLSX ou texto colado), validar os dados antes de gravar, organizar os leads em um Kanban, registrar o histórico de contatos com lembretes de retorno, abordar pelo WhatsApp com mensagem pronta e acompanhar indicadores em um dashboard.

## Funcionalidades

- **Autenticação:** login com senha protegida por bcrypt e sessão via token JWT (expira em 8 horas). Troca de senha pela própria interface.
- **Kanban:** colunas customizáveis, com arrastar e soltar entre colunas. Em dispositivos móveis, o detalhe do lead tem um seletor de coluna.
- **Lista completa:** tabela paginada (50 registros por página).
- **Importação em lote:** CSV, XLSX ou texto colado (inclusive copiado direto do Excel ou do Google Sheets). Antes de gravar, o sistema mostra a análise do arquivo:
  - leads prontos para importar;
  - leads já cadastrados, que não serão importados novamente;
  - erros por linha, que fazem a linha ser ignorada;
  - avisos por linha, que indicam o que revisar.
- **Campos do lead:** empresa, dono(a), avaliações (total), horário, telefone, Instagram, status do site, link do site, bairro, nicho e origem.
- **Histórico de contatos:** registro, edição e exclusão de contatos, com data opcional de retorno.
- **Lembretes:** cards com retorno vencido são destacados, e há um filtro para exibir apenas retornos pendentes.
- **WhatsApp:** botão que abre a conversa com o número do lead e a mensagem de abordagem pronta para envio. Se o lead tiver link do site, é usada uma mensagem que cita o site.
- **Filtros e busca:** por texto, status do site, bairro, nicho, origem, lista e avaliações mínimas.
- **Exclusão reversível:** leads excluídos podem ser restaurados pelo botão "Desfazer", por alguns segundos após a ação. Na Lista Completa, é possível selecionar vários leads com o check e excluí-los de uma vez.
- **Atualização local:** salvar, mover e registrar contato atualizam a tela sem recarregar o banco inteiro.
- **Exportação:** CSV com os leads filtrados e backup completo do banco SQLite.
- **Dashboard:** total de leads, taxa de conversão, leads sem site, retornos pendentes, funil do Kanban e distribuição por número de avaliações.

## Stack

| Camada    | Tecnologias                                                    |
|-----------|----------------------------------------------------------------|
| Back-end  | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic 2, PyJWT, bcrypt   |
| Banco     | SQLite (padrão), compatível com PostgreSQL via `DATABASE_URL`   |
| Front-end | React 18, Vite 5, Tailwind CSS 3, SheetJS 0.20 (leitura de XLSX) |
| Testes    | pytest e httpx (back-end); `node:test` (front-end)              |

## Estrutura

```
prospecdash-v2/
├── backend/
│   ├── main.py                # rotas da API e regras de negócio
│   ├── models.py              # modelos ORM
│   ├── database.py            # engine, sessão e caminho do banco
│   ├── auth.py                # hash de senha e tokens JWT
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── .env.example
│   └── tests/                 # testes de integração da API
└── frontend/
    ├── src/
    │   ├── App.jsx            # estado global e fluxo principal
    │   ├── api.js             # cliente HTTP e tradução de erros
    │   ├── csvParser.js       # leitura, validação e análise de CSV e texto colado
    │   ├── leitorArquivo.js   # leitura de XLSX
    │   ├── utils.js           # datas, WhatsApp, deduplicação e exportação
    │   └── components/
    │       ├── Cabecalho.jsx, Filtros.jsx, Kanban.jsx, Tabela.jsx, Dashboard.jsx
    │       ├── LeadModal.jsx, DetalheModal.jsx, ImportModal.jsx, SenhaModal.jsx
    │       ├── Dialogo.jsx    # confirmações e entrada de texto
    │       ├── Toast.jsx      # notificações
    │       └── Shell.jsx      # estrutura base das janelas
    ├── tests/                 # testes unitários do parser e utilitários
    └── package.json
```

## Pré-requisitos

- **Python 3.12.** Não use 3.13 nem 3.14: o `pydantic-core` ainda não tem pacote binário pronto para essas versões, e a instalação tenta compilar com Rust, o que costuma falhar no Windows.
- **Node.js 18 ou superior.**

## Instalação e execução

### Back-end

Todos os comandos desta seção devem ser executados **dentro da pasta `backend`**. Antes de começar, confira com `ls`: devem aparecer `main.py`, `requirements.txt` e `.env.example`. Se algum estiver faltando, a pasta está desatualizada ou o terminal está em outra pasta.

```bash
cd backend
py -3.12 -m venv .venv                 
source .venv/Scripts/activate         
python -m pip install -r requirements.txt
cp .env.example .env                   
uvicorn main:app --reload
```

Antes de rodar o `uvicorn`, confirme que o prompt mostra `(.venv)`. Sem o ambiente ativo, o comando não é encontrado.

A documentação interativa da API fica em `http://localhost:8000/docs`.

### Front-end

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. As requisições para `/api` são redirecionadas automaticamente para o back-end na porta 8000. Para o back-end ser encontrado, ele precisa estar rodando antes do uso.

## Configuração

Variáveis de ambiente do back-end (`backend/.env`):

| Variável         | Descrição                                                                           | Padrão                        |
|------------------|-------------------------------------------------------------------------------------|-------------------------------|
| `SECRET_KEY`     | Chave usada para assinar os tokens JWT. **Obrigatória em produção.**                | `dev-only-troque-em-producao` |
| `ADMIN_USER`     | Usuário criado no primeiro uso do banco                                             | `admin`                       |
| `ADMIN_PASSWORD` | Senha do usuário inicial. Só é aplicada se o banco ainda não tiver usuários.        | `admin`                       |
| `DATABASE_URL`   | URL de conexão do banco                                                             | `sqlite:///./prospeccao.db`   |
| `CORS_ORIGINS`   | Origens permitidas, separadas por vírgula                                           | `http://localhost:5173`       |

Para alterar a senha depois do primeiro uso, use o botão **Senha** no cabeçalho.

### Mensagens do WhatsApp

Os textos ficam em `frontend/src/utils.js`:

- `MENSAGEM_WHATSAPP`: abordagem para leads sem site. É a mensagem usada quando o campo **Link do site** está vazio.
- `MENSAGEM_COM_SITE`: abordagem para leads com site. O marcador `{site}` é substituído pelo link cadastrado.

O envio é manual: cada clique abre uma conversa, e o usuário confirma o envio no próprio WhatsApp.

### Textos de preenchimento

Valores como `não encontrado`, `não informado`, `n/a` e `-` são tratados como campo vazio. A lista está definida em dois lugares, que devem permanecer iguais:

- `backend/main.py`: constante `PLACEHOLDERS`
- `frontend/src/csvParser.js`: constante `PLACEHOLDERS`

## Formato de importação

A primeira linha é o cabeçalho. Somente **Empresa** é obrigatória. Os nomes aceitam variações com ou sem acento, e a ordem das colunas não importa.

```
Empresa;Dono(a);Avaliações;Horário;Telefone;Instagram;Status do site;Link do site;Bairro;Nicho;Origem
```

Regras de leitura:

- **Separador:** `;`, `,` ou tabulação. O sistema detecta automaticamente.
- **Avaliações:** aceita o total (`276`) ou o texto copiado do Maps (`5,0 (276)`). Apenas o total é gravado.
- **Horário:** telefone e status (`Aberto`, `Fechado`) colados junto são removidos automaticamente.
- **Status do site:** `Sem site`, `Possui site`, `Em construção` ou `Não verificado`. Outros valores geram aviso e são gravados como `Sem site`.
- **Limites de tamanho:** Empresa (160 caracteres), Bairro (80), Nicho (60), Origem (60) e Link do site (2.000). Textos maiores são cortados e geram aviso.
- **Colunas desconhecidas:** são ignoradas e informadas na análise.
- **XLSX:** lido pela primeira planilha.

### Validação da análise

Antes de importar, a janela mostra o resultado da análise, linha por linha:

| Tipo    | Efeito                                | Exemplos                                                           |
|---------|---------------------------------------|--------------------------------------------------------------------|
| Erro    | A linha é ignorada                    | Empresa vazia; telefone ou Instagram repetido dentro do arquivo    |
| Aviso   | A linha é importada, com revisão      | Status não reconhecido; telefone incompleto; link inválido; campo cortado; avaliações não reconhecidas |
| Info    | Apenas informativo                    | Colunas ignoradas                                                  |

Além disso, leads que já existem no sistema (mesmo telefone ou Instagram) são contados separadamente como **já cadastrados** e não são enviados novamente.

## Testes

```bash
# back-end (com o .venv ativo)
cd backend
python -m pip install -r requirements-dev.txt
python -m pytest

# front-end
cd frontend
npm test
```

Os testes do back-end usam um banco separado (`test_prospeccao.db`), definido em `tests/conftest.py`, e não afetam os dados de uso.

## Migrações e dados

- Ao iniciar, o back-end cria as tabelas que não existem e adiciona colunas novas em bancos de versões anteriores, sem apagar dados. A migração automática vale apenas para SQLite. Para PostgreSQL, recomenda-se adotar Alembic.
- **Mover o projeto para outra pasta:** copie também `backend/.env` e `backend/prospeccao.db`. Sem o banco, o sistema começa vazio.

## Backup

O botão **Backup** gera uma cópia consistente do banco SQLite em formato `.db`, pronta para download. Guarde essa cópia regularmente, principalmente antes de atualizar o projeto.

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `uvicorn: command not found` | Ambiente virtual não está ativo | Rode `source .venv/Scripts/activate` e confira o `(.venv)` no prompt |
| `Permission denied` ao criar o `.venv` | Pasta bloqueada por outro processo ou antivírus | Feche o VS Code e terminais abertos, ou use outro nome, como `.venv312` |
| `Fatal error in launcher` ou `pydantic-core` falhando | `.venv` copiado de outra pasta, ou Python 3.13/3.14 | Apague o `.venv` e recrie com Python 3.12 na pasta atual |
| "Não foi possível conectar ao servidor" | Back-end não está rodando | Inicie o `uvicorn` e tente de novo |
| Erro de validação na importação (ex.: `empresa: ... at most 160 characters`) | Campo acima do limite aceito pelo servidor | Confira a mensagem na janela de importação; campos longos são cortados automaticamente com aviso |
| Importação diz "X já cadastrados" | Leads com o mesmo telefone ou Instagram já estão no sistema | Esperado. Esses leads não são enviados de novo |
| Erro vermelho "repetido no arquivo" | Duas linhas da planilha têm o mesmo telefone ou Instagram | Confira se é a mesma empresa. Se forem empresas diferentes com contato compartilhado, ajuste a planilha |
| `Could not open requirements file` ou `cp: cannot stat '.env.example'` | Terminal aberto na pasta errada (raiz do projeto em vez de `backend`), ou arquivos não copiados | Rode `cd backend` e confira com `ls`. Se faltar arquivo, copie a pasta `backend` do zip |
| `.venv` criado na pasta errada (raiz do projeto) | Ambiente virtual criado fora de `backend` | Rode `deactivate`, apague o `.venv` da raiz (`rm -rf .venv`) e recrie dentro de `backend` |
| `cp .env.example .env` diz que o arquivo já existe | O `.env` já foi criado antes | Pule o passo. Não sobrescreva o arquivo, pois ele guarda a senha e a chave |
| Banco vazio após mover o projeto | `prospeccao.db` não foi copiado | Copie o arquivo para a nova pasta `backend/` |

## Segurança

- Senhas são armazenadas apenas como hash bcrypt.
- Todas as rotas de dados exigem token JWT válido.
- O token fica no `localStorage` do navegador. Em produção, recomenda-se migrar para cookie `httpOnly`.
- Não há limite de tentativas de login. Antes de expor a aplicação publicamente, adicione bloqueio temporário.
- Altere `SECRET_KEY` e `ADMIN_PASSWORD` antes de qualquer uso fora da máquina local.

## Uso responsável

Os dados de contato devem ser obtidos de fontes públicas e verificados antes de qualquer abordagem. Respeite a LGPD e as regras das plataformas de origem, e evite o envio de mensagens em massa.

## Licença

Uso privado. Todos os direitos reservados.
