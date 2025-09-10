-- Final comprehensive fix for user_follows RLS permissions
-- This migration specifically addresses the "permission denied for table users" error
-- when doing JOINs between user_follows and users tables

-- Step 1: Temporarily disable RLS to clean up
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows DISABLE ROW LEVEL SECURITY;

-- Step 2: Remove ALL existing policies completely
DROP POLICY IF EXISTS "users public profile read" ON public.users;
DROP POLICY IF EXISTS "users_public_read" ON public.users;
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_comprehensive_read" ON public.users;
DROP POLICY IF EXISTS "user_follows_read" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_manage" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_read_policy" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_manage_policy" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_public_read" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_self_manage" ON public.user_follows;
DROP POLICY IF EXISTS "follows public read" ON public.user_follows;
DROP POLICY IF EXISTS "follows write self" ON public.user_follows;

-- Step 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a very permissive read policy for users table
-- This is essential for social platform functionality where user profiles need to be discoverable
CREATE POLICY "users_social_read" ON public.users
FOR SELECT 
USING (
  -- Always allow reading basic user info (id, username, email) which is standard for social platforms
  -- This includes when accessed via JOINs from other tables like user_follows
  true
);

-- Step 5: Create policies for user_follows table
-- Allow reading all follow relationships (standard for social platforms)
CREATE POLICY "user_follows_read_all" ON public.user_follows
FOR SELECT 
USING (true);

-- Allow users to manage their own follow relationships
CREATE POLICY "user_follows_manage_own" ON public.user_follows
FOR ALL
USING (follower_id = auth.uid())
WITH CHECK (follower_id = auth.uid());

-- Step 6: Ensure the anon role has proper access
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.user_follows TO anon;
GRANT INSERT, UPDATE, DELETE ON public.user_follows TO authenticated;

-- Step 7: Force policy reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';