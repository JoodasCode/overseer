import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client with service role key for JWT validation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * GET /api/agents/[id]/collaborate
 * Get collaboration history and shared memory for an agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Verify agent exists and user has access
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('portal_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found or access denied' },
        { status: 404 }
      );
    }

    // Get inter-agent messages (both sent and received)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('inter_agent_messages')
      .select(`
        *,
        from_agent:portal_agents!inter_agent_messages_from_agent_id_fkey(id, name, role, avatar),
        to_agent:portal_agents!inter_agent_messages_to_agent_id_fkey(id, name, role, avatar)
      `)
      .or(`from_agent_id.eq.${agentId},to_agent_id.eq.${agentId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get shared memory (both sent and received)
    const { data: sharedMemory, error: sharedError } = await supabaseAdmin
      .from('shared_agent_memory')
      .select(`
        *,
        from_agent:portal_agents!shared_agent_memory_from_agent_id_fkey(id, name, role, avatar),
        to_agent:portal_agents!shared_agent_memory_to_agent_id_fkey(id, name, role, avatar)
      `)
      .or(`from_agent_id.eq.${agentId},to_agent_id.eq.${agentId}`)
      .order('created_at', { ascending: false })
      .limit(30);

    // Get other agents in the same department for collaboration suggestions
    const { data: departmentAgents, error: deptError } = await supabaseAdmin
      .from('portal_agents')
      .select('id, name, role, avatar, department_type, status')
      .eq('user_id', user.id)
      .eq('department_type', agent.department_type || 'communications')
      .neq('id', agentId)
      .eq('is_active', true);

    // Calculate collaboration statistics
    const sentMessages = messages?.filter(m => m.from_agent_id === agentId) || [];
    const receivedMessages = messages?.filter(m => m.to_agent_id === agentId) || [];
    const sharedToOthers = sharedMemory?.filter(m => m.from_agent_id === agentId) || [];
    const receivedFromOthers = sharedMemory?.filter(m => m.to_agent_id === agentId) || [];

    return NextResponse.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          department: agent.department_type
        },
        messages: messages || [],
        sharedMemory: sharedMemory || [],
        departmentAgents: departmentAgents || [],
        statistics: {
          totalMessages: messages?.length || 0,
          messagesSent: sentMessages.length,
          messagesReceived: receivedMessages.length,
          memoryShared: sharedToOthers.length,
          memoryReceived: receivedFromOthers.length,
          activeCollaborators: new Set([
            ...sentMessages.map(m => m.to_agent_id),
            ...receivedMessages.map(m => m.from_agent_id)
          ]).size
        }
      }
    });

  } catch (error) {
    console.error('Agent collaboration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/collaborate
 * Send a message or share memory with another agent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type, to_agent_id, content, message_type, memory_type, context, expires_in_hours } = body;

    if (!type || !to_agent_id || !content) {
      return NextResponse.json(
        { error: 'Type, to_agent_id, and content are required' },
        { status: 400 }
      );
    }

    // Verify both agents exist and belong to user
    const { data: fromAgent, error: fromError } = await supabaseAdmin
      .from('portal_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    const { data: toAgent, error: toError } = await supabaseAdmin
      .from('portal_agents')
      .select('*')
      .eq('id', to_agent_id)
      .eq('user_id', user.id)
      .single();

    if (!fromAgent || !toAgent) {
      return NextResponse.json(
        { error: 'One or both agents not found or access denied' },
        { status: 404 }
      );
    }

    let result;

    if (type === 'message') {
      // Send inter-agent message
      const { data: message, error: messageError } = await supabaseAdmin
        .from('inter_agent_messages')
        .insert({
          from_agent_id: agentId,
          to_agent_id,
          message_type: message_type || 'collaboration',
          content,
          metadata: { context: context || null }
        })
        .select(`
          *,
          from_agent:portal_agents!inter_agent_messages_from_agent_id_fkey(name, role),
          to_agent:portal_agents!inter_agent_messages_to_agent_id_fkey(name, role)
        `)
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        return NextResponse.json(
          { error: 'Failed to send message' },
          { status: 500 }
        );
      }

      result = { message };

      // Log activity
      await supabaseAdmin
        .from('portal_activity_log')
        .insert({
          actor_type: 'agent',
          actor_id: agentId,
          action: 'agent_message',
          description: `${fromAgent.name} sent a message to ${toAgent.name}`,
          meta: { message_type, to_agent: toAgent.name },
          user_id: user.id,
          agent_id: agentId
        });

    } else if (type === 'share_memory') {
      // Share memory with another agent
      const expiresAt = expires_in_hours 
        ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
        : null;

      const { data: sharedMemory, error: shareError } = await supabaseAdmin
        .from('shared_agent_memory')
        .insert({
          from_agent_id: agentId,
          to_agent_id,
          memory_type: memory_type || 'context',
          content,
          context: context || null,
          context_expires_at: expiresAt
        })
        .select(`
          *,
          from_agent:portal_agents!shared_agent_memory_from_agent_id_fkey(name, role),
          to_agent:portal_agents!shared_agent_memory_to_agent_id_fkey(name, role)
        `)
        .single();

      if (shareError) {
        console.error('Error sharing memory:', shareError);
        return NextResponse.json(
          { error: 'Failed to share memory' },
          { status: 500 }
        );
      }

      result = { sharedMemory };

      // Log activity
      await supabaseAdmin
        .from('portal_activity_log')
        .insert({
          actor_type: 'agent',
          actor_id: agentId,
          action: 'memory_share',
          description: `${fromAgent.name} shared ${memory_type} memory with ${toAgent.name}`,
          meta: { memory_type, to_agent: toAgent.name, expires_at: expiresAt },
          user_id: user.id,
          agent_id: agentId
        });

    } else {
      return NextResponse.json(
        { error: 'Invalid collaboration type. Must be "message" or "share_memory"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Agent collaboration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id]/collaborate
 * Mark messages as read or update collaboration status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, message_ids, from_agent_id } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Verify agent exists and user has access
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('portal_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found or access denied' },
        { status: 404 }
      );
    }

    let result;

    if (action === 'mark_read') {
      // Mark specific messages as read
      if (!message_ids || !Array.isArray(message_ids)) {
        return NextResponse.json(
          { error: 'message_ids array is required for mark_read action' },
          { status: 400 }
        );
      }

      const { data: updatedMessages, error: updateError } = await supabaseAdmin
        .from('inter_agent_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', message_ids)
        .eq('to_agent_id', agentId)
        .select();

      if (updateError) {
        console.error('Error marking messages as read:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark messages as read' },
          { status: 500 }
        );
      }

      result = { updatedMessages };

    } else if (action === 'mark_all_read') {
      // Mark all unread messages from a specific agent as read
      let query = supabaseAdmin
        .from('inter_agent_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('to_agent_id', agentId)
        .is('read_at', null);

      if (from_agent_id) {
        query = query.eq('from_agent_id', from_agent_id);
      }

      const { data: updatedMessages, error: updateError } = await query.select();

      if (updateError) {
        console.error('Error marking all messages as read:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark messages as read' },
          { status: 500 }
        );
      }

      result = { updatedMessages };

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: mark_read, mark_all_read' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Agent collaboration update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 