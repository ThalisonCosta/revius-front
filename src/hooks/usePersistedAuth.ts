import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to handle authentication state persistence after page refresh
 * Fixes the bug where authentication state is lost on page reload
 */
export function usePersistedAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First, try to get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          
          // Verify the user still exists in our users table
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // User doesn't exist in our database, create profile
            await supabase.from('users').insert({
              id: session.user.id,
              email: session.user.email,
              username: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'user',
              updated_at: new Date().toISOString(),
              share_settings: {},
            });
          }
        } else if (mounted) {
          setUser(null);
        }

        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Only initialize if not already done
    if (!initialized) {
      initializeAuth();
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, !!session?.user);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
        
        if (initialized) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  return {
    user,
    loading,
    initialized,
  };
}