import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Individual mock functions using vi.hoisted
const mockGetUser = vi.hoisted(() => vi.fn())
const mockAgentFindMany = vi.hoisted(() => vi.fn())
const mockAgentCreate = vi.hoisted(() => vi.fn())
const mockAgentCount = vi.hoisted(() => vi.fn())
const mockAgentMemoryCreate = vi.hoisted(() => vi.fn())

// Mock Supabase auth
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      findMany: mockAgentFindMany,
      create: mockAgentCreate,
      count: mockAgentCount,
    },
    agentMemory: {
      create: mockAgentMemoryCreate,
    },
  },
}))

// Import the routes after mocking
import { GET, POST } from '@/app/api/agents/route'

describe('Agents API', () => {
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful auth
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
    
    // Default agent memory creation
    mockAgentMemoryCreate.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440010',
      agent_id: '550e8400-e29b-41d4-a716-446655440001',
      key: 'system_prompt',
      value: 'I am a helpful AI assistant.',
      type: 'string',
    })
  })

  describe('GET /api/agents', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/agents')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('should return empty array when no agents exist', async () => {
      mockAgentFindMany.mockResolvedValue([])
      mockAgentCount.mockResolvedValue(0)

      const req = new NextRequest('http://localhost:3000/api/agents')
      const res = await GET(req)
      const data = await res.json()
      
      expect(res.status).toBe(200)
      expect(data.agents).toEqual([])
      expect(data.pagination).toEqual({
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      })
    })

    it('should return agents for authenticated user', async () => {
      const mockAgents = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Agent 1',
          description: 'Test Agent 1',
          user_id: mockUserId,
          tools: {},
          preferences: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Agent 2',
          description: 'Test Agent 2',
          user_id: mockUserId,
          tools: {},
          preferences: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      mockAgentFindMany.mockResolvedValue(mockAgents)
      mockAgentCount.mockResolvedValue(2)

      const req = new NextRequest('http://localhost:3000/api/agents')
      const res = await GET(req)
      const data = await res.json()
      
      expect(res.status).toBe(200)
      expect(data.agents).toHaveLength(2)
      expect(data.agents.map((a: any) => a.name)).toEqual(['Agent 1', 'Agent 2'])
      expect(data.pagination).toEqual({
        total: 2,
        limit: 50,
        offset: 0,
        hasMore: false,
      })
    })

    it('should handle pagination correctly', async () => {
      // Mock first page (2 agents)
      const mockAgentsPage1 = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Agent 1',
          description: 'Test Agent 1',
          user_id: mockUserId,
          tools: {},
          preferences: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Agent 2',
          description: 'Test Agent 2',
          user_id: mockUserId,
          tools: {},
          preferences: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      // Mock second page (1 agent)
      const mockAgentsPage2 = [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Agent 3',
          description: 'Test Agent 3',
          user_id: mockUserId,
          tools: {},
          preferences: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      // Test first page
      mockAgentFindMany.mockResolvedValueOnce(mockAgentsPage1)
      mockAgentCount.mockResolvedValue(3)

      const req1 = new NextRequest('http://localhost:3000/api/agents?limit=2&offset=0')
      const res1 = await GET(req1)
      const data1 = await res1.json()
      
      expect(res1.status).toBe(200)
      expect(data1.agents).toHaveLength(2)
      expect(data1.pagination).toEqual({
        total: 3,
        limit: 2,
        offset: 0,
        hasMore: true,
      })

      // Test second page
      mockAgentFindMany.mockResolvedValueOnce(mockAgentsPage2)

      const req2 = new NextRequest('http://localhost:3000/api/agents?limit=2&offset=2')
      const res2 = await GET(req2)
      const data2 = await res2.json()
      
      expect(res2.status).toBe(200)
      expect(data2.agents).toHaveLength(1)
      expect(data2.pagination).toEqual({
        total: 3,
        limit: 2,
        offset: 2,
        hasMore: false,
      })
    })
  })

  describe('POST /api/agents', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Agent' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('should create new agent', async () => {
      const mockCreatedAgent = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'New Test Agent',
        description: 'A test agent',
        user_id: mockUserId,
        tools: { test: true },
        preferences: { theme: 'dark' },
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockAgentCreate.mockResolvedValue(mockCreatedAgent)

      const req = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Test Agent',
          description: 'A test agent',
          tools: { test: true },
          preferences: { theme: 'dark' },
        }),
      })
      const res = await POST(req)
      const data = await res.json()
      
      expect(res.status).toBe(201)
      expect(data.agent).toMatchObject({
        name: 'New Test Agent',
        description: 'A test agent',
        tools: { test: true },
        preferences: { theme: 'dark' },
      })
    })

    it('should validate required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Missing name field',
        }),
      })
      const res = await POST(req)
      const data = await res.json()
      
      expect(res.status).toBe(400)
      expect(data.error).toBe('Agent name is required')
    })

    it('should handle invalid JSON', async () => {
      const req = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: 'invalid json',
      })
      const res = await POST(req)
      const data = await res.json()
      
      expect(res.status).toBe(400)
      expect(data.error).toBe('Invalid JSON in request body')
    })
  })
}) 