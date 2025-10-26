import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { storage, Client, HostUrl } from '@/lib/storage';
import { generateCredentials, calculateExpiryDate, getClientStatus, formatDate } from '@/lib/utils-iptv';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Trash2, RefreshCw, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ClientModal from '@/components/ClientModal';

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [hostUrls, setHostUrls] = useState<HostUrl[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClients(storage.getClients());
    setHostUrls(storage.getHostUrls());
  };

  const handleDelete = (id: string) => {
    const updatedClients = clients.filter(c => c.id !== id);
    storage.saveClients(updatedClients);
    setClients(updatedClients);
    toast({ title: 'Client deleted successfully' });
  };

  const handleRenew = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.whatsappNumber.includes(searchQuery)
  );

  const getStatusBadge = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      active: 'default',
      'expiring-soon': 'secondary',
      expired: 'destructive',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your IPTV clients</p>
        </div>
        <Button onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by username or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No clients found. Add your first client to get started.
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const status = getClientStatus(client.expiryDate);
            return (
              <Card key={client.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{client.username}</h3>
                        <Badge variant={getStatusBadge(status)}>
                          {status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Password:</span>
                          <span className="ml-2 font-mono">{client.password}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">WhatsApp:</span>
                          <span className="ml-2">{client.whatsappNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Host URL:</span>
                          <span className="ml-2 truncate">{client.hostUrl}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Package:</span>
                          <span className="ml-2">{client.packageDuration} month(s)</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="ml-2">{formatDate(client.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <span className="ml-2">{formatDate(client.expiryDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRenew(client)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Renew
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ClientModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        client={selectedClient}
        hostUrls={hostUrls}
        onSuccess={loadData}
      />
    </div>
  );
};

export default Clients;