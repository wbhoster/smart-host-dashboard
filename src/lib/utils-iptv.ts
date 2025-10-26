import { Client, WhatsAppTemplate } from './storage';

// Generate random numeric username and password
export const generateCredentials = () => {
  const generateNumeric = (length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  };
  
  return {
    username: generateNumeric(10),
    password: generateNumeric(12),
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
    .replace(/{username}/g, client.username)
    .replace(/{password}/g, client.password)
    .replace(/{hostUrl}/g, client.hostUrl)
    .replace(/{expiryDate}/g, new Date(client.expiryDate).toLocaleDateString());
};

// WhatsApp API send function using 360Messenger
export const sendWhatsAppMessage = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    const apiKey = localStorage.getItem('whatsapp_api_key');
    
    if (!apiKey) {
      console.warn('WhatsApp API key not configured');
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
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
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