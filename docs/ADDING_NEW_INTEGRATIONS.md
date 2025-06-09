# 🔧 Adding New Integrations to Overseer Agent OS

**Version**: 1.0  
**Target Audience**: Developers extending the Universal Integrations Core  
**Prerequisites**: Understanding of OAuth 2.0, REST APIs, and TypeScript

---

## 🎯 **Overview**

The Universal Integrations Core (UIC) provides a standardized framework for connecting agents to external tools. This guide walks through adding new integrations to expand agent capabilities.

---

## 🏗️ **Integration Architecture**

### **Core Components**
1. **Adapter** (`lib/integrations/adapters/`) - Tool-specific implementation
2. **OAuth Flow** (`app/api/integrations/oauth/`) - Authentication handling
3. **Tool Registration** - UIC configuration and capabilities
4. **Frontend Hooks** (`lib/hooks/use-integrations.ts`) - UI integration

### **Integration Flow**
```
Agent Command → UIC Router → Tool Adapter → External API → Response
     ↑                                                        ↓
   Chat UI ← Frontend Hook ← API Gateway ← Error Handling ← Cache
```

---

## 🚀 **Step-by-Step Implementation**

### **1. Create the Tool Adapter**

Create a new file: `lib/integrations/adapters/{tool-name}.ts`

```typescript
import { IntegrationAdapter, IntegrationAction, IntegrationCapability } from '../types';

export class AsanaAdapter implements IntegrationAdapter {
  name = 'asana';
  
  async executeAction(action: IntegrationAction, params: any, authToken: string): Promise<any> {
    const { action: actionType, ...actionParams } = action;
    
    switch (actionType) {
      case 'createTask':
        return this.createTask(actionParams, authToken);
      case 'listProjects':
        return this.listProjects(authToken);
      default:
        throw new Error(`Unknown action: ${actionType}`);
    }
  }
  
  async getCapabilities(): Promise<IntegrationCapability[]> {
    return [
      {
        action: 'createTask',
        description: 'Create a new task in Asana',
        parameters: {
          name: { type: 'string', required: true },
          notes: { type: 'string', required: false },
          projectId: { type: 'string', required: true }
        }
      },
      {
        action: 'listProjects', 
        description: 'List all accessible projects',
        parameters: {}
      }
    ];
  }
  
  async disconnect(userId: string): Promise<void> {
    // Remove stored auth tokens for this user
    // Implementation depends on your auth storage strategy
  }
  
  private async createTask(params: any, authToken: string) {
    const response = await fetch('https://app.asana.com/api/1.0/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          name: params.name,
          notes: params.notes,
          projects: [params.projectId]
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Asana API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async listProjects(authToken: string) {
    const response = await fetch('https://app.asana.com/api/1.0/projects', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Asana API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### **2. Register the OAuth Flow**

Create: `app/api/integrations/oauth/callback/asana/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ASANA_CLIENT_ID!,
        client_secret: process.env.ASANA_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback/asana`,
        code
      })
    });
    
    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }
    
    // Store tokens in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const userId = state; // Passed from authorization URL
    
    await supabase
      .from('integration_tokens')
      .upsert({
        user_id: userId,
        tool: 'asana',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      });
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations?connected=asana`);
  } catch (error) {
    console.error('Asana OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=asana_auth_failed`);
  }
}
```

### **3. Update the Universal Integrations Core**

Add your adapter to `lib/integrations/universal-integrations-core.ts`:

```typescript
import { AsanaAdapter } from './adapters/asana';

// In the constructor
this.adapters.set('asana', new AsanaAdapter());
```

### **4. Add OAuth Authorization URL**

Update `app/api/integrations/oauth/authorize/route.ts`:

```typescript
case 'asana':
  const asanaAuthUrl = new URL('https://app.asana.com/-/oauth_authorize');
  asanaAuthUrl.searchParams.set('client_id', process.env.ASANA_CLIENT_ID!);
  asanaAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback/asana`);
  asanaAuthUrl.searchParams.set('response_type', 'code');
  asanaAuthUrl.searchParams.set('state', userId);
  asanaAuthUrl.searchParams.set('scope', 'default');
  
  return NextResponse.json({ authUrl: asanaAuthUrl.toString() });
```

