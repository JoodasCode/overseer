-- Agent Tool Permissions System
-- Allows fine-grained control over which agents can access which tools

-- Table: agent_tool_permissions
-- Controls which tools each agent is allowed to use
CREATE TABLE IF NOT EXISTS agent_tool_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tool TEXT NOT NULL,
    can_execute BOOLEAN DEFAULT false,
    preferred_tool BOOLEAN DEFAULT false,
    restrictions JSONB DEFAULT '{}', -- Tool-specific restrictions like rate limits, allowed actions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique tool permissions per agent
    UNIQUE(agent_id, tool)
);

-- Table: integration_error_log
-- Logs all failed integration attempts for debugging and self-healing
CREATE TABLE IF NOT EXISTS integration_error_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tool TEXT NOT NULL,
    action TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: agent_integration_usage
-- Tracks usage statistics for integration optimization
CREATE TABLE IF NOT EXISTS agent_integration_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tool TEXT NOT NULL,
    action TEXT NOT NULL,
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL,
    cache_hit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_tool_permissions_agent_id ON agent_tool_permissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_permissions_tool ON agent_tool_permissions(tool);
CREATE INDEX IF NOT EXISTS idx_agent_tool_permissions_can_execute ON agent_tool_permissions(agent_id, can_execute);

CREATE INDEX IF NOT EXISTS idx_integration_error_log_agent_id ON integration_error_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_integration_error_log_tool ON integration_error_log(tool);
CREATE INDEX IF NOT EXISTS idx_integration_error_log_created_at ON integration_error_log(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_error_log_resolved ON integration_error_log(resolved);

CREATE INDEX IF NOT EXISTS idx_agent_integration_usage_agent_id ON agent_integration_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_integration_usage_tool ON agent_integration_usage(tool);
CREATE INDEX IF NOT EXISTS idx_agent_integration_usage_created_at ON agent_integration_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_integration_usage_success ON agent_integration_usage(success);

-- RLS Policies

-- Agent Tool Permissions
ALTER TABLE agent_tool_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agents' tool permissions" ON agent_tool_permissions
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their agents' tool permissions" ON agent_tool_permissions
    FOR ALL USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Integration Error Log
ALTER TABLE integration_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their integration errors" ON integration_error_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert integration errors" ON integration_error_log
    FOR INSERT WITH CHECK (true);

-- Integration Usage Log
ALTER TABLE agent_integration_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their integration usage" ON agent_integration_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert integration usage" ON agent_integration_usage
    FOR INSERT WITH CHECK (true);

-- Functions for agent capability introspection

-- Function: get_agent_tools
-- Returns all tools available to a specific agent
CREATE OR REPLACE FUNCTION get_agent_tools(agent_uuid UUID)
RETURNS TABLE (
    tool TEXT,
    can_execute BOOLEAN,
    preferred_tool BOOLEAN,
    restrictions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        atp.tool,
        atp.can_execute,
        atp.preferred_tool,
        atp.restrictions
    FROM agent_tool_permissions atp
    WHERE atp.agent_id = agent_uuid
    AND atp.can_execute = true
    ORDER BY atp.preferred_tool DESC, atp.tool ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_agent_preferred_tools
-- Returns preferred tools for an agent (for smart tool selection)
CREATE OR REPLACE FUNCTION get_agent_preferred_tools(agent_uuid UUID)
RETURNS TABLE (
    tool TEXT,
    restrictions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        atp.tool,
        atp.restrictions
    FROM agent_tool_permissions atp
    WHERE atp.agent_id = agent_uuid
    AND atp.can_execute = true
    AND atp.preferred_tool = true
    ORDER BY atp.tool ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: log_integration_error
-- Convenience function to log integration errors
CREATE OR REPLACE FUNCTION log_integration_error(
    p_agent_id UUID,
    p_user_id UUID,
    p_tool TEXT,
    p_action TEXT,
    p_error_code TEXT,
    p_error_message TEXT,
    p_error_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    error_id UUID;
BEGIN
    INSERT INTO integration_error_log (
        agent_id,
        user_id,
        tool,
        action,
        error_code,
        error_message,
        error_details
    ) VALUES (
        p_agent_id,
        p_user_id,
        p_tool,
        p_action,
        p_error_code,
        p_error_message,
        p_error_details
    ) RETURNING id INTO error_id;
    
    RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: log_integration_usage
-- Convenience function to log integration usage
CREATE OR REPLACE FUNCTION log_integration_usage(
    p_agent_id UUID,
    p_user_id UUID,
    p_tool TEXT,
    p_action TEXT,
    p_execution_time_ms INTEGER,
    p_success BOOLEAN,
    p_cache_hit BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO agent_integration_usage (
        agent_id,
        user_id,
        tool,
        action,
        execution_time_ms,
        success,
        cache_hit
    ) VALUES (
        p_agent_id,
        p_user_id,
        p_tool,
        p_action,
        p_execution_time_ms,
        p_success,
        p_cache_hit
    ) RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update updated_at on agent_tool_permissions
CREATE OR REPLACE FUNCTION update_agent_tool_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_tool_permissions_updated_at
    BEFORE UPDATE ON agent_tool_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_tool_permissions_updated_at();

-- Default permissions for existing agents
-- Give all existing agents access to all current tools (Gmail, Slack, Notion)
INSERT INTO agent_tool_permissions (agent_id, tool, can_execute, preferred_tool)
SELECT 
    a.id as agent_id,
    tool.name as tool,
    true as can_execute,
    false as preferred_tool
FROM agents a
CROSS JOIN (
    VALUES 
        ('gmail'),
        ('slack'), 
        ('notion')
) AS tool(name)
ON CONFLICT (agent_id, tool) DO NOTHING;

-- Set Notion as preferred for agents with 'notion' in their name/description
UPDATE agent_tool_permissions 
SET preferred_tool = true 
WHERE tool = 'notion' 
AND agent_id IN (
    SELECT id FROM agents 
    WHERE LOWER(name) LIKE '%notion%' 
    OR LOWER(role) LIKE '%document%'
    OR LOWER(role) LIKE '%content%'
);

-- Set Gmail as preferred for agents with 'email' in their name/description
UPDATE agent_tool_permissions 
SET preferred_tool = true 
WHERE tool = 'gmail' 
AND agent_id IN (
    SELECT id FROM agents 
    WHERE LOWER(name) LIKE '%email%' 
    OR LOWER(role) LIKE '%email%'
    OR LOWER(role) LIKE '%communication%'
);

-- Set Slack as preferred for agents with 'slack' or 'communication' in their name/description
UPDATE agent_tool_permissions 
SET preferred_tool = true 
WHERE tool = 'slack' 
AND agent_id IN (
    SELECT id FROM agents 
    WHERE LOWER(name) LIKE '%slack%' 
    OR LOWER(role) LIKE '%team%'
    OR LOWER(role) LIKE '%collaboration%'
); 