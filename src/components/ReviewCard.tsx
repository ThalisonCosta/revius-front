import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Star, MoreVertical, Edit, Trash2, Calendar, AlertTriangle, ThumbsUp, Eye, EyeOff } from "lucide-react";

interface ReviewCardProps {
  id: string;
  rating: number;
  review_text: string | null;
  contains_spoilers: boolean | null;
  created_at: string | null;
  helpful_votes: number | null;
  media_name?: string;
  user?: {
    username: string;
    is_verified?: boolean;
    avatar_url?: string | null;
  };
  showUserInfo?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReviewCard({
  id,
  rating,
  review_text,
  contains_spoilers,
  created_at,
  helpful_votes,
  media_name,
  user,
  showUserInfo = false,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          {showUserInfo && user && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar 
                className="h-8 w-8 cursor-pointer hover:opacity-80"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/user/${user.username}`;
                  window.open(url, '_blank');
                }}
              >
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span 
                  className="font-medium text-sm hover:text-primary cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Extract user ID from context or pass it as prop
                    const url = `/user/${user.username}`;
                    window.open(url, '_blank');
                  }}
                >
                  {user.username}
                </span>
                {user.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{rating}/5</span>
            {contains_spoilers && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Spoilers
              </Badge>
            )}
          </div>
          {media_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground hover:text-primary cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                // Extract media type and id from media_name or use defaults
                const mediaType = 'movie'; // This would need proper detection
                window.open(`/media/${mediaType}/${media_name}`, '_blank');
              }}>
                {media_name}
              </span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {review_text && (
          <div className="mb-3">
            {contains_spoilers && !showSpoiler ? (
              <div className="space-y-3">
                <div className="relative">
                  <p className="text-sm text-muted-foreground leading-relaxed blur-sm select-none">
                    {review_text}
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSpoiler(true)}
                      className="text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Show Spoiler
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review_text}
                </p>
                {contains_spoilers && showSpoiler && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSpoiler(false)}
                    className="text-xs text-muted-foreground"
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide Spoiler
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {helpful_votes !== null && helpful_votes > 0 && (
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {helpful_votes} helpful
              </span>
            )}
          </div>
          {created_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}