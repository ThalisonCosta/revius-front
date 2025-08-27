import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string | null;
  follower?: {
    id: string;
    username: string;
    email: string | null;
  };
  following?: {
    id: string;
    username: string;
    email: string | null;
  };
}

export function useUserFollows() {
  const [followers, setFollowers] = useState<UserFollow[]>([]);
  const [following, setFollowing] = useState<UserFollow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFollows();
    }
  }, [user]);

  const fetchFollows = async () => {
    if (!user) return;

    try {
      const [followersRes, followingRes] = await Promise.all([
        // Get followers
        supabase
          .from('user_follows')
          .select(`
            *,
            follower:users!user_follows_follower_id_fkey (
              id,
              username,
              email
            )
          `)
          .eq('following_id', user.id),
        // Get following
        supabase
          .from('user_follows')
          .select(`
            *,
            following:users!user_follows_following_id_fkey (
              id,
              username,
              email
            )
          `)
          .eq('follower_id', user.id)
      ]);

      if (followersRes.error) throw followersRes.error;
      if (followingRes.error) throw followingRes.error;

      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);
    } catch (error) {
      console.error('Error fetching follows:', error);
      toast({
        title: "Error",
        description: "Failed to fetch follow data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;

      // Refresh the data
      await fetchFollows();
      
      toast({
        title: "Success",
        description: "User followed successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user.",
        variant: "destructive",
      });
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      // Refresh the data
      await fetchFollows();
      
      toast({
        title: "Success",
        description: "User unfollowed successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user.",
        variant: "destructive",
      });
    }
  };

  const removeFollower = async (followerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', user.id);

      if (error) throw error;

      // Refresh the data
      await fetchFollows();
      
      toast({
        title: "Success",
        description: "Follower removed successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error removing follower:', error);
      toast({
        title: "Error",
        description: "Failed to remove follower.",
        variant: "destructive",
      });
    }
  };

  const isFollowing = (userId: string) => {
    return following.some(follow => follow.following_id === userId);
  };

  return {
    followers,
    following,
    loading,
    followUser,
    unfollowUser,
    removeFollower,
    isFollowing,
    refetch: fetchFollows,
  };
}