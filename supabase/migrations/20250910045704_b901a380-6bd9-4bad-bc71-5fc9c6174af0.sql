-- Corrigir as políticas RLS da tabela users para permitir acesso público adequado
-- Remover a política muito restritiva atual
DROP POLICY IF EXISTS "users self or admin" ON public.users;

-- Criar política mais permissiva para leitura pública quando o perfil for público
CREATE POLICY "users public profile read"
ON public.users
FOR SELECT
USING (
  -- Sempre permite acesso próprio
  auth.uid() = id 
  OR 
  -- Permite acesso público quando profile_public é true (padrão)
  COALESCE((share_settings->>'profile_public')::boolean, true) = true
);

-- Garantir que a política de inserção continue funcionando
DROP POLICY IF EXISTS "users insert via trigger only" ON public.users;
CREATE POLICY "users insert via trigger only"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Garantir que a política de atualização continue funcionando  
DROP POLICY IF EXISTS "users self update" ON public.users;
CREATE POLICY "users self update"
ON public.users
FOR UPDATE
USING (auth.uid() = id);