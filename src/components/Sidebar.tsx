import React from 'react';
import {
  LayoutDashboard,
  ArrowUpDown,
  CheckCircle2,
  Users,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'operacional' | 'baixas' | 'cadastros' | 'dre';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onRecalcularETL: () => void;
  recalculando: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onRecalcularETL,
  recalculando,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard & BI',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'operacional',
      label: 'Operacional (Pagar/Receber)',
      icon: <ArrowUpDown className="w-4 h-4" />,
    },
    {
      id: 'baixas',
      label: 'Baixas & Liquidações',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      id: 'cadastros',
      label: 'Cadastros Base',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'dre',
      label: 'DRE Gerencial',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
  ];

  return (
    <aside id="main-sidebar" className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">Mini-ERP Financeiro</h1>
          <p className="text-[11px] text-slate-500 font-medium">Business Intelligence & Fluxo</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos do Sistema
        </div>
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Pipeline ETL</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ativo
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Extração, transformação e recálculo de margens e projeção de 30 dias.
          </p>
          <button
            id="btn-recalcular-etl"
            onClick={onRecalcularETL}
            disabled={recalculando}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculando ? 'animate-spin text-blue-600' : ''}`} />
            <span>{recalculando ? 'Processando ETL...' : 'Recalcular Métricas'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
