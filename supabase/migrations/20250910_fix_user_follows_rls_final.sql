-- Final fix for user_follows RLS permissions
-- This migration resolves the "permission denied for table users" error
-- by cleaning up conflicting policies and creating comprehensive, working policies

-- First, disable RLS temporarily to clean up
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "users public profile read" ON public.users;
DROP POLICY IF EXISTS "users_public_read" ON public.users;
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "user_follows_read" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_manage" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_read_policy" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_manage_policy" ON public.user_follows;
DROP POLICY IF EXISTS "follows public read" ON public.user_follows;
DROP POLICY IF EXISTS "follows write self" ON public.user_follows;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policy for users table
-- This policy allows:
-- 1. Users to read their own profile
-- 2. Public profiles to be read by anyone (essential for social features)
-- 3. Basic user info to be accessible for JOIN operations in user_follows
CREATE POLICY "users_comprehensive_read" ON public.users
FOR SELECT 
USING (
  -- Allow users to read their own profile
  auth.uid() = id 
  OR 
  -- Allow reading public profiles (default to true for social platform behavior)
  COALESCE(((share_settings ->> 'profile_public'::text))::boolean, true) = true
);

-- Create RLS policy for user_follows table - read access
-- Allow anyone to read follow relationships (this is standard for social platforms)
CREATE POLICY "user_follows_public_read" ON public.user_follows
FOR SELECT 
USING (true);

-- Create RLS policy for user_follows table - write access
-- Allow users to manage (insert/update/delete) only their own follow relationships
CREATE POLICY "user_follows_self_manage" ON public.user_follows
FOR ALL
USING (follower_id = auth.uid())
WITH CHECK (follower_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.users TO authenticated;
GRANT ALL ON public.user_follows TO authenticated;

-- Ensure the policies are properly applied
NOTIFY pgrst, 'reload schema';