### **5. Environment Variables**

Add to your `.env.local`:

```bash
# Asana Integration
ASANA_CLIENT_ID=your_asana_client_id
ASANA_CLIENT_SECRET=your_asana_client_secret
```

### **6. OAuth App Setup**

1. **Asana Developer Console**: https://developers.asana.com/
2. **Create New App**
3. **Redirect URI**: `https://yourapp.com/api/integrations/oauth/callback/asana`
4. **Scopes**: Select appropriate permissions
5. **Copy Client ID/Secret** to environment variables

---

## 🧪 **Testing Your Integration**

### **Unit Tests**

Create: `tests/integrations/asana.test.ts`

```typescript
import { AsanaAdapter } from '../../lib/integrations/adapters/asana';

describe('AsanaAdapter', () => {
  const adapter = new AsanaAdapter();
  const mockToken = 'mock_asana_token';
  
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = jest.fn();
  });
  
  it('should create a task successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { gid: '123', name: 'Test Task' } })
    });
    
    const result = await adapter.executeAction(
      { action: 'createTask', name: 'Test Task', projectId: 'proj123' },
      {},
      mockToken
    );
    
    expect(result.data.name).toBe('Test Task');
  });
  
  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized'
    });
    
    await expect(
      adapter.executeAction({ action: 'createTask' }, {}, 'invalid_token')
    ).rejects.toThrow('Asana API error: Unauthorized');
  });
});
```

### **Integration Tests**

Test the full flow:

```typescript
// Test OAuth flow
await fetch('/api/integrations/oauth/authorize', {
  method: 'POST',
  body: JSON.stringify({ tool: 'asana', userId: 'test-user' })
});

// Test action execution
await fetch('/api/integrations', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${userToken}` },
  body: JSON.stringify({
    tool: 'asana',
    action: 'createTask',
    params: { name: 'Integration Test', projectId: 'test-project' }
  })
});
```

---

## 📋 **Checklist for New Integrations**

- [ ] **Adapter created** with all required methods
- [ ] **OAuth flow implemented** (if required)
- [ ] **Environment variables** configured
- [ ] **Tool registered** in UIC
- [ ] **Authorization URL** added to API
- [ ] **Error handling** implemented
- [ ] **Unit tests** written
- [ ] **Integration tests** passing
- [ ] **Documentation** updated
- [ ] **Rate limiting** configured

---

## 🔧 **Common Patterns**

### **API Key Authentication** (instead of OAuth)

```typescript
async executeAction(action: IntegrationAction, params: any, apiKey: string) {
  const response = await fetch(`${this.baseUrl}/${action.action}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(params)
  });
  
  return this.handleResponse(response);
}
```

### **Webhook Support**

```typescript
// Add webhook endpoint
app/api/integrations/webhooks/[tool]/route.ts

export async function POST(request: NextRequest, { params }: { params: { tool: string } }) {
  const tool = params.tool;
  const payload = await request.json();
  
  // Verify webhook signature
  // Process webhook data
  // Trigger agent notifications if needed
  
  return NextResponse.json({ received: true });
}
```

### **Rate Limiting**

All adapters automatically get rate limiting through the UIC. Configure limits per tool:

```typescript
// In your adapter
getRateLimits() {
  return {
    requests: 100,
    window: '1h',
    burst: 10
  };
}
```

---

## 🚨 **Security Best Practices**

1. **Never log auth tokens** in plain text
2. **Validate all input parameters** before API calls
3. **Use environment variables** for sensitive data
4. **Implement proper token refresh** logic
5. **Handle webhook signature verification**
6. **Use HTTPS** for all external API calls
7. **Implement timeout** for long-running requests

---

## 📞 **Getting Help**

- **UIC Types**: `lib/integrations/types.ts`
- **Example Adapters**: `lib/integrations/adapters/gmail.ts`
- **Test Examples**: `tests/integrations/`
- **Architecture Docs**: `docs/UNIVERSAL-INTEGRATIONS-CORE.md`

---

**Happy integrating!** 🚀 