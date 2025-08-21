import nodemailer from 'nodemailer';
import { getEmailConfigs, getSMTPSettings } from './server-storage';
import { GmailOAuth } from './gmail-oauth';

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

interface Recipient {
  email: string;
  name?: string;
  [key: string]: any;
}

interface BulkEmailOptions {
  campaignId?: string;
  recipients: Recipient[];
  template: EmailTemplate;
  settings: {
    sendingInterval: number;
    dailyLimit: number;
    emailProvider?: 'gmail' | 'smtp' | 'resend';
    fromEmail?: string;
    fromName?: string;
  };
}

interface EmailResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

// Generate tracking pixel for email opens
function generateTrackingPixel(campaignId: string, recipientEmail: string): string {
  const trackingId = Buffer.from(`${campaignId}:${recipientEmail}`).toString('base64');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `<img src="${baseUrl}/api/tracking?id=${encodeURIComponent(trackingId)}" width="1" height="1" style="display:none;" alt="" />`;
}

// Replace links with tracking links
function addLinkTracking(content: string, campaignId: string, recipientEmail: string): string {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  return content.replace(linkRegex, (match, originalUrl) => {
    const linkId = Buffer.from(`${campaignId}:${recipientEmail}:${originalUrl}`).toString('base64');
    const trackingUrl = `${baseUrl}/api/link-redirect?id=${encodeURIComponent(linkId)}`;
    return match.replace(originalUrl, trackingUrl);
  });
}

// Replace template variables with actual values
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
}

// Create transporter based on email configuration
async function createTransporter() {
  const emailConfigs = await getEmailConfigs();
  const defaultConfig = emailConfigs.find(config => config.isDefault && config.isActive);
  
  if (!defaultConfig) {
    throw new Error('No active email configuration found');
  }

  switch (defaultConfig.type) {
    case 'gmail-oauth': {
      const gmailOAuth = new GmailOAuth();
      return await gmailOAuth.createTransporter(defaultConfig.config.email!);
    }
    
    case 'smtp': {
      const smtpConfig = defaultConfig.config;
      return nodemailer.createTransporter({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
    
    case 'resend': {
      // For Resend, we'll use their API directly
      throw new Error('Resend integration not implemented in this function');
    }
    
    default:
      throw new Error(`Unsupported email provider: ${defaultConfig.type}`);
  }
}

// Send email using Resend API
async function sendEmailWithResend(recipient: Recipient, subject: string, html: string, fromEmail: string, fromName: string) {
  const emailConfigs = await getEmailConfigs();
  const resendConfig = emailConfigs.find(config => config.type === 'resend' && config.isActive);
  
  if (!resendConfig) {
    throw new Error('No active Resend configuration found');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendConfig.config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [recipient.email],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

// Main bulk email sending function
export async function sendBulkEmails(options: BulkEmailOptions): Promise<EmailResult> {
  const { campaignId = 'default', recipients, template, settings } = options;
  const result: EmailResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: []
  };

  // Get email configuration
  const emailConfigs = await getEmailConfigs();
  const defaultConfig = emailConfigs.find(config => config.isDefault && config.isActive);
  
  if (!defaultConfig) {
    throw new Error('No active email configuration found');
  }

  const fromEmail = settings.fromEmail || defaultConfig.config.email || defaultConfig.config.username || 'noreply@example.com';
  const fromName = settings.fromName || 'Email Campaign';

  try {
    let transporter: any = null;
    
    // Create transporter for SMTP/Gmail
    if (defaultConfig.type !== 'resend') {
      transporter = await createTransporter();
    }

    // Send emails with delay between each
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Prepare email content with personalization
        const variables = {
          email: recipient.email,
          name: recipient.name || recipient.email.split('@')[0],
          firstName: recipient.firstName || recipient.name?.split(' ')[0] || '',
          lastName: recipient.lastName || recipient.name?.split(' ').slice(1).join(' ') || '',
          ...recipient
        };

        const subject = replaceVariables(template.subject, variables);
        let htmlContent = replaceVariables(template.htmlContent, variables);
        let textContent = replaceVariables(template.textContent, variables);

        // Add tracking
        if (campaignId) {
          htmlContent = addLinkTracking(htmlContent, campaignId, recipient.email);
          htmlContent += generateTrackingPixel(campaignId, recipient.email);
        }

        // Send email based on provider type
        if (defaultConfig.type === 'resend') {
          await sendEmailWithResend(recipient, subject, htmlContent, fromEmail, fromName);
        } else {
          await transporter.sendMail({
            from: `${fromName} <${fromEmail}>`,
            to: recipient.email,
            subject,
            html: htmlContent,
            text: textContent,
          });
        }

        result.sent++;
        console.log(`Email sent to ${recipient.email} (${result.sent}/${recipients.length})`);

        // Add delay between emails (except for the last one)
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, settings.sendingInterval * 1000));
        }
      } catch (error) {
        result.failed++;
        const errorMessage = `Failed to send to ${recipient.email}: ${error}`;
        result.errors.push(errorMessage);
        console.error(errorMessage);
      }
    }
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Bulk sending failed: ${error}`);
    throw error;
  }

  return result;
}

// Send a single test email
export async function sendTestEmail(recipient: string, template: EmailTemplate, fromEmail?: string, fromName?: string): Promise<boolean> {
  try {
    const result = await sendBulkEmails({
      recipients: [{ email: recipient, name: 'Test User' }],
      template,
      settings: {
        sendingInterval: 0,
        dailyLimit: 1,
        fromEmail,
        fromName
      }
    });

    return result.sent > 0;
  } catch (error) {
    console.error('Test email failed:', error);
    return false;
  }
}

// Verify email configuration
export async function verifyEmailConfig(configId: string): Promise<boolean> {
  try {
    const testResult = await sendTestEmail(
      'test@example.com',
      {
        name: 'Test',
        subject: 'Configuration Test',
        htmlContent: '<p>This is a test email to verify your configuration.</p>',
        textContent: 'This is a test email to verify your configuration.',
        variables: []
      }
    );
    
    return testResult;
  } catch (error) {
    console.error('Email config verification failed:', error);
    return false;
  }
}