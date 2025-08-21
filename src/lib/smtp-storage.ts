interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  isDefault: boolean;
  status: 'active' | 'inactive' | 'testing';
  lastTested?: string;
  createdAt: string;
}

// In-memory storage (in production, use a database)
export const smtpConfigs: SMTPConfig[] = [];

export function getSmtpConfigs(): SMTPConfig[] {
  return smtpConfigs;
}

export function getDefaultSmtpConfig(): SMTPConfig | undefined {
  return smtpConfigs.find(config => config.isDefault) || smtpConfigs[0];
}

export function addSmtpConfig(config: Omit<SMTPConfig, 'id' | 'createdAt' | 'status' | 'isDefault'>): SMTPConfig {
  const newConfig: SMTPConfig = {
    ...config,
    id: Date.now().toString(),
    isDefault: smtpConfigs.length === 0,
    status: 'inactive',
    createdAt: new Date().toISOString()
  };

  smtpConfigs.push(newConfig);
  return newConfig;
}

export function updateSmtpConfig(id: string, updates: Partial<SMTPConfig>): SMTPConfig | null {
  const index = smtpConfigs.findIndex(c => c.id === id);
  if (index === -1) return null;

  smtpConfigs[index] = { ...smtpConfigs[index], ...updates };
  return smtpConfigs[index];
}

export function deleteSmtpConfig(id: string): boolean {
  const index = smtpConfigs.findIndex(c => c.id === id);
  if (index === -1) return false;

  const configToDelete = smtpConfigs[index];

  // Don't allow deleting the default configuration if there are others
  if (configToDelete.isDefault && smtpConfigs.length > 1) {
    return false;
  }

  smtpConfigs.splice(index, 1);

  // If we deleted the default and there are others, make the first one default
  if (configToDelete.isDefault && smtpConfigs.length > 0) {
    smtpConfigs[0].isDefault = true;
  }

  return true;
}

export function setDefaultSmtpConfig(id: string): boolean {
  const config = smtpConfigs.find(c => c.id === id);
  if (!config) return false;

  // Remove default from all configs and set it on the specified one
  smtpConfigs.forEach(c => {
    c.isDefault = c.id === id;
  });

  return true;
}

export type { SMTPConfig };
