export type TipoTitulo = 'PAGAR' | 'RECEBER';
export type StatusTitulo = 'PENDENTE' | 'PAGO' | 'VENCIDO';
export type TipoPlanoConta = 'RECEITA' | 'DESPESA';
export type FormaPagamento = 'PIX' | 'BOLETO' | 'CARTAO' | 'TRANSFERENCIA' | 'DINHEIRO';

export interface Cliente {
  id: number;
  nome: string;
  documento: string;
  contato: string;
  email: string;
  endereco: string;
  createdAt: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  documento: string;
  categoria: string;
  contato: string;
  email: string;
  endereco: string;
  createdAt: string;
}

export interface PlanoDeContas {
  id: number;
  codigo: string;
  nome: string;
  tipo: TipoPlanoConta;
  categoriaPaiId?: number | null;
  descricao?: string;
}

export interface TituloFinanceiro {
  id: number;
  tipo: TipoTitulo;
  clienteId?: number | null;
  fornecedorId?: number | null;
  planoContasId: number;
  descricao: string;
  valorOriginal: number;
  dataEmissao: string;
  dataVencimento: string;
  status: StatusTitulo;
  createdAt: string;
  entidadeNome?: string;
  planoContasNome?: string;
  planoContasCodigo?: string;
  baixa?: BaixaFinanceira;
}

export interface BaixaFinanceira {
  id: number;
  tituloId: number;
  dataPagamento: string;
  valorOriginal: number;
  valorPago: number;
  juros: number;
  descontos: number;
  formaDePagamento: FormaPagamento;
  observacao?: string;
  createdAt: string;
}

export interface BaixaRequest {
  dataPagamento: string;
  juros?: number;
  descontos?: number;
  formaDePagamento: FormaPagamento;
  observacao?: string;
}

export interface FluxoCaixaPoint {
  data: string;
  dataFormatada: string;
  saldoInicial: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
  entradasRealizadas: number;
  saidasRealizadas: number;
  saldoProjetado: number;
  saldoReal: number;
}

export interface DRECategoria {
  categoria: string;
  codigo: string;
  valor: number;
  percentual: number;
}

export interface DREGerencial {
  periodo: string;
  receitaBruta: number;
  deducoesDescontos: number;
  receitaLiquida: number;
  despesasOperacionais: number;
  resultadoLiquido: number;
  margemLiquidaPercentual: number;
  categoriasReceita: DRECategoria[];
  categoriasDespesa: DRECategoria[];
}

export interface DashboardKPIs {
  saldoCaixaAtual: number;
  totalAReceberMes: number;
  totalAPagarMes: number;
  saldoProjetadoMes: number;
  titulosVencidosTotal: number;
  titulosVencidosValor: number;
  titulosPendentesCount: number;
  titulosPagosCountMes: number;
}

export interface DashboardResponse {
  kpis: DashboardKPIs;
  fluxoCaixa30Dias: FluxoCaixaPoint[];
  dre: DREGerencial;
  titulosRecentes: TituloFinanceiro[];
  proximosVencimentos: TituloFinanceiro[];
}
