import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendWhatsAppMessage } from '@/lib/utils-iptv';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

const SendMessage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const apiKey = await (await import('@/lib/storage')).storage.getSetting('whatsapp_api_key');
    if (!apiKey) {
      toast({
        title: 'Error',
        description: 'Please configure WhatsApp API key first in Settings',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const success = await sendWhatsAppMessage(phoneNumber, message);
      if (success) {
        toast({
          title: 'Message sent',
          description: `WhatsApp message sent to ${phoneNumber}`,
        });
        setPhoneNumber('');
        setMessage('');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send message. Check API key and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send Custom Message</h1>
        <p className="text-muted-foreground mt-1">Send a personalized WhatsApp message to any number</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Custom WhatsApp Message</CardTitle>
          <CardDescription>
            Use this feature to send manual notifications or announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for USA)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message with emoji support 🎉"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Emoji support enabled. Current length: {message.length} characters
              </p>
            </div>

            <Button type="submit" disabled={isSending} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Messages are sent via 360Messenger WhatsApp API</li>
              <li>Use emojis to make your messages more engaging</li>
              <li>Keep messages concise and clear</li>
              <li>Always include a call-to-action when needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendMessage;