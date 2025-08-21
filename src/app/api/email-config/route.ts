import { NextRequest, NextResponse } from 'next/server';
import {
  getEmailConfigs,
  saveEmailConfigs,
  getDefaultEmailConfig,
  type EmailConfig
} from '@/lib/server-storage';
import { emailService } from '@/lib/email-service';

// GET - List all email configurations
export async function GET() {
  try {
    const configs = await getEmailConfigs();

    // Remove sensitive data before sending to client
    const sanitizedConfigs = configs.map(config => ({
      ...config,
      config: {
        ...config.config,
        // Hide sensitive fields
        apiKey: config.config.apiKey ? '***HIDDEN***' : undefined,
        accessToken: config.config.accessToken ? '***HIDDEN***' : undefined,
        refreshToken: config.config.refreshToken ? '***HIDDEN***' : undefined,
        password: config.config.password ? '***HIDDEN***' : undefined
      }
    }));

    return NextResponse.json(sanitizedConfigs);
  } catch (error) {
    console.error('Failed to get email configs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve email configurations' },
      { status: 500 }
    );
  }
}

// POST - Create new email configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, config } = body;

    if (!name || !type || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, config' },
        { status: 400 }
      );
    }

    // Validate configuration based on type
    if (type === 'resend' && !config.apiKey) {
      return NextResponse.json(
        { error: 'Resend API key is required' },
        { status: 400 }
      );
    }

    if (type === 'gmail-oauth' && (!config.accessToken || !config.refreshToken)) {
      return NextResponse.json(
        { error: 'Gmail OAuth tokens are required' },
        { status: 400 }
      );
    }

    if (type === 'smtp' && (!config.host || !config.port || !config.username)) {
      return NextResponse.json(
        { error: 'SMTP configuration incomplete' },
        { status: 400 }
      );
    }

    const configs = await getEmailConfigs();

    // Check if this is the first config (make it default)
    const isFirst = configs.length === 0;

    const newConfig: EmailConfig = {
      id: Date.now().toString(),
      name,
      type,
      isDefault: isFirst,
      isActive: false, // Will be set to true after successful test
      createdAt: new Date().toISOString(),
      config: {
        ...config,
        // Set email from OAuth if available
        email: config.email || config.username
      }
    };

    // Test the configuration
    const testResult = await emailService.testConfig(newConfig);

    if (testResult.success) {
      newConfig.isActive = true;

      // If this is set as default, unset others
      if (newConfig.isDefault) {
        configs.forEach(config => config.isDefault = false);
      }

      configs.push(newConfig);
      await saveEmailConfigs(configs);

      return NextResponse.json({
        message: 'Email configuration created and tested successfully',
        config: {
          ...newConfig,
          config: {
            ...newConfig.config,
            // Hide sensitive data in response
            apiKey: newConfig.config.apiKey ? '***HIDDEN***' : undefined,
            accessToken: newConfig.config.accessToken ? '***HIDDEN***' : undefined,
            refreshToken: newConfig.config.refreshToken ? '***HIDDEN***' : undefined,
            password: newConfig.config.password ? '***HIDDEN***' : undefined
          }
        }
      });
    } else {
      return NextResponse.json(
        {
          error: 'Configuration test failed',
          details: testResult.error
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to create email config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create email configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update email configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const configs = await getEmailConfigs();
    const configIndex = configs.findIndex(config => config.id === id);

    if (configIndex === -1) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Update the configuration
    const updatedConfig = {
      ...configs[configIndex],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // If setting as default, unset others
    if (updates.isDefault) {
      configs.forEach(config => config.isDefault = false);
    }

    // Test updated configuration if config data changed
    if (updates.config) {
      const testResult = await emailService.testConfig(updatedConfig);
      updatedConfig.isActive = testResult.success;

      if (!testResult.success) {
        return NextResponse.json(
          {
            error: 'Updated configuration test failed',
            details: testResult.error
          },
          { status: 400 }
        );
      }
    }

    configs[configIndex] = updatedConfig;
    await saveEmailConfigs(configs);

    return NextResponse.json({
      message: 'Email configuration updated successfully',
      config: {
        ...updatedConfig,
        config: {
          ...updatedConfig.config,
          // Hide sensitive data
          apiKey: updatedConfig.config.apiKey ? '***HIDDEN***' : undefined,
          accessToken: updatedConfig.config.accessToken ? '***HIDDEN***' : undefined,
          refreshToken: updatedConfig.config.refreshToken ? '***HIDDEN***' : undefined,
          password: updatedConfig.config.password ? '***HIDDEN***' : undefined
        }
      }
    });
  } catch (error: unknown) {
    console.error('Failed to update email config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update email configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Remove email configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const configs = await getEmailConfigs();
    const configIndex = configs.findIndex(config => config.id === id);

    if (configIndex === -1) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    const configToDelete = configs[configIndex];
    configs.splice(configIndex, 1);

    // If deleted config was default, set another as default
    if (configToDelete.isDefault && configs.length > 0) {
      configs[0].isDefault = true;
    }

    await saveEmailConfigs(configs);

    return NextResponse.json({
      message: 'Email configuration deleted successfully'
    });
  } catch (error: unknown) {
    console.error('Failed to delete email config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete email configuration' },
      { status: 500 }
    );
  }
}
