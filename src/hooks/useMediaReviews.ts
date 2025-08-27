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
      // First, try to fetch by media_id
      const { data: reviewsByMediaId, error: mediaIdError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users (
            username,
            is_verified
          )
        `)
        .eq('media_id', mediaId)
        .order('created_at', { ascending: false });

      if (mediaIdError) throw mediaIdError;

      // If we have reviews by media_id, use them
      if (reviewsByMediaId && reviewsByMediaId.length > 0) {
        setReviews(reviewsByMediaId);
        return;
      }

      // If no reviews by media_id and we have a media title, try searching by media_name
      if (mediaTitle) {
        const { data: reviewsByMediaName, error: mediaNameError } = await supabase
          .from('reviews')
          .select(`
            *,
            user:users (
              username,
              is_verified
            )
          `)
          .eq('media_name', mediaTitle)
          .order('created_at', { ascending: false });

        if (mediaNameError) throw mediaNameError;

        setReviews(reviewsByMediaName || []);
      } else {
        // No media title provided, set empty reviews
        setReviews([]);
      }
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