import { NextRequest, NextResponse } from 'next/server';
import { sendBulkEmails } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, recipients, template, settings } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Email template is required' },
        { status: 400 }
      );
    }

    // Start bulk email sending
    const result = await sendBulkEmails({
      campaignId,
      recipients,
      template,
      settings: {
        sendingInterval: settings?.sendingInterval || 5, // seconds between emails
        dailyLimit: settings?.dailyLimit || 500,
        ...settings
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  if (!campaignId) {
    return NextResponse.json(
      { error: 'Campaign ID is required' },
      { status: 400 }
    );
  }

  try {
    // Get campaign status and statistics
    // This would typically fetch from your database
    const stats = {
      campaignId,
      status: 'sending', // or 'completed', 'paused', etc.
      totalRecipients: 100,
      sent: 45,
      failed: 2,
      remaining: 53
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get campaign status:', error);
    return NextResponse.json(
      { error: 'Failed to get campaign status' },
      { status: 500 }
    );
  }
}