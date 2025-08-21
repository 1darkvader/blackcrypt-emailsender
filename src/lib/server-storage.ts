// Simple file-based storage for demo purposes
// In production, replace with your preferred database

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');
const EMAIL_CONFIGS_FILE = path.join(DATA_DIR, 'email-configs.json');
const SMTP_SETTINGS_FILE = path.join(DATA_DIR, 'smtp-settings.json');
const TRACKING_FILE = path.join(DATA_DIR, 'tracking.json');
const CLICKS_FILE = path.join(DATA_DIR, 'clicks.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read JSON file with error handling
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

// Write JSON file
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Campaign types
interface Campaign {
  id: string;
  name: string;
  contacts: Array<{ email: string; name?: string; [key: string]: any }>;
  template: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string[];
  };
  settings: {
    sendingInterval: number;
    dailyLimit: number;
    startTime?: string;
    emailProvider?: string;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'stopped';
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Email config types
interface EmailConfig {
  id: string;
  name: string;
  type: 'gmail-oauth' | 'resend' | 'smtp';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  config: {
    email?: string;
    apiKey?: string;
    domain?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
}

// Campaign functions
export async function getCampaigns(): Promise<Campaign[]> {
  return await readJsonFile(CAMPAIGNS_FILE, []);
}

export async function createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<Campaign> {
  const campaigns = await getCampaigns();
  
  const campaign: Campaign = {
    ...campaignData,
    id: uuidv4(),
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  campaigns.push(campaign);
  await writeJsonFile(CAMPAIGNS_FILE, campaigns);
  
  return campaign;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
  const campaigns = await getCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Campaign not found');
  }
  
  campaigns[index] = {
    ...campaigns[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await writeJsonFile(CAMPAIGNS_FILE, campaigns);
  return campaigns[index];
}

export async function deleteCampaign(id: string): Promise<void> {
  const campaigns = await getCampaigns();
  const filteredCampaigns = campaigns.filter(c => c.id !== id);
  await writeJsonFile(CAMPAIGNS_FILE, filteredCampaigns);
}

// Email config functions
export async function getEmailConfigs(): Promise<EmailConfig[]> {
  return await readJsonFile(EMAIL_CONFIGS_FILE, []);
}

export async function createEmailConfig(configData: Omit<EmailConfig, 'id' | 'createdAt'>): Promise<EmailConfig> {
  const configs = await getEmailConfigs();
  
  // If this is being set as default, unset others
  if (configData.isDefault) {
    configs.forEach(config => {
      config.isDefault = false;
    });
  }
  
  const config: EmailConfig = {
    ...configData,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  
  configs.push(config);
  await writeJsonFile(EMAIL_CONFIGS_FILE, configs);
  
  return config;
}

export async function updateEmailConfig(id: string, updates: Partial<EmailConfig>): Promise<EmailConfig> {
  const configs = await getEmailConfigs();
  const index = configs.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Email config not found');
  }
  
  // If this is being set as default, unset others
  if (updates.isDefault) {
    configs.forEach(config => {
      config.isDefault = false;
    });
  }
  
  configs[index] = {
    ...configs[index],
    ...updates
  };
  
  await writeJsonFile(EMAIL_CONFIGS_FILE, configs);
  return configs[index];
}

export async function deleteEmailConfig(id: string): Promise<void> {
  const configs = await getEmailConfigs();
  const filteredConfigs = configs.filter(c => c.id !== id);
  await writeJsonFile(EMAIL_CONFIGS_FILE, filteredConfigs);
}

// SMTP settings functions
export async function getSMTPSettings(): Promise<any> {
  return await readJsonFile(SMTP_SETTINGS_FILE, {});
}

export async function saveSMTPSettings(settings: any): Promise<void> {
  await writeJsonFile(SMTP_SETTINGS_FILE, settings);
}

// Tracking functions
interface TrackingEvent {
  id: string;
  campaignId: string;
  contactEmail: string;
  type: 'open' | 'click';
  timestamp: string;
  metadata?: any;
}

export async function logTrackingEvent(event: Omit<TrackingEvent, 'id' | 'timestamp'>): Promise<void> {
  const events = await readJsonFile<TrackingEvent[]>(TRACKING_FILE, []);
  
  const trackingEvent: TrackingEvent = {
    ...event,
    id: uuidv4(),
    timestamp: new Date().toISOString()
  };
  
  events.push(trackingEvent);
  await writeJsonFile(TRACKING_FILE, events);
}

export async function getTrackingEvents(campaignId?: string): Promise<TrackingEvent[]> {
  const events = await readJsonFile<TrackingEvent[]>(TRACKING_FILE, []);
  
  if (campaignId) {
    return events.filter(event => event.campaignId === campaignId);
  }
  
  return events;
}

// Click tracking functions
interface ClickEvent {
  id: string;
  campaignId: string;
  contactEmail: string;
  originalUrl: string;
  timestamp: string;
}

export async function logClickEvent(event: Omit<ClickEvent, 'id' | 'timestamp'>): Promise<void> {
  const clicks = await readJsonFile<ClickEvent[]>(CLICKS_FILE, []);
  
  const clickEvent: ClickEvent = {
    ...event,
    id: uuidv4(),
    timestamp: new Date().toISOString()
  };
  
  clicks.push(clickEvent);
  await writeJsonFile(CLICKS_FILE, clicks);
}

export async function getClickEvents(campaignId?: string): Promise<ClickEvent[]> {
  const clicks = await readJsonFile<ClickEvent[]>(CLICKS_FILE, []);
  
  if (campaignId) {
    return clicks.filter(click => click.campaignId === campaignId);
  }
  
  return clicks;
}