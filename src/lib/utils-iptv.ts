import { Client, WhatsAppTemplate } from './storage';

// Generate random numeric username and password
export const generateCredentials = () => {
  const generateNumeric = (length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  };
  
  return {
    username: generateNumeric(8),
    password: generateNumeric(8),
  };
};

// Calculate expiry date based on package duration
export const calculateExpiryDate = (startDate: Date, months: number): Date => {
  const expiry = new Date(startDate);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
};

// Get client status based on expiry date
export const getClientStatus = (expiryDate: string): 'active' | 'expired' | 'expiring-soon' => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'expiring-soon';
  return 'active';
};

// Replace template variables with actual values
export const fillTemplate = (template: string, client: Client): string => {
  return template
    .replace(/{fullName}/g, client.fullName)
    .replace(/{username}/g, client.username)
    .replace(/{password}/g, client.password)
    .replace(/{hostUrl}/g, client.hostUrl)
    .replace(/{expiryDate}/g, new Date(client.expiryDate).toLocaleDateString());
};

// WhatsApp API send function using 360Messenger
export const sendWhatsAppMessage = async (
  phoneNumber: string,
  message: string,
  meta?: { clientId?: string; clientName?: string; username?: string }
): Promise<boolean> => {
  try {
    const { storage } = await import('./storage');
    const apiKey = await storage.getSetting('whatsapp_api_key');
    
    if (!apiKey) {
      console.warn('WhatsApp API key not configured');
      // Log failed attempt
      await storage.createWhatsAppLog({
        clientId: meta?.clientId ?? null,
        clientName: meta?.clientName ?? null,
        username: meta?.username ?? null,
        phone: phoneNumber,
        message,
        status: 'failed',
        errorMessage: 'API key not configured',
      });
      return false;
    }

    const formData = new FormData();
    formData.append('phonenumber', phoneNumber);
    formData.append('text', message);

    const response = await fetch('https://api.360messenger.com/v2/sendMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WhatsApp API error:', errorText);
      await storage.createWhatsAppLog({
        clientId: meta?.clientId ?? null,
        clientName: meta?.clientName ?? null,
        username: meta?.username ?? null,
        phone: phoneNumber,
        message,
        status: 'failed',
        errorMessage: errorText,
      });
      return false;
    }

    await storage.createWhatsAppLog({
      clientId: meta?.clientId ?? null,
      clientName: meta?.clientName ?? null,
      username: meta?.username ?? null,
      phone: phoneNumber,
      message,
      status: 'sent',
    });

    return true;
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error);
    try {
      const { storage } = await import('./storage');
      await storage.createWhatsAppLog({
        clientId: meta?.clientId ?? null,
        clientName: meta?.clientName ?? null,
        username: meta?.username ?? null,
        phone: phoneNumber,
        message,
        status: 'failed',
        errorMessage: String(error?.message || error),
      });
    } catch {}
    return false;
  }
};

// Format date for display
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};