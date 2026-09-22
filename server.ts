import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { financialDb } from './server/db.ts';
import { FinancialETLPipeline } from './server/etl.ts';
import { openApiSpec } from './server/openapi.ts';
import { BaixaRequest } from './src/types/finance.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.use('/api', (req, res, next) => {
    console.log(`[API ${req.method}] ${req.url}`);
    next();
  });

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Mini-ERP Financeiro & BI',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/docs/openapi.json', (req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  app.get('/api/analytics/dashboard', (req: Request, res: Response) => {
    try {
      const data = FinancialETLPipeline.execute();
      res.json(data);
    } catch (error: any) {
      console.error('Erro ao executar pipeline ETL:', error);
      res.status(500).json({ error: error.message || 'Erro no pipeline analítico' });
    }
  });

  app.post('/api/analytics/recalcular', (req: Request, res: Response) => {
    try {
      const data = FinancialETLPipeline.execute();
      res.json({ message: 'Pipeline ETL executado com sucesso', data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/reset-demo', (req: Request, res: Response) => {
    try {
      financialDb.resetToSeed();
      const data = FinancialETLPipeline.execute();
      res.json({ message: 'Dados de demonstração restaurados com sucesso', data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/clientes', (req: Request, res: Response) => {
    try {
      const clientes = financialDb.getClientes();
      res.json(clientes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/clientes', (req: Request, res: Response) => {
    try {
      const { nome, documento, contato, email, endereco } = req.body;
      if (!nome || !documento) {
        return res.status(400).json({ error: 'Nome e Documento (CPF/CNPJ) são obrigatórios.' });
      }
      const novo = financialDb.createCliente({ nome, documento, contato: contato || '', email: email || '', endereco: endereco || '' });
      res.status(201).json(novo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/clientes/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const atualizado = financialDb.updateCliente(id, req.body);
      res.json(atualizado);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/clientes/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      financialDb.deleteCliente(id);
      res.json({ success: true, message: `Cliente #${id} excluído com sucesso.` });
    } catch (error: any) {
      res.status(409).json({ error: error.message });
    }
  });

  app.get('/api/fornecedores', (req: Request, res: Response) => {
    try {
      const fornecedores = financialDb.getFornecedores();
      res.json(fornecedores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/fornecedores', (req: Request, res: Response) => {
    try {
      const { nome, documento, categoria, contato, email, endereco } = req.body;
      if (!nome || !categoria) {
        return res.status(400).json({ error: 'Nome e Categoria do Fornecedor são obrigatórios.' });
      }
      const novo = financialDb.createFornecedor({
        nome,
        documento: documento || '',
        categoria,
        contato: contato || '',
        email: email || '',
        endereco: endereco || '',
      });
      res.status(201).json(novo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/fornecedores/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const atualizado = financialDb.updateFornecedor(id, req.body);
      res.json(atualizado);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/fornecedores/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      financialDb.deleteFornecedor(id);
      res.json({ success: true, message: `Fornecedor #${id} excluído com sucesso.` });
    } catch (error: any) {
      res.status(409).json({ error: error.message });
    }
  });

  const handleGetPlano = (req: Request, res: Response) => {
    try {
      const plano = financialDb.getPlanoDeContas();
      res.json(plano);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  const handlePostPlano = (req: Request, res: Response) => {
    try {
      const { codigo, nome, tipo, categoriaPaiId, descricao } = req.body;
      if (!codigo || !nome || !tipo) {
        return res.status(400).json({ error: 'Código, Nome e Tipo (RECEITA/DESPESA) são obrigatórios.' });
      }
      const novo = financialDb.createPlanoDeContas({ codigo, nome, tipo, categoriaPaiId, descricao });
      res.status(201).json(novo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  app.get('/api/plano-de-contas', handleGetPlano);
  app.get('/api/plano-contas', handleGetPlano);
  app.post('/api/plano-de-contas', handlePostPlano);
  app.post('/api/plano-contas', handlePostPlano);

  app.get('/api/titulos', (req: Request, res: Response) => {
    try {
      const { tipo, status, periodoInicio, periodoFim } = req.query;
      const titulos = financialDb.getTitulos({
        tipo: tipo as any,
        status: status as any,
        periodoInicio: periodoInicio as string,
        periodoFim: periodoFim as string,
      });
      res.json(titulos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/titulos/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const titulo = financialDb.getTituloById(id);
      if (!titulo) return res.status(404).json({ error: 'Título não encontrado' });
      res.json(titulo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/titulos', (req: Request, res: Response) => {
    try {
      const { tipo, clienteId, fornecedorId, planoContasId, descricao, valorOriginal, dataEmissao, dataVencimento } =
        req.body;

      if (!tipo || !planoContasId || !descricao || !valorOriginal || !dataEmissao || !dataVencimento) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios do lançamento devem ser informados.' });
      }

      const novo = financialDb.createTitulo({
        tipo,
        clienteId: clienteId ? parseInt(clienteId, 10) : undefined,
        fornecedorId: fornecedorId ? parseInt(fornecedorId, 10) : undefined,
        planoContasId: parseInt(planoContasId, 10),
        descricao,
        valorOriginal: Number(valorOriginal),
        dataEmissao,
        dataVencimento,
      });

      res.status(201).json(novo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/titulos/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      financialDb.deleteTitulo(id);
      res.json({ success: true, message: `Título #${id} removido com sucesso.` });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/titulos/:id/baixa', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { dataPagamento, juros, descontos, formaDePagamento, observacao } = req.body;

      if (!dataPagamento || !formaDePagamento) {
        return res.status(400).json({
          error: 'Data do pagamento e Forma de Pagamento são campos obrigatórios para liquidação.',
        });
      }

      const request: BaixaRequest = {
        dataPagamento,
        juros: juros !== undefined ? Number(juros) : 0,
        descontos: descontos !== undefined ? Number(descontos) : 0,
        formaDePagamento,
        observacao,
      };

      const baixa = financialDb.processarBaixa(id, request);
      const tituloAtualizado = financialDb.getTituloById(id);

      res.json({
        success: true,
        message: `Título #${id} liquidado com sucesso!`,
        baixa,
        titulo: tituloAtualizado,
      });
    } catch (error: any) {
      console.error(`Falha na baixa do título #${req.params.id}:`, error.message);
      res.status(400).json({ error: error.message || 'Falha ao processar liquidação' });
    }
  });

  app.get('/api/baixas', (req: Request, res: Response) => {
    try {
      const baixas = financialDb.getBaixas();
      res.json(baixas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mini-ERP Server] Servidor operacional rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
