-- Tighten column-level access on public.users to prevent exposure of sensitive data
-- 1) Remove broad SELECT and whitelist only non-sensitive columns for anon/authenticated
REVOKE SELECT ON TABLE public.users FROM anon, authenticated;

GRANT SELECT (id, username, avatar_url, is_verified, bio, location, created_at, updated_at, subscription_tier)
ON TABLE public.users TO anon, authenticated;

-- (Optional) Ensure service_role retains full access
GRANT SELECT ON TABLE public.users TO service_role;

-- Note: Existing RLS policies remain. Public can only read rows when share_settings->>'profile_public' is true.
-- Email and is_admin are no longer readable by anon/authenticated, mitigating the data exposure risk.