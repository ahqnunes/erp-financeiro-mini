from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models import Cliente
from ..repositories.clientes import ClienteRepository
from ..schemas import ClienteCreate, ClienteUpdate


class ClienteNotFoundError(Exception):
    pass


class ClienteHasTitlesError(Exception):
    pass


class ClienteDuplicateDocumentError(Exception):
    pass


class ClienteService:
    def __init__(self, session: Session):
        self.repository = ClienteRepository(session)
        self.session = session

    def list(self) -> list[Cliente]:
        return self.repository.list()

    def get(self, cliente_id: int) -> Cliente:
        cliente = self.repository.get(cliente_id)
        if cliente is None:
            raise ClienteNotFoundError(f"Cliente com ID {cliente_id} não encontrado.")
        return cliente

    def create(self, data: ClienteCreate) -> Cliente:
        try:
            cliente = self.repository.create(data)
            self.session.commit()
            return cliente
        except IntegrityError as error:
            self.session.rollback()
            raise ClienteDuplicateDocumentError(
                "Já existe um cliente cadastrado com este documento."
            ) from error

    def update(self, cliente_id: int, data: ClienteUpdate) -> Cliente:
        cliente = self.get(cliente_id)
        try:
            cliente = self.repository.update(cliente, data)
            self.session.commit()
            return cliente
        except IntegrityError as error:
            self.session.rollback()
            raise ClienteDuplicateDocumentError(
                "Já existe um cliente cadastrado com este documento."
            ) from error

    def delete(self, cliente_id: int) -> None:
        cliente = self.get(cliente_id)
        if self.repository.has_titles(cliente_id):
            raise ClienteHasTitlesError(
                "Não é possível excluir o cliente pois existem títulos financeiros associados a ele."
            )
        self.repository.delete(cliente)
        try:
            self.session.commit()
        except IntegrityError as error:
            self.session.rollback()
            raise ClienteHasTitlesError(
                "Não é possível excluir o cliente pois existem títulos financeiros associados."
            ) from error
