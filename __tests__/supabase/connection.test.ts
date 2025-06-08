import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxchyyxsipdopwpwnxku.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y2h5eXhzaXBkb3B3cHdueGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDA3OTcsImV4cCI6MjA2NDcxNjc5N30.F3B_omEBQwwOwQCKMzk3ImXVPNh_SypgNFAVpC8eiRA'
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize Prisma client
const prisma = new PrismaClient()

describe('Supabase Connection and Tables', () => {
  beforeAll(async () => {
    // Verify environment variables
    expect(supabaseUrl).toBeDefined()
    expect(supabaseKey).toBeDefined()
  })

  it('should connect to Supabase successfully', async () => {
    const { data, error } = await supabase.auth.getSession()
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should have all required tables', async () => {
    const requiredTables = [
      'User',
      'Agent',
      'AgentMemory',
      'Task',
      'ChatMessage',
      'Workflow',
      'WorkflowExecution',
      'ErrorLog',
      'Integration',
      'KnowledgeBase',
      'MemoryLog'
    ]

    for (const table of requiredTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    }
  })

  it('should be able to create and read data', async () => {
    // Create a test user
    const { data: userData, error: userError } = await supabase
      .from('User')
      .insert([
        {
          email: 'test@example.com',
          display_name: 'Test User',
          role: 'user',
          api_keys: [],
          api_key_metadata: [],
          preferences: {},
          metadata: {}
        }
      ])
      .select()
      .single()

    expect(userError).toBeNull()
    expect(userData).toBeDefined()
    expect(userData.email).toBe('test@example.com')

    // Create a test agent
    const { data: agentData, error: agentError } = await supabase
      .from('Agent')
      .insert([
        {
          name: 'Test Agent',
          description: 'Test Description',
          user_id: userData.id,
          tools: {},
          stats: {},
          preferences: {},
          metadata: {}
        }
      ])
      .select()
      .single()

    expect(agentError).toBeNull()
    expect(agentData).toBeDefined()
    expect(agentData.name).toBe('Test Agent')

    // Clean up test data
    await supabase.from('Agent').delete().eq('id', agentData.id)
    await supabase.from('User').delete().eq('id', userData.id)
  })

  it('should maintain referential integrity', async () => {
    // Create a test user
    const { data: userData, error: userError } = await supabase
      .from('User')
      .insert([
        {
          email: 'test2@example.com',
          display_name: 'Test User 2',
          role: 'user',
          api_keys: [],
          api_key_metadata: [],
          preferences: {},
          metadata: {}
        }
      ])
      .select()
      .single()

    expect(userError).toBeNull()

    // Try to create an agent with invalid user ID
    const { error: invalidAgentError } = await supabase
      .from('Agent')
      .insert([
        {
          name: 'Invalid Agent',
          description: 'Test Description',
          user_id: 'invalid-id',
          tools: {},
          stats: {},
          preferences: {},
          metadata: {}
        }
      ])

    expect(invalidAgentError).not.toBeNull()

    // Clean up
    await supabase.from('User').delete().eq('id', userData.id)
  })

  it('should handle Prisma and Supabase consistency', async () => {
    // Create data using Prisma
    const user = await prisma.user.create({
      data: {
        email: 'prisma-test@example.com',
        display_name: 'Prisma Test User',
        role: 'user',
        api_keys: [],
        api_key_metadata: [],
        preferences: {},
        metadata: {}
      }
    })

    // Verify data exists in Supabase
    const { data: supabaseUser, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single()

    expect(error).toBeNull()
    expect(supabaseUser).toBeDefined()
    expect(supabaseUser.email).toBe('prisma-test@example.com')

    // Clean up
    await prisma.user.delete({
      where: { id: user.id }
    })
  })
}) 