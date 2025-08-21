import { NextRequest, NextResponse } from 'next/server';
import { getSmtpConfigs, setDefaultSmtpConfig } from '@/lib/smtp-storage';

// POST - Set default SMTP configuration
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID required' },
        { status: 400 }
      );
    }

    // Find the configuration
    const config = getSmtpConfigs().find(c => c.id === id);
    if (!config) {
      return NextResponse.json(
        { error: 'SMTP configuration not found' },
        { status: 404 }
      );
    }

    const success = setDefaultSmtpConfig(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to set default SMTP configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Default SMTP configuration updated successfully',
      defaultConfig: config
    });

  } catch (error) {
    console.error('Set default SMTP error:', error);
    return NextResponse.json(
      { error: 'Failed to set default SMTP configuration' },
      { status: 500 }
    );
  }
}
