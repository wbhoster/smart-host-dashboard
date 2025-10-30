import { API_BASE_URL } from '@/config';

// API utilities for MySQL backend
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

export interface WhatsAppLog {
  id?: number;
  clientId?: string | null;
  clientName?: string | null;
  username?: string | null;
  phone: string;
  message: string;
  status: 'sent' | 'failed';
  errorMessage?: string | null;
  createdAt?: string;
}

const STORAGE_KEYS = {
  ADMIN_AUTH: 'iptv_admin_auth',
};

export const storage = {
  // Clients - API calls
  getClients: async (): Promise<Client[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients.php`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      return await response.json();
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  },
  
  saveClients: async (clients: Client[]): Promise<void> => {
    // Note: This is not used anymore, we use individual create/update/delete
    console.warn('saveClients is deprecated, use individual client operations');
  },

  createClient: async (client: Client): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clients.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to create client');
  },

  updateClient: async (client: Client): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clients.php?id=${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to update client');
  },

  deleteClient: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clients.php?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete client');
  },
  
  // Host URLs - API calls
  getHostUrls: async (): Promise<HostUrl[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/hosts.php`);
      if (!response.ok) throw new Error('Failed to fetch host URLs');
      return await response.json();
    } catch (error) {
      console.error('Error fetching host URLs:', error);
      return [];
    }
  },
  
  saveHostUrls: async (urls: HostUrl[]): Promise<void> => {
    // Note: This is not used anymore, we use individual create/update/delete
    console.warn('saveHostUrls is deprecated, use individual host operations');
  },

  createHostUrl: async (host: HostUrl): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/hosts.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(host),
    });
    if (!response.ok) throw new Error('Failed to create host URL');
  },

  updateHostUrl: async (host: HostUrl): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/hosts.php?id=${host.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(host),
    });
    if (!response.ok) throw new Error('Failed to update host URL');
  },

  deleteHostUrl: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/hosts.php?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete host URL');
  },
  
  // Templates - API calls
  getTemplates: async (): Promise<WhatsAppTemplate[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates.php`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  },
  
  saveTemplates: async (templates: WhatsAppTemplate[]): Promise<void> => {
    for (const template of templates) {
      const response = await fetch(`${API_BASE_URL}/templates.php?id=${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: template.message }),
      });
      if (!response.ok) throw new Error(`Failed to update template ${template.id}`);
    }
  },

  // WhatsApp Logs - API calls
  getWhatsAppLogs: async (page = 1, limit = 20): Promise<{ data: any[]; total: number; page: number; limit: number }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp_logs.php?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return await res.json();
    } catch (e) {
      console.error('Error fetching logs:', e);
      return { data: [], total: 0, page, limit };
    }
  },

  createWhatsAppLog: async (log: Partial<WhatsAppLog>): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/whatsapp_logs.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Failed to create log');
  },
  
  // Admin Auth - Still using localStorage for session
  isAuthenticated: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },
  
  setAuthenticated: (value: boolean) => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, value ? 'true' : 'false');
  },

  login: async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (response.ok) {
        storage.setAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/auth.php`, { method: 'DELETE', credentials: 'include' });
    } catch {}
  },

  checkAuth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth.php`, { method: 'GET', credentials: 'include' });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.authenticated;
    } catch {
      return false;
    }
  },

  // Settings - API calls
  getSetting: async (key: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings.php?key=${encodeURIComponent(key)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error('Error fetching setting:', error);
      return null;
    }
  },

  saveSetting: async (key: string, value: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/settings.php?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!response.ok) throw new Error('Failed to save setting');
  },
  
  // Initialize storage
  initialize: () => {
    // No longer needed as database is initialized via schema.sql
  },
};