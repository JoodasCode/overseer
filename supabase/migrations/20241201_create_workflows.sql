-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger jsonb NOT NULL DEFAULT '{}',
  steps jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  execution_count integer DEFAULT 0,
  last_executed timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  error_message text,
  execution_time_ms integer,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflows
CREATE POLICY "Users can view their own workflows" ON public.workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows" ON public.workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" ON public.workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" ON public.workflows
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for workflow executions
CREATE POLICY "Users can view executions of their workflows" ON public.workflow_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workflows 
      WHERE workflows.id = workflow_executions.workflow_id 
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create workflow executions" ON public.workflow_executions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows 
      WHERE workflows.id = workflow_executions.workflow_id 
      AND workflows.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status); 