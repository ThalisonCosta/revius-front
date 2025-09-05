import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/ui/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Calendar, 
  AlertTriangle, 
  ThumbsUp,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShareModal } from '@/components/ShareModal';

interface Review {
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
  user?: {
    username: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

const PublicReview = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReview();
    }
  }, [id]);

  const fetchReview = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(username, avatar_url, is_verified)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching review:', error);
        toast({
          title: "Erro",
          description: "Review não encontrada.",
          variant: "destructive",
        });
        return;
      }

      setReview(data);
    } catch (error) {
      console.error('Error loading review:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar review.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  if (loading) {
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

  if (!review) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Review não encontrada</h1>
            <p className="text-muted-foreground mb-6">
              Esta review pode ter sido removida ou não existe.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShareModalOpen(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          <Card className="border-border shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={review.user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {review.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {review.user?.username || 'Usuário Anônimo'}
                      </h3>
                      {review.user?.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 font-medium">
                          {review.rating}/5
                        </span>
                      </div>
                      
                      {review.created_at && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {review.contains_spoilers && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Spoilers
                    </Badge>
                  )}
                  
                  {review.helpful_votes && review.helpful_votes > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {review.helpful_votes}
                    </Badge>
                  )}
                </div>
              </div>

              {review.media_name && (
                <CardTitle className="text-xl mt-4">
                  Review de "{review.media_name}"
                </CardTitle>
              )}
            </CardHeader>

            {review.review_text && (
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {review.review_text.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        type="review"
        data={{
          id: review.id,
          title: review.media_name || 'Review',
          username: review.user?.username
        }}
      />
    </div>
  );
};

export default PublicReview;