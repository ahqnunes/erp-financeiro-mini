import React, { useState, useMemo } from 'react';
import {
  TituloFinanceiro,
} from '../types/finance.ts';
import { formatCurrency, formatDate } from '../utils/formatters.ts';
import {
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
} from 'lucide-react';

interface OperacionalViewProps {
  titulos: TituloFinanceiro[];
  onNovoLancamento: () => void;
  onDarBaixa: (titulo: TituloFinanceiro) => void;
  onExcluirTitulo: (id: number) => Promise<void>;
}

export const OperacionalView: React.FC<OperacionalViewProps> = ({
  titulos,
  onNovoLancamento,
  onDarBaixa,
  onExcluirTitulo,
}) => {
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [busca, setBusca] = useState<string>('');

  const titulosFiltrados = useMemo(() => {
    return titulos.filter(t => {
      if (filtroTipo !== 'TODOS' && t.tipo !== filtroTipo) return false;
      if (filtroStatus !== 'TODOS' && t.status !== filtroStatus) return false;
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const desc = t.descricao.toLowerCase();
        const ent = (t.entidadeNome || '').toLowerCase();
        const plano = (t.planoContasNome || '').toLowerCase();
        return desc.includes(termo) || ent.includes(termo) || plano.includes(termo);
      }
      return true;
    });
  }, [titulos, filtroTipo, filtroStatus, busca]);

  const totais = useMemo(() => {
    let totalReceber = 0;
    let totalPagar = 0;
    titulosFiltrados.forEach(t => {
      if (t.tipo === 'RECEBER') totalReceber += t.valorOriginal;
      else totalPagar += t.valorOriginal;
    });
    return {
      totalReceber,
      totalPagar,
      saldoLiquido: totalReceber - totalPagar,
    };
  }, [titulosFiltrados]);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por descrição, parceiro ou categoria..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="py-1.5 px-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="RECEBER">Contas a Receber</option>
              <option value="PAGAR">Contas a Pagar</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="py-1.5 px-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="VENCIDO">Vencidos</option>
              <option value="PAGO">Pagos (Liquidados)</option>
            </select>
          </div>
        </div>

        <button
          onClick={onNovoLancamento}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-teal-800">Total a Receber (Filtro)</span>
          <span className="text-sm font-bold text-teal-900 tabular-nums">{formatCurrency(totais.totalReceber)}</span>
        </div>
        <div className="p-3 bg-orange-50/60 border border-orange-200/80 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-orange-800">Total a Pagar (Filtro)</span>
          <span className="text-sm font-bold text-orange-900 tabular-nums">{formatCurrency(totais.totalPagar)}</span>
        </div>
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-stone-700">Saldo Líquido</span>
          <span className={`text-sm font-bold tabular-nums ${totais.saldoLiquido >= 0 ? 'text-violet-700' : 'text-rose-600'}`}>
            {formatCurrency(totais.saldoLiquido)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-semibold text-stone-500">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Cliente / Fornecedor</th>
                <th className="py-3 px-4">Plano de Contas</th>
                <th className="py-3 px-4">Emissão</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4 text-right">Valor Original</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {titulosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-stone-400">
                    Nenhum título financeiro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                titulosFiltrados.map(titulo => {
                  const isReceber = titulo.tipo === 'RECEBER';
                  return (
                    <tr key={titulo.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-400">#{titulo.id}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isReceber
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {isReceber ? 'RECEBER' : 'PAGAR'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-900">
                        {titulo.descricao}
                        {titulo.baixa && (
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Pago em {formatDate(titulo.baixa.dataPagamento)} via {titulo.baixa.formaDePagamento}
                            {titulo.baixa.descontos > 0 && ` (Desc: ${formatCurrency(titulo.baixa.descontos)})`}
                            {titulo.baixa.juros > 0 && ` (Juros: ${formatCurrency(titulo.baixa.juros)})`}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-700">{titulo.entidadeNome}</td>
                      <td className="py-3 px-4 text-stone-500">
                        <span className="font-mono text-[10px] text-stone-400 mr-1">[{titulo.planoContasCodigo}]</span>
                        {titulo.planoContasNome}
                      </td>
                      <td className="py-3 px-4 text-stone-500">{formatDate(titulo.dataEmissao)}</td>
                      <td className="py-3 px-4 text-stone-700 font-medium">
                        {formatDate(titulo.dataVencimento)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
                        {formatCurrency(titulo.valorOriginal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {titulo.status === 'PAGO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Pago
                          </span>
                        ) : titulo.status === 'VENCIDO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {titulo.status !== 'PAGO' && (
                            <button
                              onClick={() => onDarBaixa(titulo)}
                              className="px-2.5 py-1 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-md transition"
                            >
                              Dar Baixa
                            </button>
                          )}
                          {titulo.status === 'PENDENTE' && (
                            <button
                              onClick={() => {
                                if (confirm(`Confirma a exclusão do título #${titulo.id}?`)) {
                                  onExcluirTitulo(titulo.id);
                                }
                              }}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                              title="Excluir Título Pendente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
