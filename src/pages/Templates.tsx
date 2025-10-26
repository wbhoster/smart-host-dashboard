import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { storage, WhatsAppTemplate } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const Templates = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [activeTab, setActiveTab] = useState('welcome');
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

  const variables = [
    { name: '{username}', description: 'Client username' },
    { name: '{password}', description: 'Client password' },
    { name: '{hostUrl}', description: 'IPTV host URL' },
    { name: '{expiryDate}', description: 'Subscription expiry date' },
  ];

  const templateDescriptions: Record<string, string> = {
    welcome: 'Sent when a new client is added',
    'pre-expiry': 'Sent 7 days before subscription expires',
    expiry: 'Sent on the day subscription expires',
    renewal: 'Sent when subscription is renewed',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Templates</h1>
          <p className="text-muted-foreground mt-1">Customize WhatsApp message templates for client notifications</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Message Templates</CardTitle>
          <p className="text-sm text-muted-foreground">
            Edit and save templates for automated client notifications. Use variables to insert dynamic data.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="welcome">Welcome Message</TabsTrigger>
              <TabsTrigger value="pre-expiry">7-Day Reminder</TabsTrigger>
              <TabsTrigger value="expiry">Expiry Notice</TabsTrigger>
              <TabsTrigger value="renewal">Renewal Confirmation</TabsTrigger>
            </TabsList>

            {templates.map((template) => (
              <TabsContent key={template.id} value={template.id} className="space-y-4 mt-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {templateDescriptions[template.type]}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Available Variables</h3>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable) => (
                      <Badge key={variable.name} variant="secondary" className="text-xs">
                        {variable.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Message Content</h3>
                    <span className="text-xs text-muted-foreground">
                      {template.message.length} characters
                    </span>
                  </div>
                  <Textarea
                    value={template.message}
                    onChange={(e) => handleUpdate(template.id, e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Enter your message template..."
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Templates;