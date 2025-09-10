import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, AlertCircle, ExternalLink } from 'lucide-react';

interface ImportListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (url: string, platform: string) => Promise<void>;
  isImporting?: boolean;
  importProgress?: number;
  importStatus?: string;
}

export function ImportListModal({
  open,
  onOpenChange,
  onImport,
  isImporting = false,
  importProgress = 0,
  importStatus = ''
}: ImportListModalProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('letterboxd');
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Basic URL validation for Letterboxd
    if (platform === 'letterboxd') {
      const letterboxdPattern = /^https?:\/\/(www\.)?(letterboxd\.com\/.*\/list\/.*|boxd\.it\/.*)/i;
      if (!letterboxdPattern.test(url)) {
        setError('Please enter a valid Letterboxd list URL (e.g., https://letterboxd.com/user/list/list-name or https://boxd.it/xxxxx)');
        return;
      }
    }

    setError('');
    
    try {
      await onImport(url, platform);
      // Reset form on success
      setUrl('');
      setPlatform('letterboxd');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import list');
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setUrl('');
      setPlatform('letterboxd');
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import List
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={platform}
              onValueChange={setPlatform}
              disabled={isImporting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letterboxd">Letterboxd</SelectItem>
                <SelectItem value="imdb" disabled>IMDB (Coming Soon)</SelectItem>
                <SelectItem value="tmdb" disabled>TMDB (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">List URL</Label>
            <Input
              id="url"
              placeholder="https://letterboxd.com/username/list/list-name/ or https://boxd.it/xxxxx"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isImporting}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isImporting && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Import Progress</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
              
              {importStatus && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{importStatus}</p>
                  {importStatus.includes('Processing') && (
                    <p className="text-xs text-muted-foreground">
                      Matching with external APIs (TMDB, OMDB, Jikan)...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <span>Make sure the list is public before importing</span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={isImporting || !url.trim()}
              className="flex-1"
            >
              {isImporting ? 'Importing...' : 'Import List'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}