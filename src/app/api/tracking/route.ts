import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for tracking data (in production, use a database)
const trackingData: Record<string, {
  campaignId: string;
  contactEmail: string;
  openedAt: string[];
  userAgent?: string;
  ipAddress?: string;
}> = {};

// GET - Track email opens with 1x1 pixel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('id');

    if (!trackingId) {
      // Return a 1x1 transparent pixel even if no tracking ID
      return new NextResponse(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Content-Length': '43',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Parse tracking ID to extract campaign and contact info
    // Format: campaignId.contactEmail.timestamp
    const [campaignId, contactEmail] = trackingId.split('.');

    if (campaignId && contactEmail) {
      // Record the open event
      if (!trackingData[trackingId]) {
        trackingData[trackingId] = {
          campaignId,
          contactEmail: Buffer.from(contactEmail, 'base64').toString(),
          openedAt: [],
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown'
        };
      }

      // Add this open event
      trackingData[trackingId].openedAt.push(new Date().toISOString());

      console.log(`Email opened: Campaign ${campaignId}, Contact ${trackingData[trackingId].contactEmail}`);
    }

    // Always return the 1x1 transparent pixel
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Length': '43',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('Tracking pixel error:', error);

    // Always return a pixel even on error
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Length': '43'
        }
      }
    );
  }
}

// POST - Get tracking statistics
export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json();

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      );
    }

    // Filter tracking data for this campaign
    const campaignTracking = Object.entries(trackingData)
      .filter(([_, data]) => data.campaignId === campaignId)
      .map(([trackingId, data]) => ({
        trackingId,
        contactEmail: data.contactEmail,
        openCount: data.openedAt.length,
        firstOpened: data.openedAt[0],
        lastOpened: data.openedAt[data.openedAt.length - 1],
        userAgent: data.userAgent,
        ipAddress: data.ipAddress
      }));

    const stats = {
      totalRecipients: new Set(campaignTracking.map(t => t.contactEmail)).size,
      totalOpens: campaignTracking.reduce((sum, t) => sum + t.openCount, 0),
      uniqueOpens: campaignTracking.filter(t => t.openCount > 0).length,
      openRate: 0,
      tracking: campaignTracking
    };

    if (stats.totalRecipients > 0) {
      stats.openRate = (stats.uniqueOpens / stats.totalRecipients) * 100;
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Tracking stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get tracking statistics' },
      { status: 500 }
    );
  }
}
