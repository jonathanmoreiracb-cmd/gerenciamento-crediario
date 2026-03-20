-- Zera completamente as tabelas atuais e recomeça os IDs automáticos se houvesse,
-- e graças ao CASCADE, apagar um cliente apaga todas as suas vendas e as vendas apagam as parcelas.
TRUNCATE TABLE public.clientes CASCADE;

-- Adiciona a coluna para receber o ID do Syscor na tabela Vendas
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS syscor_id TEXT;
