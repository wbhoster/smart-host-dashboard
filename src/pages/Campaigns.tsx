import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { campaignStorage, Campaign } from '@/lib/campaign-storage';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Eye, 
  Pause, 
  Play, 
  Copy, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const PAGE_SIZE = 20;

  const loadCampaigns = async (p = page, s = search) => {
    setLoading(true);
    const result = await campaignStorage.getCampaigns(p, PAGE_SIZE, s);
    setCampaigns(result.data);
    setTotal(result.total);
    setPage(p);
    setLoading(false);
  };

  useEffect(() => {
    loadCampaigns(1, search);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await campaignStorage.deleteCampaign(deleteId);
      toast({ title: 'Campaign deleted successfully' });
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handlePauseResume = async (campaign: Campaign) => {
    try {
      const newStatus = campaign.status === 'running' ? 'paused' : 'running';
      await campaignStorage.updateCampaign(campaign.id, { status: newStatus });
      toast({ title: `Campaign ${newStatus === 'paused' ? 'paused' : 'resumed'}` });
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
    }
  };

  const handleClone = async (campaign: Campaign) => {
    try {
      const newCampaign = {
        ...campaign,
        id: `camp_${Date.now()}`,
        title: `${campaign.title} (Copy)`,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
      };
      delete newCampaign.completedAt;
      
      await campaignStorage.createCampaign(newCampaign);
      toast({ title: 'Campaign cloned successfully' });
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clone campaign',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<Campaign['status'], { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      scheduled: { variant: 'default', label: 'Scheduled' },
      running: { variant: 'default', label: 'Running' },
      paused: { variant: 'secondary', label: 'Paused' },
      completed: { variant: 'default', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    return <Badge variant={variants[status].variant}>{variants[status].label}</Badge>;
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage WhatsApp marketing campaigns</p>
        </div>
        <Button onClick={() => navigate('/campaigns/create')}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Campaigns ({total})</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No campaigns yet. Create your first campaign!</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => {
                    const progress = campaign.totalRecipients > 0 
                      ? (campaign.sentCount / campaign.totalRecipients) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium max-w-[200px] truncate" title={campaign.title}>
                          {campaign.title}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={progress} className="h-2" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {campaign.sentCount}/{campaign.totalRecipients}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{campaign.totalRecipients}</TableCell>
                        <TableCell className="text-green-600">{campaign.sentCount}</TableCell>
                        <TableCell className="text-red-600">{campaign.failedCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/campaigns/${campaign.id}`)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(campaign.status === 'running' || campaign.status === 'paused') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePauseResume(campaign)}
                                title={campaign.status === 'running' ? 'Pause' : 'Resume'}
                              >
                                {campaign.status === 'running' ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClone(campaign)}
                              title="Clone"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(campaign.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCampaigns(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCampaigns(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Campaigns;
