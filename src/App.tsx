import React, { useState, useEffect, useCallback } from 'react';
import {
  DashboardResponse,
  TituloFinanceiro,
  BaixaFinanceira,
  Cliente,
  Fornecedor,
  PlanoDeContas,
  BaixaRequest,
  TipoTitulo,
} from './types/finance.ts';

import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { OperacionalView } from './components/OperacionalView.tsx';
import { BaixasView } from './components/BaixasView.tsx';
import { CadastrosView } from './components/CadastrosView.tsx';
import { RelatoriosDREView } from './components/RelatoriosDREView.tsx';

import { BaixaModal } from './components/BaixaModal.tsx';
import { NovoLancamentoModal } from './components/NovoLancamentoModal.tsx';
import { ClienteModal } from './components/ClienteModal.tsx';
import { FornecedorModal } from './components/FornecedorModal.tsx';

import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculando, setRecalculando] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [titulos, setTitulos] = useState<TituloFinanceiro[]>([]);
  const [baixas, setBaixas] = useState<BaixaFinanceira[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [planoDeContas, setPlanoDeContas] = useState<PlanoDeContas[]>([]);

  const [modalBaixaTitulo, setModalBaixaTitulo] = useState<TituloFinanceiro | null>(null);
  const [modalNovoLancamentoAberto, setModalNovoLancamentoAberto] = useState<boolean>(false);
  const [modalCliente, setModalCliente] = useState<{ aberto: boolean; cliente: Cliente | null }>({
    aberto: false,
    cliente: null,
  });
  const [modalFornecedor, setModalFornecedor] = useState<{ aberto: boolean; fornecedor: Fornecedor | null }>({
    aberto: false,
    fornecedor: null,
  });

  const exibirFeedback = (msg: string, isError = false) => {
    if (isError) {
      setMensagemErro(msg);
      setTimeout(() => setMensagemErro(null), 5000);
    } else {
      setMensagemSucesso(msg);
      setTimeout(() => setMensagemSucesso(null), 4000);
    }
  };

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      const parseJson = async (res: Response, nome: string) => {
        if (!res.ok) {
          throw new Error(`Falha na API (${nome}): status ${res.status}`);
        }
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`A API (${nome}) não retornou JSON válido.`);
        }
      };

      const [resDash, resTitulos, resBaixas, resClientes, resFornecedores, resPlano] =
        await Promise.all([
          fetch('/api/analytics/dashboard'),
          fetch('/api/titulos'),
          fetch('/api/baixas'),
          fetch('/api/clientes'),
          fetch('/api/fornecedores'),
          fetch('/api/plano-de-contas'),
        ]);

      const [dashData, titulosData, baixasData, clientesData, fornecedoresData, planoData] =
        await Promise.all([
          parseJson(resDash, 'Dashboard'),
          parseJson(resTitulos, 'Títulos'),
          parseJson(resBaixas, 'Baixas'),
          parseJson(resClientes, 'Clientes'),
          parseJson(resFornecedores, 'Fornecedores'),
          parseJson(resPlano, 'Plano de Contas'),
        ]);

      setDashboardData(dashData);
      setTitulos(titulosData);
      setBaixas(baixasData);
      setClientes(clientesData);
      setFornecedores(fornecedoresData);
      setPlanoDeContas(planoData);
    } catch (err: any) {
      console.error('Erro ao sincronizar dados com o backend:', err);
      exibirFeedback(err.message || 'Erro de conexão com o servidor. Verifique os serviços.', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleRecalcularETL = async () => {
    try {
      setRecalculando(true);
      const res = await fetch('/api/analytics/recalcular', { method: 'POST' });
      if (!res.ok) throw new Error('Falha no processamento do ETL.');
      await carregarDados();
      exibirFeedback('Pipeline ETL reprocessado: fluxo de caixa e DRE atualizados!');
    } catch (err: any) {
      exibirFeedback(err.message, true);
    } finally {
      setRecalculando(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Deseja resetar a base para o estado inicial de demonstração?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao resetar demonstração.');
      await carregarDados();
      exibirFeedback('Base de demonstração restaurada com sucesso!');
    } catch (err: any) {
      exibirFeedback(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarBaixa = async (tituloId: number, data: BaixaRequest) => {
    const res = await fetch(`/api/titulos/${tituloId}/baixa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Falha ao processar liquidação.');
    }

    await carregarDados();
    exibirFeedback(`Título #${tituloId} liquidado com sucesso! Saldo atualizado.`);
  };

  const handleSalvarLancamento = async (dados: {
    tipo: TipoTitulo;
    clienteId?: number;
    fornecedorId?: number;
    planoContasId: number;
    descricao: string;
    valorOriginal: number;
    dataEmissao: string;
    dataVencimento: string;
  }) => {
    const res = await fetch('/api/titulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Falha ao criar título financeiro.');
    }

    await carregarDados();
    exibirFeedback(`Novo lançamento cadastrado com sucesso!`);
  };

  const handleExcluirTitulo = async (id: number) => {
    const res = await fetch(`/api/titulos/${id}`, { method: 'DELETE' });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Não foi possível excluir o título.');
    }
    await carregarDados();
    exibirFeedback(`Título #${id} removido.`);
  };

  const handleSalvarCliente = async (dados: Omit<Cliente, 'id' | 'createdAt'>) => {
    const isEdit = !!modalCliente.cliente;
    const url = isEdit ? `/api/clientes/${modalCliente.cliente!.id}` : '/api/clientes';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Falha ao salvar cliente.');
    }

    await carregarDados();
    exibirFeedback(`Cliente ${isEdit ? 'atualizado' : 'cadastrado'} com sucesso!`);
  };

  const handleExcluirCliente = async (id: number) => {
    const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Falha ao excluir cliente.');
    }
    await carregarDados();
    exibirFeedback('Cliente excluído com sucesso.');
  };

  const handleSalvarFornecedor = async (dados: Omit<Fornecedor, 'id' | 'createdAt'>) => {
    const isEdit = !!modalFornecedor.fornecedor;
    const url = isEdit ? `/api/fornecedores/${modalFornecedor.fornecedor!.id}` : '/api/fornecedores';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Falha ao salvar fornecedor.');
    }

    await carregarDados();
    exibirFeedback(`Fornecedor ${isEdit ? 'atualizado' : 'cadastrado'} com sucesso!`);
  };

  const handleExcluirFornecedor = async (id: number) => {
    const res = await fetch(`/api/fornecedores/${id}`, { method: 'DELETE' });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Falha ao excluir fornecedor.');
    }
    await carregarDados();
    exibirFeedback('Fornecedor excluído com sucesso.');
  };

  const saldoCaixaAtual = dashboardData?.kpis.saldoCaixaAtual ?? 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onRecalcularETL={handleRecalcularETL}
        recalculando={recalculando}
      />

      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Header
          currentTab={currentTab}
          saldoCaixaAtual={saldoCaixaAtual}
          onNovoLancamento={() => setModalNovoLancamentoAberto(true)}
          onResetDemo={handleResetDemo}
        />

        <div className="px-6 pt-3">
          {mensagemSucesso && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl shadow-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}
          {mensagemErro && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl shadow-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{mensagemErro}</span>
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {loading && !dashboardData ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Carregando dados financeiros e executando pipeline...</span>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && dashboardData && (
                <DashboardView
                  data={dashboardData}
                  onDarBaixa={titulo => setModalBaixaTitulo(titulo)}
                  onIrParaOperacional={() => setCurrentTab('operacional')}
                />
              )}

              {currentTab === 'operacional' && (
                <OperacionalView
                  titulos={titulos}
                  onNovoLancamento={() => setModalNovoLancamentoAberto(true)}
                  onDarBaixa={titulo => setModalBaixaTitulo(titulo)}
                  onExcluirTitulo={handleExcluirTitulo}
                />
              )}

              {currentTab === 'baixas' && (
                <BaixasView
                  titulos={titulos}
                  baixas={baixas}
                  onDarBaixa={titulo => setModalBaixaTitulo(titulo)}
                />
              )}

              {currentTab === 'cadastros' && (
                <CadastrosView
                  clientes={clientes}
                  fornecedores={fornecedores}
                  planoDeContas={planoDeContas}
                  onNovoCliente={() => setModalCliente({ aberto: true, cliente: null })}
                  onEditarCliente={c => setModalCliente({ aberto: true, cliente: c })}
                  onExcluirCliente={handleExcluirCliente}
                  onNovoFornecedor={() => setModalFornecedor({ aberto: true, fornecedor: null })}
                  onEditarFornecedor={f => setModalFornecedor({ aberto: true, fornecedor: f })}
                  onExcluirFornecedor={handleExcluirFornecedor}
                />
              )}

              {currentTab === 'dre' && dashboardData && (
                <RelatoriosDREView dre={dashboardData.dre} />
              )}
            </>
          )}
        </main>
      </div>

      {modalBaixaTitulo && (
        <BaixaModal
          titulo={modalBaixaTitulo}
          onClose={() => setModalBaixaTitulo(null)}
          onConfirm={handleConfirmarBaixa}
        />
      )}

      {modalNovoLancamentoAberto && (
        <NovoLancamentoModal
          clientes={clientes}
          fornecedores={fornecedores}
          planoDeContas={planoDeContas}
          onClose={() => setModalNovoLancamentoAberto(false)}
          onSave={handleSalvarLancamento}
        />
      )}

      {modalCliente.aberto && (
        <ClienteModal
          cliente={modalCliente.cliente}
          onClose={() => setModalCliente({ aberto: false, cliente: null })}
          onSave={handleSalvarCliente}
        />
      )}

      {modalFornecedor.aberto && (
        <FornecedorModal
          fornecedor={modalFornecedor.fornecedor}
          onClose={() => setModalFornecedor({ aberto: false, fornecedor: null })}
          onSave={handleSalvarFornecedor}
        />
      )}
    </div>
  );
}
