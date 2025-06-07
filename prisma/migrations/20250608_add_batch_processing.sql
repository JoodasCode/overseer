-- Add batch processing tables
DO $$
BEGIN
    -- Create BatchJob table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'BatchJob') THEN
        CREATE TABLE "BatchJob" (
            "id" UUID PRIMARY KEY,
            "user_id" UUID NOT NULL,
            "agent_id" UUID,
            "status" TEXT NOT NULL,
            "progress" INTEGER NOT NULL DEFAULT 0,
            "total_items" INTEGER NOT NULL,
            "processed_items" INTEGER NOT NULL DEFAULT 0,
            "estimated_tokens" INTEGER NOT NULL,
            "actual_tokens" INTEGER NOT NULL DEFAULT 0,
            "credits_pre_authorized" DECIMAL(10, 2) NOT NULL,
            "credits_used" DECIMAL(10, 2) NOT NULL DEFAULT 0,
            "model" TEXT NOT NULL,
            "error" TEXT,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "completed_at" TIMESTAMP WITH TIME ZONE
        );

        -- Add foreign key constraints
        ALTER TABLE "BatchJob" ADD CONSTRAINT "BatchJob_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
        
        ALTER TABLE "BatchJob" ADD CONSTRAINT "BatchJob_agent_id_fkey"
            FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE SET NULL;
    END IF;

    -- Create BatchProcessResult table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'BatchProcessResult') THEN
        CREATE TABLE "BatchProcessResult" (
            "id" UUID PRIMARY KEY,
            "job_id" UUID NOT NULL,
            "item_id" TEXT NOT NULL,
            "input" TEXT NOT NULL,
            "output" TEXT NOT NULL,
            "tokens_used" INTEGER NOT NULL DEFAULT 0,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add foreign key constraints
        ALTER TABLE "BatchProcessResult" ADD CONSTRAINT "BatchProcessResult_job_id_fkey"
            FOREIGN KEY ("job_id") REFERENCES "BatchJob"("id") ON DELETE CASCADE;
    END IF;

    -- Add pre_authorized_credits field to User table if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'pre_authorized_credits'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "pre_authorized_credits" DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;

    -- Add audit log table for credit operations if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CreditAuditLog') THEN
        CREATE TABLE "CreditAuditLog" (
            "id" UUID PRIMARY KEY,
            "user_id" UUID NOT NULL,
            "operation_type" TEXT NOT NULL,
            "amount" DECIMAL(10, 2) NOT NULL,
            "balance_before" DECIMAL(10, 2) NOT NULL,
            "balance_after" DECIMAL(10, 2) NOT NULL,
            "description" TEXT,
            "metadata" JSONB,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add foreign key constraints
        ALTER TABLE "CreditAuditLog" ADD CONSTRAINT "CreditAuditLog_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS "idx_batch_job_user_id" ON "BatchJob"("user_id");
    CREATE INDEX IF NOT EXISTS "idx_batch_job_status" ON "BatchJob"("status");
    CREATE INDEX IF NOT EXISTS "idx_batch_process_result_job_id" ON "BatchProcessResult"("job_id");
    CREATE INDEX IF NOT EXISTS "idx_credit_audit_log_user_id" ON "CreditAuditLog"("user_id");
    CREATE INDEX IF NOT EXISTS "idx_credit_audit_log_operation_type" ON "CreditAuditLog"("operation_type");
END $$;
