-- Communications Department Agent System Schema
-- Enhanced schema for personality scaffolding and agent collaboration
-- Run this in Supabase SQL Editor AFTER the base create-tables.sql

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enhanced agents table - Add personality and department fields
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS voice_style TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS tools_preferred JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS personality_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'communications';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS memory_enabled BOOLEAN DEFAULT true;

-- 2. Agent permissions matrix
CREATE TABLE IF NOT EXISTS public.agent_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_admin BOOLEAN DEFAULT false,
    restrictions JSONB DEFAULT '{}'::jsonb,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inter-agent messaging
CREATE TABLE IF NOT EXISTS public.inter_agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    to_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    message_thread_id TEXT,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Shared agent memory
CREATE TABLE IF NOT EXISTS public.shared_agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    to_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL,
    content TEXT NOT NULL,
    context TEXT,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Agent evolution log
CREATE TABLE IF NOT EXISTS public.agent_evolution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL,
    before_state JSONB,
    after_state JSONB,
    trigger_event TEXT,
    user_feedback TEXT,
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Agent decision threads  
CREATE TABLE IF NOT EXISTS public.agent_decision_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id TEXT NOT NULL,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    parent_decision_id UUID REFERENCES public.agent_decision_threads(id),
    decision_type TEXT NOT NULL,
    decision_data JSONB DEFAULT '{}'::jsonb,
    reasoning TEXT,
    outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Agent modes/loadouts
CREATE TABLE IF NOT EXISTS public.agent_modes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    mode_name TEXT NOT NULL,
    tone_override TEXT,
    tool_preferences JSONB DEFAULT '{}'::jsonb,
    response_length TEXT DEFAULT 'normal',
    priority_threshold FLOAT DEFAULT 0.5,
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP WITH TIME ZONE,
    activated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_permissions_agent_id ON public.agent_permissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_permissions_tool_name ON public.agent_permissions(tool_name);
CREATE INDEX IF NOT EXISTS idx_inter_agent_messages_from_agent ON public.inter_agent_messages(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_inter_agent_messages_to_agent ON public.inter_agent_messages(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_inter_agent_messages_thread ON public.inter_agent_messages(message_thread_id);
CREATE INDEX IF NOT EXISTS idx_shared_memory_from_agent ON public.shared_agent_memory(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_shared_memory_to_agent ON public.shared_agent_memory(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_shared_memory_type ON public.shared_agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_evolution_log_agent_id ON public.agent_evolution_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_evolution_log_change_type ON public.agent_evolution_log(change_type);
CREATE INDEX IF NOT EXISTS idx_decision_threads_agent_id ON public.agent_decision_threads(agent_id);
CREATE INDEX IF NOT EXISTS idx_decision_threads_thread_id ON public.agent_decision_threads(thread_id);
CREATE INDEX IF NOT EXISTS idx_agent_modes_agent_id ON public.agent_modes(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_department ON public.agents(department);

-- Enable Row Level Security (RLS)
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inter_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_evolution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decision_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_modes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agent_permissions
CREATE POLICY "Users can view their agents' permissions"
    ON public.agent_permissions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = agent_permissions.agent_id 
        AND agents.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their agents' permissions"
    ON public.agent_permissions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = agent_permissions.agent_id 
        AND agents.user_id = auth.uid()
    ));

-- Create RLS policies for inter_agent_messages
CREATE POLICY "Users can view messages from their agents"
    ON public.inter_agent_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = inter_agent_messages.from_agent_id 
        AND agents.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = inter_agent_messages.to_agent_id 
        AND agents.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages from their agents"
    ON public.inter_agent_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = inter_agent_messages.from_agent_id 
        AND agents.user_id = auth.uid()
    ));

-- Create RLS policies for shared_agent_memory
CREATE POLICY "Users can view shared memory from their agents"
    ON public.shared_agent_memory FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = shared_agent_memory.from_agent_id 
        AND agents.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = shared_agent_memory.to_agent_id 
        AND agents.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage shared memory from their agents"
    ON public.shared_agent_memory FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = shared_agent_memory.from_agent_id 
        AND agents.user_id = auth.uid()
    ));

