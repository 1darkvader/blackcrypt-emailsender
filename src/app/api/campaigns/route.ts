import { NextRequest, NextResponse } from 'next/server';

interface Contact {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

interface CampaignSettings {
  sendingInterval: number;
  dailyLimit: number;
  startTime?: string;
  emailProvider: 'gmail' | 'smtp' | 'custom';
}

interface Campaign {
  id: string;
  name: string;
  contacts: Contact[];
  template: EmailTemplate;
  settings: CampaignSettings;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'stopped';
  createdAt: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
}

// In-memory storage (in production, use a database)
// Start with empty campaigns - no demo data
const campaigns: Campaign[] = [];

// GET - List all campaigns
export async function GET() {
  try {
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const campaignData = await request.json();

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignData.name,
      contacts: campaignData.contacts,
      template: campaignData.template,
      settings: campaignData.settings,
      status: 'draft',
      createdAt: new Date().toISOString(),
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0
      }
    };

    campaigns.push(newCampaign);

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// PUT - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const updateRequest = await request.json();
    const { id, ...updateData } = updateRequest;

    const campaignIndex = campaigns.findIndex(c => c.id === id);
    if (campaignIndex === -1) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    campaigns[campaignIndex] = {
      ...campaigns[campaignIndex],
      ...updateData
    };

    return NextResponse.json(campaigns[campaignIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      );
    }

    const campaignIndex = campaigns.findIndex(c => c.id === id);
    if (campaignIndex === -1) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    campaigns.splice(campaignIndex, 1);

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
