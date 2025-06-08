import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { WorkflowStatus, WorkflowExecutionStatus } from '@prisma/client'

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn())
const mockWorkflowExecutionFindUnique = vi.hoisted(() => vi.fn())
const mockWorkflowExecutionDelete = vi.hoisted(() => vi.fn())

// Mock Supabase auth
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}))

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workflowExecution: {
      findUnique: mockWorkflowExecutionFindUnique,
      delete: mockWorkflowExecutionDelete,
    },
  },
}))

// Import the routes after mocking
import { GET, DELETE } from '@/app/api/workflows/executions/[id]/route'

describe('Workflow Executions API', () => {
  const mockUser = { id: '550e8400-e29b-41d4-a716-446655440000' }
  const mockWorkflow = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Workflow',
    status: WorkflowStatus.ACTIVE,
    user_id: mockUser.id,
  }
  const mockExecution = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    workflow_id: mockWorkflow.id,
    user_id: mockUser.id,
    status: WorkflowExecutionStatus.PENDING,
    trigger_data: {},
    result: {},
    created_at: new Date(),
    updated_at: new Date(),
    workflow: mockWorkflow,
  }

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
    
    // Mock authenticated user by default
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/workflows/executions/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = new NextRequest(`http://localhost:3000/api/workflows/executions/${mockExecution.id}`)
      const res = await GET(req, { params: { id: mockExecution.id } })
      expect(res.status).toBe(401)
    })

    it('should return 400 for invalid execution ID format', async () => {
      const req = new NextRequest('http://localhost:3000/api/workflows/executions/invalid-id')
      const res = await GET(req, { params: { id: 'invalid-id' } })
      const data = await res.json()
      
      expect(res.status).toBe(400)
      expect(data.error).toBe('Invalid execution ID format')
    })

    it('should return 404 for non-existent execution', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999'
      
      // Mock execution not found
      mockWorkflowExecutionFindUnique.mockResolvedValue(null)
      
      const req = new NextRequest(`http://localhost:3000/api/workflows/executions/${nonExistentId}`)
      const res = await GET(req, { params: { id: nonExistentId } })
      const data = await res.json()
      
      expect(res.status).toBe(404)
      expect(data.error).toBe('Workflow execution not found')
    })

    it('should return execution details for valid ID', async () => {
      // Mock execution found
      mockWorkflowExecutionFindUnique.mockResolvedValue(mockExecution)
      
      const req = new NextRequest(`http://localhost:3000/api/workflows/executions/${mockExecution.id}`)
      const res = await GET(req, { params: { id: mockExecution.id } })
      const data = await res.json()
      
      expect(res.status).toBe(200)
      expect(data.execution).toMatchObject({
        id: mockExecution.id,
        workflow_id: mockWorkflow.id,
        status: WorkflowExecutionStatus.PENDING,
      })
      expect(data.execution.workflow).toMatchObject({
        id: mockWorkflow.id,
        name: mockWorkflow.name,
      })
    })
  })

  describe('DELETE /api/workflows/executions/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = new NextRequest(
        `http://localhost:3000/api/workflows/executions/${mockExecution.id}`,
        { method: 'DELETE' }
      )
      const res = await DELETE(req, { params: { id: mockExecution.id } })
      expect(res.status).toBe(401)
    })

    it('should return 400 for invalid execution ID format', async () => {
      const req = new NextRequest('http://localhost:3000/api/workflows/executions/invalid-id', {
        method: 'DELETE',
      })
      const res = await DELETE(req, { params: { id: 'invalid-id' } })
      const data = await res.json()
      
      expect(res.status).toBe(400)
      expect(data.error).toBe('Invalid execution ID format')
    })

    it('should return 404 for non-existent execution', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440998'
      
      // Mock execution not found
      mockWorkflowExecutionFindUnique.mockResolvedValue(null)
      
      const req = new NextRequest(`http://localhost:3000/api/workflows/executions/${nonExistentId}`, {
        method: 'DELETE',
      })
      const res = await DELETE(req, { params: { id: nonExistentId } })
      const data = await res.json()
      
      expect(res.status).toBe(404)
      expect(data.error).toBe('Workflow execution not found')
    })

    it('should delete execution for valid ID', async () => {
      // Mock execution found for deletion
      mockWorkflowExecutionFindUnique.mockResolvedValue(mockExecution)
      mockWorkflowExecutionDelete.mockResolvedValue(mockExecution)
      
      const req = new NextRequest(`http://localhost:3000/api/workflows/executions/${mockExecution.id}`, {
        method: 'DELETE',
      })
      const res = await DELETE(req, { params: { id: mockExecution.id } })
      const data = await res.json()
      
      expect(res.status).toBe(200)
      expect(data.message).toBe('Workflow execution deleted successfully')
    })
  })
}) 