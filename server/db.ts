import {
  Cliente,
  Fornecedor,
  PlanoDeContas,
  TituloFinanceiro,
  BaixaFinanceira,
  BaixaRequest,
  StatusTitulo,
} from '../src/types/finance.ts';

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

interface DatabaseState {
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  planoDeContas: PlanoDeContas[];
  titulos: TituloFinanceiro[];
  baixas: BaixaFinanceira[];
  nextId: {
    cliente: number;
    fornecedor: number;
    planoConta: number;
    titulo: number;
    baixa: number;
  };
}

class FinancialDatabase {
  private state: DatabaseState;
  private transactionSnapshot: DatabaseState | null = null;
  private inTransaction: boolean = false;

  constructor() {
    this.state = this.getInitialSeedState();
  }

  public beginTransaction(): void {
    if (this.inTransaction) {
      throw new Error('Transação já está em andamento no momento.');
    }
    this.inTransaction = true;
    this.transactionSnapshot = JSON.parse(JSON.stringify(this.state));
  }

  public commit(): void {
    if (!this.inTransaction) {
      throw new Error('Nenhuma transação ativa para efetivar (commit).');
    }
    this.inTransaction = false;
    this.transactionSnapshot = null;
  }

  public rollback(): void {
    if (!this.inTransaction) {
      return;
    }
    if (this.transactionSnapshot) {
      this.state = this.transactionSnapshot;
    }
    this.inTransaction = false;
    this.transactionSnapshot = null;
  }

  public getClientes(): Cliente[] {
    return [...this.state.clientes].sort((a, b) => b.id - a.id);
  }

  public getClienteById(id: number): Cliente | undefined {
    return this.state.clientes.find(c => c.id === id);
  }

  public createCliente(data: Omit<Cliente, 'id' | 'createdAt'>): Cliente {
    const novo: Cliente = {
      id: this.state.nextId.cliente++,
      nome: data.nome.trim(),
      documento: data.documento.trim(),
      contato: data.contato.trim(),
      email: data.email.trim(),
      endereco: data.endereco.trim(),
      createdAt: new Date().toISOString(),
    };
    this.state.clientes.push(novo);
    return novo;
  }

