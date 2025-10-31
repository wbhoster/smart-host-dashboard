import { API_BASE_URL } from '@/config';

export interface Campaign {
  id: string;
  title: string;
  message: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'pdf' | 'link' | null;
  targetAudience: 'all' | 'active' | 'inactive' | 'expired' | 'expiring-soon' | 'csv';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  scheduledAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
}

export interface CampaignRecipient {
  id: number;
  campaignId: string;
  clientId?: string | null;
  name: string;
  phone: string;
  messageId?: string | null;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string | null;
  sentAt?: string | null;
}

export interface ImportedContact {
  name: string;
  phone: string;
}

export const campaignStorage = {
  // Campaigns
  getCampaigns: async (page = 1, limit = 20, search = ''): Promise<{ data: Campaign[]; total: number; page: number; limit: number }> => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.append('search', search);
      
      const response = await fetch(`${API_BASE_URL}/campaigns.php?${params}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return { data: [], total: 0, page, limit };
    }
  },

  getCampaign: async (id: string): Promise<Campaign | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns.php?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  },

  createCampaign: async (campaign: Partial<Campaign>): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/campaigns.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    });
    if (!response.ok) throw new Error('Failed to create campaign');
    const result = await response.json();
    return result.id;
  },

  updateCampaign: async (id: string, updates: Partial<Campaign>): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/campaigns.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update campaign');
  },

  deleteCampaign: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/campaigns.php?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete campaign');
  },

  // Recipients
  getRecipients: async (campaignId: string, page = 1, limit = 50, status?: string): Promise<{ data: CampaignRecipient[]; total: number }> => {
    try {
      const params = new URLSearchParams({ campaign_id: campaignId, page: String(page), limit: String(limit) });
      if (status) params.append('status', status);
      
      const response = await fetch(`${API_BASE_URL}/campaign_recipients.php?${params}`);
      if (!response.ok) throw new Error('Failed to fetch recipients');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recipients:', error);
      return { data: [], total: 0 };
    }
  },

  addRecipients: async (campaignId: string, recipients: Array<{ clientId?: string; name: string; phone: string }>): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/campaign_recipients.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, recipients }),
    });
    if (!response.ok) throw new Error('Failed to add recipients');
  },

  updateRecipient: async (id: number, updates: Partial<CampaignRecipient>): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/campaign_recipients.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update recipient');
  },

  // Import
  importFromCSV: async (csvData: string): Promise<{ contacts: ImportedContact[]; total: number; errors: string[] }> => {
    const response = await fetch(`${API_BASE_URL}/campaign_import.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData }),
    });
    if (!response.ok) throw new Error('Failed to import CSV');
    return await response.json();
  },

  // Send
  sendBatch: async (campaignId: string, batchSize = 20): Promise<{ sent: number; failed: number; remaining: number; completed: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/campaign_send.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, batchSize }),
    });
    if (!response.ok) throw new Error('Failed to send batch');
    return await response.json();
  },

  // Update statuses
  updateStatuses: async (messageIds: string[]): Promise<{ statuses: Record<string, string> }> => {
    const response = await fetch(`${API_BASE_URL}/campaign_status.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds }),
    });
    if (!response.ok) throw new Error('Failed to update statuses');
    return await response.json();
  },
};
