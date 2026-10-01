# Regras de negócio atuais

Este documento descreve o comportamento que deve ser preservado durante a migração para Python. Mudanças nessas regras devem ser tratadas como decisões de produto e acompanhadas de novos testes.

## Cadastros

- Cliente exige nome e documento no endpoint de criação.
- Fornecedor exige nome e categoria no endpoint de criação.
- IDs são gerados pelo backend.
- Clientes e fornecedores não podem ser excluídos quando possuem títulos vinculados.
- O plano de contas possui tipo `RECEITA` ou `DESPESA`.

## Títulos financeiros

- Um título deve ter tipo, plano de contas, descrição, valor original, data de emissão e vencimento.
- O valor original deve ser maior que zero.
- Títulos a receber devem apontar para um cliente existente.
- Títulos a pagar devem apontar para um fornecedor existente.
- O plano de contas informado deve existir.
- Títulos vencidos são atualizados de `PENDENTE` para `VENCIDO` quando consultados após o vencimento.
- Um título pago não pode ser excluído diretamente.
- O título só mantém o vínculo de cliente quando é `RECEBER` e só mantém o vínculo de fornecedor quando é `PAGAR`.

## Baixas

- Uma baixa só pode ser criada para um título existente e ainda não pago.
- Juros e descontos negativos são rejeitados.
- Juros e descontos são arredondados para duas casas.
- O valor pago é `valorOriginal + juros - descontos` e deve ser maior que zero.
- A baixa armazena a forma de pagamento, data, valores calculados e observação.
- A criação da baixa e a atualização do título ocorrem na mesma transação; em caso de erro, nenhuma das duas alterações permanece.
- Um título só pode possuir uma baixa no comportamento atual.

## Indicadores e DRE

- O saldo inicial de caixa da base de demonstração é R$ 25.000,00.
- O saldo atual soma recebimentos e subtrai pagamentos efetivados.
- O fluxo projetado cobre o dia atual e os próximos 30 dias.
- Títulos vencidos entram na projeção do dia atual.
- A DRE é baseada nas baixas efetivadas.
- Receitas usam o valor original e descontos como deduções.
- Despesas usam o valor efetivamente pago.
- Percentuais são calculados sobre a receita líquida para receitas e sobre despesas operacionais para despesas.

## Decisões pendentes para a migração

Estas regras ainda precisam ser formalizadas antes da implementação em banco:

- política para documentos duplicados;
- baixa parcial, estorno e renegociação;
- competência versus regime de caixa na DRE;
- timezone oficial para mudança de status;
- precisão monetária e moeda por empresa;
- multiempresa, filiais e centros de custo;
- autenticação, autorização e trilha de auditoria.
