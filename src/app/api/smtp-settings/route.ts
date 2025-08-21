import { NextRequest, NextResponse } from 'next/server';
import {
  getSmtpConfigs,
  addSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
  type SMTPConfig
} from '@/lib/smtp-storage';

// GET - List all SMTP configurations
export async function GET() {
  try {
    return NextResponse.json(getSmtpConfigs());
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SMTP configurations' },
      { status: 500 }
    );
  }
}

// POST - Create new SMTP configuration
export async function POST(request: NextRequest) {
  try {
    const configData = await request.json();

    const newConfig = addSmtpConfig({
      name: configData.name,
      host: configData.host,
      port: configData.port,
      secure: configData.secure,
      auth: {
        user: configData.auth.user,
        pass: configData.auth.pass
      }
    });

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create SMTP configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update SMTP configuration
export async function PUT(request: NextRequest) {
  try {
    const updateRequest = await request.json();
    const { id, ...updateData } = updateRequest;

    const configs = getSmtpConfigs();
    const currentConfig = configs.find(c => c.id === id);

    if (!currentConfig) {
      return NextResponse.json(
        { error: 'SMTP configuration not found' },
        { status: 404 }
      );
    }

    // Don't update password if it's empty (keep existing)
    const updatedAuth = {
      user: updateData.auth.user,
      pass: updateData.auth.pass || currentConfig.auth.pass
    };

    const updatedConfig = updateSmtpConfig(id, {
      name: updateData.name,
      host: updateData.host,
      port: updateData.port,
      secure: updateData.secure,
      auth: updatedAuth
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update SMTP configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Delete SMTP configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID required' },
        { status: 400 }
      );
    }

    const success = deleteSmtpConfig(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Cannot delete the default SMTP configuration or configuration not found.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'SMTP configuration deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete SMTP configuration' },
      { status: 500 }
    );
  }
}
