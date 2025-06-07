-- Add token usage tracking and credit management tables

-- Add credit fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan_tier" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "credits_used" DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "credits_added" DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organization_id" UUID NULL;

-- Create Organization table
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "plan_tier" TEXT NOT NULL DEFAULT 'teams',
  "credits_used" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "credits_added" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "owner_id" UUID NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY ("id"),
  CONSTRAINT "Organization_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create index on Organization
CREATE INDEX IF NOT EXISTS "Organization_owner_id_idx" ON "Organization"("owner_id");
CREATE INDEX IF NOT EXISTS "Organization_plan_tier_idx" ON "Organization"("plan_tier");

-- Add foreign key to User for organization
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS "User_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "User_organization_id_idx" ON "User"("organization_id");
CREATE INDEX IF NOT EXISTS "User_plan_tier_idx" ON "User"("plan_tier");

-- Create TokenUsage table
CREATE TABLE IF NOT EXISTS "TokenUsage" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "agent_id" UUID NULL,
  "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
  "completion_tokens" INTEGER NOT NULL DEFAULT 0,
  "total_tokens" INTEGER NOT NULL DEFAULT 0,
  "credits_used" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "model_name" TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY ("id"),
  CONSTRAINT "TokenUsage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "TokenUsage_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE SET NULL
);

-- Create indexes on TokenUsage
CREATE INDEX IF NOT EXISTS "TokenUsage_user_id_idx" ON "TokenUsage"("user_id");
CREATE INDEX IF NOT EXISTS "TokenUsage_agent_id_idx" ON "TokenUsage"("agent_id");
CREATE INDEX IF NOT EXISTS "TokenUsage_model_name_idx" ON "TokenUsage"("model_name");
CREATE INDEX IF NOT EXISTS "TokenUsage_timestamp_idx" ON "TokenUsage"("timestamp");

-- Add LLM model configuration to Agent
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "system_prompt" TEXT NULL;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "personality" TEXT NULL;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "llm_provider" TEXT NULL;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "llm_model" TEXT NULL;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "llm_api_key_id" TEXT NULL;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "llm_config" JSONB NOT NULL DEFAULT '{}';

-- Create LLMApiKey table for storing encrypted API keys
CREATE TABLE IF NOT EXISTS "LLMApiKey" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "key_name" TEXT NOT NULL,
  "encrypted_key" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY ("id"),
  CONSTRAINT "LLMApiKey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes on LLMApiKey
CREATE INDEX IF NOT EXISTS "LLMApiKey_user_id_idx" ON "LLMApiKey"("user_id");
CREATE INDEX IF NOT EXISTS "LLMApiKey_provider_idx" ON "LLMApiKey"("provider");
CREATE INDEX IF NOT EXISTS "LLMApiKey_is_default_idx" ON "LLMApiKey"("is_default");
