-- Ajustar política RLS da tabela users para permitir leitura de perfis públicos
-- através de relacionamentos de follows

-- Primeiro, remover a política atual
DROP POLICY IF EXISTS "users public profile read" ON public.users;

-- Criar nova política mais permissiva para leitura de perfis
CREATE POLICY "users public profile read" ON public.users
FOR SELECT 
USING (
  -- Usuário pode ver seu próprio perfil
  auth.uid() = id 
  OR 
  -- Perfis públicos podem ser vistos por todos (configuração padrão)
  COALESCE(((share_settings ->> 'profile_public'::text))::boolean, true) = true
  OR
  -- Permitir leitura através de relacionamentos de follows
  EXISTS (
    SELECT 1 FROM public.user_follows 
    WHERE (follower_id = auth.uid() AND following_id = users.id)
    OR (following_id = auth.uid() AND follower_id = users.id)
  )
);