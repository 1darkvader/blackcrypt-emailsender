import { google } from 'googleapis';
import type { EmailConfig } from './server-storage';

// OAuth configuration
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface UserInfo {
  email: string;
  name: string;
  picture?: string;
}

export class GmailOAuthService {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>;
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  // Generate OAuth authorization URL
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to get required tokens');
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date || 0
      };
    } catch (error: unknown) {
      console.error('Token exchange error:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  // Get user info from Google
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      if (!data.email) {
        throw new Error('Failed to get user email');
      }

      return {
        email: data.email,
        name: data.name || data.email,
        picture: data.picture
      };
    } catch (error: unknown) {
      console.error('Get user info error:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: number;
  }> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date || 0
      };
    } catch (error: unknown) {
      console.error('Token refresh error:', error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  // Validate tokens and refresh if needed
  async validateAndRefreshTokens(config: EmailConfig): Promise<{
    valid: boolean;
    accessToken?: string;
    error?: string;
  }> {
    try {
      if (!config.config.refreshToken) {
        return { valid: false, error: 'No refresh token available' };
      }

      // Check if access token is expired (with 5 minute buffer)
      const now = Date.now();
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes

      if (config.config.accessToken && config.config.expiryDate) {
        if (now < (config.config.expiryDate - expiryBuffer)) {
          return { valid: true, accessToken: config.config.accessToken };
        }
      }

      // Refresh the token
      const refreshed = await this.refreshToken(config.config.refreshToken);

      return {
        valid: true,
        accessToken: refreshed.accessToken
      };
    } catch (error: unknown) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Test Gmail API access
  async testGmailAccess(accessToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Try to get user profile to test access
      await gmail.users.getProfile({ userId: 'me' });

      return { success: true };
    } catch (error: unknown) {
      console.error('Gmail access test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to access Gmail API'
      };
    }
  }
}

// Create singleton instance
let gmailOAuthService: GmailOAuthService | null = null;

export function getGmailOAuthService(): GmailOAuthService {
  if (!gmailOAuthService) {
    const config: OAuthConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || ''
    };

    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      throw new Error('Gmail OAuth configuration missing. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.');
    }

    gmailOAuthService = new GmailOAuthService(config);
  }

  return gmailOAuthService;
}