-- Create RLS policies for agent_evolution_log
CREATE POLICY "Users can view their agents' evolution"
    ON public.agent_evolution_log FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = agent_evolution_log.agent_id 
        AND agents.user_id = auth.uid()
    ));

CREATE POLICY "Users can track their agents' evolution"
    ON public.agent_evolution_log FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = agent_evolution_log.agent_id 
        AND agents.user_id = auth.uid()
    ));

-- Create RLS policies for agent_decision_threads
CREATE POLICY "Users can view their agents' decisions"
    ON public.agent_decision_threads FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = agent_decision_threads.agent_id 
        AND agents.user_id = auth.uid()
    ));

CREATE POLICY "Users can track their agents' decisions"
    ON public.agent_decision_threads FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = agent_decision_threads.agent_id 
        AND agents.user_id = auth.uid()
    ));

-- Create RLS policies for agent_modes
CREATE POLICY "Users can view their agents' modes"
    ON public.agent_modes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = agent_modes.agent_id 
        AND agents.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their agents' modes"
    ON public.agent_modes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = agent_modes.agent_id 
        AND agents.user_id = auth.uid()
    ));

-- Create function to seed Communications Department agents
CREATE OR REPLACE FUNCTION seed_communications_department_agents()
RETURNS void AS $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Create a demo user ID for seeding (this would normally be a real user's ID)
    demo_user_id := '00000000-0000-0000-0000-000000000001';
    
    -- Delete existing communications agents for this demo user
    DELETE FROM public.agents WHERE user_id = demo_user_id AND department = 'communications';
    
    -- Insert Alex - Lead Communications Strategist
    INSERT INTO public.agents (
        name, description, role, persona, avatar, tone, voice_style, system_prompt,
        tools_preferred, personality_config, department, memory_enabled, user_id
    ) VALUES (
        'Alex',
        'Lead Communications Strategist with calm authority and tactical creativity',
        'Lead Communications Strategist',
        'Calm, articulate, and tactically creative. Thinks long-term. Speaks with clarity and structure.',
        '👔',
        'calm, professional, structured',
        'composed',
        'You are Alex, the Lead Communications Strategist. You speak with calm authority, think strategically about long-term campaigns, and coordinate team efforts. You prefer structured approaches and clear communication.',
        '["notion", "gmail", "google_calendar", "slack"]'::jsonb,
        '{"delegation_style": "clear_briefs", "decision_making": "data_driven_strategic", "communication_preference": "structured_detailed"}'::jsonb,
        'communications',
        true,
        demo_user_id
    );
    
    -- Insert Dana - Visual Communications Assistant
    INSERT INTO public.agents (
        name, description, role, persona, avatar, tone, voice_style, system_prompt,
        tools_preferred, personality_config, department, memory_enabled, user_id
    ) VALUES (
        'Dana',
        'Visual Communications Assistant with quirky, expressive energy',
        'Visual Communications Assistant',
        'Quirky, visual, expressive. Uses emojis and fast, enthusiastic language.',
        '🎨',
        'quirky, enthusiastic, visual',
        'expressive',
        'You are Dana, the Visual Communications Assistant. You''re energetic, creative, and express yourself with emojis and visual metaphors. You love creating visual content and respond quickly with enthusiasm.',
        '["canva", "figma", "slack", "supabase_storage"]'::jsonb,
        '{"creativity_level": "high", "response_speed": "fast", "emoji_usage": "frequent"}'::jsonb,
        'communications',
        true,
        demo_user_id
    );
    
    -- Insert Jamie - Internal Communications Liaison
    INSERT INTO public.agents (
        name, description, role, persona, avatar, tone, voice_style, system_prompt,
        tools_preferred, personality_config, department, memory_enabled, user_id
    ) VALUES (
        'Jamie',
        'Internal Comms Liaison focused on team morale and clarity',
        'Internal Communications Liaison',
        'Friendly, empathetic, diplomatic. Prioritizes team morale and clarity.',
        '🤝',
        'friendly, empathetic, diplomatic',
        'warm',
        'You are Jamie, the Internal Communications Liaison. You prioritize team morale, clear communication, and diplomatic solutions. You remember important team events and foster positive relationships.',
        '["slack", "gmail", "notion", "supabase_db"]'::jsonb,
        '{"empathy_level": "high", "conflict_resolution": "diplomatic", "team_focus": "morale_clarity"}'::jsonb,
        'communications',
        true,
        demo_user_id
    );
    
    -- Insert Riley - Data-Driven PR Analyst
    INSERT INTO public.agents (
        name, description, role, persona, avatar, tone, voice_style, system_prompt,
        tools_preferred, personality_config, department, memory_enabled, user_id
    ) VALUES (
        'Riley',
        'Data-Driven PR Analyst with analytical precision',
        'Data-Driven PR Analyst',
        'Analytical, precise, neutral tone. Speaks with graphs and impact metrics.',
        '📊',
        'analytical, precise, neutral',
        'factual',
        'You are Riley, the Data-Driven PR Analyst. You communicate through data, metrics, and analytical insights. You flag underperformance and provide evidence-based recommendations.',
        '["supabase_db", "google_sheets", "posthog", "typeform"]'::jsonb,
        '{"analytical_depth": "high", "threshold_sensitivity": "medium", "reporting_style": "metric_focused"}'::jsonb,
        'communications',
        true,
        demo_user_id
    );
    
    -- Insert Toby - Reactive Support Coordinator
    INSERT INTO public.agents (
        name, description, role, persona, avatar, tone, voice_style, system_prompt,
        tools_preferred, personality_config, department, memory_enabled, user_id
    ) VALUES (
        'Toby',
        'Reactive Support Coordinator for crisis management',
        'Reactive Support Coordinator',
        'Quick-thinking, slightly anxious but extremely thorough. Speaks fast but factually.',
        '⚡',
        'urgent, thorough, factual',
        'rapid',
        'You are Toby, the Reactive Support Coordinator. You respond quickly to issues, monitor for crises, and route urgent matters appropriately. You''re thorough but speak with urgency when needed.',
        '["slack", "gmail", "discord", "supabase_logs", "sentry"]'::jsonb,
        '{"response_urgency": "high", "monitoring_frequency": "continuous", "escalation_threshold": "low"}'::jsonb,
        'communications',
        true,
        demo_user_id
    );
    
    RAISE NOTICE 'Communications Department agents seeded successfully for user %', demo_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to seed agent permissions for the communications team
CREATE OR REPLACE FUNCTION seed_communications_agent_permissions()
RETURNS void AS $$
DECLARE
    alex_id UUID;
    dana_id UUID;
    jamie_id UUID;
    riley_id UUID;
    toby_id UUID;
BEGIN
    -- Get agent IDs
    SELECT id INTO alex_id FROM public.agents WHERE name = 'Alex' AND department = 'communications' LIMIT 1;
    SELECT id INTO dana_id FROM public.agents WHERE name = 'Dana' AND department = 'communications' LIMIT 1;
    SELECT id INTO jamie_id FROM public.agents WHERE name = 'Jamie' AND department = 'communications' LIMIT 1;
    SELECT id INTO riley_id FROM public.agents WHERE name = 'Riley' AND department = 'communications' LIMIT 1;
    SELECT id INTO toby_id FROM public.agents WHERE name = 'Toby' AND department = 'communications' LIMIT 1;
    
    -- Alex permissions (Lead Strategist)
    INSERT INTO public.agent_permissions (agent_id, tool_name, can_read, can_write, can_delete, can_admin) VALUES
    (alex_id, 'notion', true, true, true, false),
    (alex_id, 'gmail', true, true, false, false),
    (alex_id, 'google_calendar', true, true, true, false),
    (alex_id, 'slack', true, true, false, false);
    
    -- Dana permissions (Visual Assistant) 
    INSERT INTO public.agent_permissions (agent_id, tool_name, can_read, can_write, can_delete, can_admin) VALUES
    (dana_id, 'canva', true, true, true, false),
    (dana_id, 'figma', true, true, true, false),
    (dana_id, 'slack', true, true, false, false),
    (dana_id, 'supabase_storage', true, true, false, false);
    
    -- Jamie permissions (Internal Comms)
    INSERT INTO public.agent_permissions (agent_id, tool_name, can_read, can_write, can_delete, can_admin) VALUES
    (jamie_id, 'slack', true, true, false, false),
    (jamie_id, 'gmail', true, true, false, false),
    (jamie_id, 'notion', true, true, false, false),
    (jamie_id, 'supabase_db', true, false, false, false);
    
    -- Riley permissions (Data Analyst)
    INSERT INTO public.agent_permissions (agent_id, tool_name, can_read, can_write, can_delete, can_admin) VALUES
    (riley_id, 'supabase_db', true, false, false, false),
    (riley_id, 'google_sheets', true, true, false, false),
    (riley_id, 'posthog', true, false, false, false),
    (riley_id, 'typeform', true, true, false, false);
    
    -- Toby permissions (Support Coordinator)
    INSERT INTO public.agent_permissions (agent_id, tool_name, can_read, can_write, can_delete, can_admin) VALUES
    (toby_id, 'slack', true, true, false, false),
    (toby_id, 'gmail', true, true, false, false),
    (toby_id, 'discord', true, true, false, false),
    (toby_id, 'supabase_logs', true, false, false, false),
    (toby_id, 'sentry', true, false, false, false);
    
    RAISE NOTICE 'Agent permissions seeded successfully';
END;
$$ LANGUAGE plpgsql;

-- Create function to initialize default agent modes
CREATE OR REPLACE FUNCTION seed_default_agent_modes()
RETURNS void AS $$
DECLARE
    agent_record RECORD;
BEGIN
    -- Add default modes for each communications agent
    FOR agent_record IN 
        SELECT id, name FROM public.agents WHERE department = 'communications'
    LOOP
        -- Default mode (always active by default)
        INSERT INTO public.agent_modes (agent_id, mode_name, tone_override, tool_preferences, response_length, priority_threshold, is_active, activated_by)
        VALUES (agent_record.id, 'default', NULL, '{}'::jsonb, 'normal', 0.5, true, 'system');
        
        -- Urgent mode
        INSERT INTO public.agent_modes (agent_id, mode_name, tone_override, tool_preferences, response_length, priority_threshold, is_active, activated_by)
        VALUES (agent_record.id, 'urgent', 'urgent, focused', '{"preferred_response_time": "immediate"}'::jsonb, 'brief', 0.8, false, 'system');
        
        -- Executive mode (for when talking to leadership)
        INSERT INTO public.agent_modes (agent_id, mode_name, tone_override, tool_preferences, response_length, priority_threshold, is_active, activated_by)
        VALUES (agent_record.id, 'executive', 'professional, executive-level', '{"formality": "high"}'::jsonb, 'detailed', 0.6, false, 'system');
        
    END LOOP;
    
    RAISE NOTICE 'Default agent modes seeded successfully';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.agent_permissions IS 'Defines what tools each agent can access and with what permissions';
COMMENT ON TABLE public.inter_agent_messages IS 'Messages sent between agents for collaboration';
COMMENT ON TABLE public.shared_agent_memory IS 'Memory context shared between agents for collaboration';
COMMENT ON TABLE public.agent_evolution_log IS 'Tracks how agents learn and evolve over time';
COMMENT ON TABLE public.agent_decision_threads IS 'Audit trail of agent decision-making processes';
COMMENT ON TABLE public.agent_modes IS 'Different operational modes agents can switch between'; 