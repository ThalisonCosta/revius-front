import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MediaReview {
  id: string;
  rating: number;
  review_text: string | null;
  contains_spoilers: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  media_id: string;
  user_id: string;
  helpful_votes: number | null;
  is_verified: boolean | null;
  user: {
    username: string;
    is_verified: boolean | null;
  };
}

export function useMediaReviews(mediaId: string) {
  const [reviews, setReviews] = useState<MediaReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (mediaId) {
      fetchReviews();
    }
  }, [mediaId]);

  const fetchReviews = async () => {
    if (!mediaId) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users (
            username,
            is_verified
          )
        `)
        .eq('media_name', mediaId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching media reviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    reviews,
    loading,
    refetch: fetchReviews,
  };
}