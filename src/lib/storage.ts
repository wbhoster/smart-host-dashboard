// Local storage utilities for simulating backend
export interface Client {
  id: string;
  fullName: string;
  username: string;
  password: string;
  hostUrl: string;
  packageDuration: 1 | 3 | 6 | 12;
  createdAt: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'expiring-soon';
  whatsappNumber: string;
}

export interface HostUrl {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  type: 'welcome' | 'pre-expiry' | 'expiry' | 'renewal';
  name: string;
  message: string;
}

const STORAGE_KEYS = {
  CLIENTS: 'iptv_clients',
  HOST_URLS: 'iptv_host_urls',
  TEMPLATES: 'iptv_whatsapp_templates',
  ADMIN_AUTH: 'iptv_admin_auth',
};

// Initialize default templates
const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'welcome',
    type: 'welcome',
    name: 'Welcome Message',
    message: '🎉 Welcome to IPTV Service, {fullName}!\n\n👤 Username: {username}\n🔑 Password: {password}\n🌐 Host URL: {hostUrl}\n📅 Valid Until: {expiryDate}\n\n✨ Enjoy unlimited entertainment!',
  },
  {
    id: 'pre-expiry',
    type: 'pre-expiry',
    name: 'Pre-Expiry Reminder',
    message: '⏰ Reminder {fullName}: Your IPTV subscription expires in 7 days!\n\n📅 Expiry Date: {expiryDate}\n\n💬 Contact us to renew your subscription.',
  },
  {
    id: 'expiry',
    type: 'expiry',
    name: 'Expiry Day Message',
    message: '⚠️ Hi {fullName}, your IPTV subscription has expired today.\n\n📅 Expired: {expiryDate}\n\n💬 Renew now to continue enjoying our service!',
  },
  {
    id: 'renewal',
    type: 'renewal',
    name: 'Renewal Confirmation',
    message: '✅ Hi {fullName}! Subscription renewed successfully!\n\n📅 New Expiry Date: {expiryDate}\n\n🎉 Thank you for continuing with us!',
  },
];

export const storage = {
  // Clients
  getClients: (): Client[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },
  
  saveClients: (clients: Client[]) => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },
  
  // Host URLs
  getHostUrls: (): HostUrl[] => {
    const data = localStorage.getItem(STORAGE_KEYS.HOST_URLS);
    return data ? JSON.parse(data) : [];
  },
  
  saveHostUrls: (urls: HostUrl[]) => {
    localStorage.setItem(STORAGE_KEYS.HOST_URLS, JSON.stringify(urls));
  },
  
  // Templates
  getTemplates: (): WhatsAppTemplate[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : DEFAULT_TEMPLATES;
  },
  
  saveTemplates: (templates: WhatsAppTemplate[]) => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },
  
  // Admin Auth
  isAuthenticated: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },
  
  setAuthenticated: (value: boolean) => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, value ? 'true' : 'false');
  },
  
  // Initialize storage with defaults
  initialize: () => {
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      storage.saveTemplates(DEFAULT_TEMPLATES);
    }
  },
};