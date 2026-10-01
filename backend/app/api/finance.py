from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import (
    BaixaCreate,
    BaixaResponse,
    FornecedorCreate,
    FornecedorResponse,
    FornecedorUpdate,
    PlanoDeContasCreate,
    PlanoDeContasResponse,
    StatusTitulo,
    TipoTitulo,
    TituloCreate,
    TituloResponse,
)
from ..services.finance import FinanceError, FinanceService

router = APIRouter(prefix="/api", tags=["Financeiro"])


def service(db: Session = Depends(get_db)) -> FinanceService:
    return FinanceService(db)


def raise_http(error: FinanceError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get(
    "/fornecedores", response_model=list[FornecedorResponse], tags=["Cadastros Base"]
)
def list_fornecedores(finance: FinanceService = Depends(service)):
    return finance.list_fornecedores()


@router.post(
    "/fornecedores",
    response_model=FornecedorResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cadastros Base"],
)
def create_fornecedor(
    data: FornecedorCreate, finance: FinanceService = Depends(service)
):
    try:
        return finance.create_fornecedor(data)
    except FinanceError as error:
        raise_http(error)


@router.put(
    "/fornecedores/{fornecedor_id}",
    response_model=FornecedorResponse,
    tags=["Cadastros Base"],
)
def update_fornecedor(
    fornecedor_id: int,
    data: FornecedorUpdate,
    finance: FinanceService = Depends(service),
):
    try:
        return finance.update_fornecedor(fornecedor_id, data)
    except FinanceError as error:
        raise_http(error)


@router.delete("/fornecedores/{fornecedor_id}", tags=["Cadastros Base"])
def delete_fornecedor(fornecedor_id: int, finance: FinanceService = Depends(service)):
    try:
        finance.delete_fornecedor(fornecedor_id)
        return {
            "success": True,
            "message": f"Fornecedor #{fornecedor_id} excluído com sucesso.",
        }
    except FinanceError as error:
        raise_http(error)


@router.get(
    "/plano-de-contas",
    response_model=list[PlanoDeContasResponse],
    tags=["Cadastros Base"],
)
@router.get(
    "/plano-contas",
    response_model=list[PlanoDeContasResponse],
    include_in_schema=False,
    tags=["Cadastros Base"],
)
def list_plano_contas(finance: FinanceService = Depends(service)):
    return finance.list_plano_contas()


@router.post(
    "/plano-de-contas",
    response_model=PlanoDeContasResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cadastros Base"],
)
@router.post(
    "/plano-contas",
    response_model=PlanoDeContasResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
    tags=["Cadastros Base"],
)
def create_plano_contas(
    data: PlanoDeContasCreate, finance: FinanceService = Depends(service)
):
    try:
        return finance.create_plano_contas(data)
    except FinanceError as error:
        raise_http(error)


@router.get("/titulos", response_model=list[TituloResponse])
def list_titulos(
    tipo: TipoTitulo | None = Query(default=None),
    status_titulo: StatusTitulo | None = Query(default=None, alias="status"),
    periodo_inicio: date | None = Query(default=None, alias="periodoInicio"),
    periodo_fim: date | None = Query(default=None, alias="periodoFim"),
    finance: FinanceService = Depends(service),
):
    if periodo_inicio and periodo_fim and periodo_inicio > periodo_fim:
        raise HTTPException(
            status_code=400,
            detail="O período inicial não pode ser posterior ao período final.",
        )
    return finance.list_titulos(
        tipo.value if tipo else None,
        status_titulo.value if status_titulo else None,
        periodo_inicio,
        periodo_fim,
    )


@router.get("/titulos/{titulo_id}", response_model=TituloResponse)
def get_titulo(titulo_id: int, finance: FinanceService = Depends(service)):
    try:
        return finance.get_titulo(titulo_id)
    except FinanceError as error:
        raise_http(error)


@router.post(
    "/titulos", response_model=TituloResponse, status_code=status.HTTP_201_CREATED
)
def create_titulo(data: TituloCreate, finance: FinanceService = Depends(service)):
    try:
        return finance.create_titulo(data)
    except FinanceError as error:
        raise_http(error)


@router.delete("/titulos/{titulo_id}")
def delete_titulo(titulo_id: int, finance: FinanceService = Depends(service)):
    try:
        finance.delete_titulo(titulo_id)
        return {
            "success": True,
            "message": f"Título #{titulo_id} removido com sucesso.",
        }
    except FinanceError as error:
        raise_http(error)


@router.post("/titulos/{titulo_id}/baixa")
def create_baixa(
    titulo_id: int,
    data: BaixaCreate,
    finance: FinanceService = Depends(service),
):
    try:
        baixa = finance.create_baixa(titulo_id, data)
        return {
            "success": True,
            "message": f"Título #{titulo_id} liquidado com sucesso!",
            "baixa": baixa,
            "titulo": finance.get_titulo(titulo_id),
        }
    except FinanceError as error:
        raise_http(error)


@router.get("/baixas", response_model=list[BaixaResponse])
def list_baixas(finance: FinanceService = Depends(service)):
    return finance.list_baixas()


@router.get("/analytics/dashboard", tags=["Analytics"])
def dashboard(finance: FinanceService = Depends(service)):
    try:
        return finance.recalculate_dashboard()
    except FinanceError as error:
        raise_http(error)


@router.post("/analytics/recalcular", tags=["Analytics"])
def recalculate_dashboard(finance: FinanceService = Depends(service)):
    try:
        return {
            "message": "Pipeline ETL executado com sucesso",
            "data": finance.recalculate_dashboard(),
        }
    except FinanceError as error:
        raise_http(error)


@router.post("/reset-demo", tags=["Demo"])
@router.post("/demo/reset", include_in_schema=False, tags=["Demo"])
def reset_demo(finance: FinanceService = Depends(service)):
    try:
        finance.reset_demo()
        return {
            "message": "Dados de demonstração restaurados com sucesso",
            "data": finance.recalculate_dashboard(),
        }
    except FinanceError as error:
        raise_http(error)
