import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for click tracking data (in production, use a database)
const clickData: Record<string, {
  campaignId: string;
  contactEmail: string;
  originalUrl: string;
  clickedAt: string[];
  userAgent?: string;
  ipAddress?: string;
}> = {};

// GET - Track clicks and redirect to original URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');
    const url = searchParams.get('url');

    if (!linkId || !url) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Parse link ID to extract campaign and contact info
    // Format: campaignId.contactEmail.linkIndex.timestamp
    const [campaignId, contactEmail, linkIndex] = linkId.split('.');

    if (campaignId && contactEmail) {
      const decodedEmail = Buffer.from(contactEmail, 'base64').toString();
      const decodedUrl = Buffer.from(url, 'base64').toString();

      // Record the click event
      if (!clickData[linkId]) {
        clickData[linkId] = {
          campaignId,
          contactEmail: decodedEmail,
          originalUrl: decodedUrl,
          clickedAt: [],
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown'
        };
      }

      // Add this click event
      clickData[linkId].clickedAt.push(new Date().toISOString());

      console.log(`Link clicked: Campaign ${campaignId}, Contact ${decodedEmail}, URL: ${decodedUrl}`);

      // Redirect to the original URL
      return NextResponse.redirect(decodedUrl, 302);
    }

    // If we can't parse the link ID, just redirect to the URL
    const decodedUrl = Buffer.from(url, 'base64').toString();
    return NextResponse.redirect(decodedUrl, 302);

  } catch (error) {
    console.error('Link redirect error:', error);

    // Try to redirect to the URL even on error
    try {
      const url = new URL(request.url).searchParams.get('url');
      if (url) {
        const decodedUrl = Buffer.from(url, 'base64').toString();
        return NextResponse.redirect(decodedUrl, 302);
      }
    } catch {
      // Fall back to a generic error page
    }

    return NextResponse.json(
      { error: 'Failed to redirect' },
      { status: 500 }
    );
  }
}

// POST - Get click tracking statistics
export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json();

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      );
    }

    // Filter click data for this campaign
    const campaignClicks = Object.entries(clickData)
      .filter(([_, data]) => data.campaignId === campaignId)
      .map(([linkId, data]) => ({
        linkId,
        contactEmail: data.contactEmail,
        originalUrl: data.originalUrl,
        clickCount: data.clickedAt.length,
        firstClicked: data.clickedAt[0],
        lastClicked: data.clickedAt[data.clickedAt.length - 1],
        userAgent: data.userAgent,
        ipAddress: data.ipAddress
      }));

    const stats = {
      totalClicks: campaignClicks.reduce((sum, c) => sum + c.clickCount, 0),
      uniqueClicks: campaignClicks.filter(c => c.clickCount > 0).length,
      clickedContacts: new Set(campaignClicks.map(c => c.contactEmail)).size,
      topLinks: {} as Record<string, number>,
      clicks: campaignClicks
    };

    // Calculate top clicked links
    campaignClicks.forEach(click => {
      if (!stats.topLinks[click.originalUrl]) {
        stats.topLinks[click.originalUrl] = 0;
      }
      stats.topLinks[click.originalUrl] += click.clickCount;
    });

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Click tracking stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get click tracking statistics' },
      { status: 500 }
    );
  }
}
