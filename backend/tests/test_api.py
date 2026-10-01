from datetime import date, timedelta


def setup_parties(client):
    cliente = client.post(
        "/api/clientes",
        json={"nome": "Cliente de teste", "documento": "DOC-1"},
    )
    assert cliente.status_code == 201
    fornecedor = client.post(
        "/api/fornecedores",
        json={"nome": "Fornecedor de teste", "categoria": "Serviços"},
    )
    assert fornecedor.status_code == 201
    plano = client.post(
        "/api/plano-de-contas",
        json={"codigo": "1.01", "nome": "Receita", "tipo": "RECEITA"},
    )
    assert plano.status_code == 201
    return cliente.json(), fornecedor.json(), plano.json()


def test_client_supplier_and_account_crud_contract(client):
    cliente, fornecedor, plano = setup_parties(client)
    assert "createdAt" in cliente
    assert cliente["id"] == 1
    assert client.get("/api/clientes").json()[0]["nome"] == "Cliente de teste"
    assert client.get("/api/fornecedores").json()[0]["nome"] == "Fornecedor de teste"
    assert client.get("/api/plano-contas").json()[0]["categoriaPaiId"] is None

    updated = client.put(
        f"/api/fornecedores/{fornecedor['id']}",
        json={"nome": "Fornecedor atualizado"},
    )
    assert updated.status_code == 200
    assert updated.json()["nome"] == "Fornecedor atualizado"

    deleted = client.delete(f"/api/fornecedores/{fornecedor['id']}")
    assert deleted.status_code == 200
    assert deleted.json()["success"] is True
    assert plano["tipo"] == "RECEITA"


def test_duplicate_client_documents_are_rejected_on_create_and_update(client):
    first = client.post(
        "/api/clientes",
        json={"nome": "Cliente 1", "documento": "DOC-DUPLICADO"},
    )
    second = client.post(
        "/api/clientes",
        json={"nome": "Cliente 2", "documento": "DOC-DUPLICADO"},
    )
    assert first.status_code == 201
    assert second.status_code == 400
    assert "documento" in second.json()["error"]

    other = client.post(
        "/api/clientes",
        json={"nome": "Cliente 3", "documento": "DOC-OUTRO"},
    ).json()
    updated = client.put(
        f"/api/clientes/{other['id']}", json={"documento": "DOC-DUPLICADO"}
    )
    assert updated.status_code == 400


def test_title_filters_and_due_status(client):
    cliente, _, plano = setup_parties(client)
    due = date.today() + timedelta(days=4)
    response = client.post(
        "/api/titulos",
        json={
            "tipo": "RECEBER",
            "clienteId": cliente["id"],
            "planoContasId": plano["id"],
            "descricao": "Fatura teste",
            "valorOriginal": 125.50,
            "dataEmissao": date.today().isoformat(),
            "dataVencimento": due.isoformat(),
        },
    )
    assert response.status_code == 201
    titulo = response.json()
    assert titulo["entidadeNome"] == "Cliente de teste"
    assert titulo["planoContasCodigo"] == "1.01"
    assert titulo["status"] == "PENDENTE"

    filtered = client.get(
        "/api/titulos",
        params={
            "tipo": "RECEBER",
            "status": "PENDENTE",
            "periodoInicio": due.isoformat(),
            "periodoFim": due.isoformat(),
        },
    )
    assert filtered.status_code == 200
    assert [item["id"] for item in filtered.json()] == [titulo["id"]]
    assert client.get(f"/api/titulos/{titulo['id']}").json()["id"] == titulo["id"]


def test_overdue_titles_are_updated_when_listed(client):
    cliente, _, plano = setup_parties(client)
    response = client.post(
        "/api/titulos",
        json={
            "tipo": "RECEBER",
            "clienteId": cliente["id"],
            "planoContasId": plano["id"],
            "descricao": "Título vencido",
            "valorOriginal": 100,
            "dataEmissao": (date.today() - timedelta(days=3)).isoformat(),
            "dataVencimento": (date.today() - timedelta(days=1)).isoformat(),
        },
    )
    assert response.status_code == 201
    titulo_id = response.json()["id"]
    assert response.json()["status"] == "VENCIDO"
    assert (
        client.get("/api/titulos", params={"status": "VENCIDO"}).json()[0]["id"]
        == titulo_id
    )


