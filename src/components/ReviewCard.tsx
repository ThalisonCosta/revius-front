import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Star, MoreVertical, Edit, Trash2, Calendar, AlertTriangle, ThumbsUp } from "lucide-react";

interface ReviewCardProps {
  id: string;
  rating: number;
  review_text: string | null;
  contains_spoilers: boolean | null;
  created_at: string | null;
  helpful_votes: number | null;
  media?: {
    title: string;
    type: string;
    thumbnail: string | null;
    year: number | null;
  };
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
  media,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
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
          {media && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{media.title}</span>
              <Badge variant="outline" className="text-xs">
                {media.type}
              </Badge>
              {media.year && <span>({media.year})</span>}
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
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {review_text}
          </p>
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