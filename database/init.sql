CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    documento VARCHAR(20) NOT NULL UNIQUE, -- CPF ou CNPJ
    contato VARCHAR(50),
    email VARCHAR(100),
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    documento VARCHAR(20),
    categoria VARCHAR(100) NOT NULL,
    contato VARCHAR(50),
    email VARCHAR(100),
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS plano_de_contas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
    categoria_pai_id INTEGER REFERENCES plano_de_contas(id) ON DELETE RESTRICT,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


CREATE TABLE IF NOT EXISTS titulos_financeiros (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('PAGAR', 'RECEBER')),
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE RESTRICT,
    fornecedor_id INTEGER REFERENCES fornecedores(id) ON DELETE RESTRICT,
    plano_contas_id INTEGER NOT NULL REFERENCES plano_de_contas(id) ON DELETE RESTRICT,
    descricao VARCHAR(255) NOT NULL,
    valor_original NUMERIC(15, 2) NOT NULL CHECK (valor_original > 0),
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'VENCIDO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_entidade_vinculada CHECK (
        (tipo = 'RECEBER' AND cliente_id IS NOT NULL) OR
        (tipo = 'PAGAR' AND fornecedor_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS baixas_financeiras (
    id SERIAL PRIMARY KEY,
    titulo_id INTEGER NOT NULL UNIQUE REFERENCES titulos_financeiros(id) ON DELETE RESTRICT,
    data_pagamento DATE NOT NULL,
    valor_pago NUMERIC(15, 2) NOT NULL CHECK (valor_pago > 0),
    juros NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (juros >= 0),
    descontos NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (descontos >= 0),
    forma_de_pagamento VARCHAR(30) NOT NULL CHECK (
        forma_de_pagamento IN ('PIX', 'BOLETO', 'CARTAO', 'TRANSFERENCIA', 'DINHEIRO')
    ),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_titulos_status ON titulos_financeiros(status);
CREATE INDEX IF NOT EXISTS idx_titulos_tipo_vencimento ON titulos_financeiros(tipo, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_titulos_cliente ON titulos_financeiros(cliente_id);
CREATE INDEX IF NOT EXISTS idx_titulos_fornecedor ON titulos_financeiros(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_titulos_plano_contas ON titulos_financeiros(plano_contas_id);
CREATE INDEX IF NOT EXISTS idx_baixas_data_pagamento ON baixas_financeiras(data_pagamento);


INSERT INTO clientes (nome, documento, contato, email, endereco) VALUES
('Hospital Samaritano S.A.', '43.128.980/0001-44', '(11) 3450-8900', 'financeiro@samaritano.med.br', 'Av. Paulista, 1800 - Bela Vista, SP'),
('Supermercados Estrela D’Alva Ltda', '12.879.445/0001-90', '(11) 2980-1122', 'contas@estrelaalva.com.br', 'Rua do Comércio, 450 - Centro, Campinas - SP'),
('Varejo Brasil Logística & Distribuição', '08.654.321/0001-12', '(19) 3344-5566', 'controladoria@varejobrasil.com.br', 'Rod. Anhanguera, km 104 - Sumaré - SP'),
('Clínica Odonto Vida Ativa', '22.333.444/0001-55', '(11) 4567-8910', 'adm@odontovida.com.br', 'Rua das Flores, 88 - Moema, SP'),
('Alfa Seguros e Previdência', '33.999.888/0001-77', '(21) 2500-4321', 'pagamentos@alfaseguros.com.br', 'Av. Rio Branco, 110 - RJ')
ON CONFLICT (documento) DO NOTHING;

INSERT INTO fornecedores (nome, documento, categoria, contato, email, endereco) VALUES
('Amazon Web Services (AWS Cloud Brasil)', '23.456.789/0001-01', 'Infraestrutura Cloud & TI', 'billing-br@amazon.com', 'billing-br@amazon.com', 'Av. Faria Lima, 3700 - SP'),
('Locadora Alpha Imóveis Comerciais', '11.222.333/0001-99', 'Aluguel e Instalações', '(11) 3012-9900', 'locacoes@alphaimoveis.com.br', 'Alameda Santos, 900 - SP'),
('Provedor Fibra Telecom S.A.', '04.555.666/0001-33', 'Telecomunicações & Conectividade', '0800 700 8090', 'suporte@fibratelecom.com.br', 'Rua Vergueiro, 2000 - SP'),
('Ferreira & Associados Consultoria Contábil', '55.666.777/0001-22', 'Serviços Contábeis e Fiscais', '(11) 3222-1144', 'contabilidade@ferreira.com.br', 'Rua da Consolação, 1500 - SP'),
('Google Cloud & Workspace Brasil', '06.990.590/0001-23', 'Licenciamento de Software & Ferramentas', 'workspace-billing@google.com', 'workspace-billing@google.com', 'Av. Faria Lima, 3477 - SP');

INSERT INTO plano_de_contas (codigo, nome, tipo, descricao) VALUES
('1.01', 'Serviços de Consultoria & Integração', 'RECEITA', 'Projetos e implantação de software empresarial'),
('1.02', 'Licenciamento Mensal de Software SaaS', 'RECEITA', 'Mensalidades recorrentes da plataforma web'),
('1.03', 'Suporte Técnico e SLA Dedicado', 'RECEITA', 'Contratos mensais de suporte 24/7'),
('1.04', 'Treinamentos e Capacitação', 'RECEITA', 'Workshops e treinamentos operacionais'),
('2.01', 'Infraestrutura Cloud & Servidores', 'DESPESA', 'Servidores AWS, banco de dados e hospedagem'),
('2.02', 'Aluguel, Condomínio e IPTU', 'DESPESA', 'Sede da empresa e infraestrutura física'),
('2.03', 'Serviços de Telecom & Internet Fibra', 'DESPESA', 'Links dedicados e telefonia IP'),
('2.04', 'Serviços Contábeis e Jurídicos', 'DESPESA', 'Honorários contábeis e assessoria jurídica'),
('2.05', 'Licenças de Softwares e Ferramentas', 'DESPESA', 'Google Workspace, GitHub, Slack e Figma'),
('2.06', 'Marketing Digital e Aquisição', 'DESPESA', 'Anúncios de performance e branding')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO titulos_financeiros (tipo, cliente_id, fornecedor_id, plano_contas_id, descricao, valor_original, data_emissao, data_vencimento, status) VALUES
('RECEBER', 1, NULL, 1, 'Consultoria de Integração - Etapa 01', 14500.00, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '10 days', 'PAGO'),
('RECEBER', 2, NULL, 2, 'Assinatura SaaS Enterprise - Mensalidade', 8900.00, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '5 days', 'PAGO'),
('PAGAR', NULL, 1, 5, 'Fatura Mensal Servidores Cloud AWS', 3450.80, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '8 days', 'PAGO'),
('PAGAR', NULL, 2, 6, 'Aluguel Sede Corporativa - Mês Anterior', 6200.00, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '12 days', 'PAGO'),
('PAGAR', NULL, 4, 8, 'Honorários Contábeis Ferreira Associados', 2100.00, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '6 days', 'PAGO'),
('RECEBER', 4, NULL, 3, 'Suporte Técnico e Manutenção - Atraso', 3800.00, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '4 days', 'VENCIDO'),
('PAGAR', NULL, 3, 7, 'Link Dedicado de Fibra Óptica 1Gbps', 1250.00, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '2 days', 'VENCIDO'),
('RECEBER', 3, NULL, 2, 'Licenciamento Varejo Brasil - 40 Usuários', 11200.00, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days', 'PENDENTE'),
('PAGAR', NULL, 5, 9, 'Licenças Google Workspace e Armazenamento', 1680.50, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '4 days', 'PENDENTE'),
('RECEBER', 5, NULL, 1, 'Consultoria em BI Financeiro - Parcela 2/3', 18000.00, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '8 days', 'PENDENTE'),
('PAGAR', NULL, 2, 6, 'Aluguel Sede Corporativa - Vencimento Vigente', 6200.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'PENDENTE'),
('RECEBER', 1, NULL, 3, 'Renovação Contrato SLA Hospital Samaritano', 9500.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', 'PENDENTE'),
('PAGAR', NULL, 1, 5, 'Previsão Custos Instâncias AWS RDS e EC2', 3890.00, CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '18 days', 'PENDENTE'),
('RECEBER', 2, NULL, 2, 'Assinatura Plataforma SaaS - Mês Seguinte', 8900.00, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '22 days', 'PENDENTE'),
('PAGAR', NULL, 4, 8, 'Fechamento Fiscal Ferreira & Associados', 2100.00, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '26 days', 'PENDENTE');

INSERT INTO baixas_financeiras (titulo_id, data_pagamento, valor_pago, juros, descontos, forma_de_pagamento, observacao) VALUES
(1, CURRENT_DATE - INTERVAL '10 days', 14500.00, 0.00, 0.00, 'PIX', 'Pagamento antecipado com liquidação via PIX.'),
(2, CURRENT_DATE - INTERVAL '5 days', 8722.00, 0.00, 178.00, 'BOLETO', 'Desconto de 2% pontualidade.'),
(3, CURRENT_DATE - INTERVAL '8 days', 3450.80, 0.00, 0.00, 'CARTAO', 'Fatura AWS em débito automático.'),
(4, CURRENT_DATE - INTERVAL '12 days', 6200.00, 0.00, 0.00, 'TRANSFERENCIA', 'TED corporativa.'),
(5, CURRENT_DATE - INTERVAL '6 days', 2100.00, 0.00, 0.00, 'PIX', 'Liquidação de honorários contábeis.');
