-- Fix RLS policies for users and user_follows tables
-- This addresses the "permission denied for table users" error when accessing profile pages

-- First, clean up existing problematic policies
DROP POLICY IF EXISTS "users public profile read" ON public.users;
DROP POLICY IF EXISTS "users_public_read" ON public.users;
DROP POLICY IF EXISTS "user_follows_read" ON public.user_follows;
DROP POLICY IF EXISTS "user_follows_manage" ON public.user_follows;
DROP POLICY IF EXISTS "follows public read" ON public.user_follows;
DROP POLICY IF EXISTS "follows write self" ON public.user_follows;

-- Create a comprehensive RLS policy for users table
-- This policy allows:
-- 1. Users to read their own profile
-- 2. Public profiles to be read by anyone
-- 3. Basic user info (id, username, email) to be read when accessed via follows relationships
CREATE POLICY "users_read_policy" ON public.users
FOR SELECT 
USING (
  -- Allow users to read their own profile
  auth.uid() = id 
  OR 
  -- Allow reading public profiles (default to true if share_settings is null)
  COALESCE(((share_settings ->> 'profile_public'::text))::boolean, true) = true
  OR
  -- Allow reading basic user info when the current user has a follow relationship
  -- This is essential for JOIN operations in user_follows queries
  EXISTS (
    SELECT 1 FROM public.user_follows 
    WHERE auth.uid() IS NOT NULL -- Ensure user is authenticated
    AND (
      (follower_id = auth.uid() AND following_id = users.id) -- User follows this person
      OR 
      (following_id = auth.uid() AND follower_id = users.id) -- This person follows user
    )
  )
);

-- Create RLS policies for user_follows table
-- Allow anyone to read follow relationships (this is typically public information on social platforms)
CREATE POLICY "user_follows_read_policy" ON public.user_follows
FOR SELECT 
USING (true);

-- Allow users to manage (insert/update/delete) their own follow relationships
CREATE POLICY "user_follows_manage_policy" ON public.user_follows
FOR ALL
USING (follower_id = auth.uid())
WITH CHECK (follower_id = auth.uid());

-- Ensure RLS is enabled on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;