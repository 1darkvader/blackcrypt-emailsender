import fs from 'fs/promises';
import path from 'path';

// Storage directory
const STORAGE_DIR = path.join(process.cwd(), 'data');

// Storage files
const FILES = {
  EMAIL_CONFIGS: 'email-configs.json',
  CAMPAIGNS: 'campaigns.json',
  CONTACTS: 'contacts.json',
  ANALYTICS: 'analytics.json',
  OAUTH_TOKENS: 'oauth-tokens.json'
};

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

// Generic storage functions
export async function readStorage<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    await ensureStorageDir();
    const filePath = path.join(STORAGE_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

export async function writeStorage<T>(filename: string, data: T): Promise<void> {
  try {
    await ensureStorageDir();
    const filePath = path.join(STORAGE_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filename}:`, error);
    throw error;
  }
}

// Email Configuration Storage
export interface EmailConfig {
  id: string;
  name: string;
  type: 'gmail-oauth' | 'resend' | 'smtp';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  config: {
    // Gmail OAuth
    email?: string;
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: number;
    // Resend API
    apiKey?: string;
    domain?: string;
    // SMTP (legacy)
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
}

export async function getEmailConfigs(): Promise<EmailConfig[]> {
  return readStorage(FILES.EMAIL_CONFIGS, []);
}

export async function saveEmailConfigs(configs: EmailConfig[]): Promise<void> {
  return writeStorage(FILES.EMAIL_CONFIGS, configs);
}

export async function getDefaultEmailConfig(): Promise<EmailConfig | null> {
  const configs = await getEmailConfigs();
  return configs.find(config => config.isDefault) || null;
}

// Campaign Storage
export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'stopped';
  emailConfigId: string;
  template: {
    subject: string;
    htmlContent: string;
    textContent: string;
  };
  contacts: Array<{
    email: string;
    name?: string;
    [key: string]: string | undefined;
  }>;
  settings: {
    sendingInterval: number;
    dailyLimit: number;
    startTime?: string;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  queue: Array<{
    contactId: string;
    status: 'pending' | 'sent' | 'failed';
    scheduledAt: string;
    sentAt?: string;
    error?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export async function getCampaigns(): Promise<Campaign[]> {
  return readStorage(FILES.CAMPAIGNS, []);
}

export async function saveCampaigns(campaigns: Campaign[]): Promise<void> {
  return writeStorage(FILES.CAMPAIGNS, campaigns);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const campaigns = await getCampaigns();
  return campaigns.find(campaign => campaign.id === id) || null;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<void> {
  const campaigns = await getCampaigns();
  const index = campaigns.findIndex(campaign => campaign.id === id);
  if (index !== -1) {
    campaigns[index] = { ...campaigns[index], ...updates, updatedAt: new Date().toISOString() };
    await saveCampaigns(campaigns);
  }
}

// Analytics Storage
export interface Analytics {
  campaignId: string;
  events: Array<{
    type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';
    contactEmail: string;
    timestamp: string;
    data?: Record<string, any>;
  }>;
}

export async function saveAnalyticsEvent(campaignId: string, event: Analytics['events'][0]): Promise<void> {
  const analytics = await readStorage(FILES.ANALYTICS, {} as Record<string, Analytics>);

  if (!analytics[campaignId]) {
    analytics[campaignId] = { campaignId, events: [] };
  }

  analytics[campaignId].events.push(event);
  await writeStorage(FILES.ANALYTICS, analytics);
}

export async function getCampaignAnalytics(campaignId: string): Promise<Analytics | null> {
  const analytics = await readStorage(FILES.ANALYTICS, {} as Record<string, Analytics>);
  return analytics[campaignId] || null;
}
