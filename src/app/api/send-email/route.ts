import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaign,
  updateCampaign,
  getDefaultEmailConfig,
  saveAnalyticsEvent,
  type Campaign
} from '@/lib/server-storage';
import { emailService } from '@/lib/email-service';

// Interface for email sending request
interface SendEmailRequest {
  campaignId?: string;
  to: string;
  from?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailConfigId?: string;
  trackingEnabled?: boolean;
}

// POST - Send email (single or campaign)
export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const {
      campaignId,
      to,
      from,
      subject,
      htmlContent,
      textContent,
      emailConfigId,
      trackingEnabled = true
    } = body;

    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, htmlContent' },
        { status: 400 }
      );
    }

    // Get email configuration
    let emailConfig;
    if (emailConfigId) {
      const configs = await import('@/lib/server-storage').then(m => m.getEmailConfigs());
      emailConfig = (await configs).find(config => config.id === emailConfigId);
    } else {
      emailConfig = await getDefaultEmailConfig();
    }

    if (!emailConfig) {
      return NextResponse.json(
        { error: 'No email configuration found. Please set up an email provider first.' },
        { status: 400 }
      );
    }

    if (!emailConfig.isActive) {
      return NextResponse.json(
        { error: 'Selected email configuration is inactive' },
        { status: 400 }
      );
    }

    // Prepare email data
    const fromAddress = from || emailConfig.config.email || 'noreply@example.com';

    let processedHtml = htmlContent;
    let trackingPixel: string | undefined;

    // Add tracking if enabled and campaign exists
    if (trackingEnabled && campaignId) {
      trackingPixel = emailService.generateTrackingPixel(campaignId, to);

      // Process links for click tracking
      processedHtml = htmlContent.replace(
        /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
        (match, before, url, after) => {
          if (url.startsWith('http') && !url.includes('/api/link-redirect')) {
            const trackedUrl = emailService.generateClickTrackingUrl(campaignId, to, url);
            return `<a ${before}href="${trackedUrl}"${after}>`;
          }
          return match;
        }
      );
    }

    const emailData = {
      to,
      from: fromAddress,
      subject,
      html: processedHtml,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      trackingPixel
    };

    // Send the email
    const result = await emailService.sendEmail(emailConfig, emailData);

    if (result.success) {
      // Record analytics event if campaign exists
      if (campaignId) {
        await saveAnalyticsEvent(campaignId, {
          type: 'sent',
          contactEmail: to,
          timestamp: new Date().toISOString(),
          data: {
            provider: result.provider,
            messageId: result.messageId
          }
        });

        // Update campaign stats
        const campaign = await getCampaign(campaignId);
        if (campaign) {
          const updatedStats = {
            ...campaign.stats,
            sent: campaign.stats.sent + 1
          };

          await updateCampaign(campaignId, { stats: updatedStats });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        provider: result.provider
      });
    } else {
      // Record failed send if campaign exists
      if (campaignId) {
        await saveAnalyticsEvent(campaignId, {
          type: 'bounced',
          contactEmail: to,
          timestamp: new Date().toISOString(),
          data: {
            error: result.error,
            provider: result.provider
          }
        });

        // Update campaign stats
        const campaign = await getCampaign(campaignId);
        if (campaign) {
          const updatedStats = {
            ...campaign.stats,
            failed: campaign.stats.failed + 1
          };

          await updateCampaign(campaignId, { stats: updatedStats });
        }
      }

      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: result.error,
          provider: result.provider
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET - Process campaign queue (for scheduled sends)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const campaign = await getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.status !== 'sending') {
      return NextResponse.json(
        { error: 'Campaign is not in sending status' },
        { status: 400 }
      );
    }

    // Get email configuration
    const configs = await import('@/lib/server-storage').then(m => m.getEmailConfigs());
    const emailConfig = (await configs).find(config => config.id === campaign.emailConfigId);

    if (!emailConfig || !emailConfig.isActive) {
      return NextResponse.json(
        { error: 'Campaign email configuration not available' },
        { status: 400 }
      );
    }

    // Process pending emails in queue
    const now = new Date();
    const pendingEmails = campaign.queue.filter(
      item => item.status === 'pending' && new Date(item.scheduledAt) <= now
    );

    if (pendingEmails.length === 0) {
      return NextResponse.json({
        message: 'No emails ready to send',
        processed: 0
      });
    }

    // Process a batch of emails (limit to prevent timeout)
    const batchSize = Math.min(pendingEmails.length, 10);
    const emailsToProcess = pendingEmails.slice(0, batchSize);

    let sent = 0;
    let failed = 0;

    for (const queueItem of emailsToProcess) {
      try {
        const contact = campaign.contacts.find(c => c.email === queueItem.contactId);
        if (!contact) continue;

        // Personalize email content
        let personalizedSubject = campaign.template.subject;
        let personalizedHtml = campaign.template.htmlContent;
        let personalizedText = campaign.template.textContent;

        // Replace variables
        Object.entries(contact).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value || '');
          personalizedHtml = personalizedHtml.replace(new RegExp(placeholder, 'g'), value || '');
          personalizedText = personalizedText.replace(new RegExp(placeholder, 'g'), value || '');
        });

        // Send email
        const emailData = {
          to: contact.email,
          from: emailConfig.config.email || 'noreply@example.com',
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          trackingPixel: emailService.generateTrackingPixel(campaign.id, contact.email)
        };

        const result = await emailService.sendEmail(emailConfig, emailData);

        if (result.success) {
          queueItem.status = 'sent';
          queueItem.sentAt = new Date().toISOString();
          sent++;

          // Record analytics
          await saveAnalyticsEvent(campaign.id, {
            type: 'sent',
            contactEmail: contact.email,
            timestamp: new Date().toISOString(),
            data: {
              provider: result.provider,
              messageId: result.messageId
            }
          });
        } else {
          queueItem.status = 'failed';
          queueItem.error = result.error;
          failed++;

          // Record failure
          await saveAnalyticsEvent(campaign.id, {
            type: 'bounced',
            contactEmail: contact.email,
            timestamp: new Date().toISOString(),
            data: {
              error: result.error,
              provider: result.provider
            }
          });
        }
      } catch (error: unknown) {
        queueItem.status = 'failed';
        queueItem.error = error.message;
        failed++;
      }

      // Add delay between sends to respect rate limits
      if (campaign.settings.sendingInterval > 0) {
        await new Promise(resolve => setTimeout(resolve, campaign.settings.sendingInterval * 1000));
      }
    }

    // Update campaign with new queue status and stats
    const updatedStats = {
      ...campaign.stats,
      sent: campaign.stats.sent + sent,
      failed: campaign.stats.failed + failed
    };

    // Check if campaign is complete
    const remainingPending = campaign.queue.filter(item => item.status === 'pending').length - emailsToProcess.length;
    const newStatus = remainingPending === 0 ? 'completed' : 'sending';

    await updateCampaign(campaign.id, {
      queue: campaign.queue,
      stats: updatedStats,
      status: newStatus
    });

    return NextResponse.json({
      message: `Processed ${emailsToProcess.length} emails`,
      sent,
      failed,
      remaining: remainingPending,
      campaignStatus: newStatus
    });
  } catch (error: unknown) {
    console.error('Campaign processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process campaign queue' },
      { status: 500 }
    );
  }
}
