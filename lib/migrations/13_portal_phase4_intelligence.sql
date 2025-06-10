-- Phase 4: Chat + Intelligence Database Migration
-- This migration adds tables for agent modes, inter-agent collaboration, and enhanced memory

-- 1. Agent Modes Table
CREATE TABLE IF NOT EXISTS agent_modes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
    mode_name VARCHAR(50) NOT NULL,
    description TEXT,
    tone_override VARCHAR(100),
    response_length VARCHAR(20) DEFAULT 'medium',
    temperature_override DECIMAL(3,2),
    max_tokens_override INTEGER,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inter-Agent Messages Table
CREATE TABLE IF NOT EXISTS inter_agent_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
    to_agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
    message_type VARCHAR(50) DEFAULT 'collaboration',
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Shared Agent Memory Table
CREATE TABLE IF NOT EXISTS shared_agent_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
    to_agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
    memory_type VARCHAR(50) DEFAULT 'context',
    content TEXT NOT NULL,
    context TEXT,
    context_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Agent Personality Profiles Table (Enhanced)
CREATE TABLE IF NOT EXISTS agent_personality_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
    personality_traits JSONB DEFAULT '{}',
    communication_style JSONB DEFAULT '{}',
    preferred_tools TEXT[],
    collaboration_preferences JSONB DEFAULT '{}',
    behavioral_patterns JSONB DEFAULT '{}',
    learning_style VARCHAR(50),
    decision_making_style VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id)
);

