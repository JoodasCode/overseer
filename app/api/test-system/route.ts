import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Test basic Supabase connection
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        status: 'error',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        tests: {
          supabase: 'connected',
          auth: 'failed',
          reason: authError?.message || 'No user session'
        }
      }, { status: 401 })
    }

    // Test agents table
    const { data: agents, error: agentsError } = await supabase
      .from('portal_agents')
      .select('id, name, status')
      .limit(5)

    // Test knowledge base table  
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('id, title')
      .limit(5)

    // Test activity log
    const { data: activities, error: activitiesError } = await supabase
      .from('portal_activity_log')
      .select('id, action')
      .limit(5)

    return NextResponse.json({
      status: 'success',
      message: 'System test completed',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      },
      tests: {
        supabase: 'connected',
        auth: 'success',
        agents: {
          status: agentsError ? 'error' : 'success',
          count: agents?.length || 0,
          error: agentsError?.message
        },
        knowledge: {
          status: knowledgeError ? 'error' : 'success', 
          count: knowledge?.length || 0,
          error: knowledgeError?.message
        },
        activities: {
          status: activitiesError ? 'error' : 'success',
          count: activities?.length || 0, 
          error: activitiesError?.message
        }
      },
      next_steps: [
        'Visit /agents to manage your AI agents',
        'Visit /knowledge to upload documents', 
        'Visit /portal to see your dashboard',
        'Click "Chat" on any agent to start conversing'
      ]
    })

  } catch (error) {
    console.error('System test error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'System test failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 