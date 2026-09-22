import React, { useState } from 'react';
import { DashboardResponse, TituloFinanceiro } from '../types/finance.ts';
import { formatCurrency, formatDate } from '../utils/formatters.ts';
import { exportDashboardToPDF } from '../utils/pdfExport.ts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  CalendarClock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  FileDown,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  data: DashboardResponse;
  onDarBaixa: (titulo: TituloFinanceiro) => void;
  onIrParaOperacional: () => void;
}

const TrendPill: React.FC<{ value: number }> = ({ value }) => {
  const isFlat = Math.abs(value) < 0.5;
  const isPositive = value > 0;
  const Icon = isFlat ? Minus : isPositive ? TrendingUp : TrendingDown;
  const tone = isFlat
    ? 'bg-slate-100 text-slate-600'
    : isPositive
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-rose-50 text-rose-700';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${tone}`}>
      <Icon className="w-3 h-3" />
      {isFlat ? '0%' : `${isPositive ? '+' : ''}${value.toFixed(0)}%`}
    </span>
  );
};

const MiniBars: React.FC<{ values: number[]; barClass: string }> = ({ values, barClass }) => {
  const max = Math.max(...values.map(v => Math.abs(v)), 1);
  return (
    <div className="flex items-end gap-1 h-9">
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-[3px] ${barClass}`}
          style={{
            height: `${Math.max((Math.abs(v) / max) * 100, 10)}%`,
            opacity: i === values.length - 1 ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
};

const FluxoTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-[11px] space-y-1.5 min-w-[170px]">
      <p className="font-semibold text-slate-800 pb-1.5 border-b border-slate-100">Dia {label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          Saldo Projetado
        </span>
        <strong className="text-slate-900">{formatCurrency(payload[0].value)}</strong>
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onDarBaixa,
  onIrParaOperacional,
}) => {
  const { kpis, fluxoCaixa30Dias, dre, proximosVencimentos } = data;
  const [gerandoPDF, setGerandoPDF] = useState<boolean>(false);
  const [pdfSucesso, setPdfSucesso] = useState<boolean>(false);

  const saldoD7 = fluxoCaixa30Dias[6]?.saldoProjetado ?? kpis.saldoCaixaAtual;
  const pctSaldo7d = kpis.saldoCaixaAtual !== 0
    ? ((saldoD7 - kpis.saldoCaixaAtual) / Math.abs(kpis.saldoCaixaAtual)) * 100
    : 0;
  const pctCobertura = kpis.totalAPagarMes > 0
    ? ((kpis.totalAReceberMes - kpis.totalAPagarMes) / kpis.totalAPagarMes) * 100
    : 0;
  const pctProjetado = kpis.saldoCaixaAtual !== 0
    ? ((kpis.saldoProjetadoMes - kpis.saldoCaixaAtual) / Math.abs(kpis.saldoCaixaAtual)) * 100
    : 0;

  const sparkSaldo = fluxoCaixa30Dias.slice(0, 7).map(f => f.saldoProjetado);
  const sparkReceber = fluxoCaixa30Dias.slice(0, 7).map(f => f.entradasPrevistas);
  const sparkPagar = fluxoCaixa30Dias.slice(0, 7).map(f => f.saidasPrevistas);
  const sparkProjetado = fluxoCaixa30Dias.slice(-7).map(f => f.saldoProjetado);

  const handleExportPDF = () => {
    try {
      setGerandoPDF(true);
      exportDashboardToPDF(data);
      setPdfSucesso(true);
      setTimeout(() => setPdfSucesso(false), 3000);
    } catch (err) {
      console.error('Erro ao exportar PDF do Dashboard:', err);
    } finally {
      setGerandoPDF(false);
    }
  };

  const chartDreData = [
    {
      name: 'Receita Bruta',
      Receitas: dre.receitaBruta,
      Despesas: 0,
    },
    {
      name: 'Deduções',
      Receitas: 0,
      Despesas: dre.deducoesDescontos,
    },
    {
      name: 'Desp. Operacionais',
      Receitas: 0,
      Despesas: dre.despesasOperacionais,
    },
    {
      name: 'Resultado Líquido',
      Receitas: dre.resultadoLiquido > 0 ? dre.resultadoLiquido : 0,
      Despesas: dre.resultadoLiquido < 0 ? Math.abs(dre.resultadoLiquido) : 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800">
            Painel Executivo de Business Intelligence
          </h3>
          <p className="text-[11px] text-slate-500">
            Visão consolidada de liquidez imediata, projeção diária de fluxo de caixa e DRE
          </p>
        </div>

        <button
          id="btn-exportar-dashboard-pdf"
          onClick={handleExportPDF}
          disabled={gerandoPDF}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          title="Exportar documento PDF completo do Dashboard para impressão ou envio corporativo"
        >
          {pdfSucesso ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span>
            {gerandoPDF ? 'Gerando Relatório...' : pdfSucesso ? 'PDF Baixado com Sucesso!' : 'Exportar Relatório PDF'}
          </span>
        </button>
      </div>

      {kpis.titulosVencidosTotal > 0 && (
        <div id="alerta-vencidos" className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Atenção: {kpis.titulosVencidosTotal} título(s) financeiro(s) vencido(s) aguardando regularização
              </h4>
              <p className="text-xs text-amber-700">
                Total acumulado em aberto: <span className="font-semibold">{formatCurrency(kpis.titulosVencidosValor)}</span>. Execute as baixas ou cobranças correspondentes.
              </p>
            </div>
          </div>
          <button
            onClick={onIrParaOperacional}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
          >
            Ver Títulos Vencidos
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="kpi-saldo-caixa" className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saldo Atual em Caixa</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xl font-bold text-slate-900">{formatCurrency(kpis.saldoCaixaAtual)}</p>
            <TrendPill value={pctSaldo7d} />
          </div>
          <MiniBars values={sparkSaldo} barClass="bg-emerald-500" />
          <p className="text-[11px] text-slate-400">Projeção de saldo · próximos 7 dias</p>
        </div>

        <div id="kpi-a-receber" className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">A Receber no Mês</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xl font-bold text-blue-700">{formatCurrency(kpis.totalAReceberMes)}</p>
            <TrendPill value={pctCobertura} />
          </div>
          <MiniBars values={sparkReceber} barClass="bg-blue-500" />
          <p className="text-[11px] text-slate-400">Cobertura sobre o total a pagar no mês</p>
        </div>

        <div id="kpi-a-pagar" className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">A Pagar no Mês</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xl font-bold text-rose-700">{formatCurrency(kpis.totalAPagarMes)}</p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                kpis.titulosVencidosTotal > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {kpis.titulosVencidosTotal > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  {kpis.titulosVencidosTotal} vencido{kpis.titulosVencidosTotal > 1 ? 's' : ''}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Em dia
                </>
              )}
            </span>
          </div>
          <MiniBars values={sparkPagar} barClass="bg-rose-500" />
          <p className="text-[11px] text-slate-400">Saídas previstas · próximos 7 dias</p>
        </div>

        <div id="kpi-saldo-projetado" className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saldo Projetado Final</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xl font-bold ${kpis.saldoProjetadoMes >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
              {formatCurrency(kpis.saldoProjetadoMes)}
            </p>
            <TrendPill value={pctProjetado} />
          </div>
          <MiniBars values={sparkProjetado} barClass="bg-indigo-500" />
          <p className="text-[11px] text-slate-400">Vs. saldo atual em caixa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Projeção de Fluxo de Caixa (Próximos 30 Dias)
              </h3>
              <p className="text-[11px] text-slate-500">
                Cruzamento diário de saldos acumulados com contas a pagar e receber previstas
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              Saldo Projetado
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fluxoCaixa30Dias} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dataFormatada" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={val => `R$ ${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<FluxoTooltip />} />
                <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Zero', fill: '#f43f5e', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="saldoProjetado"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                  name="Saldo Projetado"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Saldo Inicial Hoje: <strong>{formatCurrency(kpis.saldoCaixaAtual)}</strong></span>
            <span>Saldo Projetado D+30: <strong>{formatCurrency(fluxoCaixa30Dias[fluxoCaixa30Dias.length - 1]?.saldoProjetado || 0)}</strong></span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900">DRE Gerencial</h3>
                <p className="text-[11px] text-slate-500">Receitas vs Despesas Realizadas</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Margem: {dre.margemLiquidaPercentual}%
              </span>
            </div>

            <div className="h-48 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDreData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={val => `${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Receita Líquida:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(dre.receitaLiquida)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Despesas Operacionais:</span>
              <span className="font-semibold text-rose-600">-{formatCurrency(dre.despesasOperacionais)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
              <span>Resultado Líquido:</span>
              <span className={dre.resultadoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                {formatCurrency(dre.resultadoLiquido)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Próximos Vencimentos em Aberto
            </h3>
            <p className="text-[11px] text-slate-500">
              Títulos que requerem pagamento ou cobrança imediata
            </p>
          </div>
          <button
            onClick={onIrParaOperacional}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            Ver todos os títulos →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Cliente / Fornecedor</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Vencimento</th>
                <th className="py-2.5 px-3 text-right">Valor Original</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {proximosVencimentos.map(titulo => {
                const isReceber = titulo.tipo === 'RECEBER';
                return (
                  <tr key={titulo.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isReceber ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {isReceber ? 'RECEBER' : 'PAGAR'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{titulo.descricao}</td>
                    <td className="py-2.5 px-3 text-slate-600">{titulo.entidadeNome}</td>
                    <td className="py-2.5 px-3 text-slate-500">{titulo.planoContasNome}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatDate(titulo.dataVencimento)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      {formatCurrency(titulo.valorOriginal)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          titulo.status === 'VENCIDO'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {titulo.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onDarBaixa(titulo)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md transition"
                      >
                        Dar Baixa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
