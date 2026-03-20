-- Adiciona os novos campos solicitados na V2 sem prejudicar os dados do banco atual
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS is_colaborador BOOLEAN DEFAULT false;
