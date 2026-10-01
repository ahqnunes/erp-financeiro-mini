# Contrato da API

Este documento registra o contrato funcional preservado pelo backend FastAPI,
servido sob o prefixo `/api`.

## Convenções

- Formato de entrada e saída: `application/json`.
- Datas: `YYYY-MM-DD`.
- Valores monetários são enviados e devolvidos como números; cálculos e
  persistência são arredondados para duas casas decimais.
- IDs: inteiros positivos.
- Erros retornam `{ "error": "mensagem" }`, exceto respostas de sucesso de baixa, que também incluem `success`, `baixa` e `titulo`.
- Os dados são persistidos em PostgreSQL e permanecem após reinícios.
- O endpoint `/reset-demo` restaura os registros de demonstração.

## Endpoints

| Método | Rota | Finalidade | Sucesso | Erros principais |
|---|---|---|---:|---|
| GET | `/health` | Verificar disponibilidade do serviço | 200 | — |
| GET | `/docs` | Interface interativa Swagger | 200 | — |
| GET | `/docs/openapi.json` | Obter a especificação OpenAPI | 200 | — |
| GET | `/analytics/dashboard` | Obter KPIs, fluxo de 30 dias e DRE | 200 | 500 |
| POST | `/analytics/recalcular` | Recalcular o pipeline analítico | 200 | 500 |
| POST | `/reset-demo` | Restaurar a base de demonstração | 200 | 500 |
| POST | `/demo/reset` | Alias de `/reset-demo` | 200 | 500 |
| GET | `/clientes` | Listar clientes | 200 | 500 |
| POST | `/clientes` | Criar cliente | 201 | 400 |
| PUT | `/clientes/:id` | Atualizar cliente | 200 | 400 |
| DELETE | `/clientes/:id` | Excluir cliente sem títulos vinculados | 200 | 409 |
| GET | `/fornecedores` | Listar fornecedores | 200 | 500 |
| POST | `/fornecedores` | Criar fornecedor | 201 | 400 |
| PUT | `/fornecedores/:id` | Atualizar fornecedor | 200 | 400 |
| DELETE | `/fornecedores/:id` | Excluir fornecedor sem títulos vinculados | 200 | 409 |
| GET | `/plano-de-contas` | Listar plano de contas | 200 | 500 |
| GET | `/plano-contas` | Alias de `/plano-de-contas` | 200 | 500 |
| POST | `/plano-de-contas` | Criar conta contábil | 201 | 400 |
| POST | `/plano-contas` | Alias de `/plano-de-contas` | 201 | 400 |
| GET | `/titulos` | Listar títulos com filtros | 200 | 500 |
| GET | `/titulos/:id` | Consultar título | 200 | 404 |
| POST | `/titulos` | Criar título a pagar/receber | 201 | 400 |
| DELETE | `/titulos/:id` | Excluir título não pago | 200 | 400 |
| POST | `/titulos/:id/baixa` | Liquidar título | 200 | 400 |
| GET | `/baixas` | Listar baixas | 200 | 500 |

## Filtros de títulos

`GET /titulos` aceita:

- `tipo`: `PAGAR` ou `RECEBER`;
- `status`: `PENDENTE`, `PAGO` ou `VENCIDO`;
- `periodoInicio`: data mínima de vencimento;
- `periodoFim`: data máxima de vencimento.

Os filtros de data são inclusivos e comparados no formato ISO.

## Criação de título

Campos obrigatórios:

```json
{
  "tipo": "RECEBER",
  "planoContasId": 1,
  "descricao": "Serviço contratado",
  "valorOriginal": 1000,
  "dataEmissao": "2026-09-23",
  "dataVencimento": "2026-10-23"
}
```

Títulos `RECEBER` exigem `clienteId`; títulos `PAGAR` exigem `fornecedorId`. A entidade vinculada e o plano de contas devem existir.

## Liquidação

Campos obrigatórios:

```json
{
  "dataPagamento": "2026-09-23",
  "formaDePagamento": "PIX",
  "juros": 0,
  "descontos": 0,
  "observacao": "Pagamento confirmado"
}
```

Formas aceitas: `PIX`, `BOLETO`, `CARTAO`, `TRANSFERENCIA` e `DINHEIRO`.

O valor liquidado é:

```text
valorPago = valorOriginal + juros - descontos
```

Uma baixa altera o status do título para `PAGO` e é aplicada transacionalmente.
