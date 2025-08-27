import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserReview {
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
  media?: {
    title: string;
    type: string;
    thumbnail: string | null;
    year: number | null;
  };
}

interface CreateReviewData {
  media_id: string;
  rating: number;
  review_text?: string;
  contains_spoilers?: boolean;
}

export function useUserReviews() {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          media:media_id (
            title,
            type,
            thumbnail,
            year
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your reviews.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData: CreateReviewData) => {
    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Creating review with data:', reviewData);
    console.log('User:', user.id);

    try {
      const reviewPayload = {
        ...reviewData,
        user_id: user.id,
        id: crypto.randomUUID(),
      };
      
      console.log('Review payload:', reviewPayload);

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewPayload)
        .select(`
          *,
          media:media_id (
            title,
            type,
            thumbnail,
            year
          )
        `)
        .single();

      console.log('Supabase response:', { data, error });

      if (error) throw error;

      setReviews(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Review created successfully!",
        variant: "success",
      });

      return data;
    } catch (error) {
      console.error('Error creating review:', error);
      toast({
        title: "Error",
        description: "Failed to create review.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateReview = async (reviewId: string, updates: Partial<CreateReviewData>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .select(`
          *,
          media:media_id (
            title,
            type,
            thumbnail,
            year
          )
        `)
        .single();

      if (error) throw error;

      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId 
            ? data
            : review
        )
      );

      toast({
        title: "Success",
        description: "Review updated successfully!",
        variant: "success",
      });

      return data;
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: "Error",
        description: "Failed to update review.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      setReviews(prev => prev.filter(review => review.id !== reviewId));

      toast({
        title: "Success",
        description: "Review deleted successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    reviews,
    loading,
    createReview,
    updateReview,
    deleteReview,
    refetch: fetchReviews,
  };
}