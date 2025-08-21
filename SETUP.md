# 🚀 Email Campaign Sender - Production Setup Guide

## Overview

Your email campaign sender now uses a **hybrid approach** with:
- ✅ **Gmail Workspace OAuth** - Secure authentication with your actual Gmail account
- ✅ **Resend API** - Reliable email delivery service
- ✅ **Server-side persistence** - No database needed, uses JSON files
- ✅ **Real campaign queue** - Proper email sending management

## 🔧 Setup Instructions

### 1. Gmail OAuth Setup (Recommended)

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API" and enable it

#### Step 2: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/gmail-oauth/callback`
   - For production: `https://yourdomain.com/api/gmail-oauth/callback`
5. Save and copy the Client ID and Client Secret

#### Step 3: Configure Environment Variables
Create a `.env.local` file:
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail-oauth/callback
NEXTAUTH_URL=http://localhost:3000
```

### 2. Resend API Setup (Alternative/Backup)

1. Sign up at [Resend](https://resend.com)
2. Create an API key in your dashboard
3. Add to `.env.local`:
```bash
RESEND_API_KEY=re_your_api_key_here
```

### 3. Domain Configuration (For Production)

For production deployment:
```bash
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/gmail-oauth/callback
NEXTAUTH_URL=https://yourdomain.com
EMAIL_TRACKING_DOMAIN=https://yourdomain.com
```

## 📧 Using the System

### Option 1: Gmail Workspace (Recommended)
1. Go to Settings tab in the app
2. Click "Add Email Provider"
3. Select "Gmail Workspace"
4. Click "Connect Gmail Workspace"
5. Authenticate with your Google account
6. ✅ Ready to send!

**Benefits:**
- Send from your actual Gmail address
- Best deliverability rates
- No additional costs
- OAuth security

### Option 2: Resend API
1. Go to Settings tab in the app
2. Click "Add Email Provider"
3. Select "Resend API"
4. Enter your API key
5. ✅ Ready to send!

**Benefits:**
- High deliverability
- Built-in analytics
- 3,000 emails/month free
- Easy setup

### Option 3: Custom SMTP
1. Go to Settings tab
2. Click "Add Email Provider"
3. Select "Custom SMTP"
4. Enter your SMTP details
5. ✅ Ready to send!

## 🎯 How It Works

### Campaign Sending Process
1. **Create Campaign** - Upload CSV, design email
2. **Queue Generation** - System creates sending queue
3. **Smart Sending** - Respects rate limits and intervals
4. **Real-time Tracking** - Open/click tracking
5. **Analytics** - Detailed performance metrics

### Data Persistence
- **No Database Required** - Uses JSON files in `/data` directory
- **Email Configs** - Stored securely with OAuth tokens
- **Campaign Data** - Queue status and analytics
- **Contact Lists** - Persistent across sessions

### Security Features
- OAuth tokens stored server-side only
- API keys hidden from frontend
- Automatic token refresh for Gmail
- Secure tracking URLs

## 🔥 Production Deployment

### Environment Setup
```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### Netlify Deployment
1. Set environment variables in Netlify dashboard
2. Deploy with existing configuration
3. Update OAuth redirect URI to production domain
4. ✅ Production ready!

### Custom Domain
1. Point domain to Netlify
2. Update environment variables
3. Update Google OAuth settings
4. ✅ Professional setup complete!

## 📊 Features Included

### ✅ Email Providers
- Gmail Workspace OAuth
- Resend API integration
- Custom SMTP support
- Provider health monitoring

### ✅ Campaign Management
- CSV contact upload
- Email template editor
- Campaign scheduling
- Queue management
- Real-time status tracking

### ✅ Analytics & Tracking
- Email open tracking
- Click tracking
- Delivery status
- Performance metrics
- Campaign analytics

### ✅ Enterprise Features
- Proxy rotation support
- Email deliverability tools
- DNS setup assistance
- Rate limiting
- Bulk operations

## 🆘 Troubleshooting

### Gmail OAuth Issues
1. Check redirect URI matches exactly
2. Ensure Gmail API is enabled
3. Verify OAuth consent screen setup
4. Check environment variables

### Email Sending Issues
1. Verify email provider status in Settings
2. Check rate limits and intervals
3. Review campaign queue status
4. Check server logs for errors

### General Issues
1. Clear browser cache
2. Restart development server
3. Check environment variables
4. Verify file permissions for `/data` directory

## 🎉 Success!

You now have a production-ready email campaign system with:
- ✅ Reliable email sending
- ✅ Professional OAuth authentication
- ✅ Persistent data storage
- ✅ Real-time analytics
- ✅ Enterprise features

**Ready to send your first campaign!** 🚀
