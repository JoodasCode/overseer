import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated (you might want to add admin check here)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create audit_logs table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })

    if (createTableError) {
      console.error('Failed to create audit_logs table:', createTableError)
      return NextResponse.json(
        { error: 'Failed to create audit_logs table', details: createTableError },
        { status: 500 }
      )
    }

    // Create policies
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
        DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;

        -- Create policies for audit logs access
        -- Only authenticated users can read their own audit logs
        CREATE POLICY "Users can view their own audit logs" ON audit_logs
          FOR SELECT USING (auth.uid() = user_id);

        -- Only service role can insert audit logs (for security)
        CREATE POLICY "Service role can insert audit logs" ON audit_logs
          FOR INSERT WITH CHECK (auth.role() = 'service_role');
      `
    })

    if (policyError) {
      console.error('Failed to create policies:', policyError)
      return NextResponse.json(
        { error: 'Failed to create policies', details: policyError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Audit logs table created successfully'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
} 