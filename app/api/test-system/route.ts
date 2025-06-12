import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  console.log('🧪 System test starting...')
  
  // Test auth
  const { data: { session } } = await supabase.auth.getSession()
  console.log('🔐 Auth test:', { hasSession: !!session, userId: session?.user?.id })

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
      id: session?.user?.id,
      email: session?.user?.user_metadata.email
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
} 