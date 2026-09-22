import { financialDb, round2 } from './db.ts';
import {
  DashboardResponse,
  DashboardKPIs,
  FluxoCaixaPoint,
  DREGerencial,
  DRECategoria,
} from '../src/types/finance.ts';

export class FinancialETLPipeline {
  public static execute(): DashboardResponse {
    const titulos = financialDb.getTitulos();
    const baixas = financialDb.getBaixas();
    const planoContas = financialDb.getPlanoDeContas();

    const saldoAbertura = 25000.0;
    let totalEntradasRealizadas = 0;
    let totalSaidasRealizadas = 0;

    baixas.forEach(b => {
      const titulo = titulos.find(t => t.id === b.tituloId);
      if (!titulo) {
        console.warn(`[ETL] Baixa #${b.id} referencia título #${b.tituloId} inexistente. Registro ignorado nos KPIs.`);
        return;
      }

      if (titulo.tipo === 'RECEBER') {
        totalEntradasRealizadas += b.valorPago;
      } else if (titulo.tipo === 'PAGAR') {
        totalSaidasRealizadas += b.valorPago;
      }
    });

    const saldoCaixaAtual = round2(saldoAbertura + totalEntradasRealizadas - totalSaidasRealizadas);

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    const prefixoMesAtual = `${anoAtual}-${mesAtual}`;

    let totalAReceberMes = 0;
    let totalAPagarMes = 0;
    let titulosVencidosTotal = 0;
    let titulosVencidosValor = 0;
    let titulosPendentesCount = 0;
    let titulosPagosCountMes = 0;

    titulos.forEach(t => {
      const estaNoMes = t.dataVencimento.startsWith(prefixoMesAtual);

      if (t.status === 'VENCIDO') {
        titulosVencidosTotal += 1;
        titulosVencidosValor += t.valorOriginal;
      }

      if (t.status === 'PENDENTE') {
        titulosPendentesCount += 1;
      }

      if (t.status === 'PAGO' && estaNoMes) {
        titulosPagosCountMes += 1;
      }

      if (t.status !== 'PAGO' && estaNoMes) {
        if (t.tipo === 'RECEBER') {
          totalAReceberMes += t.valorOriginal;
        } else if (t.tipo === 'PAGAR') {
          totalAPagarMes += t.valorOriginal;
        }
      }
    });

    totalAReceberMes = round2(totalAReceberMes);
    totalAPagarMes = round2(totalAPagarMes);
    titulosVencidosValor = round2(titulosVencidosValor);
    const saldoProjetadoMes = round2(saldoCaixaAtual + totalAReceberMes - totalAPagarMes);

    const kpis: DashboardKPIs = {
      saldoCaixaAtual,
      totalAReceberMes,
      totalAPagarMes,
      saldoProjetadoMes,
      titulosVencidosTotal,
      titulosVencidosValor,
      titulosPendentesCount,
      titulosPagosCountMes,
    };

    const fluxoCaixa30Dias: FluxoCaixaPoint[] = [];
    let saldoProjetadoCorrente = saldoCaixaAtual;

    let vencidosReceber = 0;
    let vencidosPagar = 0;
    titulos.filter(t => t.status === 'VENCIDO').forEach(t => {
      if (t.tipo === 'RECEBER') vencidosReceber += t.valorOriginal;
      if (t.tipo === 'PAGAR') vencidosPagar += t.valorOriginal;
    });

    for (let i = 0; i <= 30; i++) {
      const targetDate = new Date(hoje);
      targetDate.setDate(hoje.getDate() + i);
      const dataIso = targetDate.toISOString().split('T')[0];
      const dia = String(targetDate.getDate()).padStart(2, '0');
      const mes = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dataFormatada = `${dia}/${mes}`;

      let entradasPrevistas = 0;
      let saidasPrevistas = 0;

      if (i === 0) {
        entradasPrevistas += vencidosReceber;
        saidasPrevistas += vencidosPagar;
      }

      titulos.filter(t => t.status === 'PENDENTE' && t.dataVencimento === dataIso).forEach(t => {
        if (t.tipo === 'RECEBER') entradasPrevistas += t.valorOriginal;
        if (t.tipo === 'PAGAR') saidasPrevistas += t.valorOriginal;
      });

      entradasPrevistas = round2(entradasPrevistas);
      saidasPrevistas = round2(saidasPrevistas);

      const saldoInicialDia = saldoProjetadoCorrente;
      saldoProjetadoCorrente = round2(saldoProjetadoCorrente + entradasPrevistas - saidasPrevistas);

      fluxoCaixa30Dias.push({
        data: dataIso,
        dataFormatada,
        saldoInicial: saldoInicialDia,
        entradasPrevistas,
        saidasPrevistas,
        entradasRealizadas: i === 0 ? totalEntradasRealizadas : 0,
        saidasRealizadas: i === 0 ? totalSaidasRealizadas : 0,
        saldoProjetado: saldoProjetadoCorrente,
        saldoReal: saldoCaixaAtual,
      });
    }

    let receitaBruta = 0;
    let deducoesDescontos = 0;
    let despesasOperacionais = 0;

    const mapaReceitas = new Map<number, { nome: string; codigo: string; valor: number }>();
    const mapaDespesas = new Map<number, { nome: string; codigo: string; valor: number }>();

    planoContas.forEach(pc => {
      if (pc.tipo === 'RECEITA') {
        mapaReceitas.set(pc.id, { nome: pc.nome, codigo: pc.codigo, valor: 0 });
      } else {
        mapaDespesas.set(pc.id, { nome: pc.nome, codigo: pc.codigo, valor: 0 });
      }
    });

    baixas.forEach(b => {
      const titulo = titulos.find(t => t.id === b.tituloId);
      if (!titulo) {
        console.warn(`[ETL] Baixa #${b.id} referencia título #${b.tituloId} inexistente. Registro ignorado no DRE.`);
        return;
      }

      if (titulo.tipo === 'RECEBER') {
        receitaBruta += b.valorOriginal;
        deducoesDescontos += b.descontos;
        const entry = mapaReceitas.get(titulo.planoContasId);
        if (entry) {
          entry.valor = round2(entry.valor + b.valorPago);
        }
      } else if (titulo.tipo === 'PAGAR') {
        despesasOperacionais += b.valorPago;
        const entry = mapaDespesas.get(titulo.planoContasId);
        if (entry) {
          entry.valor = round2(entry.valor + b.valorPago);
        }
      }
    });

    receitaBruta = round2(receitaBruta);
    deducoesDescontos = round2(deducoesDescontos);
    const receitaLiquida = round2(receitaBruta - deducoesDescontos);
    despesasOperacionais = round2(despesasOperacionais);
    const resultadoLiquido = round2(receitaLiquida - despesasOperacionais);
    const margemLiquidaPercentual = receitaLiquida > 0 ? round2((resultadoLiquido / receitaLiquida) * 100) : 0;

    const categoriasReceita: DRECategoria[] = Array.from(mapaReceitas.values())
      .filter(item => item.valor > 0)
      .map(item => ({
        categoria: item.nome,
        codigo: item.codigo,
        valor: round2(item.valor),
        percentual: receitaLiquida > 0 ? round2((item.valor / receitaLiquida) * 100) : 0,
      }))
      .sort((a, b) => b.valor - a.valor);

    const categoriasDespesa: DRECategoria[] = Array.from(mapaDespesas.values())
      .filter(item => item.valor > 0)
      .map(item => ({
        categoria: item.nome,
        codigo: item.codigo,
        valor: round2(item.valor),
        percentual: despesasOperacionais > 0 ? round2((item.valor / despesasOperacionais) * 100) : 0,
      }))
      .sort((a, b) => b.valor - a.valor);

    const dre: DREGerencial = {
      periodo: `${mesAtual}/${anoAtual}`,
      receitaBruta,
      deducoesDescontos,
      receitaLiquida,
      despesasOperacionais,
      resultadoLiquido,
      margemLiquidaPercentual,
      categoriasReceita,
      categoriasDespesa,
    };

    const titulosRecentes = [...titulos]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6);

    const proximosVencimentos = titulos
      .filter(t => t.status !== 'PAGO')
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
      .slice(0, 6);

    return {
      kpis,
      fluxoCaixa30Dias,
      dre,
      titulosRecentes,
      proximosVencimentos,
    };
  }
}
