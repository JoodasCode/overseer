# Environment Variables for Plugin Engine

This document lists all the environment variables required for the Plugin Engine to function properly.

## Supabase Configuration

```
# Supabase URL (available in your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Service Role Key (available in your Supabase dashboard)
# Note: This is a sensitive key with admin privileges, keep it secure
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Upstash Redis Configuration

```
# Upstash Redis REST URL
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io

# Upstash Redis REST Token
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## OAuth Credentials

### Gmail

```
# Google OAuth credentials for Gmail integration
GMAIL_CLIENT_ID=your-google-client-id
GMAIL_CLIENT_SECRET=your-google-client-secret
```

### Notion

```
# Notion OAuth credentials
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret
```

### Slack

```
# Slack OAuth credentials
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
```

## Application Configuration

```
# Base URL of your application (used for OAuth callback URLs)
NEXT_PUBLIC_APP_URL=https://your-app-url.com

# Secret token for securing cron job endpoints
CRON_SECRET_TOKEN=your-secure-random-token
```

## Development Configuration

```
# Set to 'true' to enable mock responses for development
PLUGIN_ENGINE_MOCK_RESPONSES=false

# Set to 'true' to enable detailed logging
PLUGIN_ENGINE_DEBUG=false
```

## How to Use

1. Create a `.env.local` file in the root of your project
2. Copy the variables you need from this file
3. Replace the placeholder values with your actual credentials
4. Make sure to add `.env.local` to your `.gitignore` file to avoid committing sensitive information

For production deployment, set these environment variables in your hosting platform's environment configuration.
