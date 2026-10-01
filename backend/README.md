# Backend FastAPI

Este é o backend ativo do Mini-ERP. Ele preserva os endpoints usados pelo
frontend, persiste dados em PostgreSQL por SQLAlchemy e serve o frontend
compilado quando `MINIERP_FRONTEND_DIR` aponta para uma pasta existente.

## Desenvolvimento local

Requisitos: Python 3.11+, `uv` e PostgreSQL 16. Na raiz do repositório:

```powershell
docker compose up -d db
uv sync --project backend --group dev
uv run --project backend alembic -c backend/alembic.ini upgrade head
```

Em terminais separados:

```powershell
uv run --project backend uvicorn app.main:app --app-dir backend --reload --port 8000
npm run dev
```

O Vite serve o frontend em `http://localhost:3000` e encaminha `/api` para a
API em `http://localhost:8000`. Se o banco estiver vazio, carregue a base de
demonstração com `POST http://localhost:8000/api/reset-demo`.

## Banco de dados e migrações

Configure `MINIERP_DATABASE_URL` para trocar a URL padrão do PostgreSQL. O
schema é gerenciado por Alembic:

```powershell
uv run --project backend alembic -c backend/alembic.ini upgrade head
```

Em produção, a imagem executa as migrações antes de iniciar o serviço.
O `database/init.sql` continua sendo usado pelo Compose para criar as tabelas e
popular a base de demonstração em um volume PostgreSQL novo. A migração inicial
é destrutiva ao reverter; não execute downgrade em um banco com dados que devam
ser preservados.

## Testes e lint

```powershell
uv run --project backend pytest
uv run --project backend ruff check backend/app backend/tests backend/migrations
```

Os testes de API usam SQLite em memória e não precisam de um servidor
PostgreSQL ativo.

## Contrato HTTP

Todas as rotas estão sob `/api`; os schemas de entrada e saída usam camelCase
para manter compatibilidade com o frontend. Erros são retornados como
`{ "error": "mensagem" }`. A especificação OpenAPI está em
`/api/docs/openapi.json`.
