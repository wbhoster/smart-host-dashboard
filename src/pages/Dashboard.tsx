import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storage, Client } from '@/lib/storage';
import { getClientStatus } from '@/lib/utils-iptv';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    expiringSoon: 0,
  });

  useEffect(() => {
    const clients = storage.getClients();
    const total = clients.length;
    const active = clients.filter(c => getClientStatus(c.expiryDate) === 'active').length;
    const expired = clients.filter(c => getClientStatus(c.expiryDate) === 'expired').length;
    const expiringSoon = clients.filter(c => getClientStatus(c.expiryDate) === 'expiring-soon').length;

    setStats({ total, active, expired, expiringSoon });
  }, []);

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.total,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringSoon,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-600/10',
    },
    {
      title: 'Expired',
      value: stats.expired,
      icon: UserX,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your IPTV client management system</p>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to IPTV Admin Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This portal allows you to manage your IPTV clients efficiently. Here's what you can do:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">📋</span>
              <span><strong>Manage Clients:</strong> Create, view, renew, and delete client accounts</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🌐</span>
              <span><strong>Host URLs:</strong> Configure and manage multiple IPTV host URLs</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">💬</span>
              <span><strong>WhatsApp Templates:</strong> Customize automated message templates</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📄</span>
              <span><strong>Invoices:</strong> Automatically generate PDF invoices for clients</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📱</span>
              <span><strong>Custom Messages:</strong> Send personalized WhatsApp messages</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;