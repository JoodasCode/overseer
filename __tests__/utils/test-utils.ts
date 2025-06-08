import { prisma } from '@/lib/prisma'
import { testUser, testUserToken } from '../setup'
import { NextRequest } from 'next/server'
import { TaskPriority, TaskStatus, WorkflowStatus, WorkflowExecutionStatus } from '@prisma/client'

export async function createTestAgent(overrides: any = {}) {
  return await prisma.agent.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Agent',
      description: 'A test agent',
      user_id: testUser.id,
      system_prompt: 'You are a helpful assistant',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      tools: [],
      ...overrides,
    },
  })
}

export async function createTestWorkflow(overrides: any = {}) {
  return await prisma.workflow.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Workflow',
      description: 'A test workflow',
      user_id: testUser.id,
      nodes: [
        {
          id: 'node1',
          type: 'trigger',
          data: { event: 'manual' },
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
      status: 'draft',
      ...overrides,
    },
  })
}

export const createTestTask = async (overrides = {}) => {
  return prisma.task.create({
    data: {
      user_id: testUser.id,
      title: 'Test Task',
      description: 'A test task',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      metadata: {},
      ...overrides,
    },
  })
}

export const createTestWorkflowExecution = async (workflowId: string, overrides = {}) => {
  return prisma.workflowExecution.create({
    data: {
      workflow_id: workflowId,
      user_id: testUser.id,
      status: WorkflowExecutionStatus.PENDING,
      trigger_data: {},
      result: {},
      ...overrides,
    },
  })
}

export function mockAuthRequest(urlOrRequest: string | NextRequest, options: any = {}) {
  // If it's already a NextRequest, clone it and add auth headers
  if (urlOrRequest instanceof NextRequest) {
    const headers = new Headers(urlOrRequest.headers)
    headers.set('authorization', `Bearer ${testUserToken}`)
    
    return new NextRequest(urlOrRequest.url, {
      method: urlOrRequest.method,
      headers,
      body: urlOrRequest.body,
    })
  }

  // Otherwise, create a new request from URL and options
  const headers = new Headers({
    'authorization': `Bearer ${testUserToken}`,
    'content-type': 'application/json',
    ...options.headers,
  })

  const method = options.method || 'GET'
  const requestOptions: any = {
    method,
    headers,
    ...options,
  }

  // Only add body for non-GET/HEAD methods
  if (method !== 'GET' && method !== 'HEAD' && options.body) {
    requestOptions.body = JSON.stringify(options.body)
  }

  return new NextRequest(urlOrRequest, requestOptions)
}

export function mockUnauthenticatedRequest(url: string, options: any = {}) {
  const headers = new Headers({
    'content-type': 'application/json',
    ...options.headers,
  })

  const method = options.method || 'GET'
  const requestOptions: any = {
    method,
    headers,
    ...options,
  }

  // Only add body for non-GET/HEAD methods
  if (method !== 'GET' && method !== 'HEAD' && options.body) {
    requestOptions.body = JSON.stringify(options.body)
  }

  return new NextRequest(url, requestOptions)
}

export const createTestAgentMemory = async (agentId: string, overrides = {}) => {
  return prisma.agentMemory.create({
    data: {
      agent_id: agentId,
      key: 'test_memory',
      value: 'Test memory value',
      type: 'string',
      embedding: [],
      metadata: {
        importance: 5,
        category: 'test',
      },
      ...overrides,
    },
  })
}



export const createTestErrorLog = async (agentId: string, overrides = {}) => {
  return prisma.errorLog.create({
    data: {
      user_id: testUser.id,
      agent_id: agentId,
      error_type: 'TEST_ERROR',
      error_message: 'Test error message',
      stack_trace: 'Test stack trace',
      context: {},
      ...overrides,
    },
  })
} 