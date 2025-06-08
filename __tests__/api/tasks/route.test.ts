import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockTaskCreate = vi.hoisted(() => vi.fn());
const mockTaskFindMany = vi.hoisted(() => vi.fn());
const mockTaskFindUnique = vi.hoisted(() => vi.fn());
const mockTaskUpdate = vi.hoisted(() => vi.fn());
const mockTaskDelete = vi.hoisted(() => vi.fn());
const mockTaskCount = vi.hoisted(() => vi.fn());
const mockAgentFindFirst = vi.hoisted(() => vi.fn());

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      create: mockTaskCreate,
      findMany: mockTaskFindMany,
      findUnique: mockTaskFindUnique,
      update: mockTaskUpdate,
      delete: mockTaskDelete,
      count: mockTaskCount,
    },
    agent: {
      findFirst: mockAgentFindFirst,
    },
  },
}));

// Import the routes after mocking
import { POST, GET } from '@/app/api/tasks/route';
import { PATCH, DELETE, GET as GET_TASK } from '@/app/api/tasks/[id]/route';

describe('Tasks API', () => {
  const mockUser = { id: '550e8400-e29b-41d4-a716-446655440000' };
  const mockAgent = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Agent',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
  };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Mock authenticated user by default
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    
    // Mock agent exists by default
    mockAgentFindFirst.mockResolvedValue(mockAgent);
    
    // Mock task count by default
    mockTaskCount.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    // Mock unauthenticated user
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'GET',
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should create a new task', async () => {
    const mockTask = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Test Task',
      agent_id: mockAgent.id,
      user_id: mockUser.id,
      status: 'PENDING',
      priority: 'MEDIUM',
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockTaskCreate.mockResolvedValue(mockTask);

    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        agent_id: mockAgent.id,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.task.title).toBe('Test Task');
  });

  it('should validate required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should list tasks for authenticated user', async () => {
    const mockTasks = [
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'List Task',
        agent_id: mockAgent.id,
        user_id: mockUser.id,
        status: 'PENDING',
        priority: 'MEDIUM',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ];

    mockTaskFindMany.mockResolvedValue(mockTasks);

    const req = new NextRequest('http://localhost:3000/api/tasks', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.tasks)).toBe(true);
    expect(data.tasks.some((t: any) => t.title === 'List Task')).toBe(true);
  });

  it('should not allow user to access another user\'s task', async () => {
    // Mock task not found (simulating user can't access other user's task)
    mockTaskFindUnique.mockResolvedValue(null);

    const req = new NextRequest(`http://localhost:3000/api/tasks/550e8400-e29b-41d4-a716-446655440004`, { method: 'GET' });
    const res = await GET_TASK(req, { params: { id: '550e8400-e29b-41d4-a716-446655440004' } });
    expect(res.status).toBe(404);
  });

  it('should update own task', async () => {
    const mockTask = {
      id: '550e8400-e29b-41d4-a716-446655440005',
      title: 'Update Me',
      agent_id: mockAgent.id,
      user_id: mockUser.id,
      status: 'PENDING',
      priority: 'MEDIUM',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const updatedTask = { ...mockTask, title: 'Updated Title' };

    mockTaskFindUnique.mockResolvedValue(mockTask);
    mockTaskUpdate.mockResolvedValue(updatedTask);

    const req = new NextRequest(`http://localhost:3000/api/tasks/${mockTask.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const res = await PATCH(req, { params: { id: mockTask.id } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.task.title).toBe('Updated Title');
  });

  it('should not allow updating another user\'s task', async () => {
    // Mock task not found (simulating user can't access other user's task)
    mockTaskFindUnique.mockResolvedValue(null);

    const req = new NextRequest(`http://localhost:3000/api/tasks/550e8400-e29b-41d4-a716-446655440006`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Hacked' }),
    });
    const res = await PATCH(req, { params: { id: '550e8400-e29b-41d4-a716-446655440006' } });
    expect(res.status).toBe(404);
  });

  it('should delete own task', async () => {
    const mockTask = {
      id: '550e8400-e29b-41d4-a716-446655440007',
      title: 'Delete Me',
      agent_id: mockAgent.id,
      user_id: mockUser.id,
      status: 'PENDING',
      priority: 'MEDIUM',
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockTaskFindUnique.mockResolvedValueOnce(mockTask); // For finding the task
    mockTaskDelete.mockResolvedValue(mockTask);
    mockTaskFindUnique.mockResolvedValueOnce(null); // For checking if deleted

    const req = new NextRequest(`http://localhost:3000/api/tasks/${mockTask.id}`, { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: mockTask.id } });
    expect(res.status).toBe(204);
  });

  it('should not allow deleting another user\'s task', async () => {
    // Mock task not found (simulating user can't access other user's task)
    mockTaskFindUnique.mockResolvedValue(null);

    const req = new NextRequest(`http://localhost:3000/api/tasks/550e8400-e29b-41d4-a716-446655440008`, { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: '550e8400-e29b-41d4-a716-446655440008' } });
    expect(res.status).toBe(404);
  });

  it('should return 404 for non-existent task', async () => {
    mockTaskFindUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/tasks/550e8400-e29b-41d4-a716-446655440009', { method: 'GET' });
    const res = await GET_TASK(req, { params: { id: '550e8400-e29b-41d4-a716-446655440009' } });
    expect(res.status).toBe(404);
  });

  it('should handle malformed JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: '{bad json}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should handle large payloads gracefully', async () => {
    const largeTitle = 'A'.repeat(10000);
    const mockTask = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      title: largeTitle,
      agent_id: mockAgent.id,
      user_id: mockUser.id,
      status: 'PENDING',
      priority: 'MEDIUM',
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockTaskCreate.mockResolvedValue(mockTask);

    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: largeTitle, agent_id: mockAgent.id }),
    });
    const res = await POST(req);
    // Accept either 201 (if allowed) or 400 (if validation fails)
    expect([201, 400]).toContain(res.status);
  });

  // Add more tests for GET (list), PATCH, DELETE, RLS, and edge cases
}); 