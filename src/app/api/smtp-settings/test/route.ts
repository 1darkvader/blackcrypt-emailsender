import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSmtpConfigs } from '@/lib/smtp-storage';

// POST - Test SMTP connection
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

    // Special handling for Gmail/GSuite
    let transportConfig: {
      host?: string;
      port?: number;
      secure?: boolean;
      service?: string;
      auth: {
        user: string;
        pass: string;
      };
      connectionTimeout?: number;
      socketTimeout?: number;
      tls?: {
        rejectUnauthorized?: boolean;
      };
    } = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      connectionTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
    };

    // Gmail-specific optimizations
    if (config.host.includes('gmail') || config.host.includes('google')) {
      transportConfig = {
        service: 'gmail', // Use Gmail service shortcut
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
        connectionTimeout: 15000, // Longer timeout for Gmail
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false // Less strict for Gmail
        }
      };
    }

    // Create transporter with improved configuration
    const transporter = nodemailer.createTransport(transportConfig);

    // Test the connection with timeout
    try {
      console.log('Testing SMTP connection for:', config.host);

      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);

      console.log('SMTP connection successful for:', config.host);

      return NextResponse.json({
        success: true,
        message: 'SMTP connection successful',
        timestamp: new Date().toISOString(),
        details: `Connected to ${config.host}:${config.port}`
      });
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('SMTP connection failed:', errorMessage);

      // Provide helpful error messages for common issues
      let userMessage = errorMessage;
      if (errorMessage.includes('Invalid login')) {
        userMessage = 'Invalid username or password. For Gmail, ensure you\'re using an App Password.';
      } else if (errorMessage.includes('timeout')) {
        userMessage = 'Connection timeout. Check your host and port settings.';
      } else if (errorMessage.includes('ENOTFOUND')) {
        userMessage = 'Host not found. Check your SMTP server address.';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        userMessage = 'Connection refused. Check your port number and firewall settings.';
      }

      return NextResponse.json({
        success: false,
        message: userMessage,
        timestamp: new Date().toISOString(),
        details: errorMessage
      });
    }

  } catch (error) {
    console.error('SMTP test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test SMTP connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
