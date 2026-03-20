-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Clientes Table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Enums for Status
CREATE TYPE public.status_geral_venda AS ENUM ('em_aberto', 'quitado', 'atrasado');
CREATE TYPE public.status_parcela AS ENUM ('aberto', 'pago', 'parcial', 'atrasado');

-- 3. Create Vendas Table
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  produto_nome TEXT NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  num_parcelas INTEGER NOT NULL,
  data_venda DATE DEFAULT CURRENT_DATE,
  status_geral public.status_geral_venda DEFAULT 'em_aberto'
);

-- 4. Create Parcelas Table
CREATE TABLE public.parcelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE,
  num_parcela INTEGER NOT NULL,
  valor_parcela NUMERIC(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  valor_pago NUMERIC(10, 2) DEFAULT 0,
  status_parcela public.status_parcela DEFAULT 'aberto'
);

-- 5. RLS (Row Level Security) - Desabilitado por enquanto para facilitar o protótipo
-- Se quiser segurança máxima depois, podemos ativá-lo.
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas DISABLE ROW LEVEL SECURITY;
