-- Create automations table for workflow automation management
CREATE TABLE IF NOT EXISTS "Automation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "trigger_type" TEXT NOT NULL, -- 'time', 'event', 'webhook', 'manual'
  "trigger_config" JSONB NOT NULL DEFAULT '{}',
  "action_type" TEXT NOT NULL, -- 'notification', 'task_creation', 'api_call', 'workflow'
  "action_config" JSONB NOT NULL DEFAULT '{}',
  "agents" UUID[] DEFAULT '{}', -- Array of agent IDs
  "status" TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused'
  "category" TEXT NOT NULL DEFAULT 'workflows', -- 'notifications', 'workflows', 'integrations'
  "run_count" INTEGER DEFAULT 0,
  "success_count" INTEGER DEFAULT 0,
  "last_run" TIMESTAMP WITH TIME ZONE,
  "next_run" TIMESTAMP WITH TIME ZONE,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT "Automation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Automation_user_id_idx" ON "Automation"("user_id");
CREATE INDEX IF NOT EXISTS "Automation_status_idx" ON "Automation"("status");
CREATE INDEX IF NOT EXISTS "Automation_category_idx" ON "Automation"("category");
CREATE INDEX IF NOT EXISTS "Automation_trigger_type_idx" ON "Automation"("trigger_type");
CREATE INDEX IF NOT EXISTS "Automation_next_run_idx" ON "Automation"("next_run");

-- Enable Row Level Security
ALTER TABLE "Automation" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own automations" ON "Automation"
  FOR SELECT USING (auth.uid() = "user_id");
  
CREATE POLICY "Users can create their own automations" ON "Automation"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");
  
CREATE POLICY "Users can update their own automations" ON "Automation"
  FOR UPDATE USING (auth.uid() = "user_id");
  
CREATE POLICY "Users can delete their own automations" ON "Automation"
  FOR DELETE USING (auth.uid() = "user_id");

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_updated_at
BEFORE UPDATE ON "Automation"
FOR EACH ROW
EXECUTE FUNCTION update_automation_updated_at(); 