-- Create Task table that matches the API expectations
CREATE TABLE IF NOT EXISTS "Task" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "agent_id" UUID,
  "title" TEXT NOT NULL,
  "details" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "category" TEXT DEFAULT 'General',
  "xp_reward" INTEGER DEFAULT 20,
  "due_date" TIMESTAMP WITH TIME ZONE,
  "completion_date" TIMESTAMP WITH TIME ZONE,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT "Task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "Task_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Task_user_id_idx" ON "Task"("user_id");
CREATE INDEX IF NOT EXISTS "Task_agent_id_idx" ON "Task"("agent_id");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "Task_priority_idx" ON "Task"("priority");
CREATE INDEX IF NOT EXISTS "Task_due_date_idx" ON "Task"("due_date");

-- Enable Row Level Security
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tasks" ON "Task"
  FOR SELECT USING (auth.uid() = "user_id");
  
CREATE POLICY "Users can create their own tasks" ON "Task"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");
  
CREATE POLICY "Users can update their own tasks" ON "Task"
  FOR UPDATE USING (auth.uid() = "user_id");
  
CREATE POLICY "Users can delete their own tasks" ON "Task"
  FOR DELETE USING (auth.uid() = "user_id");

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_updated_at
  BEFORE UPDATE ON "Task"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 