-- Remover a política mais restritiva que está causando problemas
DROP POLICY IF EXISTS "users self or admin" ON public.users;