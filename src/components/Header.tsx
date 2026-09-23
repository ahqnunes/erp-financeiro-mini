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
    <header id="main-header" className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-sm font-bold text-stone-800 tracking-tight">{info.title}</h2>
        <p className="text-xs text-stone-500">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-lg">
          <Wallet className="w-4 h-4 text-teal-600" />
          <div className="text-right">
            <span className="text-[10px] font-semibold text-teal-700/70 block leading-none">
              Saldo em caixa
            </span>
            <span className="text-xs font-bold text-teal-900 leading-tight tabular-nums">
              {formatCurrency(saldoCaixaAtual)}
            </span>
          </div>
        </div>

        <button
          id="btn-header-novo-lancamento"
          onClick={onNovoLancamento}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo lançamento</span>
        </button>

        <button
          id="btn-header-reset-demo"
          onClick={onResetDemo}
          title="Restaurar dados originais de demonstração"
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
