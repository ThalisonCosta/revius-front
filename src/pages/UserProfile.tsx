import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/ui/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListCard } from '@/components/ListCard';
import { ReviewCard } from '@/components/ReviewCard';
import { 
  User, 
  Shield, 
  Crown, 
  List, 
  Star, 
  TrendingUp,
  Mail,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'premium' | 'enterprise';
  is_verified: boolean | null;
  created_at: string | null;
}

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
  media_name?: string;
}

interface UserList {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  items_count: number;
  created_at: string | null;
}

interface UserStats {
  lists_count: number;
  reviews_count: number;
  followers_count: number;
  following_count: number;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [lists, setLists] = useState<UserList[]>([]);
  const [stats, setStats] = useState<UserStats>({
    lists_count: 0,
    reviews_count: 0,
    followers_count: 0,
    following_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchReviews(),
        fetchPublicLists(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, is_verified, bio, location, created_at, updated_at, subscription_tier')
      .eq('id', userId)
      .single();

    if (error) throw error;
    setProfile({
      ...data,
      avatar_url: (data as any).avatar_url || null
    });
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setReviews(data || []);
  };

  const fetchPublicLists = async () => {
    const { data, error } = await supabase
      .from('user_lists')
      .select(`
        *,
        items_count:user_list_items(count)
      `)
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const processedLists = (data || []).map(list => ({
      ...list,
      items_count: list.items_count?.[0]?.count || 0
    }));
    
    setLists(processedLists);
  };

  const fetchStats = async () => {
    const [listsRes, reviewsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('user_lists').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_public', true),
      supabase.from('reviews').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('user_follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', userId)
    ]);

    setStats({
      lists_count: listsRes.count || 0,
      reviews_count: reviewsRes.count || 0,
      followers_count: followersRes.count || 0,
      following_count: followingRes.count || 0
    });
  };

  const getTierIcon = (tier: string | null) => {
    switch (tier) {
      case 'pro':
        return <Crown className="h-4 w-4" />;
      case 'enterprise':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'pro':
        return 'bg-accent text-accent-foreground';
      case 'enterprise':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleMediaClick = (mediaId: string) => {
    // Determine media type from URL patterns or use 'movie' as default
    const mediaType = 'movie'; // This would need to be determined from the media data
    const url = `/media/${mediaType}/${mediaId}`;
    window.open(url, '_blank');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-border shadow-card">
              <CardHeader className="text-center">
                <div className="relative inline-block">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                    <AvatarFallback className="text-lg">
                      {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {profile.is_verified && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                      <Shield className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <CardTitle className="flex items-center justify-center gap-2">
                  {profile.username}
                  <Badge className={getTierColor(profile.subscription_tier)}>
                    {getTierIcon(profile.subscription_tier)}
                    {profile.subscription_tier || 'free'}
                  </Badge>
                </CardTitle>
                
                {profile.bio && (
                  <p className="text-muted-foreground mt-2">{profile.bio}</p>
                )}
                
                <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Stats Card */}
            <Card className="border-border shadow-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.lists_count}</div>
                    <div className="text-sm text-muted-foreground">Public Lists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.reviews_count}</div>
                    <div className="text-sm text-muted-foreground">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.followers_count}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.following_count}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="lists" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lists">Public Lists</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="lists" className="space-y-6">
                {lists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lists.map((list) => (
                      <ListCard
                        key={list.id}
                        id={list.id}
                        name={list.name}
                        description={list.description}
                        is_public={list.is_public}
                        items_count={list.items_count}
                        created_at={list.created_at}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed border-border">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <List className="h-12 w-12 text-muted-foreground mb-4" />
                      <h4 className="font-medium mb-2">No public lists</h4>
                      <p className="text-sm text-muted-foreground">
                        This user hasn't created any public lists yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="cursor-pointer" onClick={() => handleMediaClick(review.media_id)}>
                        <ReviewCard
                          id={review.id}
                          rating={review.rating}
                          review_text={review.review_text}
                          contains_spoilers={review.contains_spoilers}
                          created_at={review.created_at}
                          helpful_votes={review.helpful_votes}
                          media_name={review.media_name}
                          onEdit={() => {}}
                          onDelete={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed border-border">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Star className="h-12 w-12 text-muted-foreground mb-4" />
                      <h4 className="font-medium mb-2">No reviews</h4>
                      <p className="text-sm text-muted-foreground">
                        This user hasn't written any reviews yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;