import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/workflows/route'
import { NextRequest } from 'next/server'
import { WorkflowStatus } from '@prisma/client'

// Individual mock functions using vi.hoisted
const mockFindMany = vi.hoisted(() => vi.fn())
const mockCreate = vi.hoisted(() => vi.fn())
const mockFindFirst = vi.hoisted(() => vi.fn())
const mockCount = vi.hoisted(() => vi.fn())
const mockAgentFindFirst = vi.hoisted(() => vi.fn())

const mockGetUser = vi.hoisted(() => vi.fn())

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workflow: {
      findMany: mockFindMany,
      create: mockCreate,
      findFirst: mockFindFirst,
      count: mockCount,
    },
    agent: {
      findFirst: mockAgentFindFirst,
    },
  },
}))

// Mock Supabase auth
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}))

describe('Workflows API', () => {
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
  const mockAgentId = '550e8400-e29b-41d4-a716-446655440001'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful auth
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
    
    // Default agent exists
    mockAgentFindFirst.mockResolvedValue({
      id: mockAgentId,
      name: 'Test Agent',
      user_id: mockUserId,
    })
  })

  describe('GET /api/workflows', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/workflows')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('should return empty array when no workflows exist', async () => {
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)

      const req = new NextRequest('http://localhost:3000/api/workflows')
      const res = await GET(req)
      const data = await res.json()
      
      expect(res.status).toBe(200)
      expect(data.workflows).toEqual([])
    })

    it('should return workflows for authenticated user', async () => {
      const mockWorkflows = [
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          name: 'Workflow 1',
          description: 'Test Description 1',
          status: 'draft',
          agentId: mockAgentId,
          userId: mockUserId,
          config: { nodes: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          name: 'Workflow 2',
          description: 'Test Description 2',
          status: 'active',
          agentId: mockAgentId,
          userId: mockUserId,
          config: { nodes: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(mockWorkflows)
      mockCount.mockResolvedValue(2)

      const req = new NextRequest('http://localhost:3000/api/workflows')
      const res = await GET(req)
      const data = await res.json()
      
      expect(res.status).toBe(200)
      expect(data.workflows).toHaveLength(2)
      expect(data.workflows.map((w: any) => w.name)).toEqual(['Workflow 1', 'Workflow 2'])
    })

    it('should filter workflows by status', async () => {
      const mockWorkflows = [
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          name: 'Active Workflow',
          description: 'Test Description',
          status: 'active',
          agentId: mockAgentId,
          userId: mockUserId,
          config: { nodes: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(mockWorkflows)
      mockCount.mockResolvedValue(1)

      const req = new NextRequest('http://localhost:3000/api/workflows?status=ACTIVE')
      const res = await GET(req)
      const data = await res.json()
      
      expect(res.status).toBe(200)
      expect(data.workflows).toHaveLength(1)
      expect(data.workflows[0].name).toBe('Active Workflow')
      expect(data.workflows[0].status).toBe('active')
    })
  })

  describe('POST /api/workflows', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Workflow',
          nodes: [],
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('should create new workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [
          {
            id: 'node1',
            type: 'trigger',
            config: { event: 'schedule' }
          },
          {
            id: 'node2',
            type: 'action',
            config: { action: 'send_email' }
          }
        ],
        status: 'draft'
      }

      const mockCreatedWorkflow = {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'Test Workflow',
        description: 'Test Description',
        status: 'draft',
        agentId: mockAgentId,
        userId: mockUserId,
        config: { nodes: workflowData.nodes },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCreate.mockResolvedValue(mockCreatedWorkflow)

      const req = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify(workflowData),
      })
      const res = await POST(req)
      const data = await res.json()
      
      expect(res.status).toBe(201)
      expect(data.workflow).toMatchObject({
        name: workflowData.name,
        description: workflowData.description,
        status: workflowData.status,
      })
      expect(data.workflow.config.nodes).toEqual(workflowData.nodes)
    })

    it('should validate required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Missing name and nodes',
        }),
      })
      const res = await POST(req)
      const data = await res.json()
      
      expect(res.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should validate nodes structure', async () => {
      const req = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Invalid Nodes Workflow',
          nodes: 'invalid-nodes', // Should be an array or object
        }),
      })
      const res = await POST(req)
      const data = await res.json()
      
      expect(res.status).toBe(400)
      expect(data.error).toBe('Invalid nodes structure')
    })

    it('should handle invalid JSON', async () => {
      const req = new NextRequest('http://localhost:3000/api/workflows', {
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