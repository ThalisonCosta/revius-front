import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShareModal } from "@/components/ShareModal";
import { List, MoreVertical, Edit, Trash2, Eye, EyeOff, Calendar, Share } from "lucide-react";

interface ListCardProps {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  items_count: number;
  created_at: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

export function ListCard({
  id,
  name,
  description,
  is_public,
  items_count,
  created_at,
  onEdit,
  onDelete,
  onClick,
}: ListCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  return (
    <Card 
      className="border-border shadow-card hover:shadow-primary/10 transition-smooth cursor-pointer" 
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <List className="h-4 w-4 text-primary" />
          {name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={is_public ? "default" : "secondary"} className="text-xs">
            {is_public ? (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Public
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Private
              </>
            )}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShareModalOpen(true)}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
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
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{items_count} items</span>
          {created_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
      
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        type="list"
        data={{
          id,
          title: name,
          description,
          items_count,
        }}
      />
    </Card>
  );
}