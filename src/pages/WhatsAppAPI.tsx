import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/storage';
import { Save, Send, ExternalLink } from 'lucide-react';

const WhatsAppAPI = () => {
  const [apiKey, setApiKey] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadApiKey = async () => {
      const saved = await storage.getSetting('whatsapp_api_key');
      if (saved) setApiKey(saved);
    };
    loadApiKey();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        variant: 'destructive',
      });
      return;
    }

    try {
      await storage.saveSetting('whatsapp_api_key', apiKey);
      toast({
        title: 'API Key Saved',
        description: 'Your 360Messenger API key has been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save API key',
        variant: 'destructive',
      });
    }
  };

  const handleTestMessage = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please save your API key first',
        variant: 'destructive',
      });
      return;
    }

    if (!testPhone.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('phonenumber', testPhone);
      formData.append('text', 'Hello! This is a test message from IPTV Admin Portal. Your WhatsApp API is configured correctly! 🎉');

      const response = await fetch('https://api.360messenger.com/v2/sendMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast({
          title: 'Test Message Sent',
          description: `Test message sent successfully to ${testPhone}`,
        });
      } else {
        const errorText = await response.text();
        toast({
          title: 'Error',
          description: `Failed to send message: ${errorText}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test message. Check your connection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp API Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your 360Messenger WhatsApp API for automated notifications</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your 360Messenger API key to enable WhatsApp notifications
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your 360Messenger API key"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://360messenger.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  360Messenger
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
            <Button onClick={handleSaveApiKey} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save API Key
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test API Connection</CardTitle>
            <p className="text-sm text-muted-foreground">
              Send a test message to verify your API configuration
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Phone Number</Label>
              <Input
                id="testPhone"
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="447488888888"
              />
              <p className="text-xs text-muted-foreground">
                Enter phone number in international format (without +)
              </p>
            </div>
            <Button 
              onClick={handleTestMessage} 
              variant="outline" 
              className="w-full"
              disabled={isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Test Message'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>360Messenger API Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Details about the WhatsApp API integration
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-2">API Endpoint</h3>
            <code className="block bg-muted px-4 py-3 rounded-lg text-sm">
              POST https://api.360messenger.com/v2/sendMessage
            </code>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Automated Notifications</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Welcome message when a new client is added</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Reminder 7 days before subscription expires</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Notification on the day subscription expires</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Confirmation when subscription is renewed</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Message Templates</h3>
            <p className="text-sm text-muted-foreground">
              Customize your notification messages in the{' '}
              <a href="/templates" className="text-primary hover:underline">
                Templates
              </a>{' '}
              section. Use variables like {'{{ username }}'} and {'{{ expiryDate }}'} for personalized messages.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppAPI;
