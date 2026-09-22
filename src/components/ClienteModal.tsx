import React, { useState, useEffect } from 'react';
import { Cliente } from '../types/finance.ts';
import { X, Users, AlertCircle } from 'lucide-react';

interface ClienteModalProps {
  cliente?: Cliente | null;
  onClose: () => void;
  onSave: (dados: Omit<Cliente, 'id' | 'createdAt'>) => Promise<void>;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({
  cliente,
  onClose,
  onSave,
}) => {
  const [nome, setNome] = useState<string>('');
  const [documento, setDocumento] = useState<string>('');
  const [contato, setContato] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome);
      setDocumento(cliente.documento);
      setContato(cliente.contato || '');
      setEmail(cliente.email || '');
      setEndereco(cliente.endereco || '');
    }
  }, [cliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !documento.trim()) {
      setErro('Nome e Documento (CPF ou CNPJ) são obrigatórios.');
      return;
    }

    const documentoDigitos = documento.replace(/\D/g, '');
    if (documentoDigitos.length !== 11 && documentoDigitos.length !== 14) {
      setErro('Documento inválido. Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        nome: nome.trim(),
        documento: documento.trim(),
        contato: contato.trim(),
        email: email.trim(),
        endereco: endereco.trim(),
      });
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-cliente-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="modal-cliente-content" className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {cliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <p className="text-xs text-slate-500">Cadastro de Tomador de Serviços</p>
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
              Razão Social ou Nome Completo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Hospital Samaritano S.A."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Documento (CNPJ ou CPF) *
            </label>
            <input
              type="text"
              required
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
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                E-mail Financeiro
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="financeiro@empresa.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Endereço Completo
            </label>
            <input
              type="text"
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Rua, Número, Bairro, Cidade - UF"
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
              {loading ? 'Salvando...' : cliente ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
