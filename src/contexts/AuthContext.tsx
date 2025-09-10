import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePersistedAuth } from '@/hooks/usePersistedAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { username?: string; bio?: string; location?: string }) => Promise<void>;
  checkSubscription: () => Promise<void>;
  subscriptionLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: persistedUser, loading: persistedLoading } = usePersistedAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const { toast } = useToast();

  // Use the persisted auth state
  const user = persistedUser;
  const loading = persistedLoading;

  useEffect(() => {
    // Get current session when user changes
    if (user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    } else {
      setSession(null);
    }
  }, [user]);

  useEffect(() => {
    // Listen for auth changes - mainly for session updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      // Check subscription status after sign in
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => {
          checkSubscription();
        }, 1000);
      }
      
      // Also check on token refresh to catch subscription changes
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        checkSubscription();
      }
    });

    return () => subscription.unsubscribe();
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Success",
      description: "Please check your email to confirm your account.",
    });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
      variant: "success",
    });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Password reset sent",
      description: "Check your email for password reset instructions.",
    });
  };

  const updateProfile = async (updates: { username?: string; bio?: string; location?: string }) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const checkSubscription = async () => {
    if (!session) return;
    
    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      // The subscription status is updated in the database by the edge function
      // The user object will be refreshed automatically
      console.log('Subscription check result:', data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    checkSubscription,
    subscriptionLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}