from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.schemas import ClienteCreate, ClienteResponse


def test_cliente_response_preserves_frontend_created_at_contract() -> None:
    response = ClienteResponse(
        id=1,
        nome="Cliente de teste",
        documento="12345678900",
        created_at=datetime(2026, 9, 23, tzinfo=UTC),
    )

    assert response.model_dump(by_alias=True)["createdAt"].year == 2026


def test_cliente_create_rejects_empty_required_fields() -> None:
    with pytest.raises(ValidationError):
        ClienteCreate(nome="", documento="")
