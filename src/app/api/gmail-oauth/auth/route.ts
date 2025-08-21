import { NextRequest, NextResponse } from 'next/server';
import { getGmailOAuthService } from '@/lib/gmail-oauth';

// GET - Initiate Gmail OAuth flow
export async function GET(request: NextRequest) {
  try {
    const gmailOAuth = getGmailOAuthService();
    const authUrl = gmailOAuth.getAuthUrl();

    return NextResponse.json({
      authUrl,
      message: 'Redirect user to this URL to start Gmail OAuth flow'
    });
  } catch (error: unknown) {
    console.error('Failed to generate Gmail OAuth URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate OAuth URL',
        details: error.message,
        hint: 'Make sure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set in environment variables'
      },
      { status: 500 }
    );
  }
}
