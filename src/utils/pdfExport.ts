import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DashboardResponse, DREGerencial, DRECategoria } from '../types/finance.ts';
import { formatCurrency, formatDate } from './formatters.ts';

export function exportDREToPDF(dre: DREGerencial): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MINI-ERP FINANCEIRO & BUSINESS INTELLIGENCE', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Relatório Financeiro Oficial • DRE Gerencial Consolidado', 14, 18);

  doc.setFontSize(8);
  doc.text(`Emissão: ${dataAtual} às ${horaAtual}`, 196, 15, { align: 'right' });

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO (DRE GERENCIAL)', 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Apuração pelo regime de liquidações efetivas com cálculo de margens e deduções.', 14, 39);

  const yCards = 44;
  const cardWidth = 43;
  const cardHeight = 18;
  const cards = [
    { title: 'Receita Líquida', val: formatCurrency(dre.receitaLiquida), color: [16, 185, 129] },
    { title: 'Despesas Operac.', val: formatCurrency(dre.despesasOperacionais), color: [244, 63, 94] },
    { title: 'Resultado Líquido', val: formatCurrency(dre.resultadoLiquido), color: [37, 99, 235] },
    { title: 'Margem Líquida', val: `${dre.margemLiquidaPercentual.toFixed(1)}%`, color: [124, 58, 237] },
  ];

  cards.forEach((c, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, yCards, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 3, yCards + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.val, x + 3, yCards + 13);
  });

  const baseCalculo = dre.receitaLiquida > 0 ? dre.receitaLiquida : 1;

  const tableBody: any[] = [
    ['1.00', 'RECEITA OPERACIONAL BRUTA', formatCurrency(dre.receitaBruta), '-'],
    ['1.01', '  (-) Deduções e Descontos Comerciais Concedidos', formatCurrency(dre.deducoesDescontos), '-'],
    ['1.99', '(=) RECEITA OPERACIONAL LÍQUIDA', formatCurrency(dre.receitaLiquida), '100.0%'],
    ['2.00', '(-) DESPESAS OPERACIONAIS TOTAIS', formatCurrency(dre.despesasOperacionais), `${((dre.despesasOperacionais / baseCalculo) * 100).toFixed(1)}%`],
  ];

  (dre.categoriasDespesa || []).forEach((cat: DRECategoria) => {
    const perc = ((cat.valor / baseCalculo) * 100).toFixed(1);
    tableBody.push([
      `  • ${cat.codigo || '2.xx'}`,
      `    ${cat.categoria}`,
      formatCurrency(cat.valor),
      `${perc}%`,
    ]);
  });

  tableBody.push([
    '3.00',
    '(=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO/PREJUÍZO)',
    formatCurrency(dre.resultadoLiquido),
    `${dre.margemLiquidaPercentual.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['Código', 'Descrição da Linha Contábil / Gerencial', 'Valor (R$)', '% Análise Vertical']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold', textColor: [71, 85, 105], halign: 'center' },
      1: { cellWidth: 100 },
      2: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'right' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    didParseCell: data => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = [239, 246, 255];
        data.cell.styles.textColor = [30, 58, 138];
        data.cell.styles.fontStyle = 'bold';
      } else if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fillColor = dre.resultadoLiquido >= 0 ? [236, 253, 245] : [255, 241, 242];
        data.cell.styles.textColor = dre.resultadoLiquido >= 0 ? [6, 95, 70] : [159, 18, 57];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    '* A análise vertical representa a participação percentual de cada rubrica sobre a Receita Operacional Líquida (base 100%).',
    14,
    finalY + 8
  );

  const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 285, 196, 285);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Mini-ERP Financeiro & BI • Gestão Financeira Integrada', 14, 290);
    doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
  }

  const nomeArquivo = `DRE_Gerencial_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nomeArquivo);
}

