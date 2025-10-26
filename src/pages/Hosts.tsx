import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { storage, HostUrl } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import HostModal from '@/components/HostModal';

const Hosts = () => {
  const [hosts, setHosts] = useState<HostUrl[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState<HostUrl | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHosts();
  }, []);

  const loadHosts = () => {
    setHosts(storage.getHostUrls());
  };

  const handleDelete = (id: string) => {
    const updatedHosts = hosts.filter(h => h.id !== id);
    storage.saveHostUrls(updatedHosts);
    setHosts(updatedHosts);
    toast({ title: 'Host URL deleted successfully' });
  };

  const handleEdit = (host: HostUrl) => {
    setSelectedHost(host);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Host URLs</h1>
          <p className="text-muted-foreground mt-1">Manage your IPTV server URLs</p>
        </div>
        <Button onClick={() => { setSelectedHost(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Host URL
        </Button>
      </div>

      <div className="grid gap-4">
        {hosts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No host URLs configured. Add your first host URL to get started.
            </CardContent>
          </Card>
        ) : (
          hosts.map((host) => (
            <Card key={host.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{host.name}</h3>
                      <Badge variant={host.isActive ? 'default' : 'secondary'}>
                        {host.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{host.url}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(host)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(host.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <HostModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        host={selectedHost}
        onSuccess={loadHosts}
      />
    </div>
  );
};

export default Hosts;