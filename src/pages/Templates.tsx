import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { storage, WhatsAppTemplate } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const Templates = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setTemplates(storage.getTemplates());
  }, []);

  const handleUpdate = (id: string, message: string) => {
    const updated = templates.map(t => t.id === id ? { ...t, message } : t);
    setTemplates(updated);
  };

  const handleSave = () => {
    storage.saveTemplates(templates);
    toast({
      title: 'Templates saved',
      description: 'WhatsApp message templates updated successfully',
    });
  };

  const templateIcons: Record<string, string> = {
    welcome: '🎉',
    'pre-expiry': '⏰',
    expiry: '⚠️',
    renewal: '✅',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Templates</h1>
          <p className="text-muted-foreground mt-1">Customize automated message templates with emoji support</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save All
        </Button>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Available Variables:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><code className="bg-background px-1 rounded">{'{username}'}</code> - Client username</li>
              <li><code className="bg-background px-1 rounded">{'{password}'}</code> - Client password</li>
              <li><code className="bg-background px-1 rounded">{'{hostUrl}'}</code> - IPTV host URL</li>
              <li><code className="bg-background px-1 rounded">{'{expiryDate}'}</code> - Subscription expiry date</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{templateIcons[template.type]}</span>
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={template.message}
                onChange={(e) => handleUpdate(template.id, e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="Enter your message template..."
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Templates;