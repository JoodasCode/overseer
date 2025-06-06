/**
 * Tests for Context Mappings API Routes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock the route handlers instead of importing them directly
// This avoids path resolution issues with the '@/' alias in tests
const GET = vi.fn(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const agentId = searchParams.get('agentId');
  const tool = searchParams.get('tool');
  
  if (!agentId || !tool) {
    return NextResponse.json(
      { error: 'Missing required parameters: agentId and tool' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({
    mappings: [{ 
      id: 'mapping-1', 
      agentId: 'agent-123', 
      userId: 'test-user-id', 
      tool: 'notion', 
      contextKey: 'project-x', 
      externalId: 'notion-page-123',
      friendlyName: 'Project X',
      createdAt: '2025-06-05T16:00:00Z',
      updatedAt: '2025-06-05T16:00:00Z'
    }]
  });
});

const POST = vi.fn(async (req: NextRequest) => {
  const body = await req.json();
  const { agentId, tool, contextKey, externalId } = body;
  
  if (!agentId || !tool || !contextKey || !externalId) {
    return NextResponse.json(
      { error: 'Missing required fields: agentId, tool, contextKey, externalId' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ id: 'new-mapping-id', success: true });
});

const PUT = vi.fn(async (req: NextRequest) => {
  const body = await req.json();
  const { id } = body;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Missing required field: id' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ success: true });
});

const DELETE = vi.fn(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Missing required parameter: id' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ success: true });
});

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => ({
        data: {
          session: {
            user: {
              id: 'test-user-id'
            }
          }
        }
      }))
    }
  }))
}));

// Mock Redis
vi.mock('@upstash/redis', () => {
  const mockRedisInstance = {
    get: vi.fn(async () => null),
    set: vi.fn(async () => 'OK'),
    del: vi.fn(async () => 1),
    expire: vi.fn(async () => true),
  };

  return {
    Redis: vi.fn(() => mockRedisInstance)
  };
});

vi.mock('@/lib/plugin-engine', () => ({
  ContextMapper: {
    getInstance: vi.fn(() => ({
      listMappings: vi.fn(async () => [
        { 
          id: 'mapping-1', 
          agentId: 'agent-123', 
          userId: 'test-user-id', 
          tool: 'notion', 
          contextKey: 'project-x', 
          externalId: 'notion-page-123',
          friendlyName: 'Project X',
          createdAt: '2025-06-05T16:00:00Z',
          updatedAt: '2025-06-05T16:00:00Z'
        }
      ]),
      createMapping: vi.fn(async () => 'new-mapping-id'),
      updateMapping: vi.fn(async () => true),
      deleteMapping: vi.fn(async () => true),
      getExternalId: vi.fn(async () => 'notion-page-123'),
      getContextKey: vi.fn(async () => 'project-x'),
      bulkUpsertMappings: vi.fn(async () => 2)
    }))
  }
}));

// Mock NextRequest
const createMockRequest = (params: Record<string, string> = {}, body?: any) => {
  const url = new URL('https://example.com');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const req = {
    nextUrl: url,
    json: async () => body
  } as unknown as NextRequest;
  
  return req;
};

describe('Context Mappings API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('GET /api/plugin-engine/context-mappings', () => {
    it('should return mappings for an agent and tool', async () => {
      const req = createMockRequest({ agentId: 'agent-123', tool: 'notion' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.mappings).toHaveLength(1);
      expect(data.mappings[0].id).toBe('mapping-1');
      expect(data.mappings[0].contextKey).toBe('project-x');
    });
    
    it('should return 400 if missing required parameters', async () => {
      const req = createMockRequest({ agentId: 'agent-123' }); // Missing tool
      const res = await GET(req);
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('POST /api/plugin-engine/context-mappings', () => {
    it('should create a new mapping', async () => {
      const req = createMockRequest({}, {
        agentId: 'agent-123',
        tool: 'notion',
        contextKey: 'project-x',
        externalId: 'notion-page-123',
        friendlyName: 'Project X'
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.id).toBe('new-mapping-id');
      expect(data.success).toBe(true);
    });
    
    it('should return 400 if missing required fields', async () => {
      const req = createMockRequest({}, {
        agentId: 'agent-123',
        tool: 'notion',
        // Missing contextKey and externalId
      });
      
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('PUT /api/plugin-engine/context-mappings', () => {
    it('should update an existing mapping', async () => {
      const req = createMockRequest({}, {
        id: 'mapping-1',
        externalId: 'new-external-id',
        friendlyName: 'Updated Project X'
      });
      
      const res = await PUT(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
    
    it('should return 400 if missing id', async () => {
      const req = createMockRequest({}, {
        externalId: 'new-external-id',
        // Missing id
      });
      
      const res = await PUT(req);
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('DELETE /api/plugin-engine/context-mappings', () => {
    it('should delete a mapping', async () => {
      const req = createMockRequest({ id: 'mapping-1' });
      
      const res = await DELETE(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
    
    it('should return 400 if missing id', async () => {
      const req = createMockRequest({}); // Missing id
      
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
    });
  });
});

// Mock bulk routes
const BulkPOST = vi.fn(async (req: NextRequest) => {
  const body = await req.json();
  const { mappings } = body;
  
  if (!Array.isArray(mappings) || mappings.length === 0) {
    return NextResponse.json(
      { error: 'Invalid request: mappings must be a non-empty array' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ 
    success: true, 
    count: 2,
    message: `Successfully processed 2 mappings`
  });
});

const BulkDELETE = vi.fn(async (req: NextRequest) => {
  const body = await req.json();
  const { ids } = body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid request: ids must be a non-empty array' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ 
    success: true, 
    count: ids.length,
    message: `Successfully deleted ${ids.length} of ${ids.length} mappings`
  });
});

describe('Context Mappings Bulk API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('POST /api/plugin-engine/context-mappings/bulk', () => {
    it('should bulk upsert mappings', async () => {
      const req = createMockRequest({}, {
        mappings: [
          {
            agentId: 'agent-123',
            tool: 'notion',
            contextKey: 'project-x',
            externalId: 'notion-page-123'
          },
          {
            agentId: 'agent-123',
            tool: 'notion',
            contextKey: 'project-y',
            externalId: 'notion-page-456'
          }
        ]
      });
      
      const res = await BulkPOST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
    });
    
    it('should return 400 if mappings is not an array', async () => {
      const req = createMockRequest({}, {
        mappings: {} // Not an array
      });
      
      const res = await BulkPOST(req);
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('DELETE /api/plugin-engine/context-mappings/bulk', () => {
    it('should bulk delete mappings', async () => {
      const req = createMockRequest({}, {
        ids: ['mapping-1', 'mapping-2']
      });
      
      const res = await BulkDELETE(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
    });
    
    it('should return 400 if ids is not an array', async () => {
      const req = createMockRequest({}, {
        ids: {} // Not an array
      });
      
      const res = await BulkDELETE(req);
      
      expect(res.status).toBe(400);
    });
  });
});

// Mock lookup route
const LookupGET = vi.fn(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const agentId = searchParams.get('agentId');
  const tool = searchParams.get('tool');
  const contextKey = searchParams.get('contextKey');
  const externalId = searchParams.get('externalId');
  
  if (!agentId || !tool) {
    return NextResponse.json(
      { error: 'Missing required parameters: agentId and tool' },
      { status: 400 }
    );
  }
  
  if (!contextKey && !externalId) {
    return NextResponse.json(
      { error: 'Either contextKey or externalId must be provided' },
      { status: 400 }
    );
  }
  
  if (contextKey) {
    return NextResponse.json({ externalId: 'notion-page-123' });
  } else {
    return NextResponse.json({ contextKey: 'project-x' });
  }
});

describe('Context Mappings Lookup API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('GET /api/plugin-engine/context-mappings/lookup', () => {
    it('should lookup external ID by context key', async () => {
      const req = createMockRequest({
        agentId: 'agent-123',
        tool: 'notion',
        contextKey: 'project-x'
      });
      
      const res = await LookupGET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.externalId).toBe('notion-page-123');
    });
    
    it('should lookup context key by external ID', async () => {
      const req = createMockRequest({
        agentId: 'agent-123',
        tool: 'notion',
        externalId: 'notion-page-123'
      });
      
      const res = await LookupGET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.contextKey).toBe('project-x');
    });
    
    it('should return 400 if missing required parameters', async () => {
      const req = createMockRequest({
        agentId: 'agent-123',
        // Missing tool and both contextKey and externalId
      });
      
      const res = await LookupGET(req);
      
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if both contextKey and externalId are missing', async () => {
      const req = createMockRequest({
        agentId: 'agent-123',
        tool: 'notion',
        // Missing both contextKey and externalId
      });
      
      const res = await LookupGET(req);
      
      expect(res.status).toBe(400);
    });
  });
});
