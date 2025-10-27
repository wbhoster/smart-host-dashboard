import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage, Client, HostUrl } from '@/lib/storage';
import { generateCredentials, calculateExpiryDate, fillTemplate, sendWhatsAppMessage } from '@/lib/utils-iptv';
import { useToast } from '@/hooks/use-toast';

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  hostUrls: HostUrl[];
  onSuccess: () => void;
  isEditMode?: boolean;
}

const ClientModal = ({ open, onOpenChange, client, hostUrls, onSuccess, isEditMode = false }: ClientModalProps) => {
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedHostUrl, setSelectedHostUrl] = useState('');
  const [packageDuration, setPackageDuration] = useState<1 | 3 | 6 | 12>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (client) {
      setFullName(client.fullName || '');
      setWhatsappNumber(client.whatsappNumber);
      setSelectedHostUrl(client.hostUrl);
      setPackageDuration(client.packageDuration);
    } else {
      setFullName('');
      setWhatsappNumber('');
      setSelectedHostUrl(hostUrls[0]?.url || '');
      setPackageDuration(1);
    }
  }, [client, open, hostUrls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter client full name',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const credentials = (client && !isEditMode) ? { username: client.username, password: client.password } : 
                         (client && isEditMode) ? { username: client.username, password: client.password } :
                         generateCredentials();
      
      const now = new Date();
      const expiryDate = isEditMode 
        ? new Date(client!.expiryDate) 
        : calculateExpiryDate(client ? new Date(client.expiryDate) : now, packageDuration);

      const newClient: Client = {
        id: client?.id || crypto.randomUUID(),
        fullName: fullName.trim(),
        username: credentials.username,
        password: credentials.password,
        hostUrl: selectedHostUrl,
        packageDuration,
        createdAt: client?.createdAt || now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'active',
        whatsappNumber,
      };

      if (client) {
        await storage.updateClient(newClient);
      } else {
        await storage.createClient(newClient);
      }

      // Send WhatsApp message only for new or renewed clients, not edits
      if (!isEditMode) {
        const templates = await storage.getTemplates();
        const template = templates.find(t => t.type === (client ? 'renewal' : 'welcome'));
        if (template) {
          const message = fillTemplate(template.message, newClient);
          const sent = await sendWhatsAppMessage(whatsappNumber, message);
          
          if (sent) {
            toast({
              title: client ? 'Client renewed successfully' : 'Client created successfully',
              description: 'WhatsApp notification sent',
            });
          } else {
            toast({
              title: client ? 'Client renewed' : 'Client created',
              description: 'WhatsApp notification failed. Check API configuration.',
              variant: 'destructive',
            });
          }
        }
      } else {
        toast({
          title: 'Client updated successfully',
          description: 'Client information has been updated',
        });
      }

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
          <DialogTitle>
            {isEditMode ? 'Edit Client' : client ? 'Renew Client' : 'Add New Client'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update client information' 
              : client 
                ? 'Extend the subscription period' 
                : 'Create a new IPTV client account'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Client Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="447488888888"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter phone number in international format (without +)
            </p>
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

          {!isEditMode && (
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
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : client ? 'Renew' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientModal;
