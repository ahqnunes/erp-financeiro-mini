from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(255))
    documento: Mapped[str] = mapped_column(String(20), unique=True)
    contato: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(100))
    endereco: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    titulos: Mapped[list["TituloFinanceiro"]] = relationship(back_populates="cliente")


class Fornecedor(Base):
    __tablename__ = "fornecedores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(255))
    documento: Mapped[str | None] = mapped_column(String(20))
    categoria: Mapped[str] = mapped_column(String(100))
    contato: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(100))
    endereco: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    titulos: Mapped[list["TituloFinanceiro"]] = relationship(
        back_populates="fornecedor"
    )


class PlanoDeContas(Base):
    __tablename__ = "plano_de_contas"
    __table_args__ = (
        CheckConstraint("tipo IN ('RECEITA', 'DESPESA')", name="chk_plano_tipo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True)
    nome: Mapped[str] = mapped_column(String(150))
    tipo: Mapped[str] = mapped_column(String(10))
    categoria_pai_id: Mapped[int | None] = mapped_column(
        ForeignKey("plano_de_contas.id", ondelete="RESTRICT")
    )
    descricao: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    categoria_pai: Mapped[Optional["PlanoDeContas"]] = relationship(remote_side=[id])
    titulos: Mapped[list["TituloFinanceiro"]] = relationship(
        back_populates="plano_contas"
    )


class TituloFinanceiro(Base):
    __tablename__ = "titulos_financeiros"
    __table_args__ = (
        CheckConstraint(
            "(tipo = 'RECEBER' AND cliente_id IS NOT NULL) OR "
            "(tipo = 'PAGAR' AND fornecedor_id IS NOT NULL)",
            name="chk_entidade_vinculada",
        ),
        CheckConstraint("valor_original > 0", name="chk_titulo_valor_positivo"),
        CheckConstraint("tipo IN ('PAGAR', 'RECEBER')", name="chk_titulo_tipo"),
        CheckConstraint(
            "status IN ('PENDENTE', 'PAGO', 'VENCIDO')", name="chk_titulo_status"
        ),
        Index("idx_titulos_status", "status"),
        Index("idx_titulos_tipo_vencimento", "tipo", "data_vencimento"),
        Index("idx_titulos_cliente", "cliente_id"),
        Index("idx_titulos_fornecedor", "fornecedor_id"),
        Index("idx_titulos_plano_contas", "plano_contas_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column(String(10))
    cliente_id: Mapped[int | None] = mapped_column(
        ForeignKey("clientes.id", ondelete="RESTRICT")
    )
    fornecedor_id: Mapped[int | None] = mapped_column(
        ForeignKey("fornecedores.id", ondelete="RESTRICT")
    )
    plano_contas_id: Mapped[int] = mapped_column(
        ForeignKey("plano_de_contas.id", ondelete="RESTRICT")
    )
    descricao: Mapped[str] = mapped_column(String(255))
    valor_original: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    data_emissao: Mapped[date] = mapped_column(Date)
    data_vencimento: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(
        String(15), default="PENDENTE", server_default=text("'PENDENTE'")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    cliente: Mapped[Cliente | None] = relationship(back_populates="titulos")
    fornecedor: Mapped[Fornecedor | None] = relationship(back_populates="titulos")
    plano_contas: Mapped[PlanoDeContas] = relationship(back_populates="titulos")
    baixa: Mapped[Optional["BaixaFinanceira"]] = relationship(
        back_populates="titulo", uselist=False
    )


class BaixaFinanceira(Base):
    __tablename__ = "baixas_financeiras"
    __table_args__ = (
        CheckConstraint("valor_pago > 0", name="chk_baixa_valor_positivo"),
        CheckConstraint("juros >= 0", name="chk_baixa_juros_nao_negativos"),
        CheckConstraint("descontos >= 0", name="chk_baixa_descontos_nao_negativos"),
        CheckConstraint(
            "forma_de_pagamento IN ('PIX', 'BOLETO', 'CARTAO', 'TRANSFERENCIA', 'DINHEIRO')",
            name="chk_baixa_forma_pagamento",
        ),
        Index("idx_baixas_data_pagamento", "data_pagamento"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo_id: Mapped[int] = mapped_column(
        ForeignKey("titulos_financeiros.id", ondelete="RESTRICT"), unique=True
    )
    data_pagamento: Mapped[date] = mapped_column(Date)
    valor_pago: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    juros: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=Decimal("0.00"), server_default=text("0.00")
    )
    descontos: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=Decimal("0.00"), server_default=text("0.00")
    )
    forma_de_pagamento: Mapped[str] = mapped_column(String(30))
    observacao: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    titulo: Mapped[TituloFinanceiro] = relationship(back_populates="baixa")
