import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { storage, HostUrl } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface HostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  host: HostUrl | null;
  onSuccess: () => void;
}

const HostModal = ({ open, onOpenChange, host, onSuccess }: HostModalProps) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (host) {
      setName(host.name);
      setUrl(host.url);
      setIsActive(host.isActive);
    } else {
      setName('');
      setUrl('');
      setIsActive(true);
    }
  }, [host, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newHost: HostUrl = {
      id: host?.id || crypto.randomUUID(),
      name,
      url,
      isActive,
    };

    try {
      if (host) {
        await storage.updateHostUrl(newHost);
      } else {
        await storage.createHostUrl(newHost);
      }

      toast({
        title: host ? 'Host URL updated' : 'Host URL added',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save host URL',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{host ? 'Edit Host URL' : 'Add Host URL'}</DialogTitle>
          <DialogDescription>
            Configure an IPTV server URL
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Primary Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/iptv"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {host ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HostModal;