export function exportDashboardToPDF(data: DashboardResponse): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { kpis, fluxoCaixa30Dias, proximosVencimentos, dre } = data;
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MINI-ERP FINANCEIRO & BUSINESS INTELLIGENCE', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Relatório Executivo • Posição de Caixa & Projeções Analíticas', 14, 18);

  doc.setFontSize(8);
  doc.text(`Emissão: ${dataAtual} às ${horaAtual}`, 196, 15, { align: 'right' });

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. INDICADORES FINANCEIROS CHAVE (KPIS)', 14, 33);

  const yKpis = 37;
  const kpiWidth = 43;
  const kpiHeight = 17;
  const kpiList = [
    { title: 'Saldo Atual em Caixa', val: formatCurrency(kpis.saldoCaixaAtual), cor: [16, 185, 129] },
    { title: 'A Receber no Mês', val: formatCurrency(kpis.totalAReceberMes), cor: [37, 99, 235] },
    { title: 'A Pagar no Mês', val: formatCurrency(kpis.totalAPagarMes), cor: [225, 29, 72] },
    { title: 'Saldo Projetado Mês', val: formatCurrency(kpis.saldoProjetadoMes), cor: [79, 70, 229] },
  ];

  kpiList.forEach((k, idx) => {
    const x = 14 + idx * (kpiWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, yKpis, kpiWidth, kpiHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k.title, x + 3, yKpis + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(k.cor[0], k.cor[1], k.cor[2]);
    doc.text(k.val, x + 3, yKpis + 12.5);
  });

  let yAposKpis = 59;
  if (kpis.titulosVencidosTotal > 0) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(14, yAposKpis, 182, 9, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text(
      `ALERTA DE LIQUIDEZ: Existem ${kpis.titulosVencidosTotal} título(s) vencido(s) totalizando ${formatCurrency(kpis.titulosVencidosValor)} em aberto.`,
      18,
      yAposKpis + 5.5
    );
    yAposKpis += 13;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. PROJEÇÃO DE FLUXO DE CAIXA DIÁRIO (PRÓXIMOS DIAS)', 14, yAposKpis);

  const fluxoTableRows = fluxoCaixa30Dias.slice(0, 14).map(f => [
    f.dataFormatada,
    formatCurrency(f.entradasPrevistas),
    formatCurrency(f.saidasPrevistas),
    formatCurrency(f.saldoProjetado),
    f.saldoProjetado >= 0 ? 'Positivo' : 'Alerta Negativo',
  ]);

  autoTable(doc, {
    startY: yAposKpis + 4,
    head: [['Data', 'Entradas Previstas', 'Saídas Previstas', 'Saldo Projetado', 'Situação']],
    body: fluxoTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 38, halign: 'right', textColor: [5, 150, 105] },
      2: { cellWidth: 38, halign: 'right', textColor: [225, 29, 72] },
      3: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 36, halign: 'center', fontSize: 7.5 },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
  });

  const yProximos = (doc as any).lastAutoTable?.finalY + 8 || 155;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. PRÓXIMOS COMPROMISSOS & RECEBIMENTOS AGENDADOS', 14, yProximos);

  const titulosRows = proximosVencimentos.slice(0, 8).map(t => [
    t.tipo,
    t.descricao,
    t.entidadeNome || '-',
    t.planoContasNome || '-',
    formatDate(t.dataVencimento),
    formatCurrency(t.valorOriginal),
    t.status,
  ]);

  autoTable(doc, {
    startY: yProximos + 4,
    head: [['Tipo', 'Descrição', 'Parceiro / Entidade', 'Categoria', 'Vencimento', 'Valor Original', 'Status']],
    body: titulosRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 35 },
      3: { cellWidth: 32 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 12, halign: 'center', fontSize: 7 },
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    didParseCell: data => {
      if (data.column.index === 0) {
        if (data.cell.raw === 'RECEBER') {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
  });

  const yFinalDRE = (doc as any).lastAutoTable?.finalY + 6 || 240;

  if (yFinalDRE < 265) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, yFinalDRE, 182, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Resumo DRE do Exercício:', 18, yFinalDRE + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Receita Líquida: ${formatCurrency(dre.receitaLiquida)}  |  Despesas Operacionais: ${formatCurrency(dre.despesasOperacionais)}  |  Lucro Líquido: ${formatCurrency(dre.resultadoLiquido)}  |  Margem Líquida: ${dre.margemLiquidaPercentual.toFixed(1)}%`,
      18,
      yFinalDRE + 11
    );
  }

  const totalPages = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 285, 196, 285);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Mini-ERP Financeiro & BI • Relatório Executivo Gerencial', 14, 290);
    doc.text(`Página ${i} de ${totalPages}`, 196, 290, { align: 'right' });
  }

  const nomeArquivo = `Dashboard_Executivo_BI_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nomeArquivo);
}
