import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useSubscriptionSync() {
  const { session, checkSubscription } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar subscription ao carregar a página
    if (session?.user) {
      checkSubscription();
    }
  }, [session?.user]);

  useEffect(() => {
    // Executar sync periódico (uma vez por dia)
    const syncInterval = setInterval(async () => {
      if (!session?.user) return;

      try {
        const { data, error } = await supabase.functions.invoke('sync-subscription-status', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error syncing subscription:', error);
          return;
        }

        console.log('Subscription sync completed:', data);
        
        // Recarregar subscription status após sync
        if (data?.downgraded > 0 || data?.updated > 0) {
          setTimeout(() => {
            checkSubscription();
          }, 2000);
        }
      } catch (error) {
        console.error('Error in subscription sync:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 horas

    return () => clearInterval(syncInterval);
  }, [session]);

  // Função manual para forçar sync
  const forceSyncSubscription = async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You need to be signed in to sync subscription.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('sync-subscription-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to sync subscription status.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sync Completed",
        description: `Processed ${data.processed} users. Updated: ${data.updated}, Downgraded: ${data.downgraded}`,
      });

      // Recarregar subscription status
      setTimeout(() => {
        checkSubscription();
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong during sync.",
        variant: "destructive",
      });
    }
  };

  return { forceSyncSubscription };
}