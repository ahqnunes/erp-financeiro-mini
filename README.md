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
| **Backend & Servidor**| Express.js + Node.js (TSX) | API RESTful unificada servindo a aplicação na porta 3000 |
| **Pipeline Analítico**| FinancialETLPipeline | Motor analítico em TypeScript para consolidação de KPIs e DRE |
| **Documentação API** | OpenAPI 3.0 / Swagger | Documentação disponível no endpoint `/api/docs/openapi.json` |

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
│ • React 19 + TypeScript      │◄─────►│ • Express.js (Porta 3000)    │
│ • Tailwind CSS v4            │ HTTP  │ • Vite Middleware (Dev)      │
│ • Recharts + jsPDF           │ JSON  │ • OpenAPI 3.0 Spec           │
│ • Modais de Baixa e Filtros  │       │ • Repositório Transacional   │
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
├── server.ts                    # Ponto de entrada do servidor unificado (Express + Vite)
├── index.html                   # HTML base da aplicação SPA
├── package.json                 # Manifesto do projeto e dependências
├── tsconfig.json                # Configurações do compilador TypeScript
├── vite.config.ts               # Configuração do Vite com otimização de dependências
│
├── server/                      # Camada de Backend
│   ├── db.ts                    # Mecanismo de persistência e validação de regras de negócio
│   ├── etl.ts                   # Pipeline analítico de cálculo do fluxo e DRE
│   └── openapi.ts               # Especificação OpenAPI 3.0 dos endpoints
│
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
- **Node.js**: Versão 20 recomendada (mínimo 18.x)
- **npm**: Versão 9+ ou **pnpm** / **yarn**

### 2. Passo a Passo

1. **Abra o terminal** na pasta do projeto:
   ```bash
   cd erp-financeiro-mini
   ```

2. **Instale as dependências:**
   > **Nota:** Use a flag `--legacy-peer-deps` para garantir compatibilidade com as versões estritas do Vite/Esbuild no ambiente local:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação:**
   Abra o navegador no endereço:
   ```text
   http://localhost:3000
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
| `npm run dev` | Inicia o servidor de desenvolvimento Express + Vite com recarregamento sob demanda |
| `npm run build` | Compila o bundle estático do frontend com o Vite e empacota o backend com o esbuild em `dist/` |
| `npm start` | Inicia o servidor Node.js apontando para a pasta compilada `dist/` em modo de produção |
| `npm run lint` | Executa a validação estática de tipos do TypeScript sem gerar arquivos (`tsc --noEmit`) |
| `npm run clean` | Remove as pastas de compilação `dist/` e arquivos temporários |

---

## 📄 Licença

Distribuído sob licença comercial interna / proprietária para uso em gestão corporativa e financeira de pequenas e médias empresas.
