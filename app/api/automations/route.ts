import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AutomationRequest {
  name: string
  description?: string
  trigger_type: string
  trigger_config: Record<string, any>
  action_type: string
  action_config: Record<string, any>
  agents: string[]
  status: 'draft' | 'active' | 'paused'
  category: 'notifications' | 'workflows' | 'integrations'
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: automations, error } = await supabase
      .from('Automation')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching automations:', error)
      return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 })
    }

    return NextResponse.json({ automations: automations || [] })
  } catch (error) {
    console.error('Automations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body: AutomationRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.trigger_type || !body.action_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, trigger_type, action_type' 
      }, { status: 400 })
    }

    const automationData = {
      user_id: user.id,
      name: body.name,
      description: body.description || '',
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config || {},
      action_type: body.action_type,
      action_config: body.action_config || {},
      agents: body.agents || [],
      status: body.status || 'draft',
      category: body.category || 'workflows',
      metadata: {}
    }

    const { data: automation, error } = await supabase
      .from('Automation')
      .insert([automationData])
      .select()
      .single()

    if (error) {
      console.error('Error creating automation:', error)
      return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 })
    }

    return NextResponse.json({ automation }, { status: 201 })
  } catch (error) {
    console.error('Automations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 })
    }

    const { data: automation, error } = await supabase
      .from('Automation')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating automation:', error)
      return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 })
    }

    return NextResponse.json({ automation })
  } catch (error) {
    console.error('Automations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('Automation')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting automation:', error)
      return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Automation deleted successfully' })
  } catch (error) {
    console.error('Automations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 