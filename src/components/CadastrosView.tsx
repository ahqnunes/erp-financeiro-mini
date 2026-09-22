import React, { useState } from 'react';
import { Cliente, Fornecedor, PlanoDeContas } from '../types/finance.ts';
import { formatDocumento } from '../utils/formatters.ts';
import {
  Users,
  Building2,
  ListTree,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  FolderTree,
} from 'lucide-react';

interface CadastrosViewProps {
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  planoDeContas: PlanoDeContas[];
  onNovoCliente: () => void;
  onEditarCliente: (c: Cliente) => void;
  onExcluirCliente: (id: number) => Promise<void>;
  onNovoFornecedor: () => void;
  onEditarFornecedor: (f: Fornecedor) => void;
  onExcluirFornecedor: (id: number) => Promise<void>;
}

export const CadastrosView: React.FC<CadastrosViewProps> = ({
  clientes,
  fornecedores,
  planoDeContas,
  onNovoCliente,
  onEditarCliente,
  onExcluirCliente,
  onNovoFornecedor,
  onEditarFornecedor,
  onExcluirFornecedor,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'clientes' | 'fornecedores' | 'plano'>('clientes');
  const [busca, setBusca] = useState<string>('');
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);

  const clientesFiltrados = clientes.filter(c =>
    busca.trim()
      ? c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.documento.includes(busca)
      : true
  );

  const fornecedoresFiltrados = fornecedores.filter(f =>
    busca.trim()
      ? f.nome.toLowerCase().includes(busca.toLowerCase()) ||
        f.categoria.toLowerCase().includes(busca.toLowerCase())
      : true
  );

  const handleExcluirCliente = async (id: number, nome: string) => {
    setErroOperacao(null);
    if (!confirm(`Deseja realmente excluir o cliente "${nome}"?`)) return;
    try {
      await onExcluirCliente(id);
    } catch (err: any) {
      setErroOperacao(err.message || 'Falha ao excluir cliente.');
    }
  };

  const handleExcluirFornecedor = async (id: number, nome: string) => {
    setErroOperacao(null);
    if (!confirm(`Deseja realmente excluir o fornecedor "${nome}"?`)) return;
    try {
      await onExcluirFornecedor(id);
    } catch (err: any) {
      setErroOperacao(err.message || 'Falha ao excluir fornecedor.');
    }
  };

  return (
    <div className="space-y-4">
      {erroOperacao && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erroOperacao}</span>
          </div>
          <button
            onClick={() => setErroOperacao(null)}
            className="text-xs font-semibold text-rose-700 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAbaAtiva('clientes');
              setBusca('');
              setErroOperacao(null);
            }}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              abaAtiva === 'clientes'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes ({clientes.length})</span>
          </button>

          <button
            onClick={() => {
              setAbaAtiva('fornecedores');
              setBusca('');
              setErroOperacao(null);
            }}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              abaAtiva === 'fornecedores'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Fornecedores ({fornecedores.length})</span>
          </button>

          <button
            onClick={() => {
              setAbaAtiva('plano');
              setBusca('');
              setErroOperacao(null);
            }}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              abaAtiva === 'plano'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTree className="w-4 h-4" />
            <span>Plano de Contas ({planoDeContas.length})</span>
          </button>
        </div>

        {abaAtiva === 'clientes' && (
          <button
            onClick={onNovoCliente}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        )}

        {abaAtiva === 'fornecedores' && (
          <button
            onClick={onNovoFornecedor}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Fornecedor</span>
          </button>
        )}
      </div>

      {abaAtiva === 'clientes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar clientes por razão social ou documento..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Código</th>
                  <th className="py-2.5 px-4">Razão Social / Nome</th>
                  <th className="py-2.5 px-4">Documento (CPF/CNPJ)</th>
                  <th className="py-2.5 px-4">Contato</th>
                  <th className="py-2.5 px-4">E-mail</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {clientesFiltrados.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">CLI-{cliente.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{cliente.nome}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {formatDocumento(cliente.documento)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{cliente.contato || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{cliente.email || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditarCliente(cliente)}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50 transition"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExcluirCliente(cliente.id, cliente.nome)}
                          className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 'fornecedores' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar fornecedores por nome ou categoria..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Código</th>
                  <th className="py-2.5 px-4">Nome Fantasia</th>
                  <th className="py-2.5 px-4">Categoria</th>
                  <th className="py-2.5 px-4">CNPJ</th>
                  <th className="py-2.5 px-4">Contato</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {fornecedoresFiltrados.map(fornecedor => (
                  <tr key={fornecedor.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">FOR-{fornecedor.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{fornecedor.nome}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {fornecedor.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {formatDocumento(fornecedor.documento)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{fornecedor.email || fornecedor.contato || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditarFornecedor(fornecedor)}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50 transition"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExcluirFornecedor(fornecedor.id, fornecedor.nome)}
                          className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 'plano' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                Estrutura Hierárquica do Plano de Contas Gerencial
              </span>
            </div>
            <span className="text-xs text-slate-500">Mapeamento para DRE e Fluxo de Caixa</span>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 className="text-xs font-bold text-emerald-900 uppercase">
                  Grupo 1.00 — Receitas Operacionais
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                {planoDeContas
                  .filter(p => p.tipo === 'RECEITA')
                  .map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-emerald-50/40 border border-emerald-100 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-700">{p.codigo}</span>
                        <span className="text-xs font-medium text-slate-800">{p.nome}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 uppercase bg-white px-2 py-0.5 rounded border border-emerald-200">
                        Receita
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h4 className="text-xs font-bold text-rose-900 uppercase">
                  Grupo 2.00 — Despesas e Custos Operacionais
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                {planoDeContas
                  .filter(p => p.tipo === 'DESPESA')
                  .map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-rose-50/40 border border-rose-100 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-700">{p.codigo}</span>
                        <span className="text-xs font-medium text-slate-800">{p.nome}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-rose-600 uppercase bg-white px-2 py-0.5 rounded border border-rose-200">
                        Despesa
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
