-- Simple automation table creation
CREATE TABLE IF NOT EXISTS "Automation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "trigger_type" TEXT NOT NULL,
  "trigger_config" JSONB NOT NULL DEFAULT '{}',
  "action_type" TEXT NOT NULL,
  "action_config" JSONB NOT NULL DEFAULT '{}',
  "agents" UUID[] DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "category" TEXT NOT NULL DEFAULT 'workflows',
  "run_count" INTEGER DEFAULT 0,
  "success_count" INTEGER DEFAULT 0,
  "last_run" TIMESTAMP WITH TIME ZONE,
  "next_run" TIMESTAMP WITH TIME ZONE,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 