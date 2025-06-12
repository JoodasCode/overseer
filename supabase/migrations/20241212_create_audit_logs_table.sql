-- Create audit_logs table for security and user activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_timestamp ON audit_logs(severity, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs access
-- Only authenticated users can read their own audit logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert audit logs (for security)
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Admin users can view all audit logs (you'll need to implement admin role)
-- CREATE POLICY "Admins can view all audit logs" ON audit_logs
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM user_roles 
--       WHERE user_id = auth.uid() 
--       AND role = 'admin'
--     )
--   );

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Security and user activity audit trail';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event (auth.signin, api.error, etc.)';
COMMENT ON COLUMN audit_logs.severity IS 'Event severity level';
COMMENT ON COLUMN audit_logs.details IS 'Event-specific details and context';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata like request IDs';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (user, agent, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected'; 