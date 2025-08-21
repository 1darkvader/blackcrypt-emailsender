import { NextRequest, NextResponse } from 'next/server';
import { getGmailOAuthService } from '@/lib/gmail-oauth';
import { getEmailConfigs, saveEmailConfigs, type EmailConfig } from '@/lib/server-storage';

// GET - Handle OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/?oauth-error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?oauth-error=no-code', request.url)
      );
    }

    const gmailOAuth = getGmailOAuthService();

    // Exchange code for tokens
    const tokens = await gmailOAuth.getTokens(code);

    // Get user info
    const userInfo = await gmailOAuth.getUserInfo(tokens.accessToken);

    // Check if user already has a Gmail config
    const configs = await getEmailConfigs();
    const existingGmailConfig = configs.find(
      config => config.type === 'gmail-oauth' && config.config.email === userInfo.email
    );

    if (existingGmailConfig) {
      // Update existing config with new tokens
      existingGmailConfig.config = {
        ...existingGmailConfig.config,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiryDate
      };
      existingGmailConfig.isActive = true;
      existingGmailConfig.lastUsed = new Date().toISOString();

      await saveEmailConfigs(configs);

      return NextResponse.redirect(
        new URL('/?oauth-success=updated&email=' + encodeURIComponent(userInfo.email), request.url)
      );
    } else {
      // Create new Gmail OAuth config
      const newConfig: EmailConfig = {
        id: Date.now().toString(),
        name: `Gmail - ${userInfo.name}`,
        type: 'gmail-oauth',
        isDefault: configs.length === 0, // First config becomes default
        isActive: true,
        createdAt: new Date().toISOString(),
        config: {
          email: userInfo.email,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiryDate: tokens.expiryDate
        }
      };

      // If this is the default, unset others
      if (newConfig.isDefault) {
        configs.forEach(config => config.isDefault = false);
      }

      configs.push(newConfig);
      await saveEmailConfigs(configs);

      return NextResponse.redirect(
        new URL('/?oauth-success=connected&email=' + encodeURIComponent(userInfo.email), request.url)
      );
    }
  } catch (error: unknown) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?oauth-error=' + encodeURIComponent(error instanceof Error ? error.message : 'callback-failed'), request.url)
    );
  }
}

// Handle POST requests (for manual token submission)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const gmailOAuth = getGmailOAuthService();

    // Exchange code for tokens
    const tokens = await gmailOAuth.getTokens(code);

    // Get user info
    const userInfo = await gmailOAuth.getUserInfo(tokens.accessToken);

    // Test Gmail API access
    const testResult = await gmailOAuth.testGmailAccess(tokens.accessToken);

    if (!testResult.success) {
      return NextResponse.json(
        {
          error: 'Gmail API access test failed',
          details: testResult.error
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userInfo,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiryDate
      },
      message: 'Gmail OAuth completed successfully'
    });
  } catch (error: unknown) {
    console.error('OAuth token exchange error:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete OAuth flow',
        details: error.message
      },
      { status: 500 }
    );
  }
}
