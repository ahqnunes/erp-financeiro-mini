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
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setAbaAtiva('pendentes')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            abaAtiva === 'pendentes'
              ? 'border-indigo-700 text-indigo-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
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
              ? 'border-indigo-700 text-indigo-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico de Baixas Realizadas ({baixas.length})</span>
        </button>
      </div>

      {abaAtiva === 'pendentes' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800">Títulos aguardando liquidação</span>
            <span className="text-xs text-stone-500">
              Clique em &quot;Dar Baixa&quot; para abrir a janela de cálculo de juros/descontos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-semibold text-stone-500">
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
              <tbody className="divide-y divide-stone-100 text-xs">
                {titulosParaBaixar.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      Nenhum título pendente no momento.
                    </td>
                  </tr>
                ) : (
                  titulosParaBaixar.map(titulo => {
                    const isReceber = titulo.tipo === 'RECEBER';
                    return (
                      <tr key={titulo.id} className="hover:bg-stone-50/80 transition">
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
                        <td className="py-3 px-4 font-medium text-stone-900">{titulo.descricao}</td>
                        <td className="py-3 px-4 text-stone-700">{titulo.entidadeNome}</td>
                        <td className="py-3 px-4 text-stone-500">{titulo.planoContasNome}</td>
                        <td className="py-3 px-4 text-stone-700 font-medium">
                          {formatDate(titulo.dataVencimento)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
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
                            className="px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
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
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800">Registro de Liquidações Efetivadas</span>
            <span className="text-xs text-stone-500">Histórico de baixas financeiras</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-semibold text-stone-500">
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
              <tbody className="divide-y divide-stone-100 text-xs">
                {baixas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-400">
                      Nenhuma baixa registrada ainda.
                    </td>
                  </tr>
                ) : (
                  baixas.map(baixa => {
                    const titulo = titulos.find(t => t.id === baixa.tituloId);
                    return (
                      <tr key={baixa.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-3 px-4 font-mono text-stone-400">#{baixa.id}</td>
                        <td className="py-3 px-4 font-medium text-stone-800">{formatDate(baixa.dataPagamento)}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-stone-900">{titulo?.descricao || `Título #${baixa.tituloId}`}</span>
                          <span className="text-[10px] text-stone-400 block">{titulo?.entidadeNome}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                            {baixa.formaDePagamento}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-stone-600 tabular-nums">{formatCurrency(baixa.valorOriginal)}</td>
                        <td className="py-3 px-4 text-right text-rose-600 tabular-nums">
                          {baixa.juros > 0 ? `+${formatCurrency(baixa.juros)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-teal-600 tabular-nums">
                          {baixa.descontos > 0 ? `-${formatCurrency(baixa.descontos)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
                          {formatCurrency(baixa.valorPago)}
                        </td>
                        <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
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