-- 5. Agent Context Sessions Table
CREATE TABLE IF NOT EXISTS agent_context_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    session_context JSONB DEFAULT '{}',
    active_goals TEXT[],
    current_focus VARCHAR(200),
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_modes_agent_id ON agent_modes(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_modes_active ON agent_modes(agent_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_inter_agent_messages_from ON inter_agent_messages(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_inter_agent_messages_to ON inter_agent_messages(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_inter_agent_messages_unread ON inter_agent_messages(to_agent_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shared_memory_from ON shared_agent_memory(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_shared_memory_to ON shared_agent_memory(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_shared_memory_expires ON shared_agent_memory(context_expires_at) WHERE context_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personality_profiles_agent ON agent_personality_profiles(agent_id);
CREATE INDEX IF NOT EXISTS idx_context_sessions_agent ON agent_context_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_context_sessions_user ON agent_context_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_context_sessions_active ON agent_context_sessions(agent_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE agent_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inter_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_context_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_modes
CREATE POLICY "Users can view their agents' modes" ON agent_modes
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM portal_agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their agents' modes" ON agent_modes
    FOR ALL USING (
        agent_id IN (
            SELECT id FROM portal_agents WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for inter_agent_messages
CREATE POLICY "Users can view messages for their agents" ON inter_agent_messages
    FOR SELECT USING (
        from_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
        OR to_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can send messages from their agents" ON inter_agent_messages
    FOR INSERT WITH CHECK (
        from_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
        AND to_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update messages to their agents" ON inter_agent_messages
    FOR UPDATE USING (
        to_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
    );

-- RLS Policies for shared_agent_memory
CREATE POLICY "Users can view shared memory for their agents" ON shared_agent_memory
    FOR SELECT USING (
        from_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
        OR to_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can share memory from their agents" ON shared_agent_memory
    FOR INSERT WITH CHECK (
        from_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
        AND to_agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
    );

-- RLS Policies for agent_personality_profiles
CREATE POLICY "Users can view their agents' personality profiles" ON agent_personality_profiles
    FOR SELECT USING (
        agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage their agents' personality profiles" ON agent_personality_profiles
    FOR ALL USING (
        agent_id IN (SELECT id FROM portal_agents WHERE user_id = auth.uid())
    );

-- RLS Policies for agent_context_sessions
CREATE POLICY "Users can view their agents' context sessions" ON agent_context_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their agents' context sessions" ON agent_context_sessions
    FOR ALL USING (user_id = auth.uid());

-- Insert default modes for existing agents
INSERT INTO agent_modes (agent_id, mode_name, description, tone_override, response_length, is_active)
SELECT 
    id,
    'standard',
    'Standard operating mode with balanced responses',
    NULL,
    'medium',
    true
FROM portal_agents
WHERE id NOT IN (SELECT agent_id FROM agent_modes WHERE mode_name = 'standard');

-- Insert additional modes for all agents
INSERT INTO agent_modes (agent_id, mode_name, description, tone_override, response_length, temperature_override, max_tokens_override, is_active)
SELECT 
    id,
    'urgent',
    'Quick response mode for urgent matters',
    'urgent and concise',
    'short',
    0.5,
    500,
    false
FROM portal_agents
WHERE id NOT IN (SELECT agent_id FROM agent_modes WHERE mode_name = 'urgent');

INSERT INTO agent_modes (agent_id, mode_name, description, tone_override, response_length, temperature_override, max_tokens_override, is_active)
SELECT 
    id,
    'detailed',
    'Comprehensive analysis mode with thorough responses',
    'detailed and analytical',
    'long',
    0.6,
    1500,
    false
FROM portal_agents
WHERE id NOT IN (SELECT agent_id FROM agent_modes WHERE mode_name = 'detailed');

INSERT INTO agent_modes (agent_id, mode_name, description, tone_override, response_length, temperature_override, max_tokens_override, is_active)
SELECT 
    id,
    'creative',
    'Creative thinking mode for innovative solutions',
    'creative and inspiring',
    'medium',
    0.9,
    1200,
    false
FROM portal_agents
WHERE id NOT IN (SELECT agent_id FROM agent_modes WHERE mode_name = 'creative');

INSERT INTO agent_modes (agent_id, mode_name, description, tone_override, response_length, temperature_override, max_tokens_override, is_active)
SELECT 
    id,
    'executive',
    'Executive communication mode for high-level discussions',
    'professional and strategic',
    'medium',
    0.4,
    800,
    false
FROM portal_agents
WHERE id NOT IN (SELECT agent_id FROM agent_modes WHERE mode_name = 'executive');

-- Create function to automatically create default modes for new agents
CREATE OR REPLACE FUNCTION create_default_agent_modes()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default modes for the new agent
    INSERT INTO agent_modes (agent_id, mode_name, description, tone_override, response_length, temperature_override, max_tokens_override, is_active)
    VALUES 
        (NEW.id, 'standard', 'Standard operating mode with balanced responses', NULL, 'medium', NULL, NULL, true),
        (NEW.id, 'urgent', 'Quick response mode for urgent matters', 'urgent and concise', 'short', 0.5, 500, false),
        (NEW.id, 'detailed', 'Comprehensive analysis mode with thorough responses', 'detailed and analytical', 'long', 0.6, 1500, false),
        (NEW.id, 'creative', 'Creative thinking mode for innovative solutions', 'creative and inspiring', 'medium', 0.9, 1200, false),
        (NEW.id, 'executive', 'Executive communication mode for high-level discussions', 'professional and strategic', 'medium', 0.4, 800, false);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create modes for new agents
DROP TRIGGER IF EXISTS trigger_create_default_agent_modes ON portal_agents;
CREATE TRIGGER trigger_create_default_agent_modes
    AFTER INSERT ON portal_agents
    FOR EACH ROW
    EXECUTE FUNCTION create_default_agent_modes();

-- Create function to clean up expired shared memory
CREATE OR REPLACE FUNCTION cleanup_expired_shared_memory()
RETURNS void AS $$
BEGIN
    DELETE FROM shared_agent_memory 
    WHERE context_expires_at IS NOT NULL 
    AND context_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get agent collaboration statistics
CREATE OR REPLACE FUNCTION get_agent_collaboration_stats(agent_uuid UUID)
RETURNS TABLE (
    total_messages INTEGER,
    messages_sent INTEGER,
    messages_received INTEGER,
    memory_shared INTEGER,
    memory_received INTEGER,
    active_collaborators INTEGER,
    unread_messages INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM inter_agent_messages 
         WHERE from_agent_id = agent_uuid OR to_agent_id = agent_uuid),
        (SELECT COUNT(*)::INTEGER FROM inter_agent_messages 
         WHERE from_agent_id = agent_uuid),
        (SELECT COUNT(*)::INTEGER FROM inter_agent_messages 
         WHERE to_agent_id = agent_uuid),
        (SELECT COUNT(*)::INTEGER FROM shared_agent_memory 
         WHERE from_agent_id = agent_uuid),
        (SELECT COUNT(*)::INTEGER FROM shared_agent_memory 
         WHERE to_agent_id = agent_uuid),
        (SELECT COUNT(DISTINCT CASE 
            WHEN from_agent_id = agent_uuid THEN to_agent_id 
            ELSE from_agent_id 
         END)::INTEGER FROM inter_agent_messages 
         WHERE from_agent_id = agent_uuid OR to_agent_id = agent_uuid),
        (SELECT COUNT(*)::INTEGER FROM inter_agent_messages 
         WHERE to_agent_id = agent_uuid AND read_at IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Update portal_agents table to include personality fields if they don't exist
DO $$ 
BEGIN
    -- Add personality_profile column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_agents' AND column_name = 'personality_profile') THEN
        ALTER TABLE portal_agents ADD COLUMN personality_profile JSONB DEFAULT '{}';
    END IF;
    
    -- Add current_mode column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_agents' AND column_name = 'current_mode') THEN
        ALTER TABLE portal_agents ADD COLUMN current_mode VARCHAR(50) DEFAULT 'standard';
    END IF;
    
    -- Add collaboration_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_agents' AND column_name = 'collaboration_enabled') THEN
        ALTER TABLE portal_agents ADD COLUMN collaboration_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create updated_at trigger for agent_modes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agent_modes_updated_at ON agent_modes;
CREATE TRIGGER update_agent_modes_updated_at
    BEFORE UPDATE ON agent_modes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_personality_profiles_updated_at ON agent_personality_profiles;
CREATE TRIGGER update_agent_personality_profiles_updated_at
    BEFORE UPDATE ON agent_personality_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON agent_modes TO authenticated;
GRANT ALL ON inter_agent_messages TO authenticated;
GRANT ALL ON shared_agent_memory TO authenticated;
GRANT ALL ON agent_personality_profiles TO authenticated;
GRANT ALL ON agent_context_sessions TO authenticated;

-- Insert sample personality profiles for existing agents
UPDATE public.portal_agents 
SET personality_profile = CASE 
  WHEN name = 'Alex' THEN '{"tone": "calm, professional, structured", "voice_style": "composed", "communication_style": "strategic, coordinating", "decision_making": "data_driven_strategic", "delegation_style": "clear_briefs"}'::jsonb
  WHEN name = 'Dana' THEN '{"tone": "quirky, enthusiastic, visual", "voice_style": "expressive", "communication_style": "creative, emoji-rich", "creativity_level": "high", "response_speed": "fast"}'::jsonb
  WHEN name = 'Jamie' THEN '{"tone": "friendly, empathetic, diplomatic", "voice_style": "warm", "communication_style": "team-focused", "empathy_level": "high", "conflict_resolution": "diplomatic"}'::jsonb
  WHEN name = 'Riley' THEN '{"tone": "analytical, precise, neutral", "voice_style": "factual", "communication_style": "data-focused", "analytical_depth": "high", "reporting_style": "metric_focused"}'::jsonb
  WHEN name = 'Toby' THEN '{"tone": "urgent, thorough, factual", "voice_style": "rapid", "communication_style": "alert, responsive", "response_urgency": "high", "escalation_threshold": "low"}'::jsonb
  ELSE personality_profile
END
WHERE name IN ('Alex', 'Dana', 'Jamie', 'Riley', 'Toby');

-- Update specialties for existing agents
UPDATE public.portal_agents 
SET specialties = CASE 
  WHEN name = 'Alex' THEN ARRAY['strategic planning', 'project coordination', 'process optimization', 'team management']
  WHEN name = 'Dana' THEN ARRAY['visual design', 'creative brainstorming', 'content creation', 'visual storytelling']
  WHEN name = 'Jamie' THEN ARRAY['team coordination', 'conflict resolution', 'collaboration facilitation', 'relationship management']
  WHEN name = 'Riley' THEN ARRAY['data analysis', 'performance tracking', 'statistical modeling', 'reporting and visualization']
  WHEN name = 'Toby' THEN ARRAY['incident response', 'issue triage', 'rapid problem solving', 'support coordination']
  ELSE specialties
END
WHERE name IN ('Alex', 'Dana', 'Jamie', 'Riley', 'Toby');

-- Create a view for agent intelligence summary
CREATE OR REPLACE VIEW agent_intelligence_summary AS
SELECT 
    a.id,
    a.name,
    a.role,
    a.department_type,
    a.current_mode,
    a.collaboration_enabled,
    am.mode_name as active_mode_name,
    am.description as active_mode_description,
    app.personality_traits,
    app.communication_style,
    app.preferred_tools,
    (SELECT COUNT(*) FROM inter_agent_messages WHERE from_agent_id = a.id OR to_agent_id = a.id) as total_messages,
    (SELECT COUNT(*) FROM inter_agent_messages WHERE to_agent_id = a.id AND read_at IS NULL) as unread_messages,
    (SELECT COUNT(*) FROM shared_agent_memory WHERE from_agent_id = a.id OR to_agent_id = a.id) as shared_memories
FROM portal_agents a
LEFT JOIN agent_modes am ON a.id = am.agent_id AND am.is_active = true
LEFT JOIN agent_personality_profiles app ON a.id = app.agent_id;

COMMENT ON TABLE agent_modes IS 'Different operational modes for agents (urgent, detailed, creative, etc.)';
COMMENT ON TABLE inter_agent_messages IS 'Messages sent between agents for collaboration';
COMMENT ON TABLE shared_agent_memory IS 'Memory and context shared between agents';
COMMENT ON TABLE agent_personality_profiles IS 'Detailed personality and behavioral profiles for agents';
COMMENT ON TABLE agent_context_sessions IS 'Active context sessions for agents with users';
COMMENT ON VIEW agent_intelligence_summary IS 'Comprehensive view of agent intelligence and collaboration data'; 