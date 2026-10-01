# 💼 erp-financeiro-mini

> **Sistema Integrado de Gestão Financeira Corporativa & Business Intelligence (BI)**  
> Plataforma full-stack para pequenas e médias empresas com controle operacional de contas a pagar e receber, baixas financeiras com cálculo de acréscimos/descontos, projeção de fluxo de caixa em 30 dias, DRE Gerencial com análise vertical e emissão de relatórios em PDF.

---

## 📑 Sumário

1. [Visão Geral e Funcionalidades](#-visão-geral-e-funcionalidades)
2. [Stack Tecnológica](#-stack-tecnológica)
3. [Arquitetura do Sistema](#-arquitetura-do-sistema)
4. [Estrutura de Diretórios](#-estrutura-de-diretórios)
5. [Guia de Instalação e Execução Local](#-guia-de-instalação-e-execução-local)
6. [Solução de Problemas Comuns (Ambiente Local)](#-solução-de-problemas-comuns-ambiente-local)
7. [Endpoints da API RESTful](#-endpoints-da-api-restful)
8. [Scripts Disponíveis](#-scripts-disponíveis)

---

## 🚀 Visão Geral e Funcionalidades

### 1. Dashboard Executivo & Business Intelligence
- **Indicadores em Tempo Real (KPIs):** Saldo atual de caixa, previsão de recebimentos e pagamentos do mês, saldo projetado e total de títulos vencidos com alerta de inadimplência.
- **Gráfico de Projeção Diária (30 dias):** Projeção contínua baseada nos vencimentos programados e impacto financeiro imediato de títulos vencidos.
- **Próximos Vencimentos & Histórico Recente:** Tabela consolidada com ações rápidas para liquidação ou consulta.

### 2. Contas a Pagar e Contas a Receber
- Lançamento financeiro completo com vinculação obrigatória a Cliente (Receber) ou Fornecedor (Pagar).
- Categorização contábil através do Plano de Contas.
- Filtros dinâmicos por status (`PENDENTE`, `PAGO`, `VENCIDO`), tipo financeiro, busca textual por descrição ou parceiro, e intervalo de datas de vencimento.
- Atualização automática de status para `VENCIDO` com base na data do sistema.

### 3. Módulo de Baixas e Liquidações Financeiras
- Quitação total de títulos em aberto.
- Cálculo de acréscimos moratórios (juros) e deduções comerciais (descontos concedidos/obtidos) com precisão decimal exata.
- Múltiplos meios de liquidação: `PIX`, `Boleto Bancário`, `Cartão Corporativo`, `Transferência Bancária (TED/DOC)` e `Dinheiro`.
- Campo de observação contábil para auditoria e histórico de quitação.

### 4. DRE Gerencial & Análise Vertical
- Apuração do Demonstrativo do Resultado do Exercício com base nas baixas efetivadas.
- Estrutura contábil padrão:
  - **Receita Operacional Bruta**
  - **(-) Deduções e Descontos Concedidos**
  - **(=) Receita Operacional Líquida (Base 100%)**
  - **(-) Despesas Operacionais Detalhadas por Categoria**
  - **(=) Resultado Líquido do Exercício (Lucro ou Prejuízo)**
- **Análise Vertical:** Percentual de representatividade de cada linha e categoria sobre a receita líquida.

### 5. Cadastros Estruturados & Integridade Referencial
- **Clientes e Fornecedores:** Cadastro com Razão Social / Nome, CNPJ/CPF, e-mail, telefone e endereço.
- **Proteção Referencial:** Bloqueio de exclusão (`ON DELETE RESTRICT`) caso a entidade possua títulos financeiros vinculados.
- **Plano de Contas:** Árvore de classificação financeira hierárquica por código estruturado (ex.: `1.01`, `2.05`).

### 6. Emissão de Relatórios em PDF
- Exportação de relatórios vetoriais formatados em A4 via `jsPDF` e `jspdf-autotable`.
- Relatório Executivo de Dashboard com tabela de fluxo e indicadores.
- Relatório Oficial de DRE Gerencial com tabela de análise vertical e formatação contábil.

---

## 🛠 Stack Tecnológica

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | SPA com componentes funcionais e hooks modernos |
| **Estilização** | Tailwind CSS v4 | Estilização utilitária de alto contraste e layout responsivo |
| **Ícones & Animações**| Lucide React + Motion | Feedback visual e transições suaves de abas e modais |
| **Visualização de Dados**| Recharts 3 + `react-is` | Gráficos de área e linha para projeção do fluxo de caixa |
| **Exportação PDF** | jsPDF + AutoTable | Geração de PDFs vetoriais com suporte a tabelas e cabeçalhos |
| **Backend & API**| FastAPI + SQLAlchemy + Alembic | API RESTful Python com persistência PostgreSQL |
| **Pipeline Analítico**| Serviço financeiro Python | Consolidação de KPIs, projeção de caixa e DRE |
| **Frontend & Dev server**| React + Vite | SPA na porta 3000, com proxy `/api` para a porta 8000 |
| **Documentação API** | OpenAPI 3.0 | Especificação disponível em `/api/docs/openapi.json` |

---

## 🏛 Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────┐
│                    erp-financeiro-mini                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐
│       Frontend (SPA)         │       │      Backend & Servidor      │
│                              │       │                              │
│ • React 19 + TypeScript      │◄─────►│ • FastAPI (Porta 8000)       │
│ • Tailwind CSS v4            │ HTTP  │ • SQLAlchemy + PostgreSQL    │
│ • Recharts + jsPDF           │ JSON  │ • OpenAPI 3.0 Spec           │
│ • Modais de Baixa e Filtros  │       │ • Migrações Alembic          │
└──────────────────────────────┘       └──────────────┬───────────────┘
                                                      │
                                       ┌──────────────┴───────────────┐
                                       ▼                              ▼
                       ┌──────────────────────────────┐ ┌──────────────────────────────┐
                       │    Pipeline Analítico ETL    │ │  Motor de Regras & Registros │
                       │                              │ │                              │
                       │ • Posição Realizada de Caixa │ │ • Clientes & Fornecedores    │
                       │ • Projeção de Caixa 30 Dias  │ │ • Plano de Contas            │
                       │ • DRE Gerencial + Análise %  │ │ • Títulos & Baixas           │
                       └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 📁 Estrutura de Diretórios

```text
erp-financeiro-mini/
├── index.html                   # HTML base da aplicação SPA
├── package.json                 # Manifesto do projeto e dependências
├── tsconfig.json                # Configurações do compilador TypeScript
├── vite.config.ts               # Configuração do Vite com otimização de dependências
│
├── backend/                     # API FastAPI ativa
│   ├── app/                     # Rotas, modelos, schemas e serviços
│   ├── migrations/              # Migrações Alembic
│   ├── pyproject.toml           # Dependências Python
│   └── README.md                # Execução e configuração do backend Python
│
├── docs/                        # Contratos e regras funcionais para a migração
│   ├── API-CONTRACT.md          # Contrato HTTP atual da API
│   └── DOMAIN-RULES.md          # Regras de negócio e decisões pendentes
├── src/                         # Camada de Frontend
│   ├── main.tsx                 # Ponto de inicialização do React
│   ├── App.tsx                  # Componente principal e orquestrador de telas
│   ├── index.css                # Configurações globais de estilo e tipografia tabular
│   ├── types/
│   │   └── finance.ts           # Interfaces e tipos TypeScript de todo o domínio
│   ├── services/
│   │   └── api.ts               # Cliente HTTP consumindo a API REST
│   ├── components/
│   │   ├── Header.tsx           # Barra superior com ações e status do sistema
│   │   ├── Sidebar.tsx          # Menu de navegação entre módulos
│   │   ├── Dashboard.tsx        # Tela de BI, KPIs e gráficos analíticos
│   │   ├── TitulosManager.tsx   # Gestão de Contas a Pagar e Receber
│   │   ├── ModalBaixa.tsx       # Modal de quitação com juros/descontos
│   │   ├── ModalNovoTitulo.tsx  # Modal de cadastro de novos títulos
│   │   ├── DREView.tsx          # Demonstrativo do Resultado do Exercício
│   │   └── CadastrosManager.tsx # Gerenciador de Clientes, Fornecedores e Contas
│   └── utils/
│       ├── formatters.ts        # Formatadores de moeda (BRL), data e documentos
│       └── pdfExport.ts         # Exportação vetorial de relatórios em PDF
```

---

## 💻 Guia de Instalação e Execução Local

### 1. Pré-requisitos
- **Node.js** 20+ e **npm**
- **Python** 3.11+
- **uv** para instalar dependências e executar a API
- **PostgreSQL** 16 (ou Docker com Docker Compose)

### 2. Passo a Passo

1. **Abra o terminal** na pasta do projeto:
   ```bash
   cd erp-financeiro-mini
   ```

2. **Instale as dependências do frontend:**
   > **Nota:** Se houver conflitos entre versões de dependências peer do frontend, use `--legacy-peer-deps`:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Inicie o PostgreSQL e prepare o schema:**
   ```bash
   docker compose up -d db
   uv sync --project backend --group dev
   uv run --project backend alembic -c backend/alembic.ini upgrade head
   ```
   O banco pode ser configurado pela variável `MINIERP_DATABASE_URL`.

4. **Inicie a API e o frontend em terminais separados:**
   ```bash
   uv run --project backend uvicorn app.main:app --app-dir backend --reload --port 8000
   ```
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação:**
   Abra o navegador no endereço:
   ```text
   http://localhost:3000
   ```
   O Vite encaminha as chamadas `/api` para `http://localhost:8000`. Em um banco
   vazio, execute `POST /api/reset-demo` para carregar os dados de demonstração.

Para executar a aplicação completa em container, incluindo PostgreSQL:

```bash
docker compose up --build
```

---

## 🔧 Solução de Problemas Comuns (Ambiente Local)

### Erro: `Failed to resolve import "react-is" from recharts`
Se aparecer esse erro ao abrir o navegador pela primeira vez, significa que o cache pré-compilado do Vite precisa ser atualizado:

1. Pare o servidor (`Ctrl + C`).
2. Limpe o diretório de cache do Vite:
   - **No Windows (PowerShell):**
     ```powershell
     Remove-Item -Recurse -Force node_modules\.vite
     ```
   - **No Windows (CMD):**
     ```cmd
     rd /s /q node_modules\.vite
     ```
   - **No Linux / macOS:**
     ```bash
     rm -rf node_modules/.vite
     ```
3. Inicie o servidor novamente:
   ```bash
   npm run dev
   ```

---

## 🌐 Endpoints da API RESTful

A documentação interativa OpenAPI 3.0 completa pode ser consultada no endpoint:  
`GET /api/docs/openapi.json`

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verificação de disponibilidade do servidor |
| `GET` | `/api/analytics/dashboard` | Retorna KPIs, projeção de fluxo de 30 dias e DRE consolidado |
| `POST` | `/api/analytics/recalcular` | Executa o recálculo do pipeline analítico sob demanda |
| `POST` | `/api/reset-demo` | Restaura a base de dados de demonstração padrão |
| `GET` | `/api/titulos` | Lista títulos com filtros opcionais (`tipo`, `status`, `periodoInicio`, `periodoFim`) |
| `GET` | `/api/titulos/:id` | Obtém os dados detalhados de um título por ID |
| `POST` | `/api/titulos` | Cadastra um novo título a pagar ou a receber |
| `DELETE` | `/api/titulos/:id` | Remove um título em aberto (títulos pagos são bloqueados) |
| `POST` | `/api/titulos/:id/baixa` | Registra a liquidação financeira de um título com juros/descontos |
| `GET` | `/api/baixas` | Lista o histórico completo de baixas e liquidações |
| `GET` | `/api/clientes` | Lista todos os clientes cadastrados |
| `POST` | `/api/clientes` | Cadastra um novo cliente |
| `PUT` | `/api/clientes/:id` | Atualiza dados cadastrais do cliente |
| `DELETE` | `/api/clientes/:id` | Exclui cliente (bloqueado se houver títulos vinculados) |
| `GET` | `/api/fornecedores` | Lista todos os fornecedores cadastrados |
| `POST` | `/api/fornecedores` | Cadastra um novo fornecedor |
| `PUT` | `/api/fornecedores/:id` | Atualiza dados cadastrais do fornecedor |
| `DELETE` | `/api/fornecedores/:id` | Exclui fornecedor (bloqueado se houver títulos vinculados) |
| `GET` | `/api/plano-contas` | Lista o plano de contas contábil e gerencial |
| `POST` | `/api/plano-contas` | Adiciona uma nova categoria no plano de contas |

---

## 📜 Scripts Disponíveis

No arquivo `package.json`, estão configurados os seguintes comandos:

| Comando | Finalidade |
| :--- | :--- |
| `npm run dev` | Inicia o frontend Vite na porta 3000 |
| `npm run dev:api` | Inicia a API FastAPI na porta 8000 em modo de desenvolvimento |
| `npm run build` | Compila o frontend estático com o Vite |
| `npm start` | Inicia a API FastAPI na porta 3000 e serve o frontend compilado em `dist/` |
| `npm test` | Executa a suíte de testes da API FastAPI |
| `npm run lint` | Executa a validação estática de tipos do TypeScript sem gerar arquivos (`tsc --noEmit`) |
| `npm run clean` | Remove as pastas de compilação `dist/` e arquivos temporários |

Os testes e verificações do backend Python são executados com:

```bash
uv run --project backend pytest
uv run --project backend ruff check backend/app backend/tests backend/migrations
```

Os contratos e regras preservados pela API estão em
[docs/API-CONTRACT.md](docs/API-CONTRACT.md) e
[docs/DOMAIN-RULES.md](docs/DOMAIN-RULES.md).

---

## 📄 Licença

Distribuído sob licença comercial interna / proprietária para uso em gestão corporativa e financeira de pequenas e médias empresas.
