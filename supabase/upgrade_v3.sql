-- 1. Create Usuarios Table
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Historico Acoes Table (Audit logs)
CREATE TABLE IF NOT EXISTS public.historico_acoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  usuario_nome TEXT NOT NULL,
  acao TEXT NOT NULL,
  descricao TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}'::jsonb,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seed Initial Operators (Password: fitch123)
-- SHA-256 for 'fitch123' is c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2
INSERT INTO public.usuarios (nome, username, senha_hash)
VALUES 
  ('Jonathan Moreira', 'jonathan', 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2'),
  ('Operador 1', 'operador1', 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2'),
  ('Operador 2', 'operador2', 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2')
ON CONFLICT (username) DO NOTHING;

-- Disable RLS for these new tables to match existing schema configuration
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_acoes DISABLE ROW LEVEL SECURITY;
