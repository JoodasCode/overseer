-- Add role, api_keys, and api_key_metadata fields to User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "api_keys" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "api_key_metadata" JSONB NOT NULL DEFAULT '[]';

-- Add index on role for faster role-based queries
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Comment explaining the migration
COMMENT ON COLUMN "User"."role" IS 'User role: user, admin, developer';
COMMENT ON COLUMN "User"."api_keys" IS 'Array of API keys for this user';
COMMENT ON COLUMN "User"."api_key_metadata" IS 'Metadata for API keys including name, scopes, and expiration';
