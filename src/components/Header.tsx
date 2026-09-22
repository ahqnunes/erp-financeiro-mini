import React from 'react';
import { NavTab } from './Sidebar.tsx';
import { formatCurrency } from '../utils/formatters.ts';
import { Plus, RotateCcw, Wallet } from 'lucide-react';

interface HeaderProps {
  currentTab: NavTab;
  saldoCaixaAtual: number;
  onNovoLancamento: () => void;
  onResetDemo: () => void;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Executivo & Business Intelligence',
    subtitle: 'Visão consolidada de caixa, projeção para 30 dias e DRE gerencial',
  },
  operacional: {
    title: 'Operacional Financeiro',
    subtitle: 'Gestão diária de contas a pagar e contas a receber',
  },
  baixas: {
    title: 'Baixas & Liquidações Financeiras',
    subtitle: 'Histórico e registro de liquidações financeiras',
  },
  cadastros: {
    title: 'Cadastros Base do ERP',
    subtitle: 'Clientes, fornecedores e plano de contas contábil/gerencial',
  },
  dre: {
    title: 'DRE Gerencial Estruturado',
    subtitle: 'Demonstrativo do Resultado do Exercício com análise de margens e receitas líquidas',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  saldoCaixaAtual,
  onNovoLancamento,
  onResetDemo,
}) => {
  const info = tabTitles[currentTab];

  return (
    <header id="main-header" className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">{info.title}</h2>
        <p className="text-xs text-slate-500">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block leading-none">
              Saldo em Caixa
            </span>
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {formatCurrency(saldoCaixaAtual)}
            </span>
          </div>
        </div>

        <button
          id="btn-header-novo-lancamento"
          onClick={onNovoLancamento}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>

        <button
          id="btn-header-reset-demo"
          onClick={onResetDemo}
          title="Restaurar dados originais de demonstração"
          className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
