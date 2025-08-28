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
    avatar_url: string | null;
  };
}

export function useMediaReviews(mediaId: string, mediaTitle?: string) {
  const [reviews, setReviews] = useState<MediaReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (mediaId) {
      fetchReviews();
    }
  }, [mediaId, mediaTitle]);

  const fetchReviews = async () => {
    if (!mediaId) return;

    try {
      console.log('Fetching reviews for mediaId:', mediaId);
      
      // Fetch reviews by media_id
      const { data: reviewsByMediaId, error: mediaIdError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users (
            username,
            is_verified,
            avatar_url
          )
        `)
        .eq('media_id', mediaId)
        .order('created_at', { ascending: false });

      console.log('Reviews query result:', { data: reviewsByMediaId, error: mediaIdError });

      if (mediaIdError) throw mediaIdError;

      // Type the response properly
      const typedReviews = (reviewsByMediaId || []) as any[];
      const processedReviews = typedReviews.map(review => ({
        ...review,
        user: review.user || {
          username: 'Unknown User',
          is_verified: false,
          avatar_url: null
        }
      }));

      console.log('Processed reviews:', processedReviews);
      setReviews(processedReviews);
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