#!/usr/bin/env python3
import os
import json
import datetime
from decimal import Decimal, ROUND_HALF_UP

# Tenta importar pandas, ou usa fallback aritmético nativo
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

# Configuração de conexão via variáveis de ambiente
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "minierp")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")

def round_money(val):
    """Garante arredondamento monetário preciso a duas casas decimais."""
    if val is None:
        return 0.0
    return float(Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

class FinancialETLPipeline:
    def __init__(self, connection_uri=None):
        self.connection_uri = connection_uri or f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    def extract(self):
        """
        FASE 1: EXTRACT
        Extrai o estado atual das tabelas transacionais e cadastrais.
        """
        print("[ETL] 1. Extraindo dados transacionais do PostgreSQL...")
        if HAS_PANDAS:
            try:
                from sqlalchemy import create_engine
                engine = create_engine(self.connection_uri)
                df_titulos = pd.read_sql("SELECT * FROM titulos_financeiros", engine)
                df_baixas = pd.read_sql("SELECT * FROM baixas_financeiras", engine)
                df_plano = pd.read_sql("SELECT * FROM plano_de_contas", engine)
                return df_titulos, df_baixas, df_plano
            except Exception as e:
                print(
                    f"[ETL WARNING] Falha ao extrair dados reais do PostgreSQL: {e!r}. "
                    "Usando dados estruturados de DEMONSTRAÇÃO — os números a seguir NÃO refletem "
                    "o estado real do banco. Investigue esta falha antes de confiar no relatório.",
                    file=__import__("sys").stderr,
                )

        return self._extract_demo_data()

    def _extract_demo_data(self):
        """Dados de fallback para execução do script em qualquer ambiente."""
        hoje = datetime.date.today()
        titulos = [
            {"id": 1, "tipo": "RECEBER", "plano_contas_id": 1, "categoria": "Consultoria", "valor_original": 14500.0, "vencimento": hoje - datetime.timedelta(days=10), "status": "PAGO"},
            {"id": 2, "tipo": "RECEBER", "plano_contas_id": 2, "categoria": "SaaS", "valor_original": 8900.0, "vencimento": hoje - datetime.timedelta(days=5), "status": "PAGO"},
            {"id": 3, "tipo": "PAGAR", "plano_contas_id": 5, "categoria": "Cloud & Servidores", "valor_original": 3450.8, "vencimento": hoje - datetime.timedelta(days=8), "status": "PAGO"},
            {"id": 4, "tipo": "PAGAR", "plano_contas_id": 6, "categoria": "Aluguel & Condomínio", "valor_original": 6200.0, "vencimento": hoje - datetime.timedelta(days=12), "status": "PAGO"},
            {"id": 5, "tipo": "PAGAR", "plano_contas_id": 8, "categoria": "Contabilidade & Jurídico", "valor_original": 2100.0, "vencimento": hoje - datetime.timedelta(days=6), "status": "PAGO"},
            {"id": 6, "tipo": "RECEBER", "plano_contas_id": 3, "categoria": "Suporte & SLA", "valor_original": 3800.0, "vencimento": hoje - datetime.timedelta(days=4), "status": "VENCIDO"},
            {"id": 7, "tipo": "PAGAR", "plano_contas_id": 7, "categoria": "Telecomunicações", "valor_original": 1250.0, "vencimento": hoje - datetime.timedelta(days=2), "status": "VENCIDO"},
            {"id": 8, "tipo": "RECEBER", "plano_contas_id": 2, "categoria": "SaaS", "valor_original": 11200.0, "vencimento": hoje + datetime.timedelta(days=2), "status": "PENDENTE"},
            {"id": 9, "tipo": "PAGAR", "plano_contas_id": 9, "categoria": "Licenças de Software", "valor_original": 1680.5, "vencimento": hoje + datetime.timedelta(days=4), "status": "PENDENTE"},
            {"id": 10, "tipo": "RECEBER", "plano_contas_id": 1, "categoria": "Consultoria", "valor_original": 18000.0, "vencimento": hoje + datetime.timedelta(days=8), "status": "PENDENTE"},
            {"id": 11, "tipo": "PAGAR", "plano_contas_id": 6, "categoria": "Aluguel & Condomínio", "valor_original": 6200.0, "vencimento": hoje + datetime.timedelta(days=10), "status": "PENDENTE"},
            {"id": 12, "tipo": "RECEBER", "plano_contas_id": 3, "categoria": "Suporte & SLA", "valor_original": 9500.0, "vencimento": hoje + datetime.timedelta(days=15), "status": "PENDENTE"},
            {"id": 13, "tipo": "PAGAR", "plano_contas_id": 5, "categoria": "Cloud & Servidores", "valor_original": 3890.0, "vencimento": hoje + datetime.timedelta(days=18), "status": "PENDENTE"},
        ]
        baixas = [
            {"id": 1, "titulo_id": 1, "valor_pago": 14500.0, "descontos": 0.0, "juros": 0.0, "tipo": "RECEBER"},
            {"id": 2, "titulo_id": 2, "valor_pago": 8722.0, "descontos": 178.0, "juros": 0.0, "tipo": "RECEBER"},
            {"id": 3, "titulo_id": 3, "valor_pago": 3450.8, "descontos": 0.0, "juros": 0.0, "tipo": "PAGAR"},
            {"id": 4, "titulo_id": 4, "valor_pago": 6200.0, "descontos": 0.0, "juros": 0.0, "tipo": "PAGAR"},
            {"id": 5, "titulo_id": 5, "valor_pago": 2100.0, "descontos": 0.0, "juros": 0.0, "tipo": "PAGAR"},
        ]
        return titulos, baixas, []

    def transform(self, titulos, baixas):
        """
        FASE 2: TRANSFORM
        Calcula saldo em caixa, projeção de fluxo de caixa em 30 dias e DRE gerencial.
        """
        print(f"[ETL] 2. Executando transformações e cálculos analíticos (Engine: {'pandas' if HAS_PANDAS else 'native'})...")

        saldo_inicial = Decimal("25000.00")
        entradas_realizadas = sum((Decimal(str(b["valor_pago"])) for b in baixas if b.get("tipo") == "RECEBER"), Decimal("0"))
        saidas_realizadas = sum((Decimal(str(b["valor_pago"])) for b in baixas if b.get("tipo") == "PAGAR"), Decimal("0"))
        saldo_atual_caixa = round_money(saldo_inicial + entradas_realizadas - saidas_realizadas)

        # DRE Gerencial (somas em Decimal para evitar deriva de ponto flutuante)
        receita_bruta = round_money(sum(
            (Decimal(str(t["valor_original"])) for t in titulos if t.get("status") == "PAGO" and t.get("tipo") == "RECEBER"),
            Decimal("0"),
        ))
        descontos_concedidos = round_money(sum(
            (Decimal(str(b["descontos"])) for b in baixas if b.get("tipo") == "RECEBER"),
            Decimal("0"),
        ))
        receita_liquida = round_money(Decimal(str(receita_bruta)) - Decimal(str(descontos_concedidos)))
        despesas_operacionais = round_money(sum(
            (Decimal(str(b["valor_pago"])) for b in baixas if b.get("tipo") == "PAGAR"),
            Decimal("0"),
        ))
        lucro_liquido = round_money(Decimal(str(receita_liquida)) - Decimal(str(despesas_operacionais)))
        margem_liquida = round_money((lucro_liquido / receita_liquida * 100) if receita_liquida > 0 else 0)

        # Projeção de Fluxo de Caixa (30 dias)
        hoje = datetime.date.today()
        fluxo_projetado = []
        saldo_acumulado = saldo_atual_caixa

        for i in range(31):
            dia_alvo = hoje + datetime.timedelta(days=i)
            entradas_dia = 0.0
            saidas_dia = 0.0

            for t in titulos:
                if t["status"] == "PENDENTE" and t["vencimento"] == dia_alvo:
                    if t["tipo"] == "RECEBER":
                        entradas_dia += t["valor_original"]
                    else:
                        saidas_dia += t["valor_original"]
                elif i == 0 and t["status"] == "VENCIDO":
                    # Provisão imediata de títulos vencidos no dia 0
                    if t["tipo"] == "RECEBER":
                        entradas_dia += t["valor_original"]
                    else:
                        saidas_dia += t["valor_original"]

            saldo_acumulado = round_money(saldo_acumulado + entradas_dia - saidas_dia)

            fluxo_projetado.append({
                "data": str(dia_alvo),
                "dia": dia_alvo.strftime("%d/%m"),
                "entradas_previstas": round_money(entradas_dia),
                "saidas_previstas": round_money(saidas_dia),
                "saldo_projetado": saldo_acumulado,
            })

        analytics = {
            "kpis": {
                "saldo_caixa_atual": saldo_atual_caixa,
                "receita_bruta": receita_bruta,
                "despesas_operacionais": despesas_operacionais,
                "lucro_liquido": lucro_liquido,
                "margem_liquida_percentual": margem_liquida,
            },
            "fluxo_caixa_30d": fluxo_projetado,
            "dre": {
                "receita_bruta": receita_bruta,
                "deducoes": descontos_concedidos,
                "receita_liquida": receita_liquida,
                "despesas": despesas_operacionais,
                "resultado_liquido": lucro_liquido,
                "margem_percentual": margem_liquida,
            },
        }
        return analytics

    def load(self, analytics):
        """
        FASE 3: LOAD / ANALYTICS
        Salva o resultado consolidado e disponibiliza métricas.
        """
        print("[ETL] 3. Consolidando inteligência financeira...")
        print(f" -> Saldo Atual em Caixa: R$ {analytics['kpis']['saldo_caixa_atual']:,.2f}")
        print(f" -> Receita Líquida (DRE): R$ {analytics['dre']['receita_liquida']:,.2f}")
        print(f" -> Lucro Líquido: R$ {analytics['dre']['resultado_liquido']:,.2f} ({analytics['dre']['margem_percentual']}%)")
        print(f" -> Projeção de Caixa em 30 dias gerada: {len(analytics['fluxo_caixa_30d'])} pontos.")

        os.makedirs("etl_output", exist_ok=True)
        with open("etl_output/analytics_latest.json", "w", encoding="utf-8") as f:
            json.dump(analytics, f, ensure_ascii=False, indent=2)
        print("[ETL] Pipeline concluído com sucesso. Persistido em etl_output/analytics_latest.json.")
        return analytics

    def run(self):
        titulos, baixas, _ = self.extract()
        analytics = self.transform(titulos, baixas)
        return self.load(analytics)

if __name__ == "__main__":
    pipeline = FinancialETLPipeline()
    pipeline.run()
