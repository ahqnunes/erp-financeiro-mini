import React, { useState } from 'react';
import { DREGerencial, DRECategoria } from '../types/finance.ts';
import { formatCurrency } from '../utils/formatters.ts';
import { exportDREToPDF } from '../utils/pdfExport.ts';
import {
  FileSpreadsheet,
  Download,
  Percent,
  FileDown,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RelatoriosDREViewProps {
  dre: DREGerencial;
}

export const RelatoriosDREView: React.FC<RelatoriosDREViewProps> = ({ dre }) => {
  const [gerandoPDF, setGerandoPDF] = useState<boolean>(false);
  const [pdfSucesso, setPdfSucesso] = useState<boolean>(false);

  const baseCalculo = dre.receitaLiquida > 0 ? dre.receitaLiquida : 1;

  const chartDespesasData = (dre.categoriasDespesa || []).map((d: DRECategoria) => ({
    categoria: d.categoria,
    valor: d.valor,
    percentual: ((d.valor / baseCalculo) * 100).toFixed(1),
  }));

  const handleExportPDF = () => {
    try {
      setGerandoPDF(true);
      exportDREToPDF(dre);
      setPdfSucesso(true);
      setTimeout(() => setPdfSucesso(false), 3000);
    } catch (err) {
      console.error('Erro ao gerar PDF do DRE:', err);
    } finally {
      setGerandoPDF(false);
    }
  };

  const csvEscape = (value: string | number): string => {
    let str = String(value);
    // Neutraliza injeção de fórmulas em planilhas (Excel/Sheets) para valores
    // vindos de cadastro do usuário (ex: nome de categoria) que comecem com
    // caracteres que iniciam uma fórmula.
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    // Escapa aspas e envolve em aspas caso contenha o delimitador, quebras de
    // linha ou aspas, para não quebrar o parsing do CSV.
    if (/[;"\n]/.test(str)) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCSV = () => {
    let csv = 'Item;Valor (R$);% Receita Líquida\n';
    csv += `1. RECEITA BRUTA OPERACIONAL;${dre.receitaBruta.toFixed(2)};-\n`;
    csv += `2. (-) Deduções e Descontos Concedidos;${dre.deducoesDescontos.toFixed(2)};-\n`;
    csv += `3. (=) RECEITA OPERACIONAL LÍQUIDA;${dre.receitaLiquida.toFixed(2)};100%\n`;
    csv += `4. (-) DESPESAS OPERACIONAIS;${dre.despesasOperacionais.toFixed(2)};${((dre.despesasOperacionais / baseCalculo) * 100).toFixed(1)}%\n`;
    (dre.categoriasDespesa || []).forEach((d: DRECategoria) => {
      csv += `  - ${csvEscape(d.categoria)};${d.valor.toFixed(2)};${((d.valor / baseCalculo) * 100).toFixed(1)}%\n`;
    });
    csv += `5. (=) RESULTADO LÍQUIDO DO EXERCÍCIO;${dre.resultadoLiquido.toFixed(2)};${dre.margemLiquidaPercentual}%\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DRE_Gerencial_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-800">
              Demonstrativo do Resultado do Exercício (DRE Gerencial)
            </h3>
            <p className="text-[11px] text-stone-500">
              Apuração por competência financeira com análise vertical detalhada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-exportar-dre-pdf"
            onClick={handleExportPDF}
            disabled={gerandoPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            title="Exportar documento PDF formatado para impressão ou compartilhamento externo"
          >
            {pdfSucesso ? (
              <Check className="w-4 h-4 text-teal-300" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>{gerandoPDF ? 'Gerando...' : pdfSucesso ? 'PDF Baixado!' : 'Exportar PDF'}</span>
          </button>

          <button
            id="btn-exportar-dre-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800">Estrutura Contábil / Gerencial</span>
            <span className="text-xs text-stone-500 font-mono">Regime de Liquidações Realizadas</span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            <div className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition">
              <div>
                <span className="font-bold text-stone-900 block">1. RECEITA OPERACIONAL BRUTA</span>
                <span className="text-[11px] text-stone-400">Total faturado de serviços e produtos</span>
              </div>
              <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">{formatCurrency(dre.receitaBruta)}</span>
            </div>

            <div className="p-4 flex items-center justify-between pl-8 hover:bg-stone-50/50 transition">
              <div>
                <span className="text-stone-600 block">(-) Deduções e Descontos Concedidos</span>
                <span className="text-[11px] text-stone-400">Descontos comerciais aplicados nas baixas</span>
              </div>
              <span className="font-mono text-orange-700 tabular-nums">
                {dre.deducoesDescontos > 0 ? `-${formatCurrency(dre.deducoesDescontos)}` : 'R$ 0,00'}
              </span>
            </div>

            <div className="p-4 bg-violet-50/50 flex items-center justify-between border-y border-violet-100 font-semibold text-violet-950">
              <div>
                <span className="block">(=) RECEITA OPERACIONAL LÍQUIDA</span>
                <span className="text-[10px] text-violet-600">Base 100% para análise vertical</span>
              </div>
              <span className="font-mono font-bold text-sm text-violet-900 tabular-nums">{formatCurrency(dre.receitaLiquida)}</span>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition">
              <div>
                <span className="font-bold text-stone-900 block">(-) DESPESAS OPERACIONAIS</span>
                <span className="text-[11px] text-stone-400">Custos fixos, infraestrutura e fornecedores</span>
              </div>
              <span className="font-mono font-bold text-orange-700 text-sm tabular-nums">
                -{formatCurrency(dre.despesasOperacionais)}
              </span>
            </div>

            {(dre.categoriasDespesa || []).map((cat: DRECategoria, idx: number) => {
              const perc = ((cat.valor / baseCalculo) * 100).toFixed(1);
              return (
                <div key={idx} className="py-2.5 px-4 pl-8 flex items-center justify-between hover:bg-stone-50/50 transition text-stone-600">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-300"></span>
                    <span>{cat.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-stone-400 font-mono">({perc}%)</span>
                    <span className="font-mono text-stone-700 tabular-nums">-{formatCurrency(cat.valor)}</span>
                  </div>
                </div>
              );
            })}

            <div className={`p-4 flex items-center justify-between border-t-2 ${
              dre.resultadoLiquido >= 0 ? 'bg-teal-50/60 border-teal-300' : 'bg-rose-50/60 border-rose-300'
            }`}>
              <div>
                <span className="font-bold text-stone-900 block text-sm">
                  (=) RESULTADO LÍQUIDO DO EXERCÍCIO
                </span>
                <span className="text-[11px] text-stone-500">
                  Lucro real apurado após deduções e liquidações
                </span>
              </div>
              <div className="text-right">
                <span className={`font-mono font-bold text-base block tabular-nums ${
                  dre.resultadoLiquido >= 0 ? 'text-teal-800' : 'text-rose-700'
                }`}>
                  {formatCurrency(dre.resultadoLiquido)}
                </span>
                <span className="text-[11px] font-semibold text-stone-600">
                  Margem Líquida: {dre.margemLiquidaPercentual}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-stone-100 pb-3">
              <h4 className="text-xs font-bold text-stone-900">Composição das Despesas</h4>
              <p className="text-[11px] text-stone-500">Distribuição por plano de contas gerencial</p>
            </div>

            <div className="h-64 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDespesasData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#78716c' }} tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="categoria" width={110} tick={{ fontSize: 9, fill: '#78716c' }} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="valor" fill="#c2410c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-stone-800">Eficiência Operacional</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Para cada R$ 100,00 de receita líquida auferida, o negócio retém atualmente <strong className="tabular-nums">R$ {dre.margemLiquidaPercentual.toFixed(2)}</strong> de lucro líquido final.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
