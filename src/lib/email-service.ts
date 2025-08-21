import { Resend } from 'resend';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import type { EmailConfig } from './server-storage';

// Email sending result interface
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'resend' | 'gmail-oauth' | 'smtp';
}

// Email data interface
export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  trackingPixel?: string;
}

class EmailService {
  private resend: Resend | null = null;
  private oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

  // Initialize Resend API
  private initResend(apiKey: string): Resend {
    if (!this.resend || this.resend.apiKey !== apiKey) {
      this.resend = new Resend(apiKey);
    }
    return this.resend;
  }

  // Initialize Gmail OAuth
  private initGmailOAuth(config: EmailConfig['config']): InstanceType<typeof google.auth.OAuth2> {
    if (!this.oauth2Client) {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    }

    if (config.accessToken && config.refreshToken) {
      this.oauth2Client.setCredentials({
        access_token: config.accessToken,
        refresh_token: config.refreshToken
      });
    }

    return this.oauth2Client;
  }

  // Send email via Resend API
  async sendViaResend(config: EmailConfig, emailData: EmailData): Promise<EmailResult> {
    try {
      if (!config.config.apiKey) {
        return {
          success: false,
          error: 'Resend API key not configured',
          provider: 'resend'
        };
      }

      const resend = this.initResend(config.config.apiKey);

      // Add tracking pixel if provided
      let htmlContent = emailData.html;
      if (emailData.trackingPixel) {
        htmlContent += `<img src="${emailData.trackingPixel}" width="1" height="1" style="display:none;" />`;
      }

      const result = await resend.emails.send({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: htmlContent,
        text: emailData.text,
        reply_to: emailData.replyTo
      });

      return {
        success: true,
        messageId: result.data?.id,
        provider: 'resend'
      };
    } catch (error: unknown) {
      console.error('Resend sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send via Resend',
        provider: 'resend'
      };
    }
  }

  // Send email via Gmail OAuth
  async sendViaGmailOAuth(config: EmailConfig, emailData: EmailData): Promise<EmailResult> {
    try {
      const oauth2Client = this.initGmailOAuth(config.config);

      // Check if token is still valid, refresh if needed
      try {
        await oauth2Client.getAccessToken();
      } catch (error) {
        return {
          success: false,
          error: 'Gmail OAuth token expired. Please reconnect your account.',
          provider: 'gmail-oauth'
        };
      }

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Create email message
      let htmlContent = emailData.html;
      if (emailData.trackingPixel) {
        htmlContent += `<img src="${emailData.trackingPixel}" width="1" height="1" style="display:none;" />`;
      }

      const message = [
        `To: ${emailData.to}`,
        `From: ${emailData.from}`,
        `Subject: ${emailData.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="boundary"`,
        ``,
        `--boundary`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
        ``,
        `--boundary`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlContent,
        ``,
        `--boundary--`
      ].join('\n');

      const encodedMessage = Buffer.from(message).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return {
        success: true,
        messageId: result.data.id,
        provider: 'gmail-oauth'
      };
    } catch (error: unknown) {
      console.error('Gmail OAuth sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send via Gmail OAuth',
        provider: 'gmail-oauth'
      };
    }
  }

  // Send email via SMTP (legacy fallback)
  async sendViaSMTP(config: EmailConfig, emailData: EmailData): Promise<EmailResult> {
    try {
      if (!config.config.host || !config.config.port) {
        return {
          success: false,
          error: 'SMTP configuration incomplete',
          provider: 'smtp'
        };
      }

      const transporter = nodemailer.createTransport({
        host: config.config.host,
        port: config.config.port,
        secure: config.config.port === 465,
        auth: {
          user: config.config.username,
          pass: config.config.password
        }
      });

      let htmlContent = emailData.html;
      if (emailData.trackingPixel) {
        htmlContent += `<img src="${emailData.trackingPixel}" width="1" height="1" style="display:none;" />`;
      }

      const result = await transporter.sendMail({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: htmlContent,
        text: emailData.text,
        replyTo: emailData.replyTo
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp'
      };
    } catch (error: unknown) {
      console.error('SMTP sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send via SMTP',
        provider: 'smtp'
      };
    }
  }

  // Main send method - routes to appropriate provider
  async sendEmail(config: EmailConfig, emailData: EmailData): Promise<EmailResult> {
    switch (config.type) {
      case 'resend':
        return this.sendViaResend(config, emailData);
      case 'gmail-oauth':
        return this.sendViaGmailOAuth(config, emailData);
      case 'smtp':
        return this.sendViaSMTP(config, emailData);
      default:
        return {
          success: false,
          error: `Unsupported email provider: ${config.type}`,
          provider: config.type as any
        };
    }
  }

  // Test email configuration
  async testConfig(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const testEmail: EmailData = {
        to: config.config.email || 'test@example.com',
        from: config.config.email || 'test@example.com',
        subject: 'Test Email Configuration',
        html: '<p>This is a test email to verify your configuration.</p>',
        text: 'This is a test email to verify your configuration.'
      };

      const result = await this.sendEmail(config, testEmail);
      return {
        success: result.success,
        error: result.error
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration test failed'
      };
    }
  }

  // Generate tracking pixel URL
  generateTrackingPixel(campaignId: string, contactEmail: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/api/tracking?campaign=${campaignId}&email=${encodeURIComponent(contactEmail)}&t=${Date.now()}`;
  }

  // Generate click tracking URL
  generateClickTrackingUrl(campaignId: string, contactEmail: string, originalUrl: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/api/link-redirect?campaign=${campaignId}&email=${encodeURIComponent(contactEmail)}&url=${encodeURIComponent(originalUrl)}`;
  }
}

export const emailService = new EmailService();
