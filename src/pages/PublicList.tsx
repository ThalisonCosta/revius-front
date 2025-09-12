import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/ui/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  List as ListIcon, 
  Calendar, 
  ArrowLeft,
  Share2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ShareModal } from '@/components/ShareModal';
import { EnhancedMediaCard } from '@/components/EnhancedMediaCard';
import { ManualMediaSearchModal } from '@/components/ManualMediaSearchModal';

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
  const { user } = useAuth();
  const [list, setList] = useState<UserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [currentCorrectionItem, setCurrentCorrectionItem] = useState<{
    title: string;
    year?: number;
    listId: string;
    itemId: string;
  } | null>(null);

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

  const handleCorrectionRequest = (title: string, year?: number, listId?: string, itemId?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to edit items",
        variant: "destructive",
      });
      return;
    }

    if (!listId || !itemId || !list) {
      return;
    }

    // Check if user owns this list
    if (list.user_id !== user.id) {
      toast({
        title: "Permission Denied",
        description: "You can only edit your own lists",
        variant: "destructive",
      });
      return;
    }

    setCurrentCorrectionItem({
      title,
      year,
      listId,
      itemId
    });
    setCorrectionModalOpen(true);
  };

  const handleCorrectionSuccess = () => {
    // Refresh the list to show updated data
    fetchList();
    setCorrectionModalOpen(false);
    setCurrentCorrectionItem(null);
  };

  const handleCorrectionSkip = () => {
    setCorrectionModalOpen(false);
    setCurrentCorrectionItem(null);
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

          {/* Import Statistics Alert */}
          {list.items && list.items.length > 0 && user && list.user_id === user.id && (
            (() => {
              const manualItems = list.items.filter(item => !item.external_id || item.api_source === 'manual');
              const matchedItems = list.items.length - manualItems.length;
              const matchPercentage = Math.round((matchedItems / list.items.length) * 100);
              
              if (manualItems.length > 0) {
                return (
                  <Alert className="mb-6 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <strong>{manualItems.length} items</strong> from this imported list need manual review. 
                        <span className="text-muted-foreground ml-1">
                          ({matchedItems}/{list.items.length} matched automatically - {matchPercentage}%)
                        </span>
                      </div>
                      <Badge variant="outline" className="ml-2 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        Review Needed
                      </Badge>
                    </AlertDescription>
                  </Alert>
                );
              } else {
                return (
                  <Alert className="mb-6 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        All <strong>{list.items.length} items</strong> were successfully matched with external APIs.
                      </div>
                      <Badge variant="outline" className="ml-2 text-green-600 dark:text-green-400 border-green-500/30">
                        Complete
                      </Badge>
                    </AlertDescription>
                  </Alert>
                );
              }
            })()
          )}

          {/* List Items */}
          {list.items && list.items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {list.items.map((item) => {
                const isManualEntry = !item.external_id || item.api_source === 'manual';
                const isUserOwnedList = user && list.user_id === user.id;
                
                return (
                  <EnhancedMediaCard
                    key={item.id}
                    id={item.media_id}
                    title={item.media_title || 'Título não disponível'}
                    type={(item.media_type as "movie" | "tv" | "novela" | "anime" | "manga" | "game") || 'movie'}
                    poster={item.media_thumbnail}
                    synopsis={item.media_synopsis}
                    externalId={item.external_id || undefined}
                    apiSource={item.api_source || undefined}
                    showEnhancedDetails={!!(item.external_id && item.api_source && item.api_source !== 'manual')}
                    isManualEntry={isManualEntry}
                    listId={id}
                    itemId={item.id}
                    onCorrectionRequest={isUserOwnedList ? handleCorrectionRequest : undefined}
                  />
                );
              })}
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

      {/* Manual Media Search Modal */}
      {currentCorrectionItem && (
        <ManualMediaSearchModal
          open={correctionModalOpen}
          onOpenChange={setCorrectionModalOpen}
          onSelect={handleCorrectionSuccess}
          onSkip={handleCorrectionSkip}
          originalTitle={currentCorrectionItem.title}
          originalYear={currentCorrectionItem.year}
          listId={currentCorrectionItem.listId}
          itemId={currentCorrectionItem.itemId}
        />
      )}
    </div>
  );
};

export default PublicList;