from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Cliente, TituloFinanceiro
from ..schemas import ClienteCreate, ClienteUpdate


class ClienteRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self) -> list[Cliente]:
        return list(self.session.scalars(select(Cliente).order_by(Cliente.id.desc())))

    def get(self, cliente_id: int) -> Cliente | None:
        return self.session.get(Cliente, cliente_id)

    def create(self, data: ClienteCreate) -> Cliente:
        cliente = Cliente(
            nome=data.nome.strip(),
            documento=data.documento.strip(),
            contato=data.contato.strip() if data.contato else None,
            email=data.email.strip() if data.email else None,
            endereco=data.endereco.strip() if data.endereco else None,
        )
        self.session.add(cliente)
        self.session.flush()
        return cliente

    def update(self, cliente: Cliente, data: ClienteUpdate) -> Cliente:
        values = data.model_dump(exclude_unset=True)
        for field, value in values.items():
            setattr(cliente, field, value.strip() if isinstance(value, str) else value)
        self.session.flush()
        return cliente

    def has_titles(self, cliente_id: int) -> bool:
        statement = (
            select(TituloFinanceiro.id)
            .where(TituloFinanceiro.cliente_id == cliente_id)
            .limit(1)
        )
        return self.session.scalar(statement) is not None

    def delete(self, cliente: Cliente) -> None:
        self.session.delete(cliente)
        self.session.flush()
