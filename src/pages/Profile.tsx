import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ListCard } from '@/components/ListCard';
import { ReviewCard } from '@/components/ReviewCard';
import { EditListModal } from '@/components/EditListModal';
import { EditReviewModal } from '@/components/EditReviewModal';
import { FollowersModal } from '@/components/FollowersModal';
import { ListDetailsModal } from '@/components/ListDetailsModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import UpgradeButton from '@/components/UpgradeButton';
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton';
import GoogleAds from '@/components/GoogleAds';
import { 
  User, 
  Settings, 
  Shield, 
  Crown, 
  List, 
  Star, 
  TrendingUp,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Plus,
  Users,
  UserPlus,
  Trash2,
  Bell,
  Eye,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLists } from '@/hooks/useUserLists';
import { useUserReviews } from '@/hooks/useUserReviews';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useSystemLists } from '@/hooks/useSystemLists';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  bio: string | null;
  location: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise' | null;
  is_verified: boolean | null;
  created_at: string | null;
}

interface UserStats {
  lists_count: number;
  reviews_count: number;
  followers_count: number;
  following_count: number;
}

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const { lists, loading: listsLoading, createList, updateList, deleteList } = useUserLists();
  const { reviews, loading: reviewsLoading, updateReview, deleteReview } = useUserReviews();
  const { followers, following, loading: followsLoading, followUser, unfollowUser, removeFollower, isFollowing } = useUserFollows();
  useSystemLists(); // Initialize system lists (now optimized)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    lists_count: 0,
    reviews_count: 0,
    followers_count: 0,
    following_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    location: ''
  });
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListForm, setNewListForm] = useState({
    name: '',
    description: '',
    is_public: true
  });
  const [editListModal, setEditListModal] = useState<{ open: boolean; list: any }>({ open: false, list: null });
  const [editReviewModal, setEditReviewModal] = useState<{ open: boolean; review: any }>({ open: false, review: null });
  const [followersModal, setFollowersModal] = useState<{ open: boolean; type: 'followers' | 'following' }>({ open: false, type: 'followers' });
  const [listDetailsModal, setListDetailsModal] = useState<{ open: boolean; list: any }>({ open: false, list: null });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ 
    open: boolean; 
    type: 'list' | 'review'; 
    id: string; 
    title: string;
  }>({ open: false, type: 'list', id: '', title: '' });
  const [settings, setSettings] = useState({
    email_notifications: true,
    profile_visibility: 'public',
    show_activity: true
  });

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setCurrentUserId(null);
      setLoading(false);
      return;
    }

    // Only fetch if user has changed
    if (user.id !== currentUserId) {
      setCurrentUserId(user.id);
      
      const loadUserData = async () => {
        setLoading(true);
        try {
          await Promise.all([fetchProfile(), fetchStats()]);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadUserData();
    }
  }, [user?.id, currentUserId]); // Controlled dependencies

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
    setFormData({
      username: data.username || '',
      bio: data.bio || '',
      location: data.location || ''
    });
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const [listsRes, reviewsRes, followersRes, followingRes] = await Promise.all([
        supabase.from('user_lists').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('reviews').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_follows').select('id', { count: 'exact' }).eq('following_id', user.id),
        supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', user.id)
      ]);

      setStats({
        lists_count: listsRes.count || 0,
        reviews_count: reviewsRes.count || 0,
        followers_count: followersRes.count || 0,
        following_count: followingRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    // Loading state is managed by the main useEffect now
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      await fetchProfile();
      setEditing(false);
    } catch (error) {
      // Error handled in AuthContext
    }
  };

  const handleCreateList = async () => {
    try {
      await createList(newListForm);
      setNewListOpen(false);
      setNewListForm({ name: '', description: '', is_public: true });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEditList = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      setEditListModal({ open: true, list });
    }
  };

  const handleDeleteList = async (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      setDeleteConfirmModal({
        open: true,
        type: 'list',
        id: listId,
        title: list.name
      });
    }
  };

  const handleEditReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setEditReviewModal({ open: true, review });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setDeleteConfirmModal({
        open: true,
        type: 'review',
        id: reviewId,
        title: review.media?.title || 'this review'
      });
    }
  };

  const handleViewList = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      setListDetailsModal({ open: true, list });
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmModal.type === 'list') {
      await deleteList(deleteConfirmModal.id);
    } else {
      await deleteReview(deleteConfirmModal.id);
    }
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
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profile.username.charAt(0).toUpperCase()}
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
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </div>
                  )}
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

                <Button
                  onClick={() => setEditing(!editing)}
                  variant="outline"
                  className="mt-4"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editing ? 'Cancel' : 'Edit Profile'}
                </Button>
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
                    <div className="text-sm text-muted-foreground">Lists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.reviews_count}</div>
                    <div className="text-sm text-muted-foreground">Reviews</div>
                  </div>
                  <button 
                    className="text-center hover:bg-muted/50 rounded p-2 transition-colors"
                    onClick={() => setFollowersModal({ open: true, type: 'followers' })}
                  >
                    <div className="text-2xl font-bold text-primary">{stats.followers_count}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </button>
                  <button 
                    className="text-center hover:bg-muted/50 rounded p-2 transition-colors"
                    onClick={() => setFollowersModal({ open: true, type: 'following' })}
                  >
                    <div className="text-2xl font-bold text-primary">{stats.following_count}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="lists">Lists</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                {editing ? (
                  <Card className="border-border shadow-card">
                    <CardHeader>
                      <CardTitle>Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself..."
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="Where are you from?"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSave} className="shadow-primary">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border shadow-card">
                    <CardHeader>
                      <CardTitle>Subscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Plan</p>
                          <p className="text-sm text-muted-foreground">
                            You are currently on the {profile.subscription_tier || 'free'} plan
                          </p>
                        </div>
                         {(profile.subscription_tier === 'free' || !profile.subscription_tier) && (
                          <UpgradeButton />
                        )}
                        {profile.subscription_tier !== 'free' && profile.subscription_tier && (
                          <ManageSubscriptionButton />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="lists" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Lists</h3>
                  <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create List
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New List</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="listName">Name</Label>
                          <Input
                            id="listName"
                            value={newListForm.name}
                            onChange={(e) => setNewListForm({ ...newListForm, name: e.target.value })}
                            placeholder="My awesome list..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="listDescription">Description (optional)</Label>
                          <Textarea
                            id="listDescription"
                            value={newListForm.description}
                            onChange={(e) => setNewListForm({ ...newListForm, description: e.target.value })}
                            placeholder="Tell us about this list..."
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="listPublic"
                            checked={newListForm.is_public}
                            onCheckedChange={(checked) => setNewListForm({ ...newListForm, is_public: checked })}
                          />
                          <Label htmlFor="listPublic">Make this list public</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleCreateList} 
                            disabled={!newListForm.name.trim()}
                            className="shadow-primary"
                          >
                            Create List
                          </Button>
                          <Button variant="outline" onClick={() => setNewListOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {listsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-muted rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : lists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {lists.map((list) => (
                       <ListCard
                         key={list.id}
                         id={list.id}
                         name={list.name}
                         description={list.description}
                         is_public={list.is_public}
                         items_count={list.items_count || 0}
                         created_at={list.created_at}
                         onEdit={handleEditList}
                         onDelete={handleDeleteList}
                         onClick={() => handleViewList(list.id)}
                       />
                     ))}
                  </div>
                ) : (
                  <Card className="border-border shadow-card">
                    <CardContent className="text-center py-8">
                      <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't created any lists yet.</p>
                      <Button 
                        onClick={() => setNewListOpen(true)}
                        className="mt-4 shadow-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First List
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Reviews</h3>
                </div>

                {reviewsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-muted rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        id={review.id}
                        rating={review.rating}
                        review_text={review.review_text}
                        contains_spoilers={review.contains_spoilers}
                        created_at={review.created_at}
                        helpful_votes={review.helpful_votes}
                        media={review.media}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-border shadow-card">
                    <CardContent className="text-center py-8">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't written any reviews yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start exploring movies, shows, and anime to leave your first review!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">
                            Receive email updates about your account activity
                          </p>
                        </div>
                        <Switch
                          checked={settings.email_notifications}
                          onCheckedChange={(checked) => 
                            setSettings({ ...settings, email_notifications: checked })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Privacy
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Profile Visibility</p>
                            <p className="text-sm text-muted-foreground">
                              Control who can see your profile
                            </p>
                          </div>
                          <select 
                            value={settings.profile_visibility}
                            onChange={(e) => setSettings({ ...settings, profile_visibility: e.target.value })}
                            className="border border-border rounded px-3 py-2 bg-background"
                          >
                            <option value="public">Public</option>
                            <option value="followers">Followers Only</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Show Activity</p>
                            <p className="text-sm text-muted-foreground">
                              Show your recent activity to others
                            </p>
                          </div>
                          <Switch
                            checked={settings.show_activity}
                            onCheckedChange={(checked) => 
                              setSettings({ ...settings, show_activity: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Danger Zone
                      </h4>
                      <div className="border border-destructive rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete your account and all data
                            </p>
                          </div>
                          <Button variant="destructive">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Modals */}
        <EditListModal
          open={editListModal.open}
          onOpenChange={(open) => setEditListModal({ open, list: null })}
          list={editListModal.list}
          onSave={updateList}
        />

        <EditReviewModal
          open={editReviewModal.open}
          onOpenChange={(open) => setEditReviewModal({ open, review: null })}
          review={editReviewModal.review}
          onSave={updateReview}
        />

        <FollowersModal
          open={followersModal.open}
          onOpenChange={(open) => setFollowersModal({ open, type: 'followers' })}
          followers={followers}
          following={following}
          onRemoveFollower={removeFollower}
          onFollowBack={followUser}
          onUnfollow={unfollowUser}
          isFollowing={isFollowing}
          type={followersModal.type}
        />

        <ListDetailsModal
          open={listDetailsModal.open}
          onOpenChange={(open) => setListDetailsModal({ open, list: null })}
          list={listDetailsModal.list}
        />

        <ConfirmDeleteModal
          open={deleteConfirmModal.open}
          onOpenChange={(open) => setDeleteConfirmModal({ ...deleteConfirmModal, open })}
          onConfirm={confirmDelete}
          title={`Delete ${deleteConfirmModal.type === 'list' ? 'List' : 'Review'}`}
          description={`Are you sure you want to delete "${deleteConfirmModal.title}"? This action cannot be undone.`}
        />
      </div>
    </div>
  );
};

export default Profile;