export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Mini-ERP Financeiro & Business Intelligence API',
    version: '1.0.0',
    description:
      'API RESTful corporativa para gestão financeira integrada: controle de clientes, fornecedores, plano de contas, contas a pagar e receber, liquidação financeira e inteligência de negócios (ETL, Projeção de Fluxo de Caixa 30d e DRE Gerencial).',
    contact: {
      name: 'Equipe de Engenharia Financeira',
      email: 'engenharia@minierp.com.br',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Servidor Local / Container',
    },
  ],
  tags: [
    { name: 'Dashboard & BI', description: 'Inteligência de negócios, projeção de fluxo de caixa e DRE' },
    { name: 'Títulos Financeiros', description: 'Gestão de contas a pagar e receber' },
    { name: 'Baixas Financeiras', description: 'Liquidação e quitação financeira' },
    { name: 'Cadastros Base', description: 'Clientes, fornecedores e plano de contas' },
  ],
  paths: {
    '/analytics/dashboard': {
      get: {
        tags: ['Dashboard & BI'],
        summary: 'Obter indicadores consolidados de BI, KPIs, projeção de 30 dias e DRE',
        responses: {
          '200': {
            description: 'Painel consolidado calculado pelo pipeline ETL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    kpis: { type: 'object' },
                    fluxoCaixa30Dias: { type: 'array' },
                    dre: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/reset-demo': {
      post: {
        tags: ['Dashboard & BI'],
        summary: 'Restaurar base de demonstração para o estado inicial',
        responses: {
          '200': { description: 'Base restaurada com sucesso' },
        },
      },
    },
    '/demo/reset': {
      post: {
        tags: ['Dashboard & BI'],
        summary: 'Alias para restaurar base de demonstração para o estado inicial',
        responses: {
          '200': { description: 'Base restaurada com sucesso' },
        },
      },
    },
    '/titulos': {
      get: {
        tags: ['Títulos Financeiros'],
        summary: 'Listar títulos financeiros (Pagar/Receber) com filtros',
        parameters: [
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['PAGAR', 'RECEBER'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDENTE', 'PAGO', 'VENCIDO'] } },
          { name: 'periodoInicio', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'periodoFim', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Lista de títulos filtrados' },
        },
      },
      post: {
        tags: ['Títulos Financeiros'],
        summary: 'Lançar novo título financeiro a pagar ou receber',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tipo', 'planoContasId', 'descricao', 'valorOriginal', 'dataEmissao', 'dataVencimento'],
                properties: {
                  tipo: { type: 'string', enum: ['PAGAR', 'RECEBER'] },
                  clienteId: { type: 'integer' },
                  fornecedorId: { type: 'integer' },
                  planoContasId: { type: 'integer' },
                  descricao: { type: 'string' },
                  valorOriginal: { type: 'number', format: 'float' },
                  dataEmissao: { type: 'string', format: 'date' },
                  dataVencimento: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Título criado com sucesso' },
          '400': { description: 'Erro de validação nos campos do lançamento' },
        },
      },
    },
    '/titulos/{id}/baixa': {
      post: {
        tags: ['Baixas Financeiras'],
        summary: 'Executar liquidação e baixa de título financeiro',
        description:
          'Rota que grava o pagamento, calcula juros/descontos com precisão decimal e altera o status do título para PAGO.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dataPagamento', 'formaDePagamento'],
                properties: {
                  dataPagamento: { type: 'string', format: 'date' },
                  juros: { type: 'number', default: 0 },
                  descontos: { type: 'number', default: 0 },
                  formaDePagamento: {
                    type: 'string',
                    enum: ['PIX', 'BOLETO', 'CARTAO', 'TRANSFERENCIA', 'DINHEIRO'],
                  },
                  observacao: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Baixa liquidada com sucesso' },
          '400': { description: 'Erro de regra financeira ou valor inválido' },
          '404': { description: 'Título não encontrado' },
          '409': { description: 'Título já se encontra liquidado' },
        },
      },
    },
    '/clientes': {
      get: { tags: ['Cadastros Base'], summary: 'Listar todos os clientes' },
      post: { tags: ['Cadastros Base'], summary: 'Cadastrar novo cliente' },
    },
    '/clientes/{id}': {
      put: { tags: ['Cadastros Base'], summary: 'Atualizar cliente' },
      delete: {
        tags: ['Cadastros Base'],
        summary: 'Excluir cliente',
      },
    },
    '/fornecedores': {
      get: { tags: ['Cadastros Base'], summary: 'Listar todos os fornecedores' },
      post: { tags: ['Cadastros Base'], summary: 'Cadastrar novo fornecedor' },
    },
    '/fornecedores/{id}': {
      put: { tags: ['Cadastros Base'], summary: 'Atualizar fornecedor' },
      delete: {
        tags: ['Cadastros Base'],
        summary: 'Excluir fornecedor',
      },
    },
    '/plano-de-contas': {
      get: { tags: ['Cadastros Base'], summary: 'Listar estrutura do plano de contas (Receitas e Despesas)' },
      post: { tags: ['Cadastros Base'], summary: 'Criar nova categoria no plano de contas' },
    },
  },
};
