import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShareModal } from '@/components/ShareModal';
import { Calendar, Trash2, GripVertical, Share } from 'lucide-react';
import { useListItems } from '@/hooks/useListItems';

interface ListDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean | null;
    items_count?: number;
  } | null;
  onRemoveItem?: (itemId: string) => void;
}

export const ListDetailsModal = ({ 
  open, 
  onOpenChange, 
  list, 
  onRemoveItem 
}: ListDetailsModalProps) => {
  const { items, loading, removeItem } = useListItems(list?.id || '');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleRemoveItem = async (itemId: string) => {
    await removeItem(itemId);
    onRemoveItem?.(itemId);
  };

  const getMediaTypeColor = (type: string) => {
    switch (type) {
      case 'movie':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'tv':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'anime':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!list) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>{list.name}</DialogTitle>
              <Badge variant="secondary">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShareModalOpen(true)}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          {list.description && (
            <p className="text-muted-foreground">{list.description}</p>
          )}
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="cursor-grab text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      
                      {item.media_thumbnail ? (
                        <img
                          src={item.media_thumbnail}
                          alt={item.media_title}
                          className="w-16 h-24 object-cover rounded-md bg-muted"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-muted rounded-md flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No Image</span>
                        </div>
                      )}

                       <div className="flex-1 space-y-2">
                         <div className="flex items-start justify-between">
                           <h4 
                             className="font-medium line-clamp-2 cursor-pointer hover:text-primary"
                             onClick={() => {
                               const mediaType = item.media_type as "movie" | "tv" | "anime";
                               const url = `/media/${mediaType}/${item.media_id}?title=${encodeURIComponent(item.media_title)}&year=${item.media_year || ''}`;
                               window.open(url, '_blank');
                             }}
                           >
                             {item.media_title}
                           </h4>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleRemoveItem(item.id)}
                             className="text-destructive hover:text-destructive"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge 
                            variant="outline" 
                            className={getMediaTypeColor(item.media_type)}
                          >
                            {item.media_type?.toUpperCase()}
                          </Badge>
                          
                          {item.media_year && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item.media_year}
                            </div>
                          )}
                        </div>

                        {item.media_synopsis && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.media_synopsis}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <p className="text-lg font-medium">This list is empty</p>
                <p className="text-sm mt-1">
                  Start adding movies, shows, or anime to organize your content
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        type="list"
        data={{
          id: list.id,
          name: list.name,
          description: list.description,
          items,
        }}
      />
    </Dialog>
  );
};