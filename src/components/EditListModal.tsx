import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface EditListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean | null;
  } | null;
  onSave: (listId: string, updates: { name: string; description?: string; is_public: boolean }) => Promise<any>;
}

export const EditListModal = ({ open, onOpenChange, list, onSave }: EditListModalProps) => {
  const [formData, setFormData] = useState({
    name: list?.name || '',
    description: list?.description || '',
    is_public: list?.is_public ?? true
  });

  const handleSave = async () => {
    if (!list) return;
    
    await onSave(list.id, formData);
    onOpenChange(false);
  };

  // Reset form when list changes
  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name,
        description: list.description || '',
        is_public: list.is_public ?? true
      });
    }
  }, [list]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editListName">Name</Label>
            <Input
              id="editListName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="List name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editListDescription">Description (optional)</Label>
            <Textarea
              id="editListDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about this list..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="editListPublic"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
            <Label htmlFor="editListPublic">Make this list public</Label>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim()}
              className="shadow-primary"
            >
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};