import React from 'react';
import {
  LayoutDashboard,
  ArrowUpDown,
  CheckCircle2,
  Users,
  FileSpreadsheet,
  RefreshCw,
  ScrollText,
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
    <aside id="main-sidebar" className="w-64 bg-indigo-950 flex flex-col shrink-0 select-none">
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-teal-400">
          <ScrollText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">Mini-ERP Financeiro</h1>
          <p className="text-[11px] text-indigo-300 font-medium">Business Intelligence & Fluxo</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 pt-3 pb-2 text-[10px] font-semibold text-indigo-400">
          Módulos do sistema
        </div>
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-indigo-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-teal-400" />
              )}
              <span className={isActive ? 'text-teal-400' : 'text-indigo-400'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-100">Pipeline ETL</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              Ativo
            </span>
          </div>
          <p className="text-[11px] text-indigo-300 leading-tight">
            Extração, transformação e recálculo de margens e projeção de 30 dias.
          </p>
          <button
            id="btn-recalcular-etl"
            onClick={onRecalcularETL}
            disabled={recalculando}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white/10 hover:bg-white/15 text-white rounded text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculando ? 'animate-spin text-teal-400' : ''}`} />
            <span>{recalculando ? 'Processando ETL...' : 'Recalcular métricas'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
