import React, { useState, useEffect } from 'react';
import { Fornecedor } from '../types/finance.ts';
import { X, Building2, AlertCircle } from 'lucide-react';

interface FornecedorModalProps {
  fornecedor?: Fornecedor | null;
  onClose: () => void;
  onSave: (dados: Omit<Fornecedor, 'id' | 'createdAt'>) => Promise<void>;
}

export const FornecedorModal: React.FC<FornecedorModalProps> = ({
  fornecedor,
  onClose,
  onSave,
}) => {
  const [nome, setNome] = useState<string>('');
  const [documento, setDocumento] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('');
  const [contato, setContato] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (fornecedor) {
      setNome(fornecedor.nome);
      setDocumento(fornecedor.documento || '');
      setCategoria(fornecedor.categoria);
      setContato(fornecedor.contato || '');
      setEmail(fornecedor.email || '');
      setEndereco(fornecedor.endereco || '');
    }
  }, [fornecedor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !categoria.trim()) {
      setErro('Nome e Categoria do Fornecedor são obrigatórios.');
      return;
    }

    const documentoDigitos = documento.replace(/\D/g, '');
    if (documentoDigitos.length > 0 && documentoDigitos.length !== 14) {
      setErro('CNPJ inválido. Informe um CNPJ com 14 dígitos ou deixe o campo em branco.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        nome: nome.trim(),
        documento: documento.trim(),
        categoria: categoria.trim(),
        contato: contato.trim(),
        email: email.trim(),
        endereco: endereco.trim(),
      });
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-fornecedor-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="modal-fornecedor-content" className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <p className="text-xs text-slate-500">Parceiro e Prestador de Contas a Pagar</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition">
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
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Razão Social / Nome Fantasia *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: AWS Cloud Brasil Ltda"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Categoria do Fornecimento *
            </label>
            <input
              type="text"
              required
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              placeholder="Ex: Infraestrutura TI, Aluguel, Serviços Jurídicos..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={documento}
              onChange={e => setDocumento(e.target.value)}
              placeholder="00.000.000/0000-00"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Telefone / Contato
              </label>
              <input
                type="text"
                value={contato}
                onChange={e => setContato(e.target.value)}
                placeholder="(11) 3000-0000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                E-mail de Cobrança
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="billing@fornecedor.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Endereço Comercial
            </label>
            <input
              type="text"
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Endereço da sede ou filial"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Salvando...' : fornecedor ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
