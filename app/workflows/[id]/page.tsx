import { WorkflowExecution } from '@/components/workflow/workflow-execution';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WorkflowWithNodes, WorkflowNode } from '@/lib/workflow/types';
import { WorkflowStatus } from '@prisma/client';

interface WorkflowPageProps {
  params: {
    id: string;
  };
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  let workflow: WorkflowWithNodes | null = null;
  let error;

  try {
    const result = await prisma.workflow.findUnique({
      where: { id: params.id },
      include: {
        nodes: true,
      },
    });

    if (result) {
      workflow = {
        id: result.id,
        name: result.name,
        description: result.description || undefined,
        status: result.status,
        user_id: result.user_id,
        agent_id: result.agent_id,
        config: result.config as Record<string, any> || undefined,
        triggers: result.triggers as Record<string, any> || undefined,
        actions: result.actions as Record<string, any> || undefined,
        created_at: result.created_at,
        updated_at: result.updated_at,
        nodes: result.nodes.map((node) => ({
          id: node.id,
          name: node.name,
          type: node.type,
          config: node.config as Record<string, any>,
          next: node.next as string[],
          previous: node.previous as string[],
        })),
      };
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch workflow data';
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!workflow) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{workflow.name}</h1>
        </div>
        
        <WorkflowExecution workflowId={workflow.id} />
        
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Workflow Nodes</h2>
          <div className="grid gap-4">
            {workflow.nodes.map((node) => (
              <div
                key={node.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{node.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {node.type}
                  </span>
                </div>
                {node.config && (
                  <pre className="mt-2 rounded bg-muted p-2 text-sm">
                    {JSON.stringify(node.config, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 