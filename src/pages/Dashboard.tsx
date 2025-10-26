import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage, Client } from '@/lib/storage';
import { getClientStatus, formatDate } from '@/lib/utils-iptv';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    expiringSoon: 0,
  });
  const [recentClients, setRecentClients] = useState<Client[]>([]);

  useEffect(() => {
    const clients = storage.getClients();
    const total = clients.length;
    const active = clients.filter(c => getClientStatus(c.expiryDate) === 'active').length;
    const expired = clients.filter(c => getClientStatus(c.expiryDate) === 'expired').length;
    const expiringSoon = clients.filter(c => getClientStatus(c.expiryDate) === 'expiring-soon').length;

    setStats({ total, active, expired, expiringSoon });
    
    // Get latest 10 clients sorted by creation date
    const sortedClients = [...clients].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 10);
    setRecentClients(sortedClients);
  }, []);

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.total,
      description: 'All registered clients',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active',
      value: stats.active,
      description: 'Valid subscriptions',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringSoon,
      description: 'Within 7 days',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-600/10',
    },
    {
      title: 'Expired',
      value: stats.expired,
      description: 'Needs renewal',
      icon: UserX,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  const getStatusBadge = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      active: 'default',
      'expiring-soon': 'secondary',
      expired: 'destructive',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your IPTV subscription management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Clients</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Latest 10 registered clients</p>
          </div>
          <Button onClick={() => navigate('/clients')}>View All</Button>
        </CardHeader>
        <CardContent>
          {recentClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No clients yet</p>
              <Button onClick={() => navigate('/clients')}>Add Client</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => {
                const status = getClientStatus(client.expiryDate);
                return (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{client.fullName}</p>
                        <Badge variant={getStatusBadge(status)} className="text-xs">
                          {status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Username: <span className="font-mono">{client.username}</span></div>
                        <div className="flex gap-4">
                          <span>Created: {formatDate(client.createdAt)}</span>
                          <span>Expires: {formatDate(client.expiryDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
