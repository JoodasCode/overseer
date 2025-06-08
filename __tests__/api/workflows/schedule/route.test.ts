import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestAgent, createTestWorkflow, mockAuthRequest } from '../../../utils/test-utils'
import { POST } from '@/app/api/workflows/schedule/route'
import { NextRequest } from 'next/server'
import { WorkflowStatus } from '@prisma/client'
import { scheduleWorkflow } from '@/lib/workflow/scheduler'

// Mock the scheduler
vi.mock('@/lib/workflow/scheduler', () => ({
  scheduleWorkflow: vi.fn(),
}))

describe('Workflow Schedule API', () => {
  let testAgent: any
  let testWorkflow: any

  beforeEach(async () => {
    testAgent = await createTestAgent()
    testWorkflow = await createTestWorkflow(testAgent.id, {
      name: 'Test Workflow',
      status: WorkflowStatus.ACTIVE,
    })
    vi.clearAllMocks()
  })

  it('should schedule workflow with valid data', async () => {
    const scheduleData = {
      id: testWorkflow.id,
      workflow: {
        id: testWorkflow.id,
        name: testWorkflow.name,
        config: testWorkflow.config,
      },
      interval: '0 0 * * *', // Daily at midnight
    }

    const req = mockAuthRequest(
      new NextRequest('http://localhost:3000/api/workflows/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      })
    )
    const res = await POST(req)
    const data = await res.json()
    
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe(`Workflow ${testWorkflow.id} scheduled.`)
    expect(scheduleWorkflow).toHaveBeenCalledWith(
      scheduleData.id,
      scheduleData.workflow,
      scheduleData.interval
    )
  })

  it('should return 400 for missing required fields', async () => {
    const invalidData = {
      id: testWorkflow.id,
      // Missing workflow and interval
    }

    const req = mockAuthRequest(
      new NextRequest('http://localhost:3000/api/workflows/schedule', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })
    )
    const res = await POST(req)
    const data = await res.json()
    
    expect(res.status).toBe(400)
    expect(data.error).toBe('Missing required fields: id, workflow, interval')
    expect(scheduleWorkflow).not.toHaveBeenCalled()
  })

  it('should handle invalid JSON', async () => {
    const req = mockAuthRequest(
      new NextRequest('http://localhost:3000/api/workflows/schedule', {
        method: 'POST',
        body: 'invalid json',
      })
    )
    const res = await POST(req)
    const data = await res.json()
    
    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to schedule workflow')
    expect(scheduleWorkflow).not.toHaveBeenCalled()
  })

  it('should handle scheduler errors', async () => {
    // Mock scheduler to throw error
    vi.mocked(scheduleWorkflow).mockImplementationOnce(() => {
      throw new Error('Scheduler error')
    })

    const scheduleData = {
      id: testWorkflow.id,
      workflow: {
        id: testWorkflow.id,
        name: testWorkflow.name,
        config: testWorkflow.config,
      },
      interval: '0 0 * * *',
    }

    const req = mockAuthRequest(
      new NextRequest('http://localhost:3000/api/workflows/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      })
    )
    const res = await POST(req)
    const data = await res.json()
    
    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to schedule workflow')
    expect(data.details).toBe('Scheduler error')
  })
}) 