  public updateCliente(id: number, data: Partial<Omit<Cliente, 'id' | 'createdAt'>>): Cliente {
    const index = this.state.clientes.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Cliente com ID ${id} não encontrado.`);
    this.state.clientes[index] = {
      ...this.state.clientes[index],
      ...data,
    };
    return this.state.clientes[index];
  }

  public deleteCliente(id: number): void {
    const hasTitulos = this.state.titulos.some(t => t.clienteId === id);
    if (hasTitulos) {
      throw new Error(
        'Violação de Integridade Referencial (ON DELETE RESTRICT): ' +
        'Não é possível excluir o cliente pois existem títulos financeiros associados a ele.'
      );
    }
    const index = this.state.clientes.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Cliente com ID ${id} não encontrado.`);
    this.state.clientes.splice(index, 1);
  }

  public getFornecedores(): Fornecedor[] {
    return [...this.state.fornecedores].sort((a, b) => b.id - a.id);
  }

  public getFornecedorById(id: number): Fornecedor | undefined {
    return this.state.fornecedores.find(f => f.id === id);
  }

  public createFornecedor(data: Omit<Fornecedor, 'id' | 'createdAt'>): Fornecedor {
    const novo: Fornecedor = {
      id: this.state.nextId.fornecedor++,
      nome: data.nome.trim(),
      documento: data.documento.trim(),
      categoria: data.categoria.trim(),
      contato: data.contato.trim(),
      email: data.email.trim(),
      endereco: data.endereco.trim(),
      createdAt: new Date().toISOString(),
    };
    this.state.fornecedores.push(novo);
    return novo;
  }

  public updateFornecedor(id: number, data: Partial<Omit<Fornecedor, 'id' | 'createdAt'>>): Fornecedor {
    const index = this.state.fornecedores.findIndex(f => f.id === id);
    if (index === -1) throw new Error(`Fornecedor com ID ${id} não encontrado.`);
    this.state.fornecedores[index] = {
      ...this.state.fornecedores[index],
      ...data,
    };
    return this.state.fornecedores[index];
  }

  public deleteFornecedor(id: number): void {
    const hasTitulos = this.state.titulos.some(t => t.fornecedorId === id);
    if (hasTitulos) {
      throw new Error(
        'Violação de Integridade Referencial (ON DELETE RESTRICT): ' +
        'Não é possível excluir o fornecedor pois existem títulos financeiros vinculados a ele.'
      );
    }
    const index = this.state.fornecedores.findIndex(f => f.id === id);
    if (index === -1) throw new Error(`Fornecedor com ID ${id} não encontrado.`);
    this.state.fornecedores.splice(index, 1);
  }

  public getPlanoDeContas(): PlanoDeContas[] {
    return [...this.state.planoDeContas].sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  public createPlanoDeContas(data: Omit<PlanoDeContas, 'id'>): PlanoDeContas {
    const novo: PlanoDeContas = {
      id: this.state.nextId.planoConta++,
      codigo: data.codigo.trim(),
      nome: data.nome.trim(),
      tipo: data.tipo,
      categoriaPaiId: data.categoriaPaiId || null,
      descricao: data.descricao?.trim(),
    };
    this.state.planoDeContas.push(novo);
    return novo;
  }

  public getTitulos(filtros?: {
    tipo?: 'PAGAR' | 'RECEBER';
    status?: StatusTitulo;
    periodoInicio?: string;
    periodoFim?: string;
  }): TituloFinanceiro[] {
    this.atualizarStatusVencidos();

    return this.state.titulos
      .filter(t => {
        if (filtros?.tipo && t.tipo !== filtros.tipo) return false;
        if (filtros?.status && t.status !== filtros.status) return false;
        if (filtros?.periodoInicio && t.dataVencimento < filtros.periodoInicio) return false;
        if (filtros?.periodoFim && t.dataVencimento > filtros.periodoFim) return false;
        return true;
      })
      .map(t => this.enrichTitulo(t))
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }

  public getTituloById(id: number): TituloFinanceiro | undefined {
    this.atualizarStatusVencidos();
    const t = this.state.titulos.find(item => item.id === id);
    return t ? this.enrichTitulo(t) : undefined;
  }

  public createTitulo(data: {
    tipo: 'PAGAR' | 'RECEBER';
    clienteId?: number | null;
    fornecedorId?: number | null;
    planoContasId: number;
    descricao: string;
    valorOriginal: number;
    dataEmissao: string;
    dataVencimento: string;
  }): TituloFinanceiro {
    if (data.valorOriginal <= 0) {
      throw new Error('O valor original do título deve ser maior que zero (DECIMAL > 0).');
    }

    if (data.tipo === 'RECEBER' && !data.clienteId) {
      throw new Error('Títulos a Receber exigem a vinculação de um Cliente válido.');
    }

    if (data.tipo === 'PAGAR' && !data.fornecedorId) {
      throw new Error('Títulos a Pagar exigem a vinculação de um Fornecedor válido.');
    }

    if (data.tipo === 'RECEBER' && data.clienteId) {
      const clienteExiste = this.state.clientes.some(c => c.id === data.clienteId);
      if (!clienteExiste) {
        throw new Error(`Cliente com ID ${data.clienteId} não encontrado. Não é possível vincular um título a um cliente inexistente.`);
      }
    }

    if (data.tipo === 'PAGAR' && data.fornecedorId) {
      const fornecedorExiste = this.state.fornecedores.some(f => f.id === data.fornecedorId);
      if (!fornecedorExiste) {
        throw new Error(`Fornecedor com ID ${data.fornecedorId} não encontrado. Não é possível vincular um título a um fornecedor inexistente.`);
      }
    }

    const plano = this.state.planoDeContas.find(p => p.id === data.planoContasId);
    if (!plano) {
      throw new Error('Plano de contas selecionado não existe.');
    }

    const hoje = new Date().toISOString().split('T')[0];
    const status: StatusTitulo = data.dataVencimento < hoje ? 'VENCIDO' : 'PENDENTE';

    const novo: TituloFinanceiro = {
      id: this.state.nextId.titulo++,
      tipo: data.tipo,
      clienteId: data.tipo === 'RECEBER' ? data.clienteId : null,
      fornecedorId: data.tipo === 'PAGAR' ? data.fornecedorId : null,
      planoContasId: data.planoContasId,
      descricao: data.descricao.trim(),
      valorOriginal: round2(data.valorOriginal),
      dataEmissao: data.dataEmissao,
      dataVencimento: data.dataVencimento,
      status,
      createdAt: new Date().toISOString(),
    };

    this.state.titulos.push(novo);
    return this.enrichTitulo(novo);
  }

  public deleteTitulo(id: number): void {
    const titulo = this.state.titulos.find(t => t.id === id);
    if (!titulo) throw new Error(`Título com ID ${id} não encontrado.`);

    if (titulo.status === 'PAGO') {
      throw new Error(
        'Violação de Auditoria Contábil: Título já liquidado (Pago) não pode ser excluído diretamente.'
      );
    }

    const index = this.state.titulos.findIndex(t => t.id === id);
    this.state.titulos.splice(index, 1);
  }

  public processarBaixa(tituloId: number, request: BaixaRequest): BaixaFinanceira {
    this.beginTransaction();

    try {
      const tituloIndex = this.state.titulos.findIndex(t => t.id === tituloId);
      if (tituloIndex === -1) {
        throw new Error(`Título financeiro ID ${tituloId} não encontrado.`);
      }

      const titulo = this.state.titulos[tituloIndex];

      if (titulo.status === 'PAGO') {
        throw new Error(`O título ID ${tituloId} já se encontra liquidado (PAGO).`);
      }

      const juros = round2(Number(request.juros) || 0);
      const descontos = round2(Number(request.descontos) || 0);

      if (juros < 0 || descontos < 0) {
        throw new Error('Juros e descontos não podem ser valores negativos.');
      }

      const valorOriginal = round2(titulo.valorOriginal);
      const valorPago = round2(valorOriginal + juros - descontos);

      if (valorPago <= 0) {
        throw new Error(
          `O valor final liquidado (R$ ${valorPago}) deve ser maior que zero. Verifique os descontos concedidos.`
        );
      }

      const novaBaixa: BaixaFinanceira = {
        id: this.state.nextId.baixa++,
        tituloId: titulo.id,
        dataPagamento: request.dataPagamento,
        valorOriginal,
        valorPago,
        juros,
        descontos,
        formaDePagamento: request.formaDePagamento,
        observacao: request.observacao?.trim() || '',
        createdAt: new Date().toISOString(),
      };

      this.state.baixas.push(novaBaixa);

      this.state.titulos[tituloIndex] = {
        ...titulo,
        status: 'PAGO',
      };

      this.commit();
      return novaBaixa;
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  public getBaixas(): BaixaFinanceira[] {
    return [...this.state.baixas].sort((a, b) => b.id - a.id);
  }

  private enrichTitulo(t: TituloFinanceiro): TituloFinanceiro {
    let entidadeNome = 'Diversos';
    if (t.tipo === 'RECEBER' && t.clienteId) {
      const c = this.state.clientes.find(item => item.id === t.clienteId);
      if (c) entidadeNome = c.nome;
    } else if (t.tipo === 'PAGAR' && t.fornecedorId) {
      const f = this.state.fornecedores.find(item => item.id === t.fornecedorId);
      if (f) entidadeNome = f.nome;
    }

    const plano = this.state.planoDeContas.find(p => p.id === t.planoContasId);
    const baixa = this.state.baixas.find(b => b.tituloId === t.id);

    return {
      ...t,
      entidadeNome,
      planoContasNome: plano?.nome || 'Não categorizado',
      planoContasCodigo: plano?.codigo || '0.00',
      baixa,
    };
  }

  private atualizarStatusVencidos(): void {
    const hoje = new Date().toISOString().split('T')[0];
    this.state.titulos.forEach(t => {
      if (t.status === 'PENDENTE' && t.dataVencimento < hoje) {
        t.status = 'VENCIDO';
      }
    });
  }

  public resetToSeed(): void {
    this.state = this.getInitialSeedState();
  }

  private getInitialSeedState(): DatabaseState {
    const hoje = new Date();
    const format = (d: Date) => d.toISOString().split('T')[0];
    const addDays = (days: number) => {
      const copy = new Date(hoje);
      copy.setDate(copy.getDate() + days);
      return format(copy);
    };

    const clientes: Cliente[] = [
      {
        id: 1,
        nome: 'Hospital Samaritano S.A.',
        documento: '43.128.980/0001-44',
        contato: '(11) 3450-8900',
        email: 'financeiro@samaritano.med.br',
        endereco: 'Av. Paulista, 1800 - Bela Vista, São Paulo - SP',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        nome: 'Supermercados Estrela D’Alva Ltda',
        documento: '12.879.445/0001-90',
        contato: '(11) 2980-1122',
        email: 'contas@estrelaalva.com.br',
        endereco: 'Rua do Comércio, 450 - Centro, Campinas - SP',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        nome: 'Varejo Brasil Logística & Distribuição',
        documento: '08.654.321/0001-12',
        contato: '(19) 3344-5566',
        email: 'controladoria@varejobrasil.com.br',
        endereco: 'Rodovia Anhanguera, km 104 - Sumaré - SP',
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        nome: 'Clínica Odonto Vida Ativa',
        documento: '22.333.444/0001-55',
        contato: '(11) 4567-8910',
        email: 'adm@odontovida.com.br',
        endereco: 'Rua das Flores, 88 - Moema, São Paulo - SP',
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        nome: 'Alfa Seguros e Previdência',
        documento: '33.999.888/0001-77',
        contato: '(21) 2500-4321',
        email: 'pagamentos@alfaseguros.com.br',
        endereco: 'Av. Rio Branco, 110 - Centro, Rio de Janeiro - RJ',
        createdAt: new Date().toISOString(),
      },
    ];

    const fornecedores: Fornecedor[] = [
      {
        id: 1,
        nome: 'Amazon Web Services (AWS Cloud Brasil)',
        documento: '23.456.789/0001-01',
        categoria: 'Infraestrutura Cloud & TI',
        contato: 'billing-br@amazon.com',
        email: 'billing-br@amazon.com',
        endereco: 'Av. Brigadeiro Faria Lima, 3700 - Itaim Bibi, SP',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        nome: 'Locadora Alpha Imóveis Comerciais',
        documento: '11.222.333/0001-99',
        categoria: 'Aluguel e Instalações',
        contato: '(11) 3012-9900',
        email: 'locacoes@alphaimoveis.com.br',
        endereco: 'Alameda Santos, 900 - Cerqueira César, SP',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        nome: 'Provedor Fibra Telecom S.A.',
        documento: '04.555.666/0001-33',
        categoria: 'Telecomunicações & Conectividade',
        contato: '0800 700 8090',
        email: 'suporte@fibratelecom.com.br',
        endereco: 'Rua Vergueiro, 2000 - Vila Mariana, SP',
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        nome: 'Ferreira & Associados Consultoria Contábil',
        documento: '55.666.777/0001-22',
        categoria: 'Serviços Contábeis e Fiscais',
        contato: '(11) 3222-1144',
        email: 'contabilidade@ferreira.com.br',
        endereco: 'Rua da Consolação, 1500 - Consolação, SP',
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        nome: 'Google Cloud & Workspace Brasil',
        documento: '06.990.590/0001-23',
        categoria: 'Licenciamento de Software & Ferramentas',
        contato: 'workspace-billing@google.com',
        email: 'workspace-billing@google.com',
        endereco: 'Av. Brig. Faria Lima, 3477 - Itaim Bibi, SP',
        createdAt: new Date().toISOString(),
      },
    ];

    const planoDeContas: PlanoDeContas[] = [
      { id: 1, codigo: '1.01', nome: 'Serviços de Consultoria & Integração', tipo: 'RECEITA', descricao: 'Projetos e implantação de software' },
      { id: 2, codigo: '1.02', nome: 'Licenciamento Mensal de Software SaaS', tipo: 'RECEITA', descricao: 'Mensalidades recorrentes da plataforma' },
      { id: 3, codigo: '1.03', nome: 'Suporte Técnico e SLA Dedicado', tipo: 'RECEITA', descricao: 'Contratos mensais de suporte 24/7' },
      { id: 4, codigo: '1.04', nome: 'Treinamentos e Capacitação', tipo: 'RECEITA', descricao: 'Workshops e treinamentos de usuários' },
      { id: 5, codigo: '2.01', nome: 'Infraestrutura Cloud & Servidores', tipo: 'DESPESA', descricao: 'Servidores AWS, bancos de dados e hospedagem' },
      { id: 6, codigo: '2.02', nome: 'Aluguel, Condomínio e IPTU', tipo: 'DESPESA', descricao: 'Sede da empresa e infraestrutura física' },
      { id: 7, codigo: '2.03', nome: 'Serviços de Telecom & Internet Fibra', tipo: 'DESPESA', descricao: 'Links dedicados e telefonia VoIP' },
      { id: 8, codigo: '2.04', nome: 'Serviços Contábeis e Jurídicos', tipo: 'DESPESA', descricao: 'Honorários de escritório de contabilidade' },
      { id: 9, codigo: '2.05', nome: 'Licenças de Softwares e Ferramentas', tipo: 'DESPESA', descricao: 'Google Workspace, GitHub, Slack e Figma' },
      { id: 10, codigo: '2.06', nome: 'Marketing Digital e Aquisição', tipo: 'DESPESA', descricao: 'Anúncios, campanhas e eventos' },
    ];

    const titulos: TituloFinanceiro[] = [
      {
        id: 1,
        tipo: 'RECEBER',
        clienteId: 1,
        planoContasId: 1,
        descricao: 'Consultoria de Integração - Etapa 01',
        valorOriginal: 14500.00,
        dataEmissao: addDays(-25),
        dataVencimento: addDays(-10),
        status: 'PAGO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        tipo: 'RECEBER',
        clienteId: 2,
        planoContasId: 2,
        descricao: 'Assinatura Plataforma Enterprise',
        valorOriginal: 8900.00,
        dataEmissao: addDays(-20),
        dataVencimento: addDays(-5),
        status: 'PAGO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        tipo: 'PAGAR',
        fornecedorId: 1,
        planoContasId: 5,
        descricao: 'Servidores de Produção & Kubernetes AWS',
        valorOriginal: 3450.80,
        dataEmissao: addDays(-22),
        dataVencimento: addDays(-8),
        status: 'PAGO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        tipo: 'PAGAR',
        fornecedorId: 2,
        planoContasId: 6,
        descricao: 'Locação Mensal Escritório Central',
        valorOriginal: 6200.00,
        dataEmissao: addDays(-28),
        dataVencimento: addDays(-12),
        status: 'PAGO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        tipo: 'PAGAR',
        fornecedorId: 4,
        planoContasId: 8,
        descricao: 'Assessoria Contábil Mensal',
        valorOriginal: 2100.00,
        dataEmissao: addDays(-20),
        dataVencimento: addDays(-6),
        status: 'PAGO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 6,
        tipo: 'RECEBER',
        clienteId: 4,
        planoContasId: 3,
        descricao: 'Suporte Técnico e Manutenção - Atraso',
        valorOriginal: 3800.00,
        dataEmissao: addDays(-30),
        dataVencimento: addDays(-4),
        status: 'VENCIDO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 7,
        tipo: 'PAGAR',
        fornecedorId: 3,
        planoContasId: 7,
        descricao: 'Link Dedicado de Fibra Óptica 1Gbps',
        valorOriginal: 1250.00,
        dataEmissao: addDays(-25),
        dataVencimento: addDays(-2),
        status: 'VENCIDO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 8,
        tipo: 'RECEBER',
        clienteId: 3,
        planoContasId: 2,
        descricao: 'Licenciamento Varejo Brasil - 40 Usuários',
        valorOriginal: 11200.00,
        dataEmissao: addDays(-5),
        dataVencimento: addDays(2),
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 9,
        tipo: 'PAGAR',
        fornecedorId: 5,
        planoContasId: 9,
        descricao: 'Licenças Google Workspace e Armazenamento',
        valorOriginal: 1680.50,
        dataEmissao: addDays(-5),
        dataVencimento: addDays(4),
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 10,
        tipo: 'RECEBER',
        clienteId: 5,
        planoContasId: 1,
        descricao: 'Consultoria em BI Financeiro - Parcela 2/3',
        valorOriginal: 18000.00,
        dataEmissao: addDays(-10),
        dataVencimento: addDays(8),
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 11,
        tipo: 'PAGAR',
        fornecedorId: 2,
        planoContasId: 6,
        descricao: 'Aluguel Sede Corporativa - Vencimento Vigente',
        valorOriginal: 6200.00,
        dataEmissao: addDays(0),
        dataVencimento: addDays(10),
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 12,
        tipo: 'RECEBER',
        clienteId: 1,
        planoContasId: 3,
        descricao: 'Renovação Contrato SLA Hospital Samaritano',
        valorOriginal: 9500.00,
        dataEmissao: addDays(0),
        dataVencimento: addDays(15),
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 13,
        tipo: 'PAGAR',
        fornecedorId: 1,
        planoContasId: 5,
        descricao: 'Previsão Custos Instâncias AWS RDS e EC2',
        valorOriginal: 3890.00,
        dataEmissao: addDays(2),
        dataVencimento: addDays(18),
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 14,
        tipo: 'RECEBER',
        clienteId: 2,
        planoContasId: 2,
        descricao: 'Assinatura Plataforma SaaS - Mês Seguinte',
        valorOriginal: 8900.00,
        dataEmissao: addDays(5),
        dataVencimento: addDays(22),
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 15,
        tipo: 'PAGAR',
        fornecedorId: 4,
        planoContasId: 8,
        descricao: 'Fechamento Fiscal Ferreira & Associados',
        valorOriginal: 2100.00,
        dataEmissao: addDays(5),
        dataVencimento: addDays(26),
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      },
    ];

    const baixas: BaixaFinanceira[] = [
      {
        id: 1,
        tituloId: 1,
        dataPagamento: addDays(-10),
        valorOriginal: 14500.00,
        valorPago: 14500.00,
        juros: 0,
        descontos: 0,
        formaDePagamento: 'PIX',
        observacao: 'Pagamento antecipado com confirmação instantânea via PIX.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        tituloId: 2,
        dataPagamento: addDays(-5),
        valorOriginal: 8900.00,
        valorPago: 8722.00,
        juros: 0,
        descontos: 178.00,
        formaDePagamento: 'BOLETO',
        observacao: 'Desconto de 2% pontualidade concedido pela diretoria.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        tituloId: 3,
        dataPagamento: addDays(-8),
        valorOriginal: 3450.80,
        valorPago: 3450.80,
        juros: 0,
        descontos: 0,
        formaDePagamento: 'CARTAO',
        observacao: 'Fatura AWS em débito automático corporativo.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        tituloId: 4,
        dataPagamento: addDays(-12),
        valorOriginal: 6200.00,
        valorPago: 6200.00,
        juros: 0,
        descontos: 0,
        formaDePagamento: 'TRANSFERENCIA',
        observacao: 'TED bancária comprovada via extrato.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        tituloId: 5,
        dataPagamento: addDays(-6),
        valorOriginal: 2100.00,
        valorPago: 2100.00,
        juros: 0,
        descontos: 0,
        formaDePagamento: 'PIX',
        observacao: 'Liquidação da nota fiscal de serviços contábeis.',
        createdAt: new Date().toISOString(),
      },
    ];

    return {
      clientes,
      fornecedores,
      planoDeContas,
      titulos,
      baixas,
      nextId: {
        cliente: 6,
        fornecedor: 6,
        planoConta: 11,
        titulo: 16,
        baixa: 6,
      },
    };
  }
}

export const financialDb = new FinancialDatabase();
