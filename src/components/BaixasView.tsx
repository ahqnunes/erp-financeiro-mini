import React, { useState } from 'react';
import { TituloFinanceiro, BaixaFinanceira } from '../types/finance.ts';
import { formatCurrency, formatDate } from '../utils/formatters.ts';
import { AlertTriangle, History, CreditCard } from 'lucide-react';

interface BaixasViewProps {
  titulos: TituloFinanceiro[];
  baixas: BaixaFinanceira[];
  onDarBaixa: (titulo: TituloFinanceiro) => void;
}

export const BaixasView: React.FC<BaixasViewProps> = ({
  titulos,
  baixas,
  onDarBaixa,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'historico'>('pendentes');

  const titulosParaBaixar = titulos.filter(t => t.status !== 'PAGO');
  const titulosVencidos = titulos.filter(t => t.status === 'VENCIDO');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setAbaAtiva('pendentes')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            abaAtiva === 'pendentes'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Títulos em Aberto para Liquidação ({titulosParaBaixar.length})</span>
          {titulosVencidos.length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
              {titulosVencidos.length} vencidos
            </span>
          )}
        </button>

        <button
          onClick={() => setAbaAtiva('historico')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            abaAtiva === 'historico'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico de Baixas Realizadas ({baixas.length})</span>
        </button>
      </div>

      {abaAtiva === 'pendentes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Títulos aguardando liquidação</span>
            <span className="text-xs text-slate-500">
              Clique em &quot;Dar Baixa&quot; para abrir a janela de cálculo de juros/descontos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Entidade</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor Original</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {titulosParaBaixar.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nenhum título pendente no momento.
                    </td>
                  </tr>
                ) : (
                  titulosParaBaixar.map(titulo => {
                    const isReceber = titulo.tipo === 'RECEBER';
                    return (
                      <tr key={titulo.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              isReceber
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isReceber ? 'RECEBER' : 'PAGAR'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{titulo.descricao}</td>
                        <td className="py-3 px-4 text-slate-700">{titulo.entidadeNome}</td>
                        <td className="py-3 px-4 text-slate-500">{titulo.planoContasNome}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {formatDate(titulo.dataVencimento)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(titulo.valorOriginal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {titulo.status === 'VENCIDO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              Vencido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onDarBaixa(titulo)}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs"
                          >
                            Dar Baixa
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 'historico' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Registro de Liquidações Efetivadas</span>
            <span className="text-xs text-slate-500">Histórico de baixas financeiras</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Baixa #</th>
                  <th className="py-3 px-4">Data Pagamento</th>
                  <th className="py-3 px-4">Título Vinculado</th>
                  <th className="py-3 px-4">Forma</th>
                  <th className="py-3 px-4 text-right">Valor Original</th>
                  <th className="py-3 px-4 text-right">Juros (+)</th>
                  <th className="py-3 px-4 text-right">Descontos (-)</th>
                  <th className="py-3 px-4 text-right">Total Liquidado</th>
                  <th className="py-3 px-4">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {baixas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Nenhuma baixa registrada ainda.
                    </td>
                  </tr>
                ) : (
                  baixas.map(baixa => {
                    const titulo = titulos.find(t => t.id === baixa.tituloId);
                    return (
                      <tr key={baixa.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">#{baixa.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{formatDate(baixa.dataPagamento)}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900">{titulo?.descricao || `Título #${baixa.tituloId}`}</span>
                          <span className="text-[10px] text-slate-400 block">{titulo?.entidadeNome}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {baixa.formaDePagamento}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(baixa.valorOriginal)}</td>
                        <td className="py-3 px-4 text-right text-rose-600">
                          {baixa.juros > 0 ? `+${formatCurrency(baixa.juros)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600">
                          {baixa.descontos > 0 ? `-${formatCurrency(baixa.descontos)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(baixa.valorPago)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {baixa.observacao || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
