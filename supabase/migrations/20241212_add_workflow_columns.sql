-- Add missing columns to workflows table
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS agent jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Update the workflows table to match the expected schema
COMMENT ON COLUMN public.workflows.agent IS 'Selected agent for the workflow';
COMMENT ON COLUMN public.workflows.metadata IS 'Additional workflow metadata and configuration'; 