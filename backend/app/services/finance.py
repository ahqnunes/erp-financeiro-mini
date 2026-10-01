from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..models import (
    BaixaFinanceira,
    Cliente,
    Fornecedor,
    PlanoDeContas,
    TituloFinanceiro,
)
from ..schemas import (
    BaixaCreate,
    FornecedorCreate,
    FornecedorUpdate,
    PlanoDeContasCreate,
    TituloCreate,
)


class FinanceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def money(value: Decimal | int | float) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class FinanceService:
    def __init__(self, session: Session):
        self.session = session

    def list_fornecedores(self) -> list[Fornecedor]:
        return list(
            self.session.scalars(select(Fornecedor).order_by(Fornecedor.id.desc()))
        )

    def create_fornecedor(self, data: FornecedorCreate) -> Fornecedor:
        values = data.model_dump()
        fornecedor = Fornecedor(**self._clean(values))
        self.session.add(fornecedor)
        return self._commit(fornecedor)

    def update_fornecedor(
        self, fornecedor_id: int, data: FornecedorUpdate
    ) -> Fornecedor:
        fornecedor = self.session.get(Fornecedor, fornecedor_id)
        if fornecedor is None:
            raise FinanceError(f"Fornecedor com ID {fornecedor_id} não encontrado.")
        for name, value in self._clean(data.model_dump(exclude_unset=True)).items():
            setattr(fornecedor, name, value)
        return self._commit(fornecedor)

    def delete_fornecedor(self, fornecedor_id: int) -> None:
        fornecedor = self.session.get(Fornecedor, fornecedor_id)
        if fornecedor is None:
            raise FinanceError(
                f"Fornecedor com ID {fornecedor_id} não encontrado.", 409
            )
        if (
            self.session.scalar(
                select(TituloFinanceiro.id)
                .where(TituloFinanceiro.fornecedor_id == fornecedor_id)
                .limit(1)
            )
            is not None
        ):
            raise FinanceError(
                "Não é possível excluir o fornecedor pois existem títulos financeiros vinculados.",
                409,
            )
        self.session.delete(fornecedor)
        try:
            self.session.commit()
        except IntegrityError as error:
            self.session.rollback()
            raise FinanceError(
                "Não é possível excluir o fornecedor pois existem títulos financeiros vinculados.",
                409,
            ) from error

    def list_plano_contas(self) -> list[PlanoDeContas]:
        return list(
            self.session.scalars(select(PlanoDeContas).order_by(PlanoDeContas.codigo))
        )

    def create_plano_contas(self, data: PlanoDeContasCreate) -> PlanoDeContas:
        values = data.model_dump()
        parent_id = values["categoria_pai_id"]
        if parent_id is not None and self.session.get(PlanoDeContas, parent_id) is None:
            raise FinanceError(f"Categoria pai com ID {parent_id} não encontrada.")
        plano = PlanoDeContas(**self._clean(values))
        self.session.add(plano)
        return self._commit(plano)

    def list_titulos(
        self,
        tipo: str | None = None,
        status: str | None = None,
        periodo_inicio: date | None = None,
        periodo_fim: date | None = None,
    ) -> list[dict]:
        self._update_overdue()
        statement = self._titulo_statement()
        if tipo:
            statement = statement.where(TituloFinanceiro.tipo == tipo)
        if status:
            statement = statement.where(TituloFinanceiro.status == status)
        if periodo_inicio:
            statement = statement.where(
                TituloFinanceiro.data_vencimento >= periodo_inicio
            )
        if periodo_fim:
            statement = statement.where(TituloFinanceiro.data_vencimento <= periodo_fim)
        titulos = self.session.scalars(
            statement.order_by(TituloFinanceiro.data_vencimento)
        ).unique()
        return [self._titulo_dict(titulo) for titulo in titulos]

    def get_titulo(self, titulo_id: int) -> dict:
        self._update_overdue()
        titulo = (
            self.session.scalars(
                self._titulo_statement().where(TituloFinanceiro.id == titulo_id)
            )
            .unique()
            .one_or_none()
        )
        if titulo is None:
            raise FinanceError("Título não encontrado", 404)
        return self._titulo_dict(titulo)

    def create_titulo(self, data: TituloCreate) -> dict:
        if data.tipo == "RECEBER":
            if data.cliente_id is None:
                raise FinanceError(
                    "Títulos a Receber exigem a vinculação de um Cliente válido."
                )
            if self.session.get(Cliente, data.cliente_id) is None:
                raise FinanceError(
                    f"Cliente com ID {data.cliente_id} não encontrado. "
                    "Não é possível vincular um título a um cliente inexistente."
                )
        else:
            if data.fornecedor_id is None:
                raise FinanceError(
                    "Títulos a Pagar exigem a vinculação de um Fornecedor válido."
                )
            if self.session.get(Fornecedor, data.fornecedor_id) is None:
                raise FinanceError(
                    f"Fornecedor com ID {data.fornecedor_id} não encontrado. "
                    "Não é possível vincular um título a um fornecedor inexistente."
                )
        if self.session.get(PlanoDeContas, data.plano_contas_id) is None:
            raise FinanceError("Plano de contas selecionado não existe.")

        today = date.today()
        titulo = TituloFinanceiro(
            tipo=data.tipo.value,
            cliente_id=data.cliente_id if data.tipo == "RECEBER" else None,
            fornecedor_id=data.fornecedor_id if data.tipo == "PAGAR" else None,
            plano_contas_id=data.plano_contas_id,
            descricao=data.descricao.strip(),
            valor_original=money(data.valor_original),
            data_emissao=data.data_emissao,
            data_vencimento=data.data_vencimento,
            status="VENCIDO" if data.data_vencimento < today else "PENDENTE",
        )
        self.session.add(titulo)
        try:
            self.session.flush()
            self.session.commit()
        except IntegrityError as error:
            self.session.rollback()
            raise FinanceError(
                "Não foi possível criar o título devido a uma alteração concorrente nos vínculos."
            ) from error
        self.session.refresh(titulo)
        return self._titulo_dict(titulo)

    def delete_titulo(self, titulo_id: int) -> None:
        titulo = self.session.get(TituloFinanceiro, titulo_id)
        if titulo is None:
            raise FinanceError(f"Título com ID {titulo_id} não encontrado.")
        if titulo.status == "PAGO":
            raise FinanceError(
                "Título já liquidado (Pago) não pode ser excluído diretamente."
            )
        self.session.delete(titulo)
        self.session.commit()

    def create_baixa(self, titulo_id: int, data: BaixaCreate) -> dict:
        titulo = self.session.scalar(
            select(TituloFinanceiro)
            .where(TituloFinanceiro.id == titulo_id)
            .with_for_update()
        )
        if titulo is None:
            raise FinanceError(f"Título financeiro ID {titulo_id} não encontrado.")
        if titulo.status == "PAGO":
            raise FinanceError(
                f"O título ID {titulo_id} já se encontra liquidado (PAGO)."
            )

        if data.juros < 0 or data.descontos < 0:
            raise FinanceError("Juros e descontos não podem ser valores negativos.")
        juros = money(data.juros)
        descontos = money(data.descontos)
        valor_original = money(titulo.valor_original)
        valor_pago = money(valor_original + juros - descontos)
        if valor_pago <= 0:
            raise FinanceError(
                f"O valor final liquidado (R$ {valor_pago}) deve ser maior que zero. "
                "Verifique os descontos concedidos."
            )
        if valor_pago > Decimal("9999999999999.99"):
            raise FinanceError("O valor pago excede o limite monetário permitido.")

        baixa = BaixaFinanceira(
            titulo_id=titulo.id,
            data_pagamento=data.data_pagamento,
            valor_pago=valor_pago,
            juros=juros,
            descontos=descontos,
            forma_de_pagamento=data.forma_de_pagamento.value,
            observacao=data.observacao.strip() if data.observacao else None,
        )
        titulo.status = "PAGO"
        self.session.add(baixa)
        try:
            self.session.commit()
        except IntegrityError as error:
            self.session.rollback()
            raise FinanceError(
                "Não foi possível registrar a baixa. Verifique se o título já foi liquidado."
            ) from error
        self.session.refresh(baixa)
        return self._baixa_dict(baixa, valor_original)

    def list_baixas(self) -> list[dict]:
        statement = (
            select(BaixaFinanceira, TituloFinanceiro.valor_original)
            .join(TituloFinanceiro)
            .order_by(BaixaFinanceira.id.desc())
        )
        return [
            self._baixa_dict(baixa, valor_original)
            for baixa, valor_original in self.session.execute(statement)
        ]

    def recalculate_dashboard(self) -> dict:
        self._update_overdue()
        titulos = self.session.scalars(self._titulo_statement()).unique().all()
        titulos_por_id = {titulo.id: titulo for titulo in titulos}
        baixas = list(self.session.scalars(select(BaixaFinanceira)))
        plano_contas = self.list_plano_contas()
        today = date.today()
        current_month = today.strftime("%Y-%m")

        entradas_realizadas = Decimal("0.00")
        saidas_realizadas = Decimal("0.00")
        for baixa in baixas:
            titulo = titulos_por_id.get(baixa.titulo_id)
            if titulo is None:
                continue
            if titulo.tipo == "RECEBER":
                entradas_realizadas += baixa.valor_pago
            else:
                saidas_realizadas += baixa.valor_pago
        saldo_atual = money(
            Decimal("25000.00") + entradas_realizadas - saidas_realizadas
        )
        vencidos = [titulo for titulo in titulos if titulo.status == "VENCIDO"]
        pendentes = [titulo for titulo in titulos if titulo.status == "PENDENTE"]
        month_titles = [
            titulo
            for titulo in titulos
            if titulo.data_vencimento.strftime("%Y-%m") == current_month
        ]
        a_receber = sum(
            (
                titulo.valor_original
                for titulo in month_titles
                if titulo.tipo == "RECEBER" and titulo.status != "PAGO"
            ),
            Decimal("0.00"),
        )
        a_pagar = sum(
            (
                titulo.valor_original
                for titulo in month_titles
                if titulo.tipo == "PAGAR" and titulo.status != "PAGO"
            ),
            Decimal("0.00"),
        )
        kpis = {
            "saldoCaixaAtual": float(saldo_atual),
            "totalAReceberMes": float(money(a_receber)),
            "totalAPagarMes": float(money(a_pagar)),
            "saldoProjetadoMes": float(money(saldo_atual + a_receber - a_pagar)),
            "titulosVencidosTotal": len(vencidos),
            "titulosVencidosValor": float(
                money(sum((t.valor_original for t in vencidos), Decimal("0.00")))
            ),
            "titulosPendentesCount": len(pendentes),
            "titulosPagosCountMes": sum(
                1 for titulo in month_titles if titulo.status == "PAGO"
            ),
        }

        fluxo: list[dict] = []
        saldo_corrente = saldo_atual
        for offset in range(31):
            day = today + timedelta(days=offset)
            vencem_no_dia = [
                titulo
                for titulo in titulos
                if titulo.status == "PENDENTE" and titulo.data_vencimento == day
            ]
            entradas = sum(
                (
                    titulo.valor_original
                    for titulo in vencem_no_dia
                    if titulo.tipo == "RECEBER"
                ),
                Decimal("0.00"),
            )
            saidas = sum(
                (
                    titulo.valor_original
                    for titulo in vencem_no_dia
                    if titulo.tipo == "PAGAR"
                ),
                Decimal("0.00"),
            )
            if offset == 0:
                entradas += sum(
                    (
                        titulo.valor_original
                        for titulo in vencidos
                        if titulo.tipo == "RECEBER"
                    ),
                    Decimal("0.00"),
                )
                saidas += sum(
                    (
                        titulo.valor_original
                        for titulo in vencidos
                        if titulo.tipo == "PAGAR"
                    ),
                    Decimal("0.00"),
                )
            entradas, saidas = money(entradas), money(saidas)
            saldo_inicial = saldo_corrente
            saldo_corrente = money(saldo_corrente + entradas - saidas)
            fluxo.append(
                {
                    "data": day.isoformat(),
                    "dataFormatada": day.strftime("%d/%m"),
                    "saldoInicial": float(saldo_inicial),
                    "entradasPrevistas": float(entradas),
                    "saidasPrevistas": float(saidas),
                    "entradasRealizadas": float(entradas_realizadas)
                    if offset == 0
                    else 0,
                    "saidasRealizadas": float(saidas_realizadas) if offset == 0 else 0,
                    "saldoProjetado": float(saldo_corrente),
                    "saldoReal": float(saldo_atual),
                }
            )

        dre = self._dre(baixas, titulos, plano_contas, today)
        recent = sorted(
            titulos, key=lambda titulo: titulo.created_at or datetime.min, reverse=True
        )[:6]
        upcoming = sorted(
            (titulo for titulo in titulos if titulo.status != "PAGO"),
            key=lambda titulo: titulo.data_vencimento,
        )[:6]
        return {
            "kpis": kpis,
            "fluxoCaixa30Dias": fluxo,
            "dre": dre,
            "titulosRecentes": [self._titulo_dict(item) for item in recent],
            "proximosVencimentos": [self._titulo_dict(item) for item in upcoming],
        }

    def reset_demo(self) -> None:
        self.session.execute(delete(BaixaFinanceira))
        self.session.execute(delete(TituloFinanceiro))
        self.session.execute(delete(PlanoDeContas))
        self.session.execute(delete(Fornecedor))
        self.session.execute(delete(Cliente))

        client_rows = [
            (
                "Hospital Samaritano S.A.",
                "43.128.980/0001-44",
                "(11) 3450-8900",
                "financeiro@samaritano.med.br",
                "Av. Paulista, 1800 - Bela Vista, São Paulo - SP",
            ),
            (
                "Supermercados Estrela D’Alva Ltda",
                "12.879.445/0001-90",
                "(11) 2980-1122",
                "contas@estrelaalva.com.br",
                "Rua do Comércio, 450 - Centro, Campinas - SP",
            ),
            (
                "Varejo Brasil Logística & Distribuição",
                "08.654.321/0001-12",
                "(19) 3344-5566",
                "controladoria@varejobrasil.com.br",
                "Rodovia Anhanguera, km 104 - Sumaré - SP",
            ),
            (
                "Clínica Odonto Vida Ativa",
                "22.333.444/0001-55",
                "(11) 4567-8910",
                "adm@odontovida.com.br",
                "Rua das Flores, 88 - Moema, São Paulo - SP",
            ),
            (
                "Alfa Seguros e Previdência",
                "33.999.888/0001-77",
                "(21) 2500-4321",
                "pagamentos@alfaseguros.com.br",
                "Av. Rio Branco, 110 - RJ",
            ),
        ]
        supplier_rows = [
            (
                "Amazon Web Services (AWS Cloud Brasil)",
                "23.456.789/0001-01",
                "Infraestrutura Cloud & TI",
                "billing-br@amazon.com",
                "billing-br@amazon.com",
                "Av. Faria Lima, 3700 - SP",
            ),
            (
                "Locadora Alpha Imóveis Comerciais",
                "11.222.333/0001-99",
                "Aluguel e Instalações",
                "(11) 3012-9900",
                "locacoes@alphaimoveis.com.br",
                "Alameda Santos, 900 - SP",
            ),
            (
                "Provedor Fibra Telecom S.A.",
                "04.555.666/0001-33",
                "Telecomunicações & Conectividade",
                "0800 700 8090",
                "suporte@fibratelecom.com.br",
                "Rua Vergueiro, 2000 - SP",
            ),
            (
                "Ferreira & Associados Consultoria Contábil",
                "55.666.777/0001-22",
                "Serviços Contábeis e Fiscais",
                "(11) 3222-1144",
                "contabilidade@ferreira.com.br",
                "Rua da Consolação, 1500 - SP",
            ),
            (
                "Google Cloud & Workspace Brasil",
                "06.990.590/0001-23",
                "Licenciamento de Software & Ferramentas",
                "workspace-billing@google.com",
                "workspace-billing@google.com",
                "Av. Faria Lima, 3477 - SP",
            ),
        ]
        clients = [
            Cliente(
                nome=row[0],
                documento=row[1],
                contato=row[2],
                email=row[3],
                endereco=row[4],
            )
            for row in client_rows
        ]
        suppliers = [
            Fornecedor(
                nome=row[0],
                documento=row[1],
                categoria=row[2],
                contato=row[3],
                email=row[4],
                endereco=row[5],
            )
            for row in supplier_rows
        ]
        self.session.add_all(clients)
        self.session.add_all(suppliers)
        accounts = [
            (
                "1.01",
                "Serviços de Consultoria & Integração",
                "RECEITA",
                "Projetos e implantação de software empresarial",
            ),
            (
                "1.02",
                "Licenciamento Mensal de Software SaaS",
                "RECEITA",
                "Mensalidades recorrentes da plataforma web",
            ),
            (
                "1.03",
                "Suporte Técnico e SLA Dedicado",
                "RECEITA",
                "Contratos mensais de suporte 24/7",
            ),
            (
                "1.04",
                "Treinamentos e Capacitação",
                "RECEITA",
                "Workshops e treinamentos operacionais",
            ),
            (
                "2.01",
                "Infraestrutura Cloud & Servidores",
                "DESPESA",
                "Servidores AWS, banco de dados e hospedagem",
            ),
            (
                "2.02",
                "Aluguel, Condomínio e IPTU",
                "DESPESA",
                "Sede da empresa e infraestrutura física",
            ),
            (
                "2.03",
                "Serviços de Telecom & Internet Fibra",
                "DESPESA",
                "Links dedicados e telefonia IP",
            ),
            (
                "2.04",
                "Serviços Contábeis e Jurídicos",
                "DESPESA",
                "Honorários contábeis e assessoria jurídica",
            ),
            (
                "2.05",
                "Licenças de Softwares e Ferramentas",
                "DESPESA",
                "Google Workspace, GitHub, Slack e Figma",
            ),
            (
                "2.06",
                "Marketing Digital e Aquisição",
                "DESPESA",
                "Anúncios de performance e branding",
            ),
        ]
        plans = [
            PlanoDeContas(codigo=row[0], nome=row[1], tipo=row[2], descricao=row[3])
            for row in accounts
        ]
        self.session.add_all(plans)
        self.session.flush()

        title_data = [
            (
                "RECEBER",
                1,
                None,
                1,
                "Consultoria de Integração - Etapa 01",
                14500.00,
                -25,
                -10,
                "PAGO",
            ),
            (
                "RECEBER",
                2,
                None,
                2,
                "Assinatura SaaS Enterprise - Mensalidade",
                8900.00,
                -20,
                -5,
                "PAGO",
            ),
            (
                "PAGAR",
                None,
                1,
                5,
                "Fatura Mensal Servidores Cloud AWS",
                3450.80,
                -20,
                -8,
                "PAGO",
            ),
            (
                "PAGAR",
                None,
                2,
                6,
                "Aluguel Sede Corporativa - Mês Anterior",
                6200.00,
                -30,
                -12,
                "PAGO",
            ),
            (
                "PAGAR",
                None,
                4,
                8,
                "Honorários Contábeis Ferreira Associados",
                2100.00,
                -20,
                -6,
                "PAGO",
            ),
            (
                "RECEBER",
                4,
                None,
                3,
                "Suporte Técnico e Manutenção - Atraso",
                3800.00,
                -30,
                -4,
                "VENCIDO",
            ),
            (
                "PAGAR",
                None,
                3,
                7,
                "Link Dedicado de Fibra Óptica 1Gbps",
                1250.00,
                -25,
                -2,
                "VENCIDO",
            ),
            (
                "RECEBER",
                3,
                None,
                2,
                "Licenciamento Varejo Brasil - 40 Usuários",
                11200.00,
                -5,
                2,
                "PENDENTE",
            ),
            (
                "PAGAR",
                None,
                5,
                9,
                "Licenças Google Workspace e Armazenamento",
                1680.50,
                -5,
                4,
                "PENDENTE",
            ),
            (
                "RECEBER",
                5,
                None,
                1,
                "Consultoria em BI Financeiro - Parcela 2/3",
                18000.00,
                -10,
                8,
                "PENDENTE",
            ),
            (
                "PAGAR",
                None,
                2,
                6,
                "Aluguel Sede Corporativa - Vencimento Vigente",
                6200.00,
                0,
                10,
                "PENDENTE",
            ),
            (
                "RECEBER",
                1,
                None,
                3,
                "Renovação Contrato SLA Hospital Samaritano",
                9500.00,
                0,
                15,
                "PENDENTE",
            ),
            (
                "PAGAR",
                None,
                1,
                5,
                "Previsão Custos Instâncias AWS RDS e EC2",
                3890.00,
                2,
                18,
                "PENDENTE",
            ),
            (
                "RECEBER",
                2,
                None,
                2,
                "Assinatura Plataforma SaaS - Mês Seguinte",
                8900.00,
                5,
                22,
                "PENDENTE",
            ),
            (
                "PAGAR",
                None,
                4,
                8,
                "Fechamento Fiscal Ferreira & Associados",
                2100.00,
                5,
                26,
                "PENDENTE",
            ),
        ]
        today = date.today()
        titles: list[TituloFinanceiro] = []
        for (
            tipo,
            cliente_id,
            fornecedor_id,
            plan_id,
            descricao,
            amount,
            issue_offset,
            due_offset,
            state,
        ) in title_data:
            titulo = TituloFinanceiro(
                tipo=tipo,
                cliente_id=clients[cliente_id - 1].id if cliente_id else None,
                fornecedor_id=suppliers[fornecedor_id - 1].id
                if fornecedor_id
                else None,
                plano_contas_id=plans[plan_id - 1].id,
                descricao=descricao,
                valor_original=money(amount),
                data_emissao=today + timedelta(days=issue_offset),
                data_vencimento=today + timedelta(days=due_offset),
                status=state,
            )
            titles.append(titulo)
        self.session.add_all(titles)
        self.session.flush()
        payment_data = [
            (
                -10,
                14500.00,
                0,
                0,
                "PIX",
                "Pagamento antecipado com liquidação via PIX.",
            ),
            (-5, 8722.00, 0, 178.00, "BOLETO", "Desconto de 2% pontualidade."),
            (-8, 3450.80, 0, 0, "CARTAO", "Fatura AWS em débito automático."),
            (-12, 6200.00, 0, 0, "TRANSFERENCIA", "TED corporativa."),
            (-6, 2100.00, 0, 0, "PIX", "Liquidação de honorários contábeis."),
        ]
        for index, (offset, paid, interest, discount, method, note) in enumerate(
            payment_data
        ):
            self.session.add(
                BaixaFinanceira(
                    titulo_id=titles[index].id,
                    data_pagamento=today + timedelta(days=offset),
                    valor_pago=money(paid),
                    juros=money(interest),
                    descontos=money(discount),
                    forma_de_pagamento=method,
                    observacao=note,
                )
            )
        self.session.commit()

    def _commit(self, entity):
        try:
            self.session.commit()
            self.session.refresh(entity)
            return entity
        except IntegrityError as error:
            self.session.rollback()
            raise FinanceError(
                "Não foi possível salvar o cadastro. Verifique os campos únicos e os vínculos informados."
            ) from error

    def _update_overdue(self) -> None:
        self.session.execute(
            update(TituloFinanceiro)
            .where(
                TituloFinanceiro.status == "PENDENTE",
                TituloFinanceiro.data_vencimento < date.today(),
            )
            .values(status="VENCIDO")
        )
        self.session.commit()

    @staticmethod
    def _titulo_statement():
        return select(TituloFinanceiro).options(
            joinedload(TituloFinanceiro.cliente),
            joinedload(TituloFinanceiro.fornecedor),
            joinedload(TituloFinanceiro.plano_contas),
            joinedload(TituloFinanceiro.baixa),
        )

    @staticmethod
    def _titulo_dict(titulo: TituloFinanceiro) -> dict:
        baixa = titulo.baixa
        return {
            "id": titulo.id,
            "tipo": titulo.tipo,
            "clienteId": titulo.cliente_id,
            "fornecedorId": titulo.fornecedor_id,
            "planoContasId": titulo.plano_contas_id,
            "descricao": titulo.descricao,
            "valorOriginal": titulo.valor_original,
            "dataEmissao": titulo.data_emissao,
            "dataVencimento": titulo.data_vencimento,
            "status": titulo.status,
            "createdAt": titulo.created_at,
            "entidadeNome": (
                titulo.cliente.nome
                if titulo.cliente
                else titulo.fornecedor.nome
                if titulo.fornecedor
                else "Diversos"
            ),
            "planoContasNome": titulo.plano_contas.nome
            if titulo.plano_contas
            else "Não categorizado",
            "planoContasCodigo": titulo.plano_contas.codigo
            if titulo.plano_contas
            else "0.00",
            "baixa": FinanceService._baixa_dict(baixa, titulo.valor_original)
            if baixa
            else None,
        }

    @staticmethod
    def _baixa_dict(baixa: BaixaFinanceira, valor_original: Decimal) -> dict:
        return {
            "id": baixa.id,
            "tituloId": baixa.titulo_id,
            "dataPagamento": baixa.data_pagamento,
            "valorOriginal": valor_original,
            "valorPago": baixa.valor_pago,
            "juros": baixa.juros,
            "descontos": baixa.descontos,
            "formaDePagamento": baixa.forma_de_pagamento,
            "observacao": baixa.observacao,
            "createdAt": baixa.created_at,
        }

    @staticmethod
    def _clean(values: dict) -> dict:
        return {
            key: value.strip() if isinstance(value, str) else value
            for key, value in values.items()
        }

    @staticmethod
    def _dre(baixas, titulos, plano_contas, today: date) -> dict:
        titulo_por_id = {titulo.id: titulo for titulo in titulos}
        revenue_accounts = {
            account.id: {
                "categoria": account.nome,
                "codigo": account.codigo,
                "valor": Decimal("0.00"),
            }
            for account in plano_contas
            if account.tipo == "RECEITA"
        }
        expense_accounts = {
            account.id: {
                "categoria": account.nome,
                "codigo": account.codigo,
                "valor": Decimal("0.00"),
            }
            for account in plano_contas
            if account.tipo == "DESPESA"
        }
        gross = Decimal("0.00")
        deductions = Decimal("0.00")
        expenses = Decimal("0.00")
        for baixa in baixas:
            titulo = titulo_por_id.get(baixa.titulo_id)
            if not titulo:
                continue
            if titulo.tipo == "RECEBER":
                gross += titulo.valor_original
                deductions += baixa.descontos
                if titulo.plano_contas_id in revenue_accounts:
                    revenue_accounts[titulo.plano_contas_id]["valor"] += (
                        baixa.valor_pago
                    )
            else:
                expenses += baixa.valor_pago
                if titulo.plano_contas_id in expense_accounts:
                    expense_accounts[titulo.plano_contas_id]["valor"] += (
                        baixa.valor_pago
                    )
        net_revenue = money(gross - deductions)
        expenses = money(expenses)
        result = money(net_revenue - expenses)
        revenue_categories = FinanceService._category_values(
            revenue_accounts, net_revenue
        )
        expense_categories = FinanceService._category_values(expense_accounts, expenses)
        return {
            "periodo": today.strftime("%m/%Y"),
            "receitaBruta": float(money(gross)),
            "deducoesDescontos": float(money(deductions)),
            "receitaLiquida": float(net_revenue),
            "despesasOperacionais": float(expenses),
            "resultadoLiquido": float(result),
            "margemLiquidaPercentual": float(money(result / net_revenue * 100))
            if net_revenue > 0
            else 0,
            "categoriasReceita": revenue_categories,
            "categoriasDespesa": expense_categories,
        }

    @staticmethod
    def _category_values(accounts: dict, total: Decimal) -> list[dict]:
        result = []
        for account in accounts.values():
            if account["valor"] <= 0:
                continue
            amount = money(account["valor"])
            result.append(
                {
                    "categoria": account["categoria"],
                    "codigo": account["codigo"],
                    "valor": float(amount),
                    "percentual": float(money(amount / total * 100))
                    if total > 0
                    else 0,
                }
            )
        return sorted(result, key=lambda item: item["valor"], reverse=True)
