import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { campaignStorage, Campaign, CampaignRecipient } from '@/lib/campaign-storage';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  Send,
  CheckCircle2,
  Eye,
  XCircle,
  Clock,
  Pause,
  Play,
  AlertCircle
} from 'lucide-react';

const CampaignReport = () => {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientTotal, setRecipientTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageIds, setMessageIds] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const PAGE_SIZE = 50;

  useEffect(() => {
    if (id) {
      loadCampaign();
      loadRecipients();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  useEffect(() => {
    loadRecipients();
  }, [recipientPage, filterStatus]);

  const loadCampaign = async () => {
    if (!id) return;
    const data = await campaignStorage.getCampaign(id);
    setCampaign(data);
    setLoading(false);

    // Auto-refresh if running
    if (data?.status === 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        loadCampaign();
        loadRecipients();
      }, 5000);
    }
  };

  const loadRecipients = async () => {
    if (!id) return;
    const result = await campaignStorage.getRecipients(id, recipientPage, PAGE_SIZE, filterStatus);
    setRecipients(result.data);
    setRecipientTotal(result.total);
  };

  const handleStartCampaign = async () => {
    if (!id || !campaign) return;

    setSending(true);
    
    try {
      // Update status to running
      await campaignStorage.updateCampaign(id, { status: 'running' });
      
      // Start sending in batches
      sendNextBatch();
      
      toast({
        title: 'Campaign Started',
        description: 'Messages are being sent in batches',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start campaign',
        variant: 'destructive',
      });
      setSending(false);
    }
  };

  const sendNextBatch = async () => {
    if (!id) return;

    try {
      const result = await campaignStorage.sendBatch(id, 20);
      
      // Collect message IDs for status tracking
      if (result.sent > 0) {
        await loadCampaign();
        await loadRecipients();
      }

      if (!result.completed) {
        // Continue sending after delay (respect rate limits)
        setTimeout(() => sendNextBatch(), 10000); // 10 second delay between batches
      } else {
        setSending(false);
        toast({
          title: 'Campaign Completed',
          description: `Sent ${campaign?.sentCount} messages`,
        });
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch (error) {
      setSending(false);
      toast({
        title: 'Error',
        description: 'Failed to send batch',
        variant: 'destructive',
      });
    }
  };

  const handlePauseResume = async () => {
    if (!id || !campaign) return;

    try {
      const newStatus = campaign.status === 'running' ? 'paused' : 'running';
      await campaignStorage.updateCampaign(id, { status: newStatus });
      
      if (newStatus === 'running') {
        sendNextBatch();
      }
      
      loadCampaign();
      toast({
        title: `Campaign ${newStatus === 'paused' ? 'Paused' : 'Resumed'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
    }
  };

  const handleResendFailed = async () => {
    if (!id) return;

    try {
      // Reset failed recipients to pending
      const failedRecipients = await campaignStorage.getRecipients(id, 1, 1000, 'failed');
      
      for (const recipient of failedRecipients.data) {
        await campaignStorage.updateRecipient(recipient.id, { status: 'pending', errorMessage: null });
      }

      await campaignStorage.updateCampaign(id, { status: 'running', failedCount: 0 });
      
      toast({
        title: 'Resending Failed Messages',
        description: `Retrying ${failedRecipients.total} failed messages`,
      });

      sendNextBatch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend messages',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    if (!recipients.length) return;

    const headers = ['Name', 'Phone', 'Status', 'Sent At', 'Delivered At', 'Read At', 'Error'];
    const rows = recipients.map(r => [
      r.name,
      r.phone,
      r.status,
      r.sentAt || '',
      r.deliveredAt || '',
      r.readAt || '',
      r.errorMessage || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaign?.title || 'report'}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Report exported to CSV' });
  };

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progress = campaign.totalRecipients > 0 
    ? (campaign.sentCount / campaign.totalRecipients) * 100 
    : 0;

  const deliveryRate = campaign.sentCount > 0
    ? ((campaign.deliveredCount / campaign.sentCount) * 100).toFixed(1)
    : '0';

  const readRate = campaign.deliveredCount > 0
    ? ((campaign.readCount / campaign.deliveredCount) * 100).toFixed(1)
    : '0';

  const totalPages = Math.max(1, Math.ceil(recipientTotal / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.title}</h1>
            <p className="text-muted-foreground mt-1">
              Created on {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'draft' && (
            <Button onClick={handleStartCampaign} disabled={sending}>
              <Send className="w-4 h-4 mr-2" />
              Start Campaign
            </Button>
          )}
          {(campaign.status === 'running' || campaign.status === 'paused') && (
            <Button onClick={handlePauseResume} variant="outline">
              {campaign.status === 'running' ? (
                <><Pause className="w-4 h-4 mr-2" />Pause</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Resume</>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => loadCampaign()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {campaign.status === 'running' && (
        <Alert>
          <Clock className="w-4 h-4 animate-pulse" />
          <AlertDescription>
            Campaign is running. Messages are being sent in batches to respect API rate limits.
            This page auto-refreshes every 5 seconds.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Recipients</CardDescription>
            <CardTitle className="text-3xl">{campaign.totalRecipients}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {campaign.sentCount} sent ({progress.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-3xl text-green-600">{campaign.deliveredCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">{deliveryRate}% delivery rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Read</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{campaign.readCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">{readRate}% read rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-600">{campaign.failedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.failedCount > 0 && campaign.status !== 'running' && (
              <Button variant="outline" size="sm" onClick={handleResendFailed} className="w-full">
                <AlertCircle className="w-4 h-4 mr-2" />
                Retry Failed
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>Detailed message delivery status</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="mb-4">
              <TabsTrigger value="">All ({recipientTotal})</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value={filterStatus} className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Read</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          No recipients found
                        </TableCell>
                      </TableRow>
                    ) : (
                      recipients.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.phone}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                r.status === 'delivered' || r.status === 'read' ? 'default' :
                                r.status === 'failed' ? 'destructive' : 'secondary'
                              }
                            >
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.sentAt ? new Date(r.sentAt).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.readAt ? new Date(r.readAt).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={r.errorMessage || ''}>
                            {r.errorMessage || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {recipientPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecipientPage(p => Math.max(1, p - 1))}
                      disabled={recipientPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecipientPage(p => Math.min(totalPages, p + 1))}
                      disabled={recipientPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Message</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
            {campaign.message}
          </div>
          {campaign.mediaUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Media Attachment:</p>
              <a 
                href={campaign.mediaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                {campaign.mediaUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignReport;
