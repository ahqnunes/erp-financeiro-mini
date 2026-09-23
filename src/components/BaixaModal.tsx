import React, { useState } from 'react';
import { TituloFinanceiro, FormaPagamento, BaixaRequest } from '../types/finance.ts';
import { formatCurrency, formatDate } from '../utils/formatters.ts';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BaixaModalProps {
  titulo: TituloFinanceiro;
  onClose: () => void;
  onConfirm: (tituloId: number, data: BaixaRequest) => Promise<void>;
}

export const BaixaModal: React.FC<BaixaModalProps> = ({
  titulo,
  onClose,
  onConfirm,
}) => {
  const hoje = new Date().toISOString().split('T')[0];

  const [dataPagamento, setDataPagamento] = useState<string>(hoje);
  const [juros, setJuros] = useState<string>('0');
  const [descontos, setDescontos] = useState<string>('0');
  const [formaDePagamento, setFormaDePagamento] = useState<FormaPagamento>('PIX');
  const [observacao, setObservacao] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const valorOriginal = titulo.valorOriginal;
  const numJuros = Math.max(0, parseFloat(juros) || 0);
  const numDescontos = Math.max(0, parseFloat(descontos) || 0);
  const valorFinal = Math.max(0, Math.round((valorOriginal + numJuros - numDescontos) * 100) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!dataPagamento) {
      setErro('Informe a data efetiva da liquidação.');
      return;
    }

    if (valorFinal <= 0) {
      setErro('O valor final liquidado deve ser maior que R$ 0,00.');
      return;
    }

    try {
      setLoading(true);
      await onConfirm(titulo.id, {
        dataPagamento,
        juros: numJuros,
        descontos: numDescontos,
        formaDePagamento,
        observacao,
      });
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Falha ao processar a liquidação.');
    } finally {
      setLoading(false);
    }
  };

  const isReceber = titulo.tipo === 'RECEBER';

  return (
    <div id="modal-baixa-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="modal-baixa-content" className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isReceber ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-800">
                Liquidar Título #{titulo.id}
              </h3>
              <p className="text-xs text-stone-500">
                Registro de Liquidação Financeira
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-baixa"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-stone-100 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isReceber ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                {isReceber ? 'Conta a Receber' : 'Conta a Pagar'}
              </span>
              <h4 className="text-sm font-semibold text-stone-900 mt-1">{titulo.descricao}</h4>
              <p className="text-xs text-stone-500">{titulo.entidadeNome} • {titulo.planoContasNome}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500">Valor Original</span>
              <p className="text-lg font-bold text-stone-900 tabular-nums">{formatCurrency(valorOriginal)}</p>
              <span className="text-xs text-stone-400">Vencimento: {formatDate(titulo.dataVencimento)}</span>
            </div>
          </div>

          {titulo.status === 'VENCIDO' && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Atenção: Este título está vencido. Aplique juros ou encargos caso acordado.</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Data do Pagamento *
              </label>
              <input
                id="input-baixa-data"
                type="date"
                required
                value={dataPagamento}
                onChange={e => setDataPagamento(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Forma de Pagamento *
              </label>
              <select
                id="select-baixa-forma-pagamento"
                value={formaDePagamento}
                onChange={e => setFormaDePagamento(e.target.value as FormaPagamento)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="PIX">PIX (Instantâneo)</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="CARTAO">Cartão de Crédito/Débito</option>
                <option value="TRANSFERENCIA">Transferência / TED</option>
                <option value="DINHEIRO">Dinheiro em Espécie</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Juros / Multa (+)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-stone-400">R$</span>
                <input
                  id="input-baixa-juros"
                  type="number"
                  step="0.01"
                  min="0"
                  value={juros}
                  onChange={e => setJuros(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Desconto Concedido (-)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-stone-400">R$</span>
                <input
                  id="input-baixa-desconto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={descontos}
                  onChange={e => setDescontos(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Observação / Comprovante
            </label>
            <input
              id="input-baixa-observacao"
              type="text"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Pago com chave PIX CNPJ. TED final 9801..."
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Valor Base:</span>
              <span className="tabular-nums">{formatCurrency(valorOriginal)}</span>
            </div>
            {numJuros > 0 && (
              <div className="flex justify-between text-xs text-rose-600 font-medium">
                <span>(+) Juros e Acréscimos:</span>
                <span className="tabular-nums">+{formatCurrency(numJuros)}</span>
              </div>
            )}
            {numDescontos > 0 && (
              <div className="flex justify-between text-xs text-teal-600 font-medium">
                <span>(-) Descontos Concedidos:</span>
                <span className="tabular-nums">-{formatCurrency(numDescontos)}</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-stone-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-stone-800">Total Liquidado em Caixa:</span>
              <span className="text-base font-bold text-stone-900 tabular-nums">{formatCurrency(valorFinal)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              id="btn-cancelar-baixa"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              id="btn-confirmar-baixa"
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Confirmar Liquidação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
