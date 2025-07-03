# Vercel Deployment Guide

This guide explains how to deploy this Next.js application to Vercel and configure the required environment variables.

## Prerequisites

1. A Vercel account
2. Your project pushed to a GitHub repository
3. Google OAuth credentials (for authentication)

## Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

## Step 2: Configure Environment Variables

Before deploying, you need to set up the following environment variables in your Vercel project:

### Required Environment Variables

1. **Google OAuth Configuration** (for authentication)
   - Variable name: `GOOGLE_CLIENT_ID`
   - Value: Your Google OAuth Client ID from Google Cloud Console
   
   - Variable name: `GOOGLE_CLIENT_SECRET`
   - Value: Your Google OAuth Client Secret from Google Cloud Console

2. **NextAuth Configuration**
   - Variable name: `NEXTAUTH_URL`
   - Value: Your production URL (e.g., `https://your-app.vercel.app`)
   
   - Variable name: `NEXTAUTH_SECRET`
   - Value: A random string for session encryption (generate one using `openssl rand -base64 32`)

### How to Set Environment Variables in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add each variable with the exact name and value
3. Make sure to select **Production**, **Preview**, and **Development** environments
4. Click **Save**

## Step 3: Deploy

1. After setting up environment variables, go to **Deployments**
2. Click **Redeploy** on your latest deployment or push new changes to trigger a new deployment
3. The build should now succeed without the environment variable errors

## Step 4: Verify Deployment

1. Check that your app loads without errors
2. Test Google OAuth login (should work if Google credentials are set)
3. Test the chat functionality with Cypher Alpha AI

## Troubleshooting

### Google OAuth Not Working

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Make sure your Google OAuth redirect URI includes your Vercel domain
- Check that `NEXTAUTH_URL` is set to your production URL

### Environment Variables Not Available

- Environment variables are only available at runtime, not build time
- The app has been updated to handle missing environment variables gracefully
- If variables are missing, the app will show appropriate error messages

## Security Notes

- Never commit API keys or secrets to your repository
- Use Vercel's environment variable system for all sensitive data
- Regularly rotate your API keys and secrets
- Consider using Vercel's preview deployments to test changes safely

## Local Development

For local development, create a `.env.local` file in your project root with the same environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

Make sure `.env.local` is in your `.gitignore` file to prevent accidentally committing secrets.

## AI Integration

This application is integrated with **Cypher Alpha** through OpenRouter API:

### Features
- Real-time chat with Cypher Alpha AI model
- Professional chat interface with message history
- Loading states and error handling
- Responsive design for all devices

### Technical Details
- **AI Model**: `openrouter/cypher-alpha:free`
- **API Provider**: OpenRouter
- **Endpoint**: `/api/chat`
- **Max Tokens**: 1000
- **Temperature**: 0.7

### Customization
You can easily modify the AI integration by:
1. Changing the model in `app/api/chat/route.ts`
2. Adjusting parameters like `max_tokens` and `temperature`
3. Adding system prompts or conversation context
4. Implementing different AI providers

The chat interface is fully functional and ready for production use with Cypher Alpha. 