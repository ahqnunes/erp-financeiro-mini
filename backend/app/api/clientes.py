from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import ClienteCreate, ClienteResponse, ClienteUpdate
from ..services.clientes import (
    ClienteDuplicateDocumentError,
    ClienteHasTitlesError,
    ClienteNotFoundError,
    ClienteService,
)

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])


def service(db: Session = Depends(get_db)) -> ClienteService:
    return ClienteService(db)


@router.get("", response_model=list[ClienteResponse])
def list_clientes(clientes: ClienteService = Depends(service)):
    return clientes.list()


@router.get("/{cliente_id}", response_model=ClienteResponse)
def get_cliente(cliente_id: int, clientes: ClienteService = Depends(service)):
    try:
        return clientes.get(cliente_id)
    except ClienteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def create_cliente(data: ClienteCreate, clientes: ClienteService = Depends(service)):
    try:
        return clientes.create(data)
    except ClienteDuplicateDocumentError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.put("/{cliente_id}", response_model=ClienteResponse)
def update_cliente(
    cliente_id: int,
    data: ClienteUpdate,
    clientes: ClienteService = Depends(service),
):
    try:
        return clientes.update(cliente_id, data)
    except ClienteNotFoundError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except ClienteDuplicateDocumentError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/{cliente_id}", status_code=status.HTTP_200_OK)
def delete_cliente(cliente_id: int, clientes: ClienteService = Depends(service)):
    try:
        clientes.delete(cliente_id)
        return {
            "success": True,
            "message": f"Cliente #{cliente_id} excluído com sucesso.",
        }
    except ClienteNotFoundError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except ClienteHasTitlesError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
