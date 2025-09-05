-- Add missing columns used by the app to user_list_items
ALTER TABLE public.user_list_items
  ADD COLUMN IF NOT EXISTS media_title text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS media_year integer;

-- Allow owners to delete their own lists
CREATE POLICY IF NOT EXISTS "lists delete own"
ON public.user_lists
FOR DELETE
USING (user_id = auth.uid());

-- Allow public read of user profiles when profile_public is true (or self)
CREATE POLICY IF NOT EXISTS "users public profile read"
ON public.users
FOR SELECT
USING (
  auth.uid() = id
  OR COALESCE((share_settings->>'profile_public')::boolean, true)
);
