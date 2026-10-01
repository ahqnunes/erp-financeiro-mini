from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )


class TipoTitulo(StrEnum):
    PAGAR = "PAGAR"
    RECEBER = "RECEBER"


class StatusTitulo(StrEnum):
    PENDENTE = "PENDENTE"
    PAGO = "PAGO"
    VENCIDO = "VENCIDO"


class TipoPlanoConta(StrEnum):
    RECEITA = "RECEITA"
    DESPESA = "DESPESA"


class FormaPagamento(StrEnum):
    PIX = "PIX"
    BOLETO = "BOLETO"
    CARTAO = "CARTAO"
    TRANSFERENCIA = "TRANSFERENCIA"
    DINHEIRO = "DINHEIRO"


class ClienteCreate(ApiModel):
    nome: str = Field(min_length=1, max_length=255)
    documento: str = Field(min_length=1, max_length=20)
    contato: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=100)
    endereco: str | None = None


class ClienteUpdate(ApiModel):
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    documento: str | None = Field(default=None, min_length=1, max_length=20)
    contato: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=100)
    endereco: str | None = None

    @field_validator("nome", "documento")
    @classmethod
    def required_fields_cannot_be_null(cls, value):
        if value is None:
            raise ValueError("Este campo não pode ser nulo.")
        return value


class ClienteResponse(ClienteCreate):
    id: int
    created_at: datetime

    @field_validator("contato", "email", "endereco", mode="before")
    @classmethod
    def empty_optional_values(cls, value):
        return value or ""


class FornecedorCreate(ApiModel):
    nome: str = Field(min_length=1, max_length=255)
    categoria: str = Field(min_length=1, max_length=100)
    documento: str | None = Field(default=None, max_length=20)
    contato: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=100)
    endereco: str | None = None


class FornecedorUpdate(ApiModel):
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    categoria: str | None = Field(default=None, min_length=1, max_length=100)
    documento: str | None = Field(default=None, max_length=20)
    contato: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=100)
    endereco: str | None = None

    @field_validator("nome", "categoria")
    @classmethod
    def required_fields_cannot_be_null(cls, value):
        if value is None:
            raise ValueError("Este campo não pode ser nulo.")
        return value


class FornecedorResponse(FornecedorCreate):
    id: int
    created_at: datetime

    @field_validator("documento", "contato", "email", "endereco", mode="before")
    @classmethod
    def empty_optional_values(cls, value):
        return value or ""


class PlanoDeContasCreate(ApiModel):
    codigo: str = Field(min_length=1, max_length=20)
    nome: str = Field(min_length=1, max_length=150)
    tipo: TipoPlanoConta
    categoria_pai_id: int | None = None
    descricao: str | None = None


class PlanoDeContasResponse(PlanoDeContasCreate):
    id: int
    created_at: datetime


class TituloCreate(ApiModel):
    tipo: TipoTitulo
    cliente_id: int | None = None
    fornecedor_id: int | None = None
    plano_contas_id: int = Field(gt=0)
    descricao: str = Field(min_length=1, max_length=255)
    valor_original: Decimal = Field(gt=0, le=Decimal("9999999999999.99"), max_digits=17)
    data_emissao: date
    data_vencimento: date


class BaixaCreate(ApiModel):
    data_pagamento: date
    juros: Decimal = Field(
        default=Decimal("0.00"), le=Decimal("9999999999999.99"), max_digits=17
    )
    descontos: Decimal = Field(
        default=Decimal("0.00"), le=Decimal("9999999999999.99"), max_digits=17
    )
    forma_de_pagamento: FormaPagamento
    observacao: str | None = None


class BaixaResponse(ApiModel):
    id: int
    titulo_id: int
    data_pagamento: date
    valor_original: float
    valor_pago: float
    juros: float
    descontos: float
    forma_de_pagamento: FormaPagamento
    observacao: str | None
    created_at: datetime


class TituloResponse(ApiModel):
    id: int
    tipo: TipoTitulo
    cliente_id: int | None
    fornecedor_id: int | None
    plano_contas_id: int
    descricao: str
    valor_original: float
    data_emissao: date
    data_vencimento: date
    status: StatusTitulo
    created_at: datetime
    entidade_nome: str | None = None
    plano_contas_nome: str | None = None
    plano_contas_codigo: str | None = None
    baixa: BaixaResponse | None = None
