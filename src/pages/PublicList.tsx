import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/ui/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  List as ListIcon, 
  Calendar, 
  ArrowLeft,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShareModal } from '@/components/ShareModal';
import { EnhancedMediaCard } from '@/components/EnhancedMediaCard';

interface ListItem {
  id: string;
  media_id: string;
  media_title?: string;
  media_type?: string;
  media_thumbnail?: string;
  media_synopsis?: string;
  position?: number;
  external_id?: string;
  api_source?: string;
}

interface UserList {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string | null;
  user_id: string;
  user?: {
    username: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
  items?: ListItem[];
}

const PublicList = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [list, setList] = useState<UserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchList();
    }
  }, [id]);

  const fetchList = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from('user_lists')
        .select(`
          *,
          user:users(username, avatar_url, is_verified)
        `)
        .eq('id', id)
        .eq('is_public', true)
        .single();

      if (listError || !listData) {
        console.error('Error fetching list:', listError);
        toast({
          title: "Erro",
          description: "Lista não encontrada ou não é pública.",
          variant: "destructive",
        });
        return;
      }

      // Fetch list items
      const { data: itemsData, error: itemsError } = await supabase
        .from('user_list_items')
        .select('*')
        .eq('list_id', id)
        .order('position', { ascending: true });

      if (itemsError) {
        console.error('Error fetching list items:', itemsError);
      }

      setList({
        ...listData,
        items: itemsData || []
      });
    } catch (error) {
      console.error('Error loading list:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar lista.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  if (!list) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Lista não encontrada</h1>
            <p className="text-muted-foreground mb-6">
              Esta lista pode ter sido removida, tornada privada ou não existe.
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
        <div className="max-w-6xl mx-auto">
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

          <Card className="border-border shadow-card mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={list.user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {list.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm text-muted-foreground">
                        Lista de {list.user?.username || 'Usuário Anônimo'}
                      </h3>
                      {list.user?.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-2xl mt-1">
                      {list.name}
                    </CardTitle>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ListIcon className="h-4 w-4" />
                        {list.items?.length || 0} itens
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {list.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {list.is_public ? 'Pública' : 'Privada'}
                      </div>
                      
                      {list.created_at && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(list.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {list.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-muted-foreground">
                    {list.description}
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* List Items */}
          {list.items && list.items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {list.items.map((item) => (
                <EnhancedMediaCard
                  key={item.id}
                  id={item.media_id}
                  title={item.media_title || 'Título não disponível'}
                  type={(item.media_type as "movie" | "tv" | "novela" | "anime" | "manga" | "game") || 'movie'}
                  poster={item.media_thumbnail}
                  synopsis={item.media_synopsis}
                  externalId={item.external_id || undefined}
                  apiSource={item.api_source || undefined}
                  showEnhancedDetails={!!(item.external_id && item.api_source)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <ListIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Lista vazia</h4>
                <p className="text-sm text-muted-foreground">
                  Esta lista ainda não possui itens.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        type="list"
        data={{
          id: list.id,
          title: list.name,
          username: list.user?.username
        }}
      />
    </div>
  );
};

export default PublicList;