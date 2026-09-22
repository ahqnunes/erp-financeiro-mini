import React, { useState } from 'react';
import {
  TipoTitulo,
  Cliente,
  Fornecedor,
  PlanoDeContas,
} from '../types/finance.ts';
import { X, PlusCircle, AlertCircle } from 'lucide-react';

interface NovoLancamentoModalProps {
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  planoDeContas: PlanoDeContas[];
  onClose: () => void;
  onSave: (dados: {
    tipo: TipoTitulo;
    clienteId?: number;
    fornecedorId?: number;
    planoContasId: number;
    descricao: string;
    valorOriginal: number;
    dataEmissao: string;
    dataVencimento: string;
  }) => Promise<void>;
}

export const NovoLancamentoModal: React.FC<NovoLancamentoModalProps> = ({
  clientes,
  fornecedores,
  planoDeContas,
  onClose,
  onSave,
}) => {
  const hoje = new Date().toISOString().split('T')[0];

  const [tipo, setTipo] = useState<TipoTitulo>('RECEBER');
  const [clienteId, setClienteId] = useState<string>('');
  const [fornecedorId, setFornecedorId] = useState<string>('');
  const [planoContasId, setPlanoContasId] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [valorOriginal, setValorOriginal] = useState<string>('');
  const [dataEmissao, setDataEmissao] = useState<string>(hoje);
  const [dataVencimento, setDataVencimento] = useState<string>(hoje);
  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const planosFiltrados = planoDeContas.filter(p =>
    tipo === 'RECEBER' ? p.tipo === 'RECEITA' : p.tipo === 'DESPESA'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const val = parseFloat(valorOriginal);
    if (!val || val <= 0) {
      setErro('Informe um valor financeiro válido maior que R$ 0,00.');
      return;
    }

    if (!planoContasId) {
      setErro('Selecione uma categoria válida do Plano de Contas.');
      return;
    }

    if (tipo === 'RECEBER' && !clienteId) {
      setErro('Títulos a Receber exigem a seleção de um Cliente.');
      return;
    }

    if (tipo === 'PAGAR' && !fornecedorId) {
      setErro('Títulos a Pagar exigem a seleção de um Fornecedor.');
      return;
    }

    if (dataVencimento < dataEmissao) {
      setErro('A data de vencimento não pode ser anterior à data de emissão.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        tipo,
        clienteId: tipo === 'RECEBER' ? parseInt(clienteId, 10) : undefined,
        fornecedorId: tipo === 'PAGAR' ? parseInt(fornecedorId, 10) : undefined,
        planoContasId: parseInt(planoContasId, 10),
        descricao: descricao.trim(),
        valorOriginal: val,
        dataEmissao,
        dataVencimento,
      });
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Falha ao registrar o lançamento financeiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-novo-lancamento-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="modal-novo-lancamento-content" className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Novo Lançamento Financeiro
              </h3>
              <p className="text-xs text-slate-500">
                Lançamento de Título a Pagar ou a Receber
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-lancamento"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Tipo do Título *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-tipo-receber"
                onClick={() => {
                  setTipo('RECEBER');
                  setPlanoContasId('');
                }}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  tipo === 'RECEBER'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Contas a Receber (Entrada)
              </button>
              <button
                type="button"
                id="btn-tipo-pagar"
                onClick={() => {
                  setTipo('PAGAR');
                  setPlanoContasId('');
                }}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  tipo === 'PAGAR'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Contas a Pagar (Saída)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {tipo === 'RECEBER' ? 'Cliente *' : 'Fornecedor *'}
            </label>
            {tipo === 'RECEBER' ? (
              <select
                id="select-lancamento-cliente"
                required
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">Selecione o Cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.documento})
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="select-lancamento-fornecedor"
                required
                value={fornecedorId}
                onChange={e => setFornecedorId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">Selecione o Fornecedor...</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nome} • {f.categoria}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Categoria do Plano de Contas *
            </label>
            <select
              id="select-lancamento-plano"
              required
              value={planoContasId}
              onChange={e => setPlanoContasId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Selecione a Categoria Financeira...</option>
              {planosFiltrados.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.codigo}] {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição do Título *
            </label>
            <input
              id="input-lancamento-descricao"
              type="text"
              required
              placeholder="Ex: Fatura 104 - Licenciamento de Software"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Valor Original (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400">R$</span>
              <input
                id="input-lancamento-valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={valorOriginal}
                onChange={e => setValorOriginal(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Data de Emissão *
              </label>
              <input
                id="input-lancamento-emissao"
                type="date"
                required
                value={dataEmissao}
                onChange={e => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Data de Vencimento *
              </label>
              <input
                id="input-lancamento-vencimento"
                type="date"
                required
                value={dataVencimento}
                onChange={e => setDataVencimento(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              id="btn-cancelar-lancamento"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              id="btn-salvar-lancamento"
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
