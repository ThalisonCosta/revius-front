-- Corrigir o problema de permissão para a tabela users
-- Vamos criar uma política mais simples e clara

-- Remover a política problemática
DROP POLICY IF EXISTS "users public profile read" ON public.users;

-- Criar uma política mais simples que permite leitura básica de perfis públicos
CREATE POLICY "users_public_read" ON public.users
FOR SELECT 
USING (
  -- Usuário pode ver seu próprio perfil
  auth.uid() = id 
  OR 
  -- Permitir leitura básica de perfis públicos (usando configuração padrão true)
  COALESCE(((share_settings ->> 'profile_public'::text))::boolean, true) = true
);

-- Verificar se existe algum problema com o relacionamento na tabela user_follows
-- Vamos garantir que as políticas sejam consistentes
DROP POLICY IF EXISTS "follows public read" ON public.user_follows;
DROP POLICY IF EXISTS "follows write self" ON public.user_follows;

-- Recriar políticas mais claras para user_follows
CREATE POLICY "user_follows_read" ON public.user_follows
FOR SELECT 
USING (true); -- Permitir leitura pública das relações de follow

CREATE POLICY "user_follows_manage" ON public.user_follows
FOR ALL
USING (follower_id = auth.uid())
WITH CHECK (follower_id = auth.uid());