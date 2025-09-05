import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Link, 
  Instagram, 
  MessageCircle, 
  Twitter,
  Copy,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { generateSharePreview } from '@/lib/sharePreview';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'review' | 'list' | 'profile';
  data: {
    id: string;
    title?: string;
    username?: string;
    [key: string]: any;
  };
}

export function ShareModal({ open, onOpenChange, type, data }: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const getPublicUrl = () => {
    const baseUrl = window.location.origin;
    switch (type) {
      case 'review':
        return `${baseUrl}/review/${data.id}`;
      case 'list':
        return `${baseUrl}/list/${data.id}`;
      case 'profile':
        return `${baseUrl}/user/${data.username}`;
      default:
        return baseUrl;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const generateAndDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateSharePreview(type, data);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revius-${type}-${data.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Image generated!",
        description: "The share image has been downloaded.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate share image.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToSocial = (platform: string) => {
    const url = getPublicUrl();
    const text = `Check out this ${type} on Revius!`;
    
    let shareUrl = '';
    switch (platform) {
      case 'instagram':
        // Instagram doesn't support direct URL sharing, copy to clipboard instead
        copyToClipboard(url);
        toast({
          title: "Link copied!",
          description: "Paste this link in your Instagram story or bio.",
          variant: "success",
        });
        return;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'review':
        return `Review of "${data.title}"`;
      case 'list':
        return `List: "${data.title}"`;
      case 'profile':
        return `Profile: ${data.username}`;
      default:
        return 'Share';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share {getTypeTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Generate Image Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Generate Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a beautiful preview image for social media
                  </p>
                </div>
              </div>
              <Button 
                onClick={generateAndDownloadImage}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Copy Public Link */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Link className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Public Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Share a direct link that anyone can view
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getPublicUrl()}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(getPublicUrl())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Social Sharing */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Share to Social Media</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocial('instagram')}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="text-xs">Instagram</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocial('whatsapp')}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocial('twitter')}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Twitter className="h-5 w-5" />
                  <span className="text-xs">Twitter</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}