import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserMinus, UserPlus } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string | null;
}

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followers: Array<{
    id: string;
    follower?: User;
    following?: User;
  }>;
  following: Array<{
    id: string;
    follower?: User;
    following?: User;
  }>;
  onRemoveFollower: (followerId: string) => void;
  onFollowBack: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  type: 'followers' | 'following';
}

export const FollowersModal = ({ 
  open, 
  onOpenChange, 
  followers, 
  following,
  onRemoveFollower, 
  onFollowBack,
  onUnfollow,
  isFollowing,
  type 
}: FollowersModalProps) => {
  const users = type === 'followers' 
    ? followers.map(f => f.follower).filter(Boolean) as User[]
    : following.map(f => f.following).filter(Boolean) as User[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    {user.email && (
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {type === 'followers' ? (
                    <>
                      {!isFollowing(user.id) && (
                        <Button
                          size="sm"
                          onClick={() => onFollowBack(user.id)}
                          className="shadow-primary"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Follow Back
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveFollower(user.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUnfollow(user.id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unfollow
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};