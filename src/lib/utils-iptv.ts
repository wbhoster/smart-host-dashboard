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

// Mock WhatsApp API send function
export const sendWhatsAppMessage = async (phoneNumber: string, message: string): Promise<boolean> => {
  // Simulate API call
  console.log('Sending WhatsApp message to:', phoneNumber);
  console.log('Message:', message);
  
  // In production, this would call 360Messenger API:
  // const response = await fetch('https://api.360messenger.com/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ to: phoneNumber, message }),
  // });
  
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000);
  });
};

// Format date for display
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};