interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

interface IntegrationConfig {
  name: string;
  icon: string;
  description: string;
  config: OAuthConfig;
  isActive: boolean;
}

class OAuthManager {
  private integrations: Map<string, IntegrationConfig> = new Map();

  constructor() {
    this.initializeIntegrations();
  }

  private initializeIntegrations() {
    // Gmail integration
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.integrations.set('gmail', {
        name: 'Gmail',
        icon: '📧',
        description: 'Send and manage emails through Gmail',
        isActive: true,
        config: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/gmail`,
          scopes: [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify'
          ],
          authUrl: 'https://accounts.google.com/o/oauth2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
        },
      });
    }

    // Slack integration
    if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) {
      this.integrations.set('slack', {
        name: 'Slack',
        icon: '💬',
        description: 'Send messages and manage Slack workspaces',
        isActive: true,
        config: {
          clientId: process.env.SLACK_CLIENT_ID,
          clientSecret: process.env.SLACK_CLIENT_SECRET,
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/slack`,
          scopes: [
            'chat:write',
            'channels:read',
            'users:read',
            'files:write'
          ],
          authUrl: 'https://slack.com/oauth/v2/authorize',
          tokenUrl: 'https://slack.com/api/oauth.v2.access',
        },
      });
    }

    // Notion integration
    if (process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET) {
      this.integrations.set('notion', {
        name: 'Notion',
        icon: '📝',
        description: 'Create and manage Notion pages and databases',
        isActive: true,
        config: {
          clientId: process.env.NOTION_CLIENT_ID,
          clientSecret: process.env.NOTION_CLIENT_SECRET,
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/notion`,
          scopes: [],
          authUrl: 'https://api.notion.com/v1/oauth/authorize',
          tokenUrl: 'https://api.notion.com/v1/oauth/token',
        },
      });
    }
  }

  getIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  getIntegration(platform: string): IntegrationConfig | undefined {
    return this.integrations.get(platform);
  }

  generateAuthUrl(platform: string, state?: string): string | null {
    const integration = this.integrations.get(platform);
    if (!integration) return null;

    const { config } = integration;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      ...(state && { state }),
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    platform: string,
    code: string,
    state?: string
  ): Promise<OAuthTokens | null> {
    const integration = this.integrations.get(platform);
    if (!integration) return null;

    const { config } = integration;

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.redirectUri,
        }),
      });

      if (!response.ok) {
        console.error(`OAuth token exchange failed for ${platform}:`, response.statusText);
        return null;
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in 
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
        scope: data.scope,
      };
    } catch (error) {
      console.error(`Error exchanging code for tokens (${platform}):`, error);
      return null;
    }
  }

  async refreshAccessToken(
    platform: string,
    refreshToken: string
  ): Promise<OAuthTokens | null> {
    const integration = this.integrations.get(platform);
    if (!integration) return null;

    const { config } = integration;

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        console.error(`OAuth token refresh failed for ${platform}:`, response.statusText);
        return null;
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Some providers don't return new refresh token
        expiresAt: data.expires_in 
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
        scope: data.scope,
      };
    } catch (error) {
      console.error(`Error refreshing access token (${platform}):`, error);
      return null;
    }
  }

  async testConnection(platform: string, accessToken: string): Promise<boolean> {
    try {
      switch (platform) {
        case 'gmail':
          const gmailResponse = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/profile',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          return gmailResponse.ok;

        case 'slack':
          const slackResponse = await fetch(
            'https://slack.com/api/auth.test',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const slackData = await slackResponse.json();
          return slackData.ok === true;

        case 'notion':
          const notionResponse = await fetch(
            'https://api.notion.com/v1/users/me',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28',
              },
            }
          );
          return notionResponse.ok;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Connection test failed for ${platform}:`, error);
      return false;
    }
  }
}

export const oauthManager = new OAuthManager();
export type { OAuthTokens, IntegrationConfig }; 