def test_settlement_is_atomic_and_appears_in_dashboard(client):
    cliente, _, plano = setup_parties(client)
    titulo = client.post(
        "/api/titulos",
        json={
            "tipo": "RECEBER",
            "clienteId": cliente["id"],
            "planoContasId": plano["id"],
            "descricao": "Liquidação teste",
            "valorOriginal": 100,
            "dataEmissao": date.today().isoformat(),
            "dataVencimento": (date.today() + timedelta(days=1)).isoformat(),
        },
    ).json()

    invalid_baixa = client.post(
        f"/api/titulos/{titulo['id']}/baixa",
        json={
            "dataPagamento": date.today().isoformat(),
            "formaDePagamento": "PIX",
            "juros": -1,
        },
    )
    assert invalid_baixa.status_code == 400
    assert "não podem ser valores negativos" in invalid_baixa.json()["error"]
    assert client.get(f"/api/titulos/{titulo['id']}").json()["status"] == "PENDENTE"

    zero_value_baixa = client.post(
        f"/api/titulos/{titulo['id']}/baixa",
        json={
            "dataPagamento": date.today().isoformat(),
            "formaDePagamento": "PIX",
            "descontos": 100,
        },
    )
    assert zero_value_baixa.status_code == 400
    assert "maior que zero" in zero_value_baixa.json()["error"]
    assert client.get(f"/api/titulos/{titulo['id']}").json()["status"] == "PENDENTE"

    baixa = client.post(
        f"/api/titulos/{titulo['id']}/baixa",
        json={
            "dataPagamento": date.today().isoformat(),
            "formaDePagamento": "PIX",
            "juros": 10.125,
            "descontos": 2.125,
            "observacao": "  confirmado  ",
        },
    )
    assert baixa.status_code == 200
    assert baixa.json()["baixa"]["valorPago"] == 108
    assert baixa.json()["baixa"]["observacao"] == "confirmado"
    assert baixa.json()["titulo"]["status"] == "PAGO"
    assert client.get("/api/baixas").json()[0]["valorOriginal"] == 100
    assert client.delete(f"/api/titulos/{titulo['id']}").status_code == 400
    assert (
        client.post(
            f"/api/titulos/{titulo['id']}/baixa",
            json={
                "dataPagamento": date.today().isoformat(),
                "formaDePagamento": "PIX",
            },
        ).status_code
        == 400
    )

    dashboard = client.get("/api/analytics/dashboard")
    assert dashboard.status_code == 200
    assert len(dashboard.json()["fluxoCaixa30Dias"]) == 31
    assert dashboard.json()["dre"]["receitaBruta"] == 100
    assert dashboard.json()["dre"]["resultadoLiquido"] == 97.87


def test_demo_reset_and_openapi_aliases(client):
    reset = client.post("/api/reset-demo")
    assert reset.status_code == 200
    assert len(client.get("/api/clientes").json()) == 5
    assert len(client.get("/api/titulos").json()) == 15
    assert client.get("/api/docs/openapi.json").status_code == 200
    assert client.get("/api/docs").status_code == 200
    assert client.get("/api/health").json()["version"] == "1.0.0"
    assert client.post("/api/demo/reset").status_code == 200


def test_invalid_title_and_referential_delete_are_reported(client):
    cliente, _, plano = setup_parties(client)
    invalid = client.post(
        "/api/titulos",
        json={
            "tipo": "RECEBER",
            "planoContasId": plano["id"],
            "descricao": "Sem cliente",
            "valorOriginal": 100,
            "dataEmissao": date.today().isoformat(),
            "dataVencimento": (date.today() + timedelta(days=1)).isoformat(),
        },
    )
    assert invalid.status_code == 400
    assert "Cliente válido" in invalid.json()["error"]

    title = client.post(
        "/api/titulos",
        json={
            "tipo": "RECEBER",
            "clienteId": cliente["id"],
            "planoContasId": plano["id"],
            "descricao": "Associado",
            "valorOriginal": 100,
            "dataEmissao": date.today().isoformat(),
            "dataVencimento": (date.today() + timedelta(days=1)).isoformat(),
        },
    )
    assert title.status_code == 201
    assert client.delete(f"/api/clientes/{cliente['id']}").status_code == 409
    assert client.delete(f"/api/titulos/{title.json()['id']}").status_code == 200
