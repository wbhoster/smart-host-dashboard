import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { campaignStorage } from '@/lib/campaign-storage';
import { storage, Client } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X, Send, Calendar, Users, FileText, Smile, Bold, Italic } from 'lucide-react';

const CampaignCreate = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'pdf' | 'link'>('image');
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'inactive' | 'expired' | 'expiring-soon' | 'csv'>('all');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContacts, setCsvContacts] = useState<Array<{ name: string; phone: string }>>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await storage.getClients();
    setClients(data);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      
      try {
        const result = await campaignStorage.importFromCSV(csvData);
        setCsvContacts(result.contacts);
        setCsvErrors(result.errors);
        
        if (result.errors.length > 0) {
          toast({
            title: 'CSV Import Warning',
            description: `${result.total} contacts imported with ${result.errors.length} errors. Check details below.`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'CSV Imported Successfully',
            description: `${result.total} contacts imported`,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to parse CSV file',
          variant: 'destructive',
        });
      }
    };
    
    reader.readAsText(file);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = messageRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emojiData.emoji + message.substring(end);
    
    setMessage(newMessage);
    setShowEmojiPicker(false);
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
    }, 0);
  };

  const wrapText = (wrapper: string) => {
    const textarea = messageRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    
    if (!selectedText) {
      toast({
        title: 'No Text Selected',
        description: 'Please select text to format',
        variant: 'default',
      });
      return;
    }

    const newMessage = message.substring(0, start) + wrapper + selectedText + wrapper + message.substring(end);
    setMessage(newMessage);
    
    // Set cursor position after formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(end + (wrapper.length * 2), end + (wrapper.length * 2));
    }, 0);
  };

  const getTargetRecipients = () => {
    if (targetAudience === 'csv') {
      return csvContacts;
    }
    
    let filtered = clients;
    
    if (targetAudience !== 'all') {
      filtered = clients.filter(c => c.status === targetAudience);
    }
    
    return filtered.map(c => ({
      clientId: c.id,
      name: c.fullName,
      phone: c.whatsappNumber,
    }));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a campaign title',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    const recipients = getTargetRecipients();
    
    if (recipients.length === 0) {
      toast({
        title: 'Error',
        description: 'No recipients found for selected audience',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const campaignId = `camp_${Date.now()}`;
      
      // Create campaign
      await campaignStorage.createCampaign({
        id: campaignId,
        title,
        message,
        mediaUrl: mediaUrl || null,
        mediaType: mediaUrl ? mediaType : null,
        targetAudience,
        status: sendImmediately ? 'draft' : 'scheduled',
        scheduledAt: sendImmediately ? null : scheduledDate,
        totalRecipients: recipients.length,
      });

      // Add recipients
      await campaignStorage.addRecipients(campaignId, recipients);

      toast({
        title: 'Campaign Created',
        description: `Campaign created with ${recipients.length} recipients`,
      });

      navigate(`/campaigns/${campaignId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const recipientCount = getTargetRecipients().length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
          <p className="text-muted-foreground mt-1">Set up a new WhatsApp marketing campaign</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Configure your campaign message and targeting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Summer Promotion 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <div className="relative">
              <Textarea
                ref={messageRef}
                id="message"
                placeholder="Hello {{name}}, this is your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => wrapText('*')}
                  title="Bold (select text first)"
                  className="h-8 w-8 p-0"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => wrapText('_')}
                  title="Italic (select text first)"
                  className="h-8 w-8 p-0"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Add Emoji"
                      className="h-8 w-8 p-0"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 border-none" align="end">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={350}
                      height={400}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use placeholders: <code className="bg-muted px-1 py-0.5 rounded">{'{{name}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{phone}}'}</code>
              <br />
              Formatting: Select text and click <Bold className="w-3 h-3 inline" /> for *bold* or <Italic className="w-3 h-3 inline" /> for _italic_
            </p>
          </div>

          <div className="space-y-4">
            <Label>Media Attachment (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mediaType">Media Type</Label>
                <Select value={mediaType} onValueChange={(v: any) => setMediaType(v)}>
                  <SelectTrigger id="mediaType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mediaUrl">Media URL</Label>
                <Input
                  id="mediaUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="audience">Target Audience *</Label>
            <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
              <SelectTrigger id="audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    All Clients
                  </div>
                </SelectItem>
                <SelectItem value="active">Active Clients</SelectItem>
                <SelectItem value="inactive">Inactive Clients</SelectItem>
                <SelectItem value="expired">Expired Clients</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Import from CSV
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {targetAudience === 'csv' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {csvFile ? 'Change CSV File' : 'Upload CSV File'}
                </Button>
                
                {csvFile && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{csvFile.name}</span>
                      <Badge variant="secondary">{csvContacts.length} contacts</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCsvFile(null);
                        setCsvContacts([]);
                        setCsvErrors([]);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {csvErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <p className="font-semibold mb-2">CSV Import Errors:</p>
                      <ul className="list-disc list-inside text-xs space-y-1 max-h-32 overflow-y-auto">
                        {csvErrors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {csvErrors.length > 10 && <li>...and {csvErrors.length - 10} more</li>}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-xs text-muted-foreground">
                  CSV format: name, phone (one per line)
                </p>
              </div>
            )}

            <Alert>
              <Users className="w-4 h-4" />
              <AlertDescription>
                <strong>{recipientCount}</strong> recipient{recipientCount !== 1 ? 's' : ''} will receive this campaign
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-4">
            <Label>Schedule</Label>
            <div className="flex items-center gap-4">
              <Button
                variant={sendImmediately ? 'default' : 'outline'}
                onClick={() => setSendImmediately(true)}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
              <Button
                variant={!sendImmediately ? 'default' : 'outline'}
                onClick={() => setSendImmediately(false)}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </div>

            {!sendImmediately && (
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate('/campaigns')}>
          Cancel
        </Button>
        <Button onClick={handleCreate} disabled={loading || recipientCount === 0}>
          {loading ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </div>
  );
};

export default CampaignCreate;
