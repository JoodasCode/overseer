import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
  last_active: string;
  department_type: string | null;
  personality_profile: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AttentionItem {
  id: string;
  type: 'task_failed' | 'task_overdue' | 'agent_error' | 'workflow_failed' | 'approval_needed';
  title: string;
  description: string;
  agentName?: string;
  agentId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    console.log('📊 Portal Dashboard API: Fetching data for user:', user.id);

    // Fetch agents with basic data
    const { data: agents, error: agentsError } = await supabase
      .from('portal_agents')
      .select(`
        id,
        name,
        role,
        avatar,
        status,
        last_active,
        department_type,
        personality_profile,
        is_active,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('last_active', { ascending: false });

    if (agentsError) {
      console.error('❌ Error fetching agents:', agentsError);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    // Fetch recent activity from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: activities, error: activitiesError } = await supabase
      .from('portal_activity_log')
      .select(`
        id,
        actor_type,
        actor_id,
        action,
        meta,
        created_at
      `)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20);

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
    }

    // Fetch departments for breakdown
    const { data: departments, error: deptError } = await supabase
      .from('portal_departments')
      .select('*');

    if (deptError) {
      console.error('❌ Error fetching departments:', deptError);
    }

    // Generate sample attention items (in real implementation, these would come from various sources)
    const generateAttentionItems = (): AttentionItem[] => {
      const items: AttentionItem[] = [];
      
      // Check for inactive agents
      const inactiveAgents = agents?.filter((agent: Agent) => !agent.is_active) || [];
      inactiveAgents.forEach((agent: Agent) => {
        items.push({
          id: `inactive-${agent.id}`,
          type: 'agent_error' as const,
          title: `Agent ${agent.name} is inactive`,
          description: `Agent has been offline for an extended period`,
          agentName: agent.name,
          agentId: agent.id,
          priority: 'medium' as const,
          timestamp: agent.last_active || new Date().toISOString()
        });
      });

      // Check for offline agents that should be active
      const offlineAgents = agents?.filter((agent: Agent) => agent.is_active && agent.status === 'offline') || [];
      offlineAgents.forEach((agent: Agent) => {
        items.push({
          id: `offline-${agent.id}`,
          type: 'task_overdue' as const,
          title: `Agent appears offline`,
          description: `${agent.name} is marked as active but appears offline`,
          agentName: agent.name,
          agentId: agent.id,
          priority: 'medium' as const,
          timestamp: new Date().toISOString()
        });
      });

      return items.slice(0, 10); // Limit to 10 items
    };

    // Calculate team statistics
    const calculateTeamStats = () => {
      if (!agents || agents.length === 0) {
        return {
          totalAgents: 0,
          activeAgents: 0,
          departmentBreakdown: []
        };
      }

      const totalAgents = agents.length;
      const activeAgents = agents.filter(agent => agent.is_active).length;

      // Department breakdown
      const departmentColors = {
        communications: '#3b82f6',
        hr: '#10b981',
        operations: '#f59e0b',
        product: '#8b5cf6',
        finance: '#ef4444',
        analytics: '#06b6d4'
      };

      const deptBreakdown = Object.entries(
        agents.reduce((acc, agent) => {
          const dept = agent.department_type || 'unassigned';
          if (!acc[dept]) {
            acc[dept] = { count: 0 };
          }
          acc[dept].count++;
          return acc;
        }, {} as Record<string, { count: number }>)
      ).map(([department, data]) => ({
        department,
        count: data.count,
        color: departmentColors[department as keyof typeof departmentColors] || '#6b7280'
      }));

      return {
        totalAgents,
        activeAgents,
        departmentBreakdown: deptBreakdown
      };
    };

    // Enrich activities with actor names
    const enrichedActivities = activities?.map(activity => {
      let actorName = '';
      
      if (activity.actor_type === 'agent') {
        const agent = agents?.find(a => a.id === activity.actor_id);
        actorName = agent?.name || 'Unknown Agent';
      } else if (activity.actor_type === 'user') {
        actorName = user.email?.split('@')[0] || 'User';
      } else {
        actorName = 'System';
      }

      return {
        ...activity,
        actor_name: actorName
      };
    }) || [];

    const dashboardData = {
      agents: agents || [],
      teamStats: calculateTeamStats(),
      recentActivity: enrichedActivities,
      attentionItems: generateAttentionItems(),
      departments: departments || []
    };

    console.log('✅ Dashboard data compiled:', {
      agentCount: dashboardData.agents.length,
      activityCount: dashboardData.recentActivity.length,
      attentionCount: dashboardData.attentionItems.length,
      activeAgents: dashboardData.teamStats.activeAgents
    });

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('❌ Portal Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 