import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage, Client, HostUrl, WhatsAppTemplate } from '@/lib/storage';
import { generateCredentials, calculateExpiryDate, fillTemplate, sendWhatsAppMessage } from '@/lib/utils-iptv';
import { useToast } from '@/hooks/use-toast';

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  hostUrls: HostUrl[];
  onSuccess: () => void;
}

const ClientModal = ({ open, onOpenChange, client, hostUrls, onSuccess }: ClientModalProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedHostUrl, setSelectedHostUrl] = useState('');
  const [packageDuration, setPackageDuration] = useState<1 | 3 | 6 | 12>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (client) {
      setWhatsappNumber(client.whatsappNumber);
      setSelectedHostUrl(client.hostUrl);
      setPackageDuration(client.packageDuration);
    } else {
      setWhatsappNumber('');
      setSelectedHostUrl(hostUrls[0]?.url || '');
      setPackageDuration(1);
    }
  }, [client, open, hostUrls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const credentials = client ? { username: client.username, password: client.password } : generateCredentials();
      const now = new Date();
      const expiryDate = calculateExpiryDate(now, packageDuration);

      const newClient: Client = {
        id: client?.id || crypto.randomUUID(),
        username: credentials.username,
        password: credentials.password,
        hostUrl: selectedHostUrl,
        packageDuration,
        createdAt: client?.createdAt || now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'active',
        whatsappNumber,
      };

      const clients = storage.getClients();
      const updatedClients = client
        ? clients.map(c => c.id === client.id ? newClient : c)
        : [...clients, newClient];
      
      storage.saveClients(updatedClients);

      // Send WhatsApp message
      const templates = storage.getTemplates();
      const template = templates.find(t => t.type === (client ? 'renewal' : 'welcome'));
      if (template) {
        const message = fillTemplate(template.message, newClient);
        await sendWhatsAppMessage(whatsappNumber, message);
      }

      toast({
        title: client ? 'Client renewed successfully' : 'Client created successfully',
        description: 'WhatsApp notification sent',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save client',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? 'Renew Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Extend the subscription period' : 'Create a new IPTV client account'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="+1234567890"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostUrl">Host URL</Label>
            <Select value={selectedHostUrl} onValueChange={setSelectedHostUrl} required>
              <SelectTrigger>
                <SelectValue placeholder="Select host URL" />
              </SelectTrigger>
              <SelectContent>
                {hostUrls.map((host) => (
                  <SelectItem key={host.id} value={host.url}>
                    {host.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="package">Package Duration</Label>
            <Select value={String(packageDuration)} onValueChange={(v) => setPackageDuration(Number(v) as 1 | 3 | 6 | 12)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : client ? 'Renew' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